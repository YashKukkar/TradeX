// Mobile nav toggle with delegation
function initMobileNav() {
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.mobile-toggle');
    if (!toggle) return;
    const nav = toggle.closest('.nav');
    const links = nav ? nav.querySelector('.nav-links') : document.querySelector('.nav-links');
    if (links) {
      links.classList.toggle('open');
      const icon = toggle.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.textContent = links.classList.contains('open') ? 'close' : 'menu';
      }
    }
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  initMobileNav();
}

// Active link highlight
const path = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href').split('/').pop();
  if (href === path) a.classList.add('active');
});

// Contact form (demo handler)
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = document.getElementById('formStatus');
    status.textContent = 'Thanks! Your message has been received.';
    status.style.color = 'var(--color-success)';
    form.reset();
  });
};
