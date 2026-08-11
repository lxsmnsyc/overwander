import { solidStart } from '@solidjs/start/config';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  // Tailwind reads its configuration out of src/app.css rather than a
  // config file of its own, so the plugin is all the wiring there is
  plugins: [tailwindcss(), solidStart(), nitro()],
});
