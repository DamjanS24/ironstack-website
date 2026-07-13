/* Ironstack — i18n toggle, mobile nav, terminal placeholder, lead form */
(function () {
  // ---------- i18n ----------
  var toggle = document.getElementById('langToggle');
  var LANGS = ['en', 'nl', 'sr-latn', 'sr-cyrl'];
  var HTML_LANG = { en: 'en', nl: 'nl', 'sr-latn': 'sr-Latn', 'sr-cyrl': 'sr-Cyrl' };
  var lang = localStorage.getItem('ironstack-lang') || 'en';
  if (LANGS.indexOf(lang) === -1) lang = 'en';

  // the page's own HTML is the English source of truth; captured on first swap so EN needs no dictionary
  var enSource = {};
  function apply(l) {
    var dict = window.I18N[l] || window.I18N.en;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!(key in enSource)) enSource[key] = el.innerHTML;
      if (dict[key]) el.innerHTML = dict[key];
      else if (l === 'en') el.innerHTML = enSource[key];
    });
    document.documentElement.lang = HTML_LANG[l] || l;
    toggle.querySelectorAll('[data-lang]').forEach(function (sp) {
      sp.classList.toggle('on', sp.getAttribute('data-lang') === l);
    });
    localStorage.setItem('ironstack-lang', l);
    lang = l;
  }
  if (toggle && window.I18N) {
    toggle.addEventListener('click', function () {
      apply(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]);
    });
    if (lang !== 'en') apply(lang);
  } else {
    lang = 'en';
  }

  // ---------- theme (light / dark / system) ----------
  // the inline head script already set data-theme; here we run the three-way mode switch and the seal artwork
  var themeBtn = document.getElementById('themeToggle');
  var sysDark = window.matchMedia('(prefers-color-scheme: dark)');
  var themeMode = (function () {
    try {
      var q = new URLSearchParams(location.search).get('theme');
      if (q === 'dark' || q === 'light') return q;
    } catch (e) {}
    return localStorage.getItem('ironstack-theme-mode') || 'system';
  })();
  function applyTheme(mode, persist) {
    themeMode = mode;
    var t = mode === 'system' ? (sysDark.matches ? 'dark' : 'light') : mode;
    document.documentElement.setAttribute('data-theme', t);
    // Safari paints the browser chrome (status bar, toolbar) from theme-color; keep it in step
    var mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.setAttribute('content', t === 'dark' ? '#14120D' : '#F6F3EC');
    if (persist) localStorage.setItem('ironstack-theme-mode', mode);
    if (themeBtn) themeBtn.querySelectorAll('[data-mode]').forEach(function (sp) {
      sp.classList.toggle('on', sp.getAttribute('data-mode') === mode);
    });
    // seals exist in ink and cream variants; swap artwork to match the ground it sits on
    document.querySelectorAll('img[src*="-ink.svg"], img[src*="-cream.svg"], img[data-osrc]').forEach(function (img) {
      if (!img.dataset.osrc) img.dataset.osrc = img.getAttribute('src');
      var src = img.dataset.osrc;
      if (t === 'dark') {
        src = src.indexOf('-ink.svg') > -1 ? src.replace('-ink.svg', '-cream.svg') : src.replace('-cream.svg', '-ink.svg');
      }
      img.setAttribute('src', src);
    });
  }
  applyTheme(themeMode, false);
  if (themeBtn) themeBtn.addEventListener('click', function (e) {
    var sp = e.target.closest('[data-mode]');
    var order = ['light', 'dark', 'system'];
    applyTheme(sp ? sp.getAttribute('data-mode') : order[(order.indexOf(themeMode) + 1) % 3], true);
  });
  if (sysDark.addEventListener) sysDark.addEventListener('change', function () {
    if (themeMode === 'system') applyTheme('system', false);
  });

  // ---------- mobile nav ----------
  var burger = document.getElementById('navBurger');
  var links = document.getElementById('navLinks');
  function setMenu(open) {
    if (open) { links.classList.remove('no-anim'); burger.classList.remove('no-anim'); }
    links.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  }
  burger.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
  links.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    // leaving the page: close instantly, or the view-transition snapshot
    // catches the curtain mid-animation and the pinned nav morphs visibly
    if (!(a.pathname === location.pathname && a.hash)) {
      links.classList.add('no-anim');
      burger.classList.add('no-anim');
    }
    setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); burger.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (links.classList.contains('open') && !e.target.closest('.nav')) setMenu(false);
  });
  var navMq = window.matchMedia('(min-width: 721px)');
  if (navMq.addEventListener) navMq.addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  // ---------- services mega (desktop): aria state + touch support ----------
  var mega = document.querySelector('.has-mega');
  var megaLink = mega ? mega.querySelector('a') : null;
  if (megaLink) {
    megaLink.setAttribute('aria-haspopup', 'true');
    megaLink.setAttribute('aria-expanded', 'false');
    var setMega = function (open) {
      mega.classList.toggle('tap-open', open);
      megaLink.setAttribute('aria-expanded', String(open));
    };
    mega.addEventListener('mouseenter', function () {
      mega.classList.remove('is-closed');
      if (navMq.matches) megaLink.setAttribute('aria-expanded', 'true');
    });
    mega.addEventListener('mouseleave', function () { if (!mega.classList.contains('tap-open')) megaLink.setAttribute('aria-expanded', 'false'); });
    mega.addEventListener('focusin', function () {
      mega.classList.remove('is-closed');
      if (navMq.matches) megaLink.setAttribute('aria-expanded', 'true');
    });
    mega.addEventListener('focusout', function (e) {
      if (!mega.contains(e.relatedTarget) && !mega.classList.contains('tap-open')) megaLink.setAttribute('aria-expanded', 'false');
    });
    // clicking any item closes the panel for good: CSS alone keeps it open when the
    // click does not unload the page (hash scrolls, links to the current page) —
    // blur breaks :focus-within, .is-closed suppresses :hover until re-entry
    mega.addEventListener('click', function (e) {
      if (e.defaultPrevented || !e.target.closest('a')) return;
      setMega(false);
      mega.classList.add('is-closed');
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });
    // back/forward cache restores the page as it was — including an open panel
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) { setMega(false); mega.classList.add('is-closed'); }
    });
    // touch at desktop width (tablets): first tap opens the panel, second follows the link
    megaLink.addEventListener('click', function (e) {
      if (navMq.matches && window.matchMedia('(hover: none)').matches && !mega.classList.contains('tap-open')) {
        e.preventDefault();
        setMega(true);
      }
    });
    document.addEventListener('click', function (e) {
      if (mega.classList.contains('tap-open') && !e.target.closest('.has-mega')) setMega(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mega.classList.contains('tap-open')) setMega(false);
    });
  }

  // ---------- back to top (injected here so every page gets it without markup) ----------
  var toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(toTop);
  var toTopQueued = false;
  function updateToTop() {
    toTop.classList.toggle('show', window.scrollY > window.innerHeight * 0.8);
    toTopQueued = false;
  }
  window.addEventListener('scroll', function () {
    if (!toTopQueued) { toTopQueued = true; requestAnimationFrame(updateToTop); }
  }, { passive: true });
  updateToTop();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0 }); });

  // ---------- page transitions: forward navigations only ----------
  // back/forward restores scroll mid-page; a transition there fights scroll
  // restoration and smears. Skipped, traversal stays native and instant.
  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;
    var type = e.activation && e.activation.navigationType;
    if (type === 'traverse' || type === 'reload') e.viewTransition.skipTransition();
  });

  // logo: href="/" everywhere for clean semantics, but when already on the
  // homepage a click scrolls to the top instead of reloading the page
  var brand = document.querySelector('.nav-brand');
  var onHome = location.pathname === '/' || /\/index\.html$/.test(location.pathname);
  if (brand && onHome) brand.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0 });
    if (location.hash) history.replaceState(null, '', location.pathname);
  });

  // ---------- scroll-reveal (hero stays static: no blank flash above the fold) ----------
  var revealables = document.querySelectorAll(
    '.section-title, .section-sub, .svc, .phases li, .register, .proof-line, ' +
    '.services-note, .manifesto blockquote, .manifesto p, .about-photo, .about-text > *, ' +
    '.lead-form, .contact-aside, .exit-inner > *, .faq-item, .step, .prose > *'
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
      var rx = ((y - r.height / 2) / (r.height / 2)) * -11;  // max 11deg
      var ry = ((x - r.width / 2) / (r.width / 2)) * 11;
      tilt.style.transition = 'transform 0.1s ease-out, box-shadow 0.15s ease-out';
      tilt.style.transform = 'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale3d(1.04, 1.04, 1.04)';
      // the shadow falls away from the tilt, like a card lifted under a light
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      tilt.style.boxShadow = (ry * -2.2).toFixed(1) + 'px ' + (26 + rx * -2.2).toFixed(1) + 'px 60px -26px rgba(' + (dark ? '0, 0, 0, 0.75' : '23, 21, 15, 0.55') + ')';
      // the glare sits where the cursor is: that's where the light hits
      tilt.style.setProperty('--gx', (x / r.width * 100).toFixed(1) + '%');
      tilt.style.setProperty('--gy', (y / r.height * 100).toFixed(1) + '%');
      tilt.style.setProperty('--gs', '1');
    });
    tilt.addEventListener('mouseleave', function () {
      tilt.style.transition = 'transform 0.4s ease-in-out, box-shadow 0.4s ease-in-out';
      tilt.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      tilt.style.boxShadow = '';
      tilt.style.setProperty('--gs', '0');
    });
  }

  // ---------- living portrait: load the loop only where it earns its bytes ----------
  var lp = document.querySelector('.tilt-video');
  if (lp && lp.dataset.src) {
    var wantLoop = window.matchMedia('(min-width: 860px)').matches &&
                   !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
                   !(navigator.connection && navigator.connection.saveData);
    if (wantLoop) {
      var lio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          lp.addEventListener('playing', function () { lp.classList.add('on'); });
          lp.src = lp.dataset.src;
          lp.play().catch(function () {});
          lio.disconnect();
        }
      }, { rootMargin: '300px' });
      lio.observe(lp);
    } else {
      lp.remove();
    }
  }

  // ---------- gyro tilt: on phones the card leans with the device ----------
  var gyroTilt = document.getElementById('aboutPhoto');
  if (gyroTilt && 'DeviceOrientationEvent' in window &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var gBase = null, gtx = 0, gty = 0, gcx = 0, gcy = 0, gRaf = null;
    function gyroApply() {
      gRaf = null;
      gcx += (gtx - gcx) * 0.12;
      gcy += (gty - gcy) * 0.12;
      gyroTilt.style.transform = 'perspective(1000px) rotateX(' + gcx.toFixed(2) + 'deg) rotateY(' + gcy.toFixed(2) + 'deg)';
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      gyroTilt.style.boxShadow = (gcy * -2.2).toFixed(1) + 'px ' + (26 + gcx * -2.2).toFixed(1) + 'px 60px -26px rgba(' + (dark ? '0, 0, 0, 0.75' : '23, 21, 15, 0.55') + ')';
      // glare slides toward the raised edge; brightness grows with the lean, so a flat phone shows none
      gyroTilt.style.setProperty('--gx', (50 + (gcy / 11) * 45).toFixed(1) + '%');
      gyroTilt.style.setProperty('--gy', (42 - (gcx / 11) * 45).toFixed(1) + '%');
      gyroTilt.style.setProperty('--gs', Math.min(1, Math.sqrt(gcx * gcx + gcy * gcy) / 5).toFixed(2));
      if (Math.abs(gcx - gtx) > 0.04 || Math.abs(gcy - gty) > 0.04) gRaf = requestAnimationFrame(gyroApply);
    }
    function gyroRead(e) {
      if (e.beta === null || e.gamma === null) return;
      if (gBase === null) gBase = { b: e.beta, g: e.gamma };
      // deltas from how the phone was being held when the page loaded
      var db = Math.max(-18, Math.min(18, e.beta - gBase.b));
      var dg = Math.max(-18, Math.min(18, e.gamma - gBase.g));
      gtx = (db / 18) * -11;
      gty = (dg / 18) * 11;
      if (!gRaf) gRaf = requestAnimationFrame(gyroApply);
    }
    function gyroStart() { window.addEventListener('deviceorientation', gyroRead); }
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS: sensor access needs a user gesture; the card wakes on first tap
      gyroTilt.addEventListener('click', function gyroAsk() {
        DeviceOrientationEvent.requestPermission().then(function (r) {
          if (r === 'granted') { gyroTilt.removeEventListener('click', gyroAsk); gyroStart(); }
        }).catch(function () {});
      });
    } else {
      gyroStart();
    }
  }

  // ---------- proof register: the seal stamps the document once, on scroll ----------
  var register = document.querySelector('.register');
  if (register) {
    var rio = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { register.classList.add('stamped'); rio.disconnect(); }
    }, { threshold: 0.5 });
    rio.observe(register);
  }

  // ---------- service cards: on touch devices the seal stamps on scroll, not on tap ----------
  if (window.matchMedia('(hover: none)').matches) {
    var svcCards = document.querySelectorAll('.svc');
    if (svcCards.length) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('stamped'); sio.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -45% 0px', threshold: 0 });
      svcCards.forEach(function (el) { sio.observe(el); });
    }
  }

  // ---------- lead form ----------
  var WEBHOOK = 'https://n8n.ironstack.nl/webhook/website-lead';
  var form = document.getElementById('leadForm');
  var status = document.getElementById('formStatus');
  var modal = document.getElementById('leadModal');
  var loadedAt = Date.now();

  function dict() { return window.I18N[lang] || window.I18N.en; }
  function msg(key) {
    status.textContent = key ? dict()[key] : '';
  }

  // ----- success dialog -----
  var lastFocus = null;
  function openModal() {
    if (!modal) { msg('contact.ok'); return; }
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.querySelector('.lead-modal-close').focus();
    document.addEventListener('keydown', onModalKey);
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    document.removeEventListener('keydown', onModalKey);
    modal.classList.add('closing');
    setTimeout(function () {
      modal.classList.remove('closing');
      modal.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, 230);
  }
  function onModalKey(e) { if (e.key === 'Escape') closeModal(); }
  if (modal) modal.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-close')) closeModal();
  });

  // ----- live field validation: judge on leave, reward while typing -----
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function phoneShaped(v) {
    var digits = v.replace(/\D/g, '');
    return /^[+0-9][0-9 ()\/.\-]*$/.test(v) && digits.length >= 8 && digits.length <= 15;
  }
  // true = good (green), false = wrong (red + hint), null = nothing to say yet
  var FIELDS = {
    name:    { err: 'contact.errName',    check: function (v) { return v !== ''; } },
    company: { check: function (v) { return v !== '' ? true : null; } },
    email:   { err: 'contact.errEmail',   check: function (v) { return EMAIL_RE.test(v); } },
    phone:   { err: 'contact.errPhone',   check: function (v) { return v === '' ? null : phoneShaped(v); } },
    reason:  { check: function (v) { return v ? true : null; } },
    size:    { check: function (v) { return v ? true : null; } },
    message: { err: 'contact.errMessage', check: function (v) { return v !== ''; } }
  };
  function judge(key) { return FIELDS[key].check(form[key].value.trim()); }
  function setFieldState(key, state) {
    var label = form[key].closest('label');
    if (!label) return;
    label.classList.toggle('valid', state === true);
    label.classList.toggle('invalid', state === false);
    var em = label.querySelector('.field-msg');
    if (state === false) {
      if (!em) {
        em = document.createElement('em');
        em.className = 'field-msg';
        label.appendChild(em);
      }
      em.textContent = dict()[FIELDS[key].err];
    } else if (em) {
      em.remove();
    }
  }
  function resetFieldStates() {
    Object.keys(FIELDS).forEach(function (key) { setFieldState(key, null); });
  }
  if (form) Object.keys(FIELDS).forEach(function (key) {
    var input = form[key];
    // leaving the field is the moment of judgement, in both directions
    input.addEventListener('blur', function () { setFieldState(key, judge(key)); });
    // while typing: good news lands immediately, bad news only while fixing a known error
    function live() {
      var state = judge(key);
      var label = input.closest('label');
      if (state === true) setFieldState(key, true);
      else if (state === null || label.classList.contains('invalid')) setFieldState(key, state);
      else label.classList.remove('valid'); // not right yet, still typing: back to neutral
    }
    input.addEventListener('input', live);
    input.addEventListener('change', live);
  });

  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.classList.remove('error', 'shake');
    // spam gate: honeypot filled or form submitted inhumanly fast → pretend success, send nothing
    if (form.website.value !== '' || Date.now() - loadedAt < 3000) {
      form.reset();
      resetFieldStates();
      msg('');
      openModal();
      return;
    }
    var data = {
      name: form.name.value.trim(),
      company: form.company.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      reason: form.reason.value,
      size: form.size.value,
      message: form.message.value.trim(),
      website: form.website.value,
      lang: lang,
      page: location.href
    };
    var blockers = [];
    Object.keys(FIELDS).forEach(function (key) {
      var state = judge(key);
      setFieldState(key, state);
      if (state === false) blockers.push(key);
    });
    if (blockers.length) {
      form[blockers[0]].focus();
      msg('contact.invalid');
      status.classList.add('error');
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
      resetFieldStates();
      msg('');
      openModal();
    }).catch(function () {
      msg('contact.err');
      status.classList.add('error', 'shake');
    }).finally(function () {
      sendBtn.disabled = false;
    });
  });

  // ---------- click the portrait card: the spin flourish replays ----------
  var spinner = document.querySelector('#aboutPhoto .card-spin');
  if (spinner) document.getElementById('aboutPhoto').addEventListener('click', function () {
    spinner.style.animation = 'none';
    void spinner.offsetWidth; // reflow so the animation restarts
    spinner.style.animation = '';
  });

  // ---------- service worker: fonts and versioned assets from local cache ----------
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
})();
