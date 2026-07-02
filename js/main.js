/* ============================================================
   HIMALAYAN EXPLORATION — Interactions
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Page loader ---------- */
  window.addEventListener('load', () => {
    const loader = $('#loader');
    if (!loader) return;
    setTimeout(() => loader.classList.add('done'), reduceMotion ? 0 : 650);
    setTimeout(() => (loader.style.display = 'none'), 1500);
  });

  /* ---------- Image fallback (graceful, on-brand) ---------- */
  const gradients = [
    'linear-gradient(135deg,#33566B,#1E3A30)',
    'linear-gradient(135deg,#26302C,#1A1D1C)',
    'linear-gradient(135deg,#5C7C8F,#33566B)',
    'linear-gradient(135deg,#B08D57,#8A6A32)'
  ];
  $$('img').forEach((img, i) => {
    img.addEventListener('error', function handle() {
      img.removeEventListener('error', handle);
      const parent = img.parentElement;
      if (parent) parent.style.background = gradients[i % gradients.length];
      img.style.visibility = 'hidden';
    });
  });

  /* ---------- Sticky nav state ---------- */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ---------- Mobile menu ---------- */
  const mobileNav = $('#mobileNav');
  const openMobile = () => { mobileNav.classList.add('open'); mobileNav.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
  const closeMobile = () => { mobileNav.classList.remove('open'); mobileNav.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
  $('#burger').addEventListener('click', openMobile);
  $('#mClose').addEventListener('click', closeMobile);
  $$('.m-link').forEach(a => a.addEventListener('click', closeMobile));

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$('.reveal');
  if (reduceMotion) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const inner = el.querySelector('.u, span');
    const innerHTML = inner ? inner.outerHTML : '';
    if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; if (inner) el.appendChild(inner); return; }
    const dur = 1600; const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.floor(eased * target);
      el.firstChild ? null : null;
      el.textContent = val.toLocaleString() + suffix;
      if (innerHTML) el.insertAdjacentHTML('beforeend', innerHTML);
      if (p < 1) requestAnimationFrame(step);
      else { el.textContent = target.toLocaleString() + suffix; if (innerHTML) el.insertAdjacentHTML('beforeend', innerHTML); }
    };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counters.forEach(c => cio.observe(c));

  /* ---------- Inquiry drawer ---------- */
  const drawer = $('#drawer');
  const overlay = $('#drawerOverlay');
  let lastFocus = null;
  const openDrawer = () => {
    lastFocus = document.activeElement;
    drawer.classList.add('open'); overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    closeMobile();
    setTimeout(() => $('#fName').focus(), 350);
  };
  const closeDrawer = () => {
    drawer.classList.remove('open'); overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  $$('[data-drawer-open]').forEach(b => b.addEventListener('click', openDrawer));
  $('#drawerClose').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDrawer(); closeLightbox(); } });

  /* ---------- Form validation ---------- */
  const form = $('#inquiryForm');
  const validateField = (input) => {
    const field = input.closest('.field');
    let ok = true;
    if (input.hasAttribute('required') && !input.value.trim()) ok = false;
    if (input.type === 'email' && input.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value)) ok = false;
    field.classList.toggle('invalid', !ok);
    return ok;
  };
  $$('#inquiryForm input[required]').forEach(inp => inp.addEventListener('blur', () => validateField(inp)));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const required = $$('#inquiryForm input[required]');
    let valid = true; let firstBad = null;
    required.forEach(inp => { const r = validateField(inp); if (!r && !firstBad) firstBad = inp; valid = valid && r; });
    if (!valid) { firstBad && firstBad.focus(); return; }
    const btn = $('#inquirySubmit');
    btn.disabled = true; btn.style.opacity = '.7'; btn.textContent = 'Sending…';
    setTimeout(() => {
      btn.textContent = '✓ Enquiry sent'; btn.style.background = '#2F6B4F';
      showToast('Thank you — we\'ll reply within 24 hours.');
      setTimeout(() => { closeDrawer(); form.reset(); btn.disabled = false; btn.style.opacity = ''; btn.style.background = '';
        btn.innerHTML = 'Send my enquiry <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'; }, 1600);
    }, 900);
  });

  /* ---------- Wishlist save ---------- */
  $$('[data-save]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      btn.classList.toggle('saved');
      showToast(btn.classList.contains('saved') ? 'Saved to your wishlist' : 'Removed from wishlist');
    });
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  const toast = $('#toast');
  function showToast(msg) {
    $('#toastMsg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* ---------- Story carousel ---------- */
  const track = $('#storyTrack');
  const scrollByCard = (dir) => {
    const card = track.querySelector('.story');
    const gap = 24;
    const amt = card ? card.offsetWidth + gap : 400;
    track.scrollBy({ left: dir * amt, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  $('#storyNext').addEventListener('click', () => scrollByCard(1));
  $('#storyPrev').addEventListener('click', () => scrollByCard(-1));
  track.style.overflowX = 'auto';
  track.style.scrollbarWidth = 'none';
  track.style.scrollSnapType = 'x mandatory';
  $$('.story', track).forEach(s => { s.style.scrollSnapAlign = 'start'; });

  /* ---------- FAQ accordion ---------- */
  $$('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      $$('.faq-item').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Floating plan pill + back to top ---------- */
  const floatPlan = $('#floatPlan');
  const toTop = $('#toTop');
  const heroH = () => window.innerHeight * 0.9;
  const onScrollFloat = () => {
    const y = window.scrollY;
    const nearFooter = (document.body.scrollHeight - (y + window.innerHeight)) < 420;
    floatPlan.classList.toggle('show', y > heroH() && !nearFooter);
    toTop.classList.toggle('show', y > heroH());
  };
  onScrollFloat();
  window.addEventListener('scroll', onScrollFloat, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- Lightbox ---------- */
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  function closeLightbox() { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
  $$('.gitem').forEach(item => {
    item.addEventListener('click', () => {
      const full = item.dataset.full;
      if (!full) return;
      lightboxImg.src = full;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  $('#lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  /* ---------- Smooth anchor + close menus ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMobile();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Subtle hero parallax ---------- */
  if (!reduceMotion) {
    const heroImg = $('.hero__media img');
    if (heroImg) {
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y < window.innerHeight) heroImg.style.transform = `translateY(${y * 0.18}px) scale(1.05)`;
      }, { passive: true });
    }
  }
})();
