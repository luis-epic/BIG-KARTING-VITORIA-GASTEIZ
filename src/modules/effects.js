/**
 * Submódulo de efectos interactivos y animaciones de scroll
 */
export function initVisualEffects() {
  // 1. NAVBAR SCROLL
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    if (window.scrollY > 50) {
      nav.style.background = 'rgba(10,10,10,0.98)';
      nav.style.padding = '12px 40px';
    } else {
      nav.style.background = 'linear-gradient(to bottom, rgba(10,10,10,0.95), transparent)';
      nav.style.padding = '18px 40px';
    }
  });

  // 2. SCROLL REVEAL OBSERVER
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach(r => obs.observe(r));
  }

  // 3. ANIMATED COUNTERS
  function animateCounter(el, targetStr) {
    const isSymbol = isNaN(parseFloat(targetStr));
    if (isSymbol) return; // Saltar símbolos como ∞
    const hasOrdinal = /\D/.test(targetStr);
    const target = parseFloat(targetStr);
    const suffix = hasOrdinal ? targetStr.replace(/[\d\.]/g, '') : '';
    let start = 0;
    const duration = 1400;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(target * ease);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = targetStr;
    }
    requestAnimationFrame(tick);
  }

  const statNums = document.querySelectorAll('.stat-num');
  if (statNums.length > 0) {
    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const original = e.target.dataset.target || e.target.textContent.trim();
          e.target.dataset.target = original;
          animateCounter(e.target, original);
          counterObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    statNums.forEach(n => counterObs.observe(n));
  }

  // 4. 3D TILT CARDS
  document.querySelectorAll('.card-3d').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
