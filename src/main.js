import { initMobileMenu } from './modules/menu.js';
import { initCustomCursor } from './modules/cursor.js';
import { init3DScene } from './modules/scene3d.js';
import { initOpeningStatus } from './modules/horario.js';
import { initVisualEffects } from './modules/effects.js';
import { initAssistant } from './modules/assistant.js';
import { initFooterTelemetry } from './modules/footer.js';

import './style.css';

// ==========================================
// 🛠️ MOBILE DEBUG CONSOLE (Capturador de Errores)
// ==========================================
const debugErrors = [];
const showOnScreen = (msg) => {
  let panel = document.getElementById('mobile-debug-console');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'mobile-debug-console';
    panel.style.cssText = 'position:fixed;bottom:15px;left:15px;right:15px;background:rgba(20,4,4,0.92);backdrop-filter:blur(10px);border:1.5px solid #ff4a4a;color:#fff;padding:15px;font-family:monospace;font-size:11px;z-index:999999;max-height:160px;overflow-y:auto;border-radius:12px;box-shadow:0 15px 35px rgba(0,0,0,0.9);';
    
    const title = document.createElement('div');
    title.style.cssText = 'font-weight:bold;color:#ff5a00;margin-bottom:8px;border-bottom:1px solid rgba(255,90,0,0.3);padding-bottom:4px;letter-spacing:1px;';
    title.textContent = '🏎️ BIGKARTING - TELEMETRÍA DE ERRORES';
    panel.appendChild(title);
    
    document.body.appendChild(panel);
  }
  const line = document.createElement('div');
  line.style.cssText = 'border-bottom:1px solid rgba(255,255,255,0.06);padding:5px 0;word-break:break-all;line-height:1.4;';
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  panel.appendChild(line);
};

window.addEventListener('error', (e) => {
  const msg = `${e.message} in ${e.filename}:${e.lineno}`;
  debugErrors.push(msg);
  showOnScreen(msg);
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = `Promesa rechazada: ${e.reason}`;
  debugErrors.push(msg);
  showOnScreen(msg);
});

// Capturar errores WebGL nativos de Three.js
const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  if (msg.toLowerCase().includes('webgl') || msg.toLowerCase().includes('three') || msg.toLowerCase().includes('gltf') || msg.toLowerCase().includes('shader')) {
    showOnScreen(`ThreeJS: ${msg}`);
  }
};

// Habilitar la clase js inmediatamente en el cliente para el cursor y reveals
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initCustomCursor();
  init3DScene();
  initOpeningStatus();
  initVisualEffects();
  initAssistant();
  initFooterTelemetry();
  
  // Mostrar el body suavemente una vez cargado el DOM y el bundle de estilos
  document.body.classList.add('loaded');
});
