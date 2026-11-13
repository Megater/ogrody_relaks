import { defineField, defineType } from 'sanity';

export const opiniaType = defineType({
  name: 'opinia',
  title: 'Opinie klientów',
  type: 'document',
  fields: [
    defineField({
      name: 'approved',
      title: 'Zatwierdzona (widoczna na stronie)',
      type: 'boolean',
      description: 'Zaznacz, aby opinia pojawiła się publicznie na stronie głównej w sekcji opinii.',
      initialValue: false,
    }),
    defineField({
      name: 'author',
      title: 'Imię / Autor',
      type: 'string',
      description: 'Imię i nazwisko lub nick autora opinii',
      validation: (rule) => rule.required().error('Imię autora jest wymagane.'),
    }),
    defineField({
      name: 'role',
      title: 'Rola / Opis klienta',
      type: 'string',
      description: 'Np. Właściciel ogrodu, Klient indywidualny, Zarządca nieruchomości',
      initialValue: 'Klient',
    }),
    defineField({
      name: 'rating',
      title: 'Ocena (1-5)',
      type: 'number',
      description: 'Liczba gwiazdek od 1 do 5',
      validation: (rule) => rule.required().min(1).max(5).error('Ocena musi wynosić od 1 do 5.'),
      initialValue: 5,
    }),
    defineField({
      name: 'tags',
      title: 'Szybkie cechy (Tagi)',
      description: 'Wyróżniki i atuty wskazane przez klienta',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
        list: [
          { title: 'Fachowe doradztwo', value: 'Fachowe doradztwo' },
          { title: 'Szybka realizacja', value: 'Szybka realizacja' },
          { title: 'Zostawiony porządek', value: 'Zostawiony porządek' },
          { title: 'Terminowość', value: 'Terminowość' },
          { title: 'Piękny efekt', value: 'Piękny efekt' },
        ],
      },
    }),
    defineField({
      name: 'content',
      title: 'Treść opinii',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().error('Treść opinii jest wymagana.'),
    }),
  ],
  preview: {
    select: {
      title: 'author',
      subtitle: 'content',
      approved: 'approved',
      rating: 'rating',
    },
    prepare({ title, subtitle, approved, rating }) {
      const status = approved ? '✅ Widoczna' : '⏳ Oczekuje na akceptację';
      const stars = rating ? `[${rating}/5 ⭐]` : '';
      return {
        title: `${stars} ${title || 'Anonim'}`,
        subtitle: `${status} — ${subtitle ? subtitle.slice(0, 60) + '...' : ''}`,
      };
    },
  },
});
