import { initMobileMenu } from './modules/menu.js';
import { initCustomCursor } from './modules/cursor.js';
import { init3DScene } from './modules/scene3d.js';
import { initOpeningStatus } from './modules/horario.js';
import { initVisualEffects } from './modules/effects.js';
import { initAssistant } from './modules/assistant.js';
import { initFooterTelemetry } from './modules/footer.js';

import './style.css';

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
});
