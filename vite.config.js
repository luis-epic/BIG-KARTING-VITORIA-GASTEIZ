import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        carreras: resolve(__dirname, 'carreras.html'),
        drift: resolve(__dirname, 'drift.html'),
        infantil: resolve(__dirname, 'infantil.html'),
        tienda: resolve(__dirname, 'tienda.html'),
        grupos: resolve(__dirname, 'grupos.html'),
        contacto: resolve(__dirname, 'contacto.html'),
        legal: resolve(__dirname, 'legal.html'),
        blog: resolve(__dirname, 'blog.html'),
        blogTiempos: resolve(__dirname, 'blog/como-mejorar-tiempo-vuelta.html'),
        blogDrift: resolve(__dirname, 'blog/tecnicas-de-drift-karting.html'),
        blogInfantil: resolve(__dirname, 'blog/seguridad-karting-infantil.html'),
        blogTeambuilding: resolve(__dirname, 'blog/teambuilding-karting-empresa.html'),
        blogSodi: resolve(__dirname, 'blog/guia-sodi-rt8-kart.html')
      }
    }
  }
});
