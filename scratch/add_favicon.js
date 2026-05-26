import fs from 'fs';
import path from 'path';

const projectDir = 'c:/Users/luis/OneDrive/Documents/proyectos/bigkarting';
const htmlFiles = [
  'index.html',
  'carreras.html',
  'drift.html',
  'grupos.html',
  'infantil.html',
  'legal.html',
  'tienda.html',
  'contacto.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(projectDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si ya tiene el favicon inyectado
    if (!content.includes('rel="icon"')) {
      // Inyectar justo después de <head> o antes de las fuentes
      const faviconTag = '\n  <link rel="icon" type="image/jpeg" href="/logo-negro.jpg">';
      
      if (content.includes('<head>')) {
        content = content.replace('<head>', `<head>${faviconTag}`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Favicon inyectado en ${file}`);
      }
    } else {
      console.log(`${file} ya tiene favicon`);
    }
  }
});
