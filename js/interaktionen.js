/* =========================================================
   Interaktionen der einzelnen Abschnitte
   ========================================================= */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var Bug = function () { return window.Tausendfuessler; };

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
    return null;
  }

  /* ---------- 1. Sohle: Wackeltest ---------- */
  function initWackel() {
    var fig = $('#zbFigur');
    if (!fig) return;
    var msg = $('#zbMsg');
    var reset = $('[data-reset]');
    var removeBtns = $$('[data-remove]');

    removeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var which = btn.getAttribute('data-remove');
        $('.zb-bein[data-bein="' + which + '"]', fig).classList.add('is-gone');
        removeBtns.forEach(function (b) { b.disabled = true; });
        setTimeout(function () {
          fig.classList.add(which === 'kohle' ? 'fall-left' : 'fall-right');
        }, 350);
        setTimeout(function () {
          msg.textContent = 'Rumms! Bricht ein Standbein weg, gerät die ganze Region ins Wanken – so stark war die Abhängigkeit von Kohle und Stahl.';
          reset.hidden = false;
          reset.focus();
        }, 1300);
      });
    });

    reset.addEventListener('click', function () {
      fig.classList.remove('fall-left', 'fall-right');
      $$('.zb-bein', fig).forEach(function (b) { b.classList.remove('is-gone'); });
      removeBtns.forEach(function (b) { b.disabled = false; });
      msg.textContent = '';
      reset.hidden = true;
    });
  }

  /* ---------- 2. Sohle: Wirkungsgefüge ---------- */
  function initWirkung() {
    var root = $('#wirkung');
    if (!root) return;
    var next = $('#wkNext'), all = $('#wkAll'), infoEl = $('#wkInfo');
    var step = 0, MAX = 4;

    function show(n) {
      step = n;
      $$('.wk-step', root).forEach(function (el) {
        el.classList.toggle('is-on', parseInt(el.getAttribute('data-step'), 10) <= step);
      });
      infoEl.textContent = 'Schritt ' + step + ' von ' + MAX;
      next.textContent = step >= MAX ? '↺ Von vorn' : 'Nächster Schritt ➜';
    }
    next.addEventListener('click', function () { show(step >= MAX ? 0 : step + 1); });
    all.addEventListener('click', function () { show(MAX); });
    show(0);
  }

  /* ---------- 2. Sohle: Grubenlampe ---------- */
  function initLamp() {
    var lamp = $('#lamp');
    if (!lamp) return;
    var btn = $('#lampAll');
    var pos = { x: 0, y: 0 };

    function setLight(x, y) {
      pos.x = x; pos.y = y;
      lamp.style.setProperty('--lx', x + 'px');
      lamp.style.setProperty('--ly', y + 'px');
    }
    function center() { setLight(lamp.clientWidth * 0.5, lamp.clientHeight * 0.45); }
    center();

    lamp.addEventListener('pointermove', function (e) {
      var r = lamp.getBoundingClientRect();
      setLight(e.clientX - r.left, e.clientY - r.top);
    });
    lamp.addEventListener('pointerdown', function (e) {
      var r = lamp.getBoundingClientRect();
      setLight(e.clientX - r.left, e.clientY - r.top);
    });
    lamp.addEventListener('keydown', function (e) {
      var step = 30, moved = true;
      if (e.key === 'ArrowLeft') setLight(Math.max(0, pos.x - step), pos.y);
      else if (e.key === 'ArrowRight') setLight(Math.min(lamp.clientWidth, pos.x + step), pos.y);
      else if (e.key === 'ArrowUp') setLight(pos.x, Math.max(0, pos.y - step));
      else if (e.key === 'ArrowDown') setLight(pos.x, Math.min(lamp.clientHeight, pos.y + step));
      else moved = false;
      if (moved) e.preventDefault();
    });
    btn.addEventListener('click', function () {
      var lit = lamp.classList.toggle('is-lit');
      btn.textContent = lit ? '🔦 Licht aus' : '💡 Licht an';
    });
    window.addEventListener('resize', center);
  }

  /* ---------- 2. Sohle: Bergsenkung ---------- */
  function initSenkung() {
    var svg = $('#senkSvg');
    if (!svg) return;
    var range = $('#senkRange'), out = $('#senkOut');
    var earth = $('#sgEarth'), road = $('#sgRoad'), mark = $('#sgRoadMark'), crackRoad = $('#sgRoadCrack');
    var pipeL = $('#sgPipeL'), pipeR = $('#sgPipeR'), drops = $('#sgDrops');
    var water = $('#sgWater'), house = $('#sgHouse'), crack = $('#sgCrack'), cav = $('#sgCav');
    var items = $$('#senkList li');
    var BASE = 200, PX_PER_M = 5, CENTER = 400, SIGMA = 150, HOUSE_X = 470;

    // Wasser soll über der Straße liegen (überflutete Senke)
    svg.insertBefore(water, house);

    function surf(x, s) { return BASE + s * PX_PER_M * Math.exp(-Math.pow((x - CENTER) / SIGMA, 2)); }
    function line(from, to, s, offset, extra) {
      var d = '';
      for (var x = from; x <= to; x += 10) {
        var y = surf(x, s) + (offset || 0) + (extra || 0);
        d += (d ? ' L' : 'M') + x + ' ' + y.toFixed(1);
      }
      return d;
    }

    function update() {
      var s = parseFloat(range.value);
      var surface = line(0, 800, s, 0);
      earth.setAttribute('d', surface + ' L800 420 L0 420 Z');
      road.setAttribute('d', surface);
      mark.setAttribute('d', surface);

      // Hohlraum wird durch das nachsackende Gestein kleiner
      var h = Math.max(4, 26 - s * 1.1);
      cav.setAttribute('height', h.toFixed(1));
      cav.setAttribute('y', (338 + 26 - h).toFixed(1));

      // Haus neigt sich mit dem Gelände
      var hy = surf(HOUSE_X, s);
      var slope = (surf(HOUSE_X + 2, s) - surf(HOUSE_X - 2, s)) / 4;
      var angle = Math.atan(slope) * 180 / Math.PI * 0.55;
      house.setAttribute('transform', 'translate(' + HOUSE_X + ' ' + hy.toFixed(1) + ') rotate(' + angle.toFixed(1) + ')');
      crack.setAttribute('opacity', s >= 5 ? Math.min(1, (s - 4) / 3).toFixed(2) : '0');

      // Straße reißt
      if (s >= 9) {
        var x0 = 322, y0 = surf(330, s);
        crackRoad.setAttribute('d', 'M' + x0 + ' ' + (y0 - 7) + ' L' + (x0 + 9) + ' ' + (y0 - 1) + ' L' + (x0 + 4) + ' ' + (y0 + 4) + ' L' + (x0 + 13) + ' ' + (y0 + 9));
        crackRoad.setAttribute('opacity', '1');
      } else {
        crackRoad.setAttribute('opacity', '0');
      }

      // Leitung bricht
      var broken = s >= 13;
      if (broken) {
        pipeL.setAttribute('d', line(0, 390, s, 30));
        pipeR.setAttribute('d', line(410, 800, s, 30, Math.min(10, (s - 12) * 1.6)));
        drops.setAttribute('opacity', '1');
        drops.setAttribute('transform', 'translate(0 ' + (surf(CENTER, s) + 40).toFixed(1) + ')');
      } else {
        pipeL.setAttribute('d', line(0, 800, s, 30));
        pipeR.setAttribute('d', '');
        drops.setAttribute('opacity', '0');
      }

      // Wasser sammelt sich in der Senke
      if (s >= 16) {
        var wl = surf(CENTER, s) - (s - 15) * 7;
        var pts = [];
        for (var x = 0; x <= 800; x += 5) {
          var y = surf(x, s);
          if (y > wl) pts.push([x, y]);
        }
        if (pts.length > 1) {
          var d = 'M' + pts[0][0] + ' ' + wl.toFixed(1);
          pts.forEach(function (p) { d += ' L' + p[0] + ' ' + p[1].toFixed(1); });
          d += ' L' + pts[pts.length - 1][0] + ' ' + wl.toFixed(1) + ' Z';
          water.setAttribute('d', d);
        }
      } else {
        water.setAttribute('d', '');
      }

      out.textContent = s.toLocaleString('de-DE') + ' m';
      items.forEach(function (li) {
        li.classList.toggle('is-on', s >= parseFloat(li.getAttribute('data-ab')));
      });
    }

    range.addEventListener('input', update);
    update();
  }

  /* ---------- Ausfahrt I: Zeitstrahl ---------- */
  function initZeit() {
    var root = $('#zeit');
    if (!root) return;
    var stops = $$('.zeit__stop', root);
    var panels = $$('.zeit__panel', root);

    stops.forEach(function (stop) {
      stop.addEventListener('click', function () {
        var n = stop.getAttribute('data-phase');
        stops.forEach(function (s) {
          var on = s === stop;
          s.classList.toggle('is-active', on);
          s.setAttribute('aria-pressed', String(on));
        });
        stop.classList.add('is-done');
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== n; });
        var panel = $('.zeit__panel[data-panel="' + n + '"]', root);
        if (panel && Bug()) Bug().grow(panel.getAttribute('data-grow'));
      });
    });
  }

  /* ---------- Ausfahrt II: Sektoren ---------- */
  function initSektor() {
    var root = $('#sektor');
    if (!root) return;
    var people = $$('.person', root);
    var caption = $('#sektorCaption');
    var TEXT = {
      frueher: 'Früher war es im Ruhrgebiet umgekehrt: ca. ¾ im sekundären Sektor (Industrie).',
      heute: 'Heute: nahezu ¾ der Bevölkerung im tertiären Sektor (Dienstleistung).'
    };
    var PATTERN = { frueher: ['ind', 'ind', 'ind', 'dl'], heute: ['ind', 'dl', 'dl', 'dl'] };

    $$('.seg__btn', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var z = btn.getAttribute('data-zeit');
        $$('.seg__btn', root).forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        people.forEach(function (p, i) {
          p.classList.toggle('is-ind', PATTERN[z][i] === 'ind');
          p.classList.toggle('is-dl', PATTERN[z][i] === 'dl');
        });
        caption.textContent = TEXT[z];
      });
    });
  }

  /* ---------- Ausfahrt III: Hochschulkarte ---------- */
  function initUni() {
    var seg = $('#uniSeg');
    if (!seg) return;
    var map = $('#uniMap'), note = $('#uniNote'), badges = $('#uniBadges');
    var NOTE = {
      vorher: 'Sehr geringe Dichte an Universitäten und Forschungseinrichtungen – unter dem Bundesdurchschnitt.',
      mitte: 'Mitte der 1960er-Jahre: Gründung der Ruhr-Universität Bochum – ein wichtiger Meilenstein zur Überwindung der Krise.',
      heute: 'Heute: Universitäten u. a. in Bochum, Dortmund, Duisburg-Essen und Hagen, dazu zahlreiche Fachhochschulen und außeruniversitäre Forschungseinrichtungen.'
    };
    var ORDER = { vorher: 0, mitte: 1, heute: 2 };

    $$('.seg__btn', seg).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var stage = btn.getAttribute('data-stage');
        $$('.seg__btn', seg).forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        $$('.pin', map).forEach(function (p) {
          p.classList.toggle('is-hidden', ORDER[p.getAttribute('data-from')] > ORDER[stage]);
        });
        var rub = $('.pin--rub', map);
        if (rub) rub.classList.toggle('is-highlight', stage === 'mitte');
        badges.classList.toggle('is-hidden', stage !== 'heute');
        note.textContent = NOTE[stage];
      });
    });
  }

  /* ---------- Ausfahrt III: Zähler ---------- */
  function initCounter() {
    var el = $('#counter');
    if (!el) return;
    var target = parseInt(el.getAttribute('data-count'), 10);
    var fmt = function (n) { return Math.round(n).toLocaleString('de-DE'); };
    var run = function () {
      var start = null, DUR = 1800;
      var tick = function (t) {
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / DUR);
        el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) { el.textContent = fmt(target); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(); io.disconnect(); }
      });
    }, { threshold: 0.5 });
    io.observe(el);
  }

  /* ---------- Ausfahrt IV: IBA-Karte & Filter ---------- */
  function initIba() {
    var map = $('#ibaMap');
    if (!map) return;
    var infoBox = $('#ibaInfo');
    var pins = $$('.ipin', map);
    var cards = $$('#ibaCards .mcard');
    var filter = 'alle';

    function matches(el) {
      return filter === 'alle' || (' ' + el.getAttribute('data-pillar') + ' ').indexOf(' ' + filter + ' ') !== -1;
    }
    function applyFilter() {
      pins.forEach(function (p) { p.classList.toggle('is-dim', !matches(p)); });
      cards.forEach(function (c) { c.classList.toggle('is-dim', !matches(c)); });
    }
    function select(proj) {
      pins.forEach(function (p) { p.classList.toggle('is-selected', p.getAttribute('data-proj') === proj); });
      var card = $('#ibaCards .mcard[data-proj="' + proj + '"]');
      if (card) infoBox.innerHTML = card.innerHTML;
    }

    $$('#ibaFilter .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        filter = chip.getAttribute('data-filter');
        $$('#ibaFilter .chip').forEach(function (c) {
          c.classList.toggle('is-active', c === chip);
          c.setAttribute('aria-pressed', String(c === chip));
        });
        applyFilter();
      });
    });
    pins.forEach(function (p) {
      p.addEventListener('click', function () { select(p.getAttribute('data-proj')); });
      p.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(p.getAttribute('data-proj')); }
      });
    });
  }

  /* ---------- Vorher/Nachher-Schieber ---------- */
  function initCompare() {
    $$('.compare').forEach(function (cmp) {
      var input = $('.compare__range', cmp);
      var set = function () { cmp.style.setProperty('--pos', input.value + '%'); };
      input.addEventListener('input', set);
      set();
    });
  }

  /* ---------- Schieberegler-Füllung (Chrome/Edge) ---------- */
  function initRangeFill() {
    $$('input[type="range"]:not(.compare__range)').forEach(function (r) {
      var set = function () {
        var min = parseFloat(r.min) || 0, max = parseFloat(r.max) || 100;
        r.style.setProperty('--fill', ((r.value - min) / (max - min)) * 100 + '%');
      };
      r.addEventListener('input', set);
      set();
    });
  }

  /* ---------- Flip-Karten ---------- */
  function initFlip() {
    $$('.flip').forEach(function (card) {
      card.addEventListener('click', function () {
        var on = card.classList.toggle('is-flipped');
        card.setAttribute('aria-pressed', String(on));
      });
    });
  }

  /* ---------- Bilanz: großer Tausendfüßler ---------- */
  function initBigBug() {
    var svg = $('#bigBug');
    var T = Bug();
    if (!svg || !T) return;
    var all = T.legsFor(T.GROUPS.filter(function (g) { return !g.future; }).map(function (g) { return g.key; }));
    var msg = $('#bigBugMsg');
    var removeBtn = $('#bigBugRemove');
    T.render(svg, all, null);

    removeBtn.addEventListener('click', function () {
      var left = $$('.bf-leg:not(.is-gone)', svg);
      if (!left.length) return;
      var leg = left[Math.floor(Math.random() * left.length)];
      leg.classList.add('is-gone');
      var name = $('title', leg).textContent;
      var rest = left.length - 1;
      svg.classList.toggle('is-wobbly', rest <= 2);
      if (rest > 2) {
        msg.textContent = '„' + name + '“ ist weg – der Tausendfüßler steht trotzdem sicher! (noch ' + rest + ' Standbeine)';
      } else if (rest > 0) {
        msg.textContent = 'Nur noch ' + rest + ' Standbein' + (rest === 1 ? '' : 'e') + ' – jetzt wird es wieder wackelig wie beim Zweibeiner!';
      } else {
        msg.textContent = 'Alle Standbeine sind weg. Zum Glück ist das nur ein Gedankenexperiment.';
        removeBtn.disabled = true;
      }
    });
    $('#bigBugReset').addEventListener('click', function () {
      $$('.bf-leg', svg).forEach(function (l) { l.classList.remove('is-gone'); });
      svg.classList.remove('is-wobbly');
      removeBtn.disabled = false;
      msg.textContent = '';
    });
  }

  /* ---------- Leitfrage: Argument-Waage ---------- */
  function initWaage() {
    var root = $('#waage');
    if (!root) return;
    var svg = $('#waageSvg');
    var lists = { pool: $('#argPool'), pro: $('#zonePro'), contra: $('#zoneContra') };
    var panPro = $('#panPro'), panContra = $('#panContra');
    var result = $('#waageResult');
    var total = $$('.arg', root).length;
    var BTN = {
      pool: [['pro', '✔ dafür', 'arg__btn--pro'], ['contra', '✖ dagegen', 'arg__btn--contra']],
      pro: [['contra', '✖ dagegen', 'arg__btn--contra'], ['pool', '↩', '']],
      contra: [['pro', '✔ dafür', 'arg__btn--pro'], ['pool', '↩', '']]
    };

    function zoneOf(li) {
      if (li.parentNode === lists.pro) return 'pro';
      if (li.parentNode === lists.contra) return 'contra';
      return 'pool';
    }
    function buttons(li) {
      var box = $('.arg__btns', li);
      if (!box) { box = document.createElement('span'); box.className = 'arg__btns'; li.appendChild(box); }
      box.innerHTML = '';
      BTN[zoneOf(li)].forEach(function (b) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'arg__btn ' + b[2];
        btn.textContent = b[1];
        if (b[0] === 'pool') btn.setAttribute('aria-label', 'Zurück zu den Argumenten');
        btn.addEventListener('click', function () { move(li, b[0]); });
        box.appendChild(btn);
      });
    }
    function weights(group, n, color, cx) {
      var html = '';
      for (var k = 0; k < n; k++) {
        var x = cx - 44 + (k % 5) * 18, y = 178 - Math.floor(k / 5) * 13;
        html += '<rect x="' + x + '" y="' + y + '" width="16" height="11" rx="2" fill="' + color + '" stroke="#fff" stroke-width="1"/>';
      }
      group.innerHTML = html;
    }
    function update() {
      var p = lists.pro.children.length, c = lists.contra.children.length;
      var tilt = Math.max(-16, Math.min(16, (c - p) * 4));
      svg.style.setProperty('--tilt', tilt + 'deg');
      weights(panPro, p, '#3f9a62', 110);
      weights(panContra, c, '#c8553f', 530);
      var t;
      if (!p && !c) t = 'Lege die Argumente in die Waagschalen.';
      else if (p > c) t = 'Die Waage neigt sich zu: eher zukunftsfähig (' + p + ' : ' + c + ')';
      else if (c > p) t = 'Die Waage neigt sich zu: eher nicht zukunftsfähig (' + p + ' : ' + c + ')';
      else t = 'Die Waage ist im Gleichgewicht (' + p + ' : ' + c + ')';
      var asOurs = $$('.arg', root).every(function (li) { return zoneOf(li) === li.getAttribute('data-side'); });
      if (asOurs) t = 'Unsere Einordnung: ' + p + ' Stärken, ' + c + ' Schwächen – trotzdem lautet unser Urteil nur „bedingt zukunftsfähig“ (siehe unten).';
      else if (p + c === total) t += ' – Tipp: Nicht nur die Anzahl zählt. Wie schwer wiegt jedes Argument?';
      result.textContent = t;
      save();
    }
    function move(li, zone) {
      lists[zone].appendChild(li);
      buttons(li);
      update();
    }
    function save() {
      var state = {};
      $$('.arg', root).forEach(function (li) { state[li.getAttribute('data-id')] = zoneOf(li); });
      store('ruhr-waage-2', JSON.stringify(state));
    }

    // Drag & Drop (Maus); auf Touch-Geräten helfen die Knöpfe
    var dragged = null;
    $$('.arg', root).forEach(function (li) {
      li.setAttribute('draggable', 'true');
      li.addEventListener('dragstart', function (e) {
        dragged = li;
        li.classList.add('is-dragging');
        try { e.dataTransfer.setData('text/plain', li.getAttribute('data-id')); } catch (err) { /* egal */ }
        e.dataTransfer.effectAllowed = 'move';
      });
      li.addEventListener('dragend', function () { li.classList.remove('is-dragging'); dragged = null; });
      buttons(li);
    });
    $$('[data-zone]', root).forEach(function (zoneEl) {
      var zone = zoneEl.getAttribute('data-zone');
      zoneEl.addEventListener('dragover', function (e) { if (dragged) { e.preventDefault(); zoneEl.classList.add('is-over'); } });
      zoneEl.addEventListener('dragleave', function (e) { if (!zoneEl.contains(e.relatedTarget)) zoneEl.classList.remove('is-over'); });
      zoneEl.addEventListener('drop', function (e) {
        e.preventDefault();
        zoneEl.classList.remove('is-over');
        if (dragged) move(dragged, zone);
      });
    });
    // Ziehen auf die Waagschalen in der Grafik
    svg.addEventListener('dragover', function (e) { if (dragged) e.preventDefault(); });
    svg.addEventListener('drop', function (e) {
      e.preventDefault();
      if (!dragged) return;
      var r = svg.getBoundingClientRect();
      move(dragged, e.clientX - r.left < r.width / 2 ? 'pro' : 'contra');
    });

    $('#waageReset').addEventListener('click', function () {
      $$('.arg', root).forEach(function (li) { lists.pool.appendChild(li); buttons(li); });
      update();
    });
    var ours = $('#waageOurs');
    if (ours) {
      ours.addEventListener('click', function () {
        $$('.arg', root).forEach(function (li) {
          var side = li.getAttribute('data-side');
          if (lists[side]) { lists[side].appendChild(li); buttons(li); }
        });
        update();
      });
    }

    // Gespeicherten Stand wiederherstellen (nur in diesem Browser)
    try {
      var saved = JSON.parse(store('ruhr-waage-2') || '{}');
      Object.keys(saved).forEach(function (id) {
        var li = $('.arg[data-id="' + id + '"]', root);
        if (li && lists[saved[id]] && saved[id] !== 'pool') { lists[saved[id]].appendChild(li); buttons(li); }
      });
    } catch (err) { /* egal */ }

    var ta = $('#meinUrteil');
    if (ta) {
      ta.value = store('ruhr-urteil') || '';
      ta.addEventListener('input', function () { store('ruhr-urteil', ta.value); });
    }
    update();
  }

  /* ---------- Leitfrage: KI-Puzzle ---------- */
  function initPuzzle() {
    var root = $('#puzzle');
    if (!root) return;
    var core = $('#puzzleCore'), count = $('#puzzleCount'), msg = $('#puzzleMsg'), reset = $('#puzzleReset');
    var pieces = $$('#puzzleTray [data-piece]');
    var total = pieces.length;

    function placed() { return $$('.puzzle__slot.is-filled', root).length; }
    function refresh() {
      var n = placed();
      count.textContent = n + ' / ' + total + ' Bausteine';
      var done = n === total;
      core.classList.toggle('is-complete', done);
      reset.hidden = n === 0;
      if (done) {
        msg.textContent = 'Das Ruhrgebiet könnte vom Ausbau von Rechenzentren wirtschaftlich profitieren – ein mögliches neues Standbein für den Tausendfüßler!';
        if (Bug()) Bug().grow('zukunft');
      } else {
        msg.textContent = '';
      }
    }
    pieces.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slot = $('.puzzle__slot[data-slot="' + btn.getAttribute('data-piece') + '"]', root);
        if (slot) slot.classList.add('is-filled');
        btn.hidden = true;
        refresh();
      });
    });
    reset.addEventListener('click', function () {
      $$('.puzzle__slot', root).forEach(function (s) { s.classList.remove('is-filled'); });
      pieces.forEach(function (b) { b.hidden = false; });
      refresh();
    });
    refresh();
  }

  /* ---------- Leitfrage: Urteils-Ampel ---------- */
  function initAmpel() {
    var ampel = $('#ampel');
    if (!ampel) return;
    var btn = $('#ampelBtn'), box = $('#unserUrteil');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    btn.addEventListener('click', function () {
      if (ampel.classList.contains('is-final')) {
        // zurücksetzen
        ampel.classList.remove('is-final');
        ampel.removeAttribute('data-on');
        box.hidden = true;
        btn.textContent = 'Urteil aufdecken';
        return;
      }
      btn.disabled = true;
      var seq = reduce ? ['gelb'] : ['rot', 'gruen', 'rot', 'gruen', 'gelb'];
      seq.forEach(function (color, i) {
        setTimeout(function () {
          ampel.setAttribute('data-on', color);
          if (i === seq.length - 1) {
            ampel.classList.add('is-final');
            box.hidden = false;
            btn.disabled = false;
            btn.textContent = '↺ Ampel zurücksetzen';
          }
        }, i * 380);
      });
    });
  }

  window.Interaktionen = {
    init: function () {
      [initWackel, initWirkung, initLamp, initSenkung, initZeit, initSektor, initUni, initCounter,
        initIba, initCompare, initRangeFill, initFlip, initBigBug, initWaage, initPuzzle, initAmpel].forEach(function (fn) {
        try { fn(); } catch (err) { if (window.console) console.error(fn.name, err); }
      });
    }
  };
})();
