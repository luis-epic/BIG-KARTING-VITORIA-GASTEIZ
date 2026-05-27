/**
 * Submódulo de cursor personalizado reactivo y suavizado con Lerp
 */
export function initCustomCursor() {
  const cursor = document.getElementById('cursor');
  const cursorGlow = document.getElementById('cursor-glow');

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;
  let currentCursorX = 0, currentCursorY = 0;

  if (window.matchMedia('(hover: hover)').matches) {
    // Ocultar cursor de sistema dinámicamente
    document.body.style.cursor = 'none';
    
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    let isClicked = false;
    document.addEventListener('mousedown', () => {
      isClicked = true;
      if (cursor) cursor.classList.add('click');
    });
    document.addEventListener('mouseup', () => {
      isClicked = false;
      if (cursor) cursor.classList.remove('click');
    });

    let lastCursorX = -1;
    let lastCursorY = -1;
    let lastGlowX = -1;
    let lastGlowY = -1;

    function animateCursor() {
      // 1. Cursor principal (Lerp súper reactivo 40% por frame)
      currentCursorX += (mouseX - currentCursorX) * 0.4;
      currentCursorY += (mouseY - currentCursorY) * 0.4;

      const scaleCursor = isClicked ? 1.6 : 1.0;
      if (cursor && (Math.abs(currentCursorX - lastCursorX) > 0.05 || Math.abs(currentCursorY - lastCursorY) > 0.05)) {
        cursor.style.transform = `translate3d(${currentCursorX}px, ${currentCursorY}px, 0) translate(-50%, -50%) scale(${scaleCursor})`;
        lastCursorX = currentCursorX;
        lastCursorY = currentCursorY;
      }

      // 2. Halo Glow (Lerp elástico e inercia del 15% por frame)
      const lerpGlow = 0.15;
      glowX += (mouseX - glowX) * lerpGlow;
      glowY += (mouseY - glowY) * lerpGlow;

      const scaleGlow = isClicked ? 0.6 : 1.0;
      if (cursorGlow && (Math.abs(glowX - lastGlowX) > 0.05 || Math.abs(glowY - lastGlowY) > 0.05)) {
        cursorGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%) scale(${scaleGlow})`;
        lastGlowX = glowX;
        lastGlowY = glowY;
      }

      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }
}
