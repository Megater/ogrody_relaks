import { defineField, defineType } from 'sanity';

export const uslugaType = defineType({
  name: 'usluga',
  title: 'Usługi',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Tytuł usługi',
      type: 'string',
      description: 'Główna nazwa usługi (np. Pielęgnacja trawników, Karczowanie i porządkowanie działek)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Końcówka linku (kliknij Generate)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'badge',
      title: 'Etykieta / Kategoria (np. Cały sezon, Wiosna, Przygotowanie terenu)',
      type: 'string',
      initialValue: 'Sezonowa usługa',
    }),
    defineField({
      name: 'icon',
      title: 'Ikona (emoji, np. 🌱, 🚜, 🌲, ✂️, 💧, 🏡)',
      type: 'string',
      initialValue: '🌿',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Krótki opis (1-2 zdania, widoczny na pierwszy rzut oka)',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required().max(180),
    }),
    defineField({
      name: 'description',
      title: 'Szczegółowy opis usługi (widoczny po rozwinięciu)',
      type: 'text',
      rows: 6,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'features',
      title: 'Co obejmuje usługa? (Punkty / zakres prac)',
      description: 'Wpisz kolejne elementy, np. Wertykulacja mechaniczna, Dosiewka trawy, Nawożenie mineralne',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'image',
      title: 'Zdjęcie główne usługi (okładka)',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Dodatkowe zdjęcia (np. 2 kolejne ujęcia – łącznie do 3 zdjęć)',
      description: 'Dodatkowe zdjęcia prezentujące sprzęt, efekty lub proces realizacji usługi',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
        },
      ],
      options: {
        layout: 'grid',
      },
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: 'order',
      title: 'Kolejność wyświetlania (liczba: 1, 2, 3...)',
      type: 'number',
      initialValue: 1,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'badge',
      media: 'image',
    },
  },
});
