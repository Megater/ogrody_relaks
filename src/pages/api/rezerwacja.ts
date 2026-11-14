import type { APIRoute } from 'astro';

export const prerender = false;

const SERVICE_NAMES: Record<string, string> = {
  wycena: 'Bezpłatna wycena i konsultacja na działce (0 zł)',
  projekt: 'Omówienie projektu i aranżacji',
  pielegnacja: 'Pielęgnacja ogrodu / porządkowanie terenu',
};

export const POST: APIRoute = async (context) => {
  const { request } = context;

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nieprawidłowy format danych. Wymagany format JSON.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nieprawidłowy format JSON.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, phone, service, address, zip, city, date } = body || {};

    // 1. Walidacja danych klienta
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Podaj imię i nazwisko (minimum 2 znaki).',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Podaj prawidłowy adres e-mail.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Wybierz prawidłowy termin z kalendarza (format RRRR-MM-DD).',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Adres działki / spotkania jest wymagany.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Miejscowość jest wymagana.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Odczyt adresu Webhooka Make.com (obsługa Cloudflare Pages locals + env lokalnego)
    const DEFAULT_MAKE_WEBHOOK_URL =
      'https://hook.eu1.make.com/96pm3uvdsfog0zckk47awyzaaaxlk77n';

    const cfEnv =
      (context.locals as any)?.runtime?.env ||
      (context.locals as any)?.env ||
      (context as any)?.env;

    const makeWebhookUrl =
      cfEnv?.MAKE_WEBHOOK_URL ||
      import.meta.env.MAKE_WEBHOOK_URL ||
      (typeof process !== 'undefined' ? process.env?.MAKE_WEBHOOK_URL : undefined) ||
      DEFAULT_MAKE_WEBHOOK_URL;

    if (!makeWebhookUrl) {
      console.error('[API rezerwacja] Błąd: Brak zmiennej MAKE_WEBHOOK_URL!');
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Serwer nie został jeszcze skonfigurowany do obsługi rezerwacji (brak MAKE_WEBHOOK_URL). Skontaktuj się z administratorem.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Przygotowanie paczki danych do wysłania na Webhook Make.com
    const cleanService = typeof service === 'string' && service ? service : 'wycena';
    const cleanServiceName = SERVICE_NAMES[cleanService] || cleanService;
    const cleanAddress = address.trim();
    const cleanZip = typeof zip === 'string' ? zip.trim() : '';
    const cleanCity = city.trim();

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: typeof phone === 'string' ? phone.trim() : '',
      service: cleanService,
      serviceName: cleanServiceName,
      address: cleanAddress,
      zip: cleanZip,
      city: cleanCity,
      fullAddress: cleanZip ? `${cleanAddress}, ${cleanZip} ${cleanCity}` : `${cleanAddress}, ${cleanCity}`,
      date: date.trim(),
      submittedAt: new Date().toISOString(),
    };

    // 4. Przesłanie (forward) requestu POST do Make.com
    const webhookResponse = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      console.error(
        `[API rezerwacja] Błąd odpowiedzi Make.com: ${webhookResponse.status} ${webhookResponse.statusText}`
      );
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Wystąpił błąd podczas przekazywania rezerwacji do systemu kalendarza. Spróbuj ponownie lub zadzwoń bezpośrednio.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Zarezerwowano! Skontaktujemy się z Tobą w celu potwierdzenia.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[API rezerwacja] Nieoczekiwany błąd:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
