(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Red de nodos de fondo: tenue, lenta y detenida si el usuario pide menos movimiento
  const canvas = document.querySelector('.net');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const LINK = 150;
    let w = 0, h = 0, nodes = [], raf = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(90, Math.round((w * h) / 17000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(90,176,255,${(0.1 * (1 - d / LINK)).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = 'rgba(90,176,255,0.28)';
      for (const p of nodes) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2); ctx.fill(); }
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
    let lastW = innerWidth;
    addEventListener('resize', () => {
      // En el celular la barra del navegador cambia la altura al hacer scroll: solo se rehace si cambia el ancho
      if (Math.abs(innerWidth - lastW) < 2 && Math.abs(innerHeight - h) < 160) return;
      lastW = innerWidth; size(); if (reduce) draw();
    });
    document.addEventListener('visibilitychange', () => {
      if (reduce) return;
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(step);
    });
  }

  // Portada: la imagen satelital cambia cada pocos segundos
  const pics = [...document.querySelectorAll('.hero__pic')];
  const cap = document.querySelector('.hero__cap span');
  if (pics.length > 1 && !reduce) {
    let at = 0;
    setTimeout(() => pics.forEach((f) => { const i = f.querySelector('img'); if (i) i.loading = 'eager'; }), 1500);
    setInterval(() => {
      if (document.hidden) return;
      const next = (at + 1) % pics.length;
      const img = pics[next].querySelector('img');
      if (img && !img.complete) return;
      pics[at].classList.remove('is-active');
      pics[next].classList.add('is-active');
      cap.textContent = pics[next].dataset.cap;
      at = next;
    }, 6000);
  }

  // Etiquetas de habilidades: entrada escalonada
  document.querySelectorAll('.tags').forEach((t) => [...t.children].forEach((s, i) => s.style.setProperty('--i', i)));

  // Contadores
  const count = (el) => {
    if (reduce) return;
    const to = +el.dataset.count;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 1200);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  };

  // Entradas al aparecer, una sola vez
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      e.target.querySelectorAll('[data-count]').forEach(count);
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  // Línea de tiempo: la línea se dibuja con el scroll
  const tl = document.querySelector('.timeline');
  if (tl && !reduce) {
    const placeLine = () => {
      const r = tl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
      tl.style.setProperty('--p', p.toFixed(3));
    };
    let queued = false;
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; placeLine(); }); } }, { passive: true });
    placeLine();
  }

  // Video de la tesis: se reproduce solo cuando está a la vista
  const video = document.querySelector('.feature video');
  if (video && !reduce) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { video.preload = 'auto'; video.play().catch(() => {}); } else video.pause();
    }, { threshold: 0.4 }).observe(video);
  }

  // Mapa histórico
  const hmap = document.querySelector('.hmap');
  if (!hmap) return;
  const ROLES = [
    ['Científico de Datos Geoespaciales', 'ICTA', 2024, 2026, 'santiago', 'w'],
    ['Docente de análisis de datos y SIG', 'Universidades', 2022, 2026, 'santiago', 'd'],
    ['Analista Geoespacial, Censo 2024', 'INE', 2023, 2024, 'santiago', 'w'],
    ['Analista de datos hidrometeorológicos', 'CITRA, U. de Talca', 2021, 2023, 'talca', 'i'],
    ['Investigador, proyecto ANID FSEQ210004', 'U. de Talca', 2022, 2023, 'talca', 'i'],
    ['Profesor de cátedra', 'U. de Chile', 2022, 2023, 'santiago', 'd'],
    ['Profesor de cátedra', 'U. Mayor', 2022, 2023, 'santiago', 'd'],
    ['Consultor Geoespacial', 'CEAF', 2021, 2022, 'rengo', 'w'],
    ['Profesor instructor de SIG y teledetección', 'U. de Chile', 2019, 2023, 'santiago', 'd'],
    ['Investigador, enfermedades exóticas animales', 'SAG', 2019, 2021, 'santiago', 'i'],
    ['Investigador, proyecto CORFO nogal', 'U. de Chile', 2019, 2021, 'santiago', 'i'],
    ['Investigador, plagas cuarentenarias', 'U. de Chile', 2019, 2021, 'santiago', 'i'],
    ['Asistente, proyecto FIA de evapotranspiración', 'U. de Talca', 2018, 2019, 'talca', 'i'],
    ['Personal técnico, FONDECYT 1181374', 'U. de Concepción', 2018, 2019, 'concepcion', 'i'],
    ['Especialista SIG, promoción de salud', 'Mun. de Estación Central', 2017, 2018, 'santiago', 'w'],
    ['Apoyo técnico, calidad del aire', 'ENAP', 2017, 2018, null, 'w'],
    ['Asistente, FONDECYT microclima urbano', 'U. de Chile', 2016, 2019, 'santiago', 'i'],
    ['Profesional de apoyo, zonificación agrometeorológica', 'INIA', 2016, 2017, null, 'i'],
    ['Analista de datos, zonificación del tabaco', 'Cía. Chilena de Tabaco', 2015, 2016, 'santiago', 'w'],
    ['Ayudante de cátedra', 'U. de Chile', 2011, 2018, 'santiago', 'd'],
    ['Director General', 'Preuniversitario Popular Antumapu', 2011, 2016, 'santiago', 'd'],
    ['Profesor de Matemáticas, Física y Geografía', 'Preuniversitario Popular Antumapu', 2010, 2017, 'santiago', 'd'],
    ['Sistemas y redes computacionales', 'Independiente', 2006, 2015, null, 'w'],
  ];
  const STUDIES = [
    ['Pastizales naturales de la Patagonia chilena', 2016, 'patagonia'],
    ['Zonificación agrometeorológica de Arica y Parinacota', 2016, 'aricaParinacota'],
    ['Temperaturas extremas en Santiago con MODIS', 2018, 'santiago'],
    ['Isla de calor urbana de Santiago', 2020, 'santiago'],
    ['Mosquito alado antártico y cambio climático', 2020, 'antartica'],
    ['Temperatura superficial de lagos del centro-sur', 2021, 'lagos'],
    ['Tesis: precipitación en el desierto de Atacama', 2022, 'atacama'],
    ['Topoclima de Arica-Parinacota y Tarapacá', 2023, 'aricaParinacota'],
    ['Temperatura superficial de Chile central', 2024, 'chileCentral'],
    ['Hábitat de peces de río en el sur', 2024, 'lagos'],
    ['Desierto Florido en la cuenca del Huasco', 2026, 'huasco'],
  ];
  const ICON = { w: 'i-briefcase', d: 'i-presentation', i: 'i-satellite' };
  const KIND = { w: 'Trabajo', d: 'Docencia', i: 'Investigación' };
  const range = hmap.querySelector('input[type="range"]');
  const yearEl = hmap.querySelector('.hmap__year');
  const rolesEl = hmap.querySelector('.hmap__roles');
  const studiesEl = hmap.querySelector('.hmap__studies');
  const play = hmap.querySelector('.hmap__play');
  const works = [...hmap.querySelectorAll('.work')];
  const studyDots = [...hmap.querySelectorAll('.study')];
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const render = (y) => {
    yearEl.textContent = y;
    range.value = y;
    range.setAttribute('aria-valuetext', String(y));
    const active = ROLES.filter((r) => r[2] <= y && y <= r[3]).sort((a, b) => b[2] - a[2]);
    const places = new Set(active.map((r) => r[4]).filter(Boolean));
    works.forEach((g) => g.classList.toggle('is-on', places.has(g.dataset.loc)));
    const seen = STUDIES.filter((s) => s[1] <= y);
    studyDots.forEach((c) => {
      const here = seen.filter((s) => s[2] === c.dataset.loc);
      c.classList.toggle('is-on', here.length > 0);
      c.classList.toggle('is-new', here.some((s) => s[1] === y));
    });
    rolesEl.innerHTML = active.length
      ? active.map((r) => `<li>${icon(ICON[r[5]])}<span>${esc(r[0])}<small>${esc(r[1])} · ${KIND[r[5]]} · ${r[2]}–${r[3] === 2026 ? 'hoy' : r[3]}</small></span></li>`).join('')
      : '<li class="hmap__empty">Sin cargos registrados ese año.</li>';
    studiesEl.innerHTML = seen.length
      ? seen.slice().reverse().map((s) => `<li>${icon('i-map')}<span>${esc(s[0])}<small>${s[1]}${s[1] === y ? ' · nuevo' : ''}</small></span></li>`).join('')
      : '<li class="hmap__empty">Todavía no hay estudios publicados.</li>';
  };

  let timer = 0;
  const stop = () => { clearInterval(timer); timer = 0; play.classList.remove('is-playing'); play.setAttribute('aria-label', 'Reproducir la línea de tiempo'); };
  const start = () => {
    if (+range.value >= +range.max) render(+range.min);
    play.classList.add('is-playing');
    play.setAttribute('aria-label', 'Pausar la línea de tiempo');
    timer = setInterval(() => {
      const y = +range.value + 1;
      if (y > +range.max) { stop(); return; }
      render(y);
    }, 1100);
  };
  play.addEventListener('click', () => (timer ? stop() : start()));
  range.addEventListener('input', () => { stop(); render(+range.value); });
  render(+range.value);

  // La primera vez que el mapa aparece, recorre los años solo
  if (!reduce) {
    const once = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { once.disconnect(); render(+range.min); start(); }
    }, { threshold: 0.45 });
    once.observe(hmap);
  }
})();
