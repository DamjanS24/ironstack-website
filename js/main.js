/* Ironstack — i18n toggle, mobile nav, terminal placeholder, lead form */
(function () {
  // ---------- i18n ----------
  var toggle = document.getElementById('langToggle');
  var lang = localStorage.getItem('ironstack-lang') || 'en';

  function apply(l) {
    var dict = window.I18N[l] || window.I18N.en;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key]) el.innerHTML = dict[key];
    });
    document.documentElement.lang = l;
    toggle.textContent = l === 'en' ? 'NL' : 'EN';
    localStorage.setItem('ironstack-lang', l);
    lang = l;
  }
  toggle.addEventListener('click', function () { apply(lang === 'en' ? 'nl' : 'en'); });
  if (lang !== 'en') apply(lang);

  // ---------- mobile nav ----------
  var burger = document.getElementById('navBurger');
  var links = document.getElementById('navLinks');
  burger.addEventListener('click', function () { links.classList.toggle('open'); });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') links.classList.remove('open');
  });

  // ---------- terminal placeholder (removed when the showcase video lands) ----------
  var LINES = [
    { t: '$ ironstack audit --client voorbeeld-bv', c: '' },
    { t: '  mapping 14 services across 3 providers…', c: 'dim' },
    { t: '  ✓ audit complete — 11 services reclaimable', c: 'ok' },
    { t: '$ ironstack migrate --phase 3 --dry-run', c: '' },
    { t: '  ✓ 42/42 steps verified · rollback ready', c: 'ok' },
    { t: '$ ironstack status', c: '' },
    { t: '  crm ✓  projects ✓  invoicing ✓  monitoring ✓', c: 'ok' },
    { t: '  sovereignty: 100% — no third-party processors', c: 'dim' }
  ];
  var term = document.getElementById('terminal');
  if (term) {
    var i = 0;
    function nextLine() {
      if (i >= LINES.length) return;
      var line = LINES[i];
      var el = document.createElement('div');
      if (line.c) el.className = line.c;
      term.appendChild(el);
      var j = 0;
      var typer = setInterval(function () {
        el.textContent = line.t.slice(0, ++j);
        if (j >= line.t.length) {
          clearInterval(typer);
          i++;
          setTimeout(nextLine, 340);
        }
      }, 14);
    }
    // start typing when the device scrolls into view
    var started = false;
    var io = new IntersectionObserver(function (entries) {
      if (!started && entries[0].isIntersecting) { started = true; nextLine(); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(term);
  }

  // ---------- scroll-reveal (hero stays static: no blank flash above the fold) ----------
  var revealables = document.querySelectorAll(
    '.section-title, .section-sub, .card, .phases li, .proof-item, .proof-line, ' +
    '.services-note, .manifesto blockquote, .manifesto p, .about-photo, .about-text > *, ' +
    '.lead-form, .contact-aside, .exit-inner > *, .faq-item, .step'
  );
  revealables.forEach(function (el) { el.classList.add('reveal'); });
  var ro = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
        return c.classList && c.classList.contains('reveal');
      });
      el.style.transitionDelay = Math.min(siblings.indexOf(el) * 70, 350) + 'ms';
      el.classList.add('in');
      ro.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealables.forEach(function (el) { ro.observe(el); });

  // ---------- showcase video: load only where it earns its bytes ----------
  // desktop viewport + motion allowed + no data-saver; everyone else keeps the 20KB poster
  var vid = document.querySelector('.showcase-video');
  if (vid && vid.dataset.src) {
    var wantVideo = window.matchMedia('(min-width: 860px)').matches &&
                    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
                    !(navigator.connection && navigator.connection.saveData);
    if (wantVideo) {
      var vio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          vid.src = vid.dataset.src;
          vid.play().catch(function () {});
          vio.disconnect();
        }
      }, { rootMargin: '200px' });
      vio.observe(vid);
    }
  }

  // ---------- about tilt card (3D follow-cursor, mouse devices only) ----------
  var tilt = document.getElementById('aboutPhoto');
  var canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
                !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (tilt && canTilt) {
    tilt.addEventListener('mousemove', function (e) {
      var r = tilt.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      var rx = ((y - r.height / 2) / (r.height / 2)) * -8;  // max 8deg
      var ry = ((x - r.width / 2) / (r.width / 2)) * 8;
      tilt.style.transition = 'transform 0.1s ease-out';
      tilt.style.transform = 'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale3d(1.04, 1.04, 1.04)';
    });
    tilt.addEventListener('mouseleave', function () {
      tilt.style.transition = 'transform 0.4s ease-in-out';
      tilt.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }

  // ---------- 3D cards (services + AI): parallax tilt; the seal stamp is CSS-only ----------
  if (canTilt) {
    document.querySelectorAll('.card-3d').forEach(function (card) {
      var ghost = card.querySelector('.ghost-no');
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform 0.09s ease-out, box-shadow 0.3s ease';
        card.style.transform = 'perspective(900px) rotateX(' + (-py * 9).toFixed(2) + 'deg) rotateY(' + (px * 9).toFixed(2) + 'deg) scale3d(1.03, 1.03, 1.03)';
        if (ghost) ghost.style.transform = 'translate(-50%, -50%) translate(' + (-px * 30).toFixed(1) + 'px, ' + (-py * 30).toFixed(1) + 'px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.45s ease, box-shadow 0.45s ease';
        card.style.transform = '';
        if (ghost) ghost.style.transform = 'translate(-50%, -50%)';
      });
    });
  }

  // ---------- proof tags: one split-flap wave when the grid scrolls in ----------
  var proofGrid = document.querySelector('.proof-grid');
  if (proofGrid && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var FLAP_CHARS = 'abcdefghijklmnopqrstuvwxyz-';
    function flapEl(el, delay) {
      var text = el.textContent;
      el.innerHTML = text.split('').map(function () { return '<span class="fl">&nbsp;</span>'; }).join('');
      Array.prototype.forEach.call(el.children, function (sp, i) {
        setTimeout(function () {
          var n = 0, max = 3 + Math.floor(i / 2);
          sp.classList.add('spin');
          var iv = setInterval(function () {
            sp.textContent = FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)];
            if (++n >= max) { clearInterval(iv); sp.textContent = text[i]; sp.classList.remove('spin'); }
          }, 55);
        }, delay + i * 40);
      });
    }
    var flapped = false;
    var fio = new IntersectionObserver(function (entries) {
      if (!flapped && entries[0].isIntersecting) {
        flapped = true;
        proofGrid.querySelectorAll('.proof-v').forEach(function (v, row) { flapEl(v, row * 120); });
        fio.disconnect();
      }
    }, { threshold: 0.35 });
    fio.observe(proofGrid);
  }

  // ---------- lead form ----------
  var WEBHOOK = 'https://n8n.ironstack.nl/webhook/website-lead';
  var form = document.getElementById('leadForm');
  var status = document.getElementById('formStatus');
  var loadedAt = Date.now();

  function msg(key) {
    status.textContent = (window.I18N[lang] || window.I18N.en)[key];
  }

  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    // spam gate: honeypot filled or form submitted inhumanly fast → pretend success, send nothing
    if (form.website.value !== '' || Date.now() - loadedAt < 3000) {
      form.reset();
      msg('contact.ok');
      return;
    }
    var data = {
      name: form.name.value.trim(),
      company: form.company.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      website: form.website.value,
      lang: lang,
      page: location.href
    };
    if (!data.name || !data.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      msg('contact.invalid');
      return;
    }
    var sendBtn = form.querySelector('button[type="submit"]');
    sendBtn.disabled = true;
    msg('contact.sending');
    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      form.reset();
      msg('contact.ok');
    }).catch(function () {
      msg('contact.err');
    }).finally(function () {
      sendBtn.disabled = false;
    });
  });
})();
