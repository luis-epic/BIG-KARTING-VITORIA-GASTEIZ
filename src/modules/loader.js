/**
 * Submódulo de control de la pantalla de carga Cyber-Loader HUD
 */
export function initLoader() {
  const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname.endsWith('/');
  let loaderEl = document.getElementById('cyber-loader');

  if (isHomePage) {
    if (!loaderEl) {
      loaderEl = document.createElement('div');
      loaderEl.id = 'cyber-loader';
      loaderEl.innerHTML = `
        <div class="loader-container">
          <div style="text-align: center;"><img src="/logo-negro.jpg" class="loader-logo-img" alt="Big Karting Vitoria-Gasteiz"></div>
          <div class="loader-status" id="loader-status">INICIALIZANDO MOTOR GRÁFICO...</div>
          <div class="loader-bar-wrap">
            <div class="loader-bar" id="loader-bar"></div>
          </div>
          <div class="loader-percentage" id="loader-percentage">0%</div>
        </div>
      `;
      document.body.appendChild(loaderEl);
    }
  } else {
    if (loaderEl) {
      loaderEl.remove();
      loaderEl = null;
    }
  }

  const loaderBar = document.getElementById('loader-bar');
  const loaderPercentage = document.getElementById('loader-percentage');
  const loaderStatus = document.getElementById('loader-status');

  const loadingMessages = [
    "ESTABLECIENDO ENLACE CON EL SERVIDOR...",
    "DESCARGANDO TELEMETRÍA DE VELOCIDAD...",
    "ENSAMBLANDO CHASIS DE COMPETICIÓN...",
    "CALIBRANDO SUSPENSIÓN DE DERRAPE...",
    "COMPLETANDO AJUSTES AERODINÁMICOS..."
  ];

  function updateLoader(progress, text) {
    if (loaderBar) loaderBar.style.width = `${progress}%`;
    if (loaderPercentage) loaderPercentage.textContent = `${Math.round(progress)}%`;
    if (loaderStatus && text) loaderStatus.textContent = text;
  }

  function removeLoader() {
    if (loaderStatus) loaderStatus.textContent = 'CONEXIÓN ESTABLECIDA';
    if (loaderPercentage) loaderPercentage.textContent = '100%';
    if (loaderBar) loaderBar.style.width = '100%';
    
    setTimeout(() => {
      if (loaderEl) {
        loaderEl.classList.add('loaded');
        setTimeout(() => loaderEl.remove(), 800);
      }
    }, 600);
  }

  return {
    updateLoader,
    removeLoader,
    loadingMessages
  };
}
