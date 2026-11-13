import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

export const prerender = false;

// Dozwolone wstępnie zdefiniowane tagi (szybkie cechy)
const ALLOWED_TAGS = [
  'Fachowe doradztwo',
  'Szybka realizacja',
  'Zostawiony porządek',
  'Terminowość',
  'Piękny efekt',
];

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Walidacja formatu żądania
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

    const { author, role, rating, tags, content } = body || {};

    // 2. Walidacja pól formularza
    if (!author || typeof author !== 'string' || author.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Imię / Rola autora jest wymagana.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (author.trim().length > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Imię autora nie może przekraczać 100 znaków.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Ocena musi być liczbą od 1 do 5.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Treść opinii jest wymagana.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (content.trim().length > 2000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Treść opinii jest zbyt długa (maks. 2000 znaków).',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Walidacja i filtracja tagów
    const validatedTags: string[] = Array.isArray(tags)
      ? tags
          .map((t) => String(t).trim())
          .filter((t) => t.length > 0 && (ALLOWED_TAGS.includes(t) || t.length <= 40))
          .slice(0, 10)
      : [];

    // 3. Sprawdzenie konfiguracji Sanity i tokena zapisu
    // Odczytujemy zmienne ze środowiska Astro (Cloudflare Pages / local env)
    const writeToken =
      import.meta.env.SANITY_WRITE_TOKEN ||
      (typeof process !== 'undefined' ? process.env?.SANITY_WRITE_TOKEN : undefined);

    const projectId =
      import.meta.env.SANITY_PROJECT_ID ||
      (typeof process !== 'undefined' ? process.env?.SANITY_PROJECT_ID : undefined) ||
      '9qf0gufo';

    const dataset =
      import.meta.env.SANITY_DATASET ||
      (typeof process !== 'undefined' ? process.env?.SANITY_DATASET : undefined) ||
      'production';

    if (!writeToken) {
      console.error('[API dodaj-opinie] Błąd: Brak zmiennej SANITY_WRITE_TOKEN!');
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Serwer nie został jeszcze skonfigurowany do zapisywania danych (brak SANITY_WRITE_TOKEN). Skontaktuj się z administratorem strony.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Inicjalizacja klienta Sanity z tokenem zapisu
    const sanityWriteClient = createClient({
      projectId,
      dataset,
      token: writeToken,
      apiVersion: '2024-01-01',
      useCdn: false,
    });

    // 5. Utworzenie dokumentu w Sanity
    // Ważne: approved jest zawsze ustawione na false dla nowych opinii z zewnątrz
    const newDoc = {
      _type: 'opinia',
      author: author.trim(),
      role: typeof role === 'string' && role.trim().length > 0 ? role.trim() : 'Klient',
      rating: Math.round(parsedRating),
      tags: validatedTags,
      content: content.trim(),
      approved: false, // Moderator / właściciel musi zaakceptować w Sanity Studio
    };

    const created = await sanityWriteClient.create(newDoc);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dziękujemy! Twoja opinia została przesłana i czeka na weryfikację przez administratora.',
        id: created._id,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[API dodaj-opinie] Błąd zapisu:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Wystąpił nieoczekiwany błąd podczas zapisywania opinii. Spróbuj ponownie później.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
