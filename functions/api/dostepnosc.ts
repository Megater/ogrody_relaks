export async function onRequestGet(context: any) {
  const { env } = context;

  try {
    const DEFAULT_GAS_CALENDAR_URL =
      'https://script.google.com/macros/s/AKfycbz8xkJQIayN_rIY2u4zR-VD6bUAvjWenjERVs9TsC9l3LlRZQDugsiLUH1z_rNJ_ZEDVg/exec';

    const gasCalendarUrl =
      env?.GAS_CALENDAR_URL ||
      (typeof process !== 'undefined' ? process.env?.GAS_CALENDAR_URL : undefined) ||
      DEFAULT_GAS_CALENDAR_URL;

    if (!gasCalendarUrl) {
      console.warn('[Cloudflare Pages Function dostepnosc] Brak GAS_CALENDAR_URL w env.');
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    const res = await fetch(gasCalendarUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      console.error(
        `[Cloudflare Pages Function dostepnosc] Błąd Google Apps Script: ${res.status}`
      );
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    const data: any = await res.json().catch(() => []);

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

    const uniqueDates = Array.from(new Set(cleanDates));

    return new Response(JSON.stringify(uniqueDates), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[Cloudflare Pages Function dostepnosc] Błąd:', err);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}
