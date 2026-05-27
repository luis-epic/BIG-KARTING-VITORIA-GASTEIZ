/**
 * Submódulo de navegación por pestañas de telemetría responsive en el footer móvil
 */
export function initFooterTelemetry() {
  const footerGrid = document.querySelector('.footer-grid');
  if (!footerGrid) return;

  const cols = footerGrid.children;
  // Necesitamos que haya exactamente 4 columnas: Marca (0), Karting (1), Grupos (2), Más info (3)
  if (cols.length < 4) return;

  const colKarting = cols[1];
  const colGrupos = cols[2];
  const colInfo = cols[3];

  // Crear contenedor de pestañas de telemetría móvil
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'footer-telemetry-tabs';
  tabsContainer.innerHTML = `
    <button class="telemetry-tab-btn active" data-tab="1">
      <span class="tab-num">01/</span>Karting
    </button>
    <button class="telemetry-tab-btn" data-tab="2">
      <span class="tab-num">02/</span>Grupos
    </button>
    <button class="telemetry-tab-btn" data-tab="3">
      <span class="tab-num">03/</span>Info
    </button>
  `;

  // Insertar la barra de pestañas antes de las columnas de navegación
  footerGrid.insertBefore(tabsContainer, colKarting);

  // Inicializar clases iniciales de visibilidad
  colKarting.classList.add('telemetry-tab-col', 'active');
  colGrupos.classList.add('telemetry-tab-col');
  colInfo.classList.add('telemetry-tab-col');

  const tabButtons = tabsContainer.querySelectorAll('.telemetry-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Actualizar botón activo
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Ocultar y mostrar columnas correspondientes
      colKarting.classList.remove('active');
      colGrupos.classList.remove('active');
      colInfo.classList.remove('active');

      if (targetTab === '1') {
        colKarting.classList.add('active');
      } else if (targetTab === '2') {
        colGrupos.classList.add('active');
      } else if (targetTab === '3') {
        colInfo.classList.add('active');
      }
    });
  });
}
