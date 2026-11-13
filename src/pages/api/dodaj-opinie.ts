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

export const POST: APIRoute = async (context) => {
  const { request } = context;

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
          error: 'Imię autora jest wymagane.',
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

    // 3. Pobieranie zmiennych środowiskowych i tokena zapisu
    // Na Cloudflare Pages / Workers zmienne z dashboardu są wstrzykiwane w context.locals.runtime.env
    // Lokalnie lub w trybie Node odczytujemy z import.meta.env lub process.env
    const cfEnv =
      (context.locals as any)?.runtime?.env ||
      (context.locals as any)?.env ||
      (context as any)?.env;

    const writeToken =
      cfEnv?.SANITY_WRITE_TOKEN ||
      import.meta.env.SANITY_WRITE_TOKEN ||
      (typeof process !== 'undefined' ? process.env?.SANITY_WRITE_TOKEN : undefined);

    const projectId =
      cfEnv?.SANITY_PROJECT_ID ||
      import.meta.env.SANITY_PROJECT_ID ||
      (typeof process !== 'undefined' ? process.env?.SANITY_PROJECT_ID : undefined) ||
      '9qf0gufo';

    const dataset =
      cfEnv?.SANITY_DATASET ||
      import.meta.env.SANITY_DATASET ||
      (typeof process !== 'undefined' ? process.env?.SANITY_DATASET : undefined) ||
      'production';

    if (!writeToken) {
      console.error('[API dodaj-opinie] Błąd: Brak zmiennej SANITY_WRITE_TOKEN!');
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Serwer nie posiada skonfigurowanego tokena SANITY_WRITE_TOKEN w panelu Cloudflare (Environment Variables).',
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
        error: `Błąd podczas zapisywania opinii w Sanity: ${err?.message || 'Spróbuj ponownie później.'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
