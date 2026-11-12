import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { realizacjaType } from './src/sanity/schemaTypes/realizacja';

export default defineConfig({
  name: 'default',
  title: 'Ogrody Relaks - CMS',
  projectId: '9qf0gufo',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: [realizacjaType],
  },
});