// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.mobile-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  // Active link highlight
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === path) a.classList.add('active');
  });

  // Animate hero chart (SVG path)
  const chart = document.getElementById('heroChart');
  if (chart) {
    const w = 520, h = 180;
    const points = 40;
    let v = 60;
    const seq = [];
    for (let i = 0; i < points; i++) {
      v += (Math.random() - 0.45) * 12;
      v = Math.max(20, Math.min(h - 20, v));
      seq.push(v);
    }
    const step = w / (points - 1);
    const line = seq.map((y, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = line + ` L${w},${h} L0,${h} Z`;
    chart.innerHTML = `
      <defs>
        <linearGradient id="gFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#00e0a4" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#00e0a4" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#gFill)"/>
      <path d="${line}" fill="none" stroke="#00e0a4" stroke-width="2.2" stroke-linejoin="round"/>
    `;
  }

  // Contact form (demo handler)
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.getElementById('formStatus');
      status.textContent = 'Thanks! Your message has been received. We\'ll get back to you within one business day.';
      status.style.color = 'var(--primary)';
      form.reset();
    });
  }
});
