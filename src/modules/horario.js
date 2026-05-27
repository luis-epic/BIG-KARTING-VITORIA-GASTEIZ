/**
 * Submódulo de control del horario de apertura y reloj en tiempo real
 */
export function initOpeningStatus() {
  function updateOpeningStatus() {
    const now = new Date();
    
    // Reloj digital
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const timeEl = document.querySelector('.clock-time');
    if (timeEl) timeEl.textContent = h + ':' + m;

    const day = now.getDay(); 
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let isOpen = false;
    let statusMsg = "";

    const rows = document.querySelectorAll('.horario-row');
    rows.forEach(r => r.classList.remove('active'));
    const activeIdx = day === 0 ? 6 : day - 1;
    if (rows[activeIdx]) {
      rows[activeIdx].classList.add('active');
    }

    if (day === 1) {
      isOpen = false;
      statusMsg = "Cerrado hoy · Abre mañana a las 16h";
    } else if (day >= 2 && day <= 4) {
      if (currentTime >= 960 && currentTime < 1260) {
        isOpen = true;
        statusMsg = "Abierto ahora · Cierra a las 21:00";
      } else {
        isOpen = false;
        statusMsg = currentTime < 960 ? "Cerrado · Abre hoy a las 16h" : "Cerrado · Abre mañana a las 16h";
      }
    } else if (day === 5) {
      if (currentTime >= 960 && currentTime < 1320) {
        isOpen = true;
        statusMsg = "Abierto ahora · Cierra a las 22:00";
      } else {
        isOpen = false;
        statusMsg = currentTime < 960 ? "Cerrado · Abre hoy a las 16h" : "Cerrado · Abre mañana a las 11h";
      }
    } else if (day === 6) {
      if ((currentTime >= 660 && currentTime < 840) || (currentTime >= 960 && currentTime < 1320)) {
        isOpen = true;
        const closes = currentTime < 840 ? "14:00" : "22:00";
        statusMsg = "Abierto ahora · Cierra a las " + closes;
      } else {
        isOpen = false;
        if (currentTime < 660) {
          statusMsg = "Cerrado · Abre hoy a las 11:00";
        } else if (currentTime >= 840 && currentTime < 960) {
          statusMsg = "Cerrado temporalmente · Abre a las 16:00";
        } else {
          statusMsg = "Cerrado · Abre mañana a las 11:00";
        }
      }
    } else if (day === 0) {
      if ((currentTime >= 660 && currentTime < 840) || (currentTime >= 960 && currentTime < 1260)) {
        isOpen = true;
        const closes = currentTime < 840 ? "14:00" : "21:00";
        statusMsg = "Abierto ahora · Cierra a las " + closes;
      } else {
        isOpen = false;
        if (currentTime < 660) {
          statusMsg = "Cerrado · Abre hoy a las 11:00";
        } else if (currentTime >= 840 && currentTime < 960) {
          statusMsg = "Cerrado temporalmente · Abre a las 16:00";
        } else {
          statusMsg = "Cerrado · Abre el martes a las 16:00";
        }
      }
    }

    const clockLabel = document.querySelector('.clock-label');
    let badge = document.querySelector('.status-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'status-badge';
      const container = document.querySelector('.horario-visual');
      if (container) container.appendChild(badge);
    }

    if (isOpen) {
      if (clockLabel) {
        clockLabel.textContent = "ABIERTO";
        clockLabel.style.color = "#2ecc71";
      }
      badge.textContent = statusMsg;
      badge.className = "status-badge open";
    } else {
      if (clockLabel) {
        clockLabel.textContent = "CERRADO";
        clockLabel.style.color = "var(--red)";
      }
      badge.textContent = statusMsg;
      badge.className = "status-badge closed";
    }
  }

  updateOpeningStatus();
  setInterval(updateOpeningStatus, 15000);
}
