import { createClient } from '@sanity/client';

const ALLOWED_TAGS = [
  'Fachowe doradztwo',
  'Szybka realizacja',
  'Zostawiony porządek',
  'Terminowość',
  'Piękny efekt',
];

export async function onRequestPost(context: any) {
  const { request, env } = context;

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

    const { author, role, rating, tags, content } = body || {};

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

    const validatedTags: string[] = Array.isArray(tags)
      ? tags
          .map((t: any) => String(t).trim())
          .filter((t: string) => t.length > 0 && (ALLOWED_TAGS.includes(t) || t.length <= 40))
          .slice(0, 10)
      : [];

    const writeToken =
      env?.SANITY_WRITE_TOKEN ||
      (typeof process !== 'undefined' ? process.env?.SANITY_WRITE_TOKEN : undefined);

    const projectId =
      env?.SANITY_PROJECT_ID ||
      (typeof process !== 'undefined' ? process.env?.SANITY_PROJECT_ID : undefined) ||
      '9qf0gufo';

    const dataset =
      env?.SANITY_DATASET ||
      (typeof process !== 'undefined' ? process.env?.SANITY_DATASET : undefined) ||
      'production';

    if (!writeToken) {
      console.error('[Cloudflare Pages Function] Brak tokena SANITY_WRITE_TOKEN w env!');
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Serwer nie posiada skonfigurowanego tokena SANITY_WRITE_TOKEN w panelu Cloudflare (Environment Variables).',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sanityWriteClient = createClient({
      projectId,
      dataset,
      token: writeToken,
      apiVersion: '2024-01-01',
      useCdn: false,
    });

    const newDoc = {
      _type: 'opinia',
      author: author.trim(),
      role: typeof role === 'string' && role.trim().length > 0 ? role.trim() : 'Klient',
      rating: Math.round(parsedRating),
      tags: validatedTags,
      content: content.trim(),
      approved: false,
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
    console.error('[Cloudflare Pages Function] Błąd zapisu:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Błąd podczas zapisywania w Sanity: ${err?.message || 'Spróbuj ponownie później.'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
