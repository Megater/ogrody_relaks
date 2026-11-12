import { defineField, defineType } from 'sanity';

export const realizacjaType = defineType({
  name: 'realizacja',
  title: 'Realizacje (Wagoniki)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Tytuł realizacji',
      type: 'string',
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
      name: 'description',
      title: 'Krótki opis',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'icon',
      title: 'Ikona (emoji, np. 🌱, 🧱, 💡)',
      type: 'string',
      initialValue: '🌿',
    }),
    defineField({
      name: 'image',
      title: 'Zdjęcie główne (okładka w wagoniku i siatce)',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Dodatkowe zdjęcia (np. 2 kolejne ujęcia tego samego ogrodu)',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
        },
      ],
      options: {
        layout: 'grid', // Wyświetla ładną siatkę miniaturek w panelu /studio
      },
      validation: (rule) => rule.max(5), // Limit do 5 dodatkowych zdjęć (możesz zmienić np. na 2)
    }),
  ],
});