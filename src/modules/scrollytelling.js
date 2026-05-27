/**
 * Módulo de Scrollytelling Sincronizado para Big Karting
 * Vincula el porcentaje de scroll obtenido en la escena 3D con el despliegue elástico
 * de las tarjetas informativas flotantes (Glassmorphic) de forma suave y optimizada.
 * También gestiona la interactividad del botón HUD para plegar y desplegar la información.
 */

let panelHero = null;
let panelModalidades = null;
let panelDrift = null;
let stickyContainer = null;
let hudToggleBtn = null;
let hudText = null;
let elementsInitialized = false;

// Estado global exportado de visibilidad (para que scene3d.js reencuadre la cámara)
export let isInfoFolded = false;

function initElements() {
  panelHero = document.getElementById('panel-hero');
  panelModalidades = document.getElementById('panel-modalidades');
  panelDrift = document.getElementById('panel-drift');
  stickyContainer = document.querySelector('.scrolly-text-sticky');
  hudToggleBtn = document.getElementById('hud-toggle-info');
  
  if (hudToggleBtn) {
    hudText = hudToggleBtn.querySelector('.hud-btn-text');
    
    // Escuchar clics en el botón HUD de plegado
    hudToggleBtn.addEventListener('click', () => {
      isInfoFolded = !isInfoFolded;
      
      if (stickyContainer) {
        if (isInfoFolded) {
          stickyContainer.classList.add('folded');
          if (hudText) hudText.textContent = 'MOSTRAR TELEMETRÍA';
        } else {
          stickyContainer.classList.remove('folded');
          if (hudText) hudText.textContent = 'OCULTAR TELEMETRÍA';
        }
      }
    });
  }

  elementsInitialized = true;
}

/**
 * Actualiza la visibilidad de los paneles del scrollytelling en función del progreso del scroll (0.0 a 1.0)
 * @param {number} scrollPercent - Progreso de scroll de la página de inicio (0.0 a 1.0)
 */
export function updateScrollytelling(scrollPercent) {
  // Inicialización perezosa de los elementos del DOM si no están listos
  if (!elementsInitialized) {
    initElements();
  }

  // Si los elementos no existen en este documento (ej. en otra subpágina), salir
  if (!panelHero || !panelModalidades || !panelDrift) return;

  // En pantallas móviles (ancho <= 900px), el diseño es fluido y vertical estándar.
  // No alteramos las clases active/inactive para evitar flickering y mantener todo visible y scrollable.
  if (window.innerWidth <= 900) {
    if (!panelHero.classList.contains('active')) panelHero.classList.add('active');
    if (!panelModalidades.classList.contains('active')) panelModalidades.classList.add('active');
    if (!panelDrift.classList.contains('active')) panelDrift.classList.add('active');
    return;
  }

  // Si está plegado por el usuario, omitir transiciones en scroll
  if (isInfoFolded) return;

  // Umbrales de fases de scroll
  const phase1 = 0.25; // 0.00 a 0.25 -> Hero
  const phase2 = 0.55; // 0.25 a 0.55 -> Modalidades
  const phase3 = 0.85; // 0.55 a 0.85 -> Drift
  // > 0.85 -> Todos inactivos para ver secciones inferiores (Horario, Ubicación, etc.)

  if (scrollPercent < phase1) {
    // Fase 1: Hero Activo
    setActivePanel(panelHero);
  } else if (scrollPercent >= phase1 && scrollPercent < phase2) {
    // Fase 2: Modalidades Activo
    setActivePanel(panelModalidades);
  } else if (scrollPercent >= phase2 && scrollPercent < phase3) {
    // Fase 3: Drift Activo
    setActivePanel(panelDrift);
  } else {
    // Fase 4: Ninguno (Scroll libre en partes inferiores)
    setActivePanel(null);
  }
}

/**
 * Función interna optimizada para alternar la clase 'active' sin repaints costosos
 * @param {HTMLElement|null} activePanel - El panel que debe mostrarse activo, o null para ninguno
 */
function setActivePanel(activePanel) {
  const panels = [panelHero, panelModalidades, panelDrift];

  panels.forEach(panel => {
    if (!panel) return;
    if (panel === activePanel) {
      if (!panel.classList.contains('active')) {
        panel.classList.add('active');
      }
    } else {
      if (panel.classList.contains('active')) {
        panel.classList.remove('active');
      }
    }
  });
}
