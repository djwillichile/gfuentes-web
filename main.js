(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  // localStorage puede lanzar SecurityError (modo privado, cookies bloqueadas): nunca debe detener el script
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
  };

  // Red de nodos de fondo: muy tenue, lenta y quieta si el usuario pide menos movimiento
  const canvas = $('.net');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const LINK = 150;
    let w = 0, h = 0, nodes = [], raf = 0, lastW = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight; lastW = w;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(80, Math.round((w * h) / 19000));
      nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.16, vy: (Math.random() - 0.5) * 0.16 }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(15,43,70,${(0.09 * (1 - d / LINK)).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = 'rgba(25,118,210,0.22)';
      for (const p of nodes) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill(); }
    };
    const step = () => {
      for (const p of nodes) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
      }
      draw();
      raf = requestAnimationFrame(step);
    };
    size();
    if (reduce) draw(); else raf = requestAnimationFrame(step);
    addEventListener('resize', () => {
      // En el celular la barra del navegador cambia la altura al hacer scroll: solo se rehace si cambia el ancho
      if (Math.abs(innerWidth - lastW) < 2 && Math.abs(innerHeight - h) < 160) return;
      size(); if (reduce) draw();
    });
    document.addEventListener('visibilitychange', () => {
      if (reduce) return;
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(step);
    });
  }

  // Menú móvil: se cierra con el fondo, con un enlace o con Escape
  const menuBtn = $('.menu-btn');
  const drawer = $('#drawer');
  if (menuBtn && drawer) {
    const setMenu = (open) => {
      drawer.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (open) $('a', drawer).focus();
    };
    menuBtn.addEventListener('click', () => setMenu(drawer.hidden));
    $$('[data-close]', drawer).forEach((el) => el.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !drawer.hidden) { setMenu(false); menuBtn.focus(); }
    });
    matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  // Portada: escenas con cambio automático (disolución de 500 ms definida en CSS)
  const INTERVALO = 4000; // milisegundos que cada escena queda en pantalla
  const thumbs = $$('.thumb');
  const scenes = $$('.hero__img');
  const card = $('.scene-card');
  const toggle = $('.scene-toggle');
  const sceneOf = (btn) => scenes.find((s) => s.dataset.scene === btn.dataset.scene);
  // Asigna la imagen grande la primera vez que se necesita y espera a que esté decodificada
  const load = (img) => {
    if (img.dataset.srcset) { img.srcset = img.dataset.srcset; img.removeAttribute('data-srcset'); }
    if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
    return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  };
  let current = 0;
  const showScene = async (btn) => {
    const target = sceneOf(btn);
    await load(target);
    current = thumbs.indexOf(btn);
    scenes.forEach((img) => img.classList.toggle('is-active', img === target));
    thumbs.forEach((t) => { const on = t === btn; t.classList.toggle('is-active', on); t.setAttribute('aria-pressed', String(on)); });
    $('.scene-card__place', card).textContent = btn.dataset.place;
    $('.scene-card__meta', card).textContent = btn.dataset.meta;
    load(sceneOf(thumbs[(current + 1) % thumbs.length])); // deja lista la siguiente
  };

  // El cambio automático se detiene con el botón, al elegir una escena, al apuntar las miniaturas,
  // cuando la portada no está en pantalla o la pestaña está oculta, y nunca arranca con movimiento reducido
  let userPaused = reduce, hover = false, visible = true, sceneTimer = 0;
  const running = () => !userPaused && !hover && visible && !document.hidden;
  const schedule = () => {
    clearTimeout(sceneTimer);
    if (running()) sceneTimer = setTimeout(async () => { await showScene(thumbs[(current + 1) % thumbs.length]); schedule(); }, INTERVALO);
  };
  const setPaused = (p) => {
    userPaused = p;
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(p));
      toggle.setAttribute('aria-label', p ? 'Reanudar el cambio automático de escena' : 'Pausar el cambio automático de escena');
    }
    schedule();
  };
  thumbs.forEach((t) => {
    t.addEventListener('click', () => { showScene(t); setPaused(true); });
    const preload = () => load(sceneOf(t));
    t.addEventListener('pointerenter', preload, { once: true });
    t.addEventListener('focus', preload, { once: true });
  });
  const scenesBox = $('.thumbs');
  if (scenesBox) {
    scenesBox.addEventListener('pointerenter', () => { hover = true; schedule(); });
    scenesBox.addEventListener('pointerleave', () => { hover = false; schedule(); });
  }
  toggle && toggle.addEventListener('click', () => setPaused(!userPaused));
  document.addEventListener('visibilitychange', schedule);
  const hero = $('.hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: 0.3 }).observe(hero);
  }
  if (thumbs.length > 1) { load(sceneOf(thumbs[1])); setPaused(userPaused); }

  // Experiencia: trayectoria completa
  const expBtn = $('.exp__toggle');
  const expMore = $('#exp-more');
  if (expBtn && expMore) {
    expBtn.addEventListener('click', () => {
      const open = !expMore.classList.contains('is-open');
      expMore.classList.toggle('is-open', open);
      expBtn.setAttribute('aria-expanded', String(open));
      expBtn.textContent = open ? 'Ocultar trayectoria completa' : 'Ver trayectoria completa · 17 cargos más';
    });
  }

  // Publicaciones: filtro por año desde el histograma
  const bars = $('.hist__bars');
  if (bars) {
    const items = $$('.pubs-lists > ol:first-child > li');
    const count = $('.hist__count');
    const clear = $('.hist__clear');
    const total = items.length;
    let year = null;
    const apply = () => {
      bars.classList.toggle('has-year', year !== null);
      $$('button', bars).forEach((b) => { if (!b.disabled) b.setAttribute('aria-pressed', String(b.dataset.year === year)); });
      let n = 0;
      items.forEach((li) => { const show = year === null || li.dataset.year === year; li.classList.toggle('is-hidden', !show); if (show) n++; });
      count.textContent = year === null ? `${total} artículos` : `${n} en ${year}`;
      clear.hidden = year === null;
    };
    $$('button', bars).forEach((b, i) => {
      b.querySelector('i').style.setProperty('--d', i);
      b.addEventListener('click', () => { if (b.disabled) return; year = year === b.dataset.year ? null : b.dataset.year; apply(); });
    });
    clear.addEventListener('click', () => { year = null; apply(); });
  }

  // Contadores de las métricas
  const countUp = (el) => {
    if (reduce) return;
    const to = +el.dataset.count;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 1100);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  };
  const metrics = $('.metrics');
  if (metrics && 'IntersectionObserver' in window) {
    const mo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { mo.disconnect(); $$('[data-count]', metrics).forEach(countUp); } }, { threshold: 0.5 });
    mo.observe(metrics);
  }

  // Entradas al aparecer, una sola vez
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('[data-reveal]').forEach((el) => io.observe(el));
  } else {
    $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));
  }

  // Mapa de trayectoria
  const tmap = $('.tmap');
  if (!tmap) return;
  const range = $('.tmap__range', tmap);
  const play = $('.tmap__play', tmap);
  const yearEl = $('.tmap__year', tmap);
  const roles = $$('.tmap__roles li', tmap);
  const studies = $$('.tmap__studies li', tmap);
  const circles = $$('.tmap__studies circle', tmap);
  const places = $$('.tmap__places [data-place]', tmap);
  const nRoles = $('.tmap__n-roles', tmap);
  const nStudies = $('.tmap__n-studies', tmap);
  const empty = $('.tmap__empty', tmap);
  const setR = (g, on, hl) => {
    g.querySelector('.dot').setAttribute('r', on ? 5.5 : 3.5);
    g.querySelector('.halo').setAttribute('r', hl ? 13 : 9);
  };
  let year = +(store.get('gfj-map-year') || 2026);
  if (!(year >= 2010 && year <= 2026)) year = 2026;

  const render = (y, animate) => {
    year = y;
    range.value = y;
    range.setAttribute('aria-valuetext', String(y));
    yearEl.textContent = y;
    const active = new Set();
    let nr = 0;
    roles.forEach((li) => {
      const on = +li.dataset.from <= y && y <= +li.dataset.to;
      const was = !li.classList.contains('is-hidden');
      li.classList.toggle('is-hidden', !on);
      li.classList.toggle('is-new-in', on && !was && animate);
      if (on) { active.add(li.dataset.place); nr++; }
    });
    let ns = 0;
    studies.forEach((li) => {
      const on = +li.dataset.year <= y;
      const was = !li.classList.contains('is-hidden');
      li.classList.toggle('is-hidden', !on);
      li.classList.toggle('is-new-in', on && !was && animate);
      if (on) ns++;
    });
    circles.forEach((c) => {
      const cy = +c.dataset.year;
      c.classList.toggle('is-off', cy > y);
      c.classList.toggle('is-new', cy === y);
    });
    places.forEach((g) => { const on = active.has(g.dataset.place); g.classList.toggle('is-on', on); setR(g, on, g.classList.contains('is-hl')); });
    nRoles.textContent = nr;
    nStudies.textContent = ns;
    empty.hidden = ns > 0;
  };
  const setYear = (y, animate = true) => { render(y, animate); store.set('gfj-map-year', y); };

  // Al pasar por un cargo se resalta su lugar en el mapa
  roles.forEach((li) => {
    const hl = (on) => {
      li.classList.toggle('is-hl', on);
      places.forEach((g) => { const is = on && g.dataset.place === li.dataset.place; g.classList.toggle('is-hl', is); setR(g, g.classList.contains('is-on'), is); });
    };
    li.addEventListener('pointerenter', () => hl(true));
    li.addEventListener('pointerleave', () => hl(false));
  });

  let timer = 0;
  const stop = () => { clearInterval(timer); timer = 0; play.classList.remove('is-playing'); play.setAttribute('aria-label', 'Reproducir la línea de tiempo'); };
  const start = () => {
    if (year >= 2026) setYear(2010);
    play.classList.add('is-playing');
    play.setAttribute('aria-label', 'Pausar la línea de tiempo');
    timer = setInterval(() => { if (year >= 2026) { stop(); return; } setYear(year + 1); }, 900);
  };
  play.addEventListener('click', () => (timer ? stop() : start()));
  range.addEventListener('input', () => { stop(); setYear(+range.value); });
  render(year, false);

  // La primera vez que el mapa entra en pantalla recorre los años solo, salvo con movimiento reducido
  if (!reduce && 'IntersectionObserver' in window && !store.get('gfj-map-played')) {
    const once = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { once.disconnect(); store.set('gfj-map-played', '1'); setYear(2010, false); start(); }
    }, { threshold: 0.4 });
    once.observe(tmap);
  }
})();
