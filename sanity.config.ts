import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { realizacjaType } from './src/sanity/schemaTypes/realizacja';
import { uslugaType } from './src/sanity/schemaTypes/usluga';
import { opiniaType } from './src/sanity/schemaTypes/opinia';

export default defineConfig({
  name: 'default',
  title: 'Ogrody Relaks - CMS',
  projectId: '9qf0gufo',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: [realizacjaType, uslugaType, opiniaType],
  },
});
