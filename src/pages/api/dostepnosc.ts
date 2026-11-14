import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const DEFAULT_GAS_CALENDAR_URL =
      'https://script.google.com/macros/s/AKfycbz8xkJQIayN_rIY2u4zR-VD6bUAvjWenjERVs9TsC9l3LlRZQDugsiLUH1z_rNJ_ZEDVg/exec';

    const cfEnv =
      (context.locals as any)?.runtime?.env ||
      (context.locals as any)?.env ||
      (context as any)?.env;

    const gasCalendarUrl =
      cfEnv?.GAS_CALENDAR_URL ||
      import.meta.env.GAS_CALENDAR_URL ||
      (typeof process !== 'undefined' ? process.env?.GAS_CALENDAR_URL : undefined) ||
      DEFAULT_GAS_CALENDAR_URL;

    // Jeśli zmienna nie jest jeszcze skonfigurowana, zwracamy pustą listę zajętych terminów
    if (!gasCalendarUrl) {
      console.warn('[API dostepnosc] Brak zmiennej GAS_CALENDAR_URL w środowisku. Zwracam pustą tablicę.');
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // Google Apps Script Web App przekierowuje (HTTP 302), dlatego 'redirect: follow' jest kluczowe
    const res = await fetch(gasCalendarUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      console.error(`[API dostepnosc] Błąd pobierania z Google Apps Script: ${res.status} ${res.statusText}`);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    const data: any = await res.json().catch(() => []);

    // Standaryzacja do tablicy dat ["YYYY-MM-DD", ...]
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray(data?.occupiedDates)
      ? data.occupiedDates
      : Array.isArray(data?.dates)
      ? data.dates
      : [];

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const cleanDates: string[] = rawList
      .filter((d: any) => typeof d === 'string' && dateRegex.test(d.trim()))
      .map((d: string) => d.trim());

    // Usuwamy ewentualne duplikaty
    const uniqueDates = Array.from(new Set(cleanDates));

    return new Response(JSON.stringify(uniqueDates), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[API dostepnosc] Błąd:', err);
    // W razie błędu sieciowego zwracamy pustą listę, aby kalendarz na stronie nadal działał
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
};
