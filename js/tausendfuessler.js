/* =========================================================
   Der Tausendfüßler
   Startet als „Zweibeiner“ (Kohle & Stahl) und bekommt mit
   jedem neuen Wirtschaftszweig ein weiteres Bein.
   Die Beine stammen ausschließlich aus unserem Material.
   ========================================================= */
(function () {
  'use strict';

  // Reihenfolge = Reihenfolge der Beine am Körper
  var GROUPS = [
    { key: 'montan',    section: 'start',     name: 'Montanindustrie',               color: '#a39b92', legs: ['Kohle', 'Stahl'] },
    { key: 'phase1',    section: 'ausfahrt1', name: 'Reindustrialisierung · Phase 1', color: '#f08a3c', legs: ['Textilindustrie', 'Maschinenbau', 'Chemische Industrie', 'Elektroindustrie', 'Fahrzeugbau'] },
    { key: 'phase2',    section: 'ausfahrt1', name: 'Reindustrialisierung · Phase 2', color: '#f4c44e', legs: ['Technologiekonzerne'] },
    { key: 'phase3',    section: 'ausfahrt1', name: 'Reindustrialisierung · Phase 3', color: '#ffe08a', legs: ['Neue Technologien'] },
    { key: 'tertiaer',  section: 'ausfahrt2', name: 'Tertiärisierung',                color: '#5fb0dc', legs: ['IT', 'Logistik', 'Dienstleistungen'] },
    { key: 'forschung', section: 'ausfahrt3', name: 'Bildung & Forschung',            color: '#b9a2ea', legs: ['Forschung', 'Umwelttechnologie', 'Biomedizin'] },
    { key: 'iba',       section: 'ausfahrt4', name: 'IBA Emscher Park',               color: '#69c08a', legs: ['Industriekultur & Tourismus'] },
    // wächst nur, wenn das KI-Puzzle in der Leitfrage gelöst wird
    { key: 'zukunft',   section: 'leitfrage', name: 'Mögliches Zukunfts-Standbein',   color: '#7fe3ff', legs: ['KI & Rechenzentren?'], future: true }
  ];

  var SPACING = 30;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function legsFor(keys) {
    var out = [];
    GROUPS.forEach(function (g) {
      if (keys.indexOf(g.key) === -1) return;
      g.legs.forEach(function (label, i) {
        out.push({ id: g.key + '-' + i, label: label, color: g.color, group: g.key, future: !!g.future });
      });
    });
    return out;
  }

  function headSvg(x) {
    return '' +
      '<circle cx="' + x + '" cy="24" r="17" fill="#6b635c" stroke="#2a2522" stroke-width="2"/>' +
      '<path d="M' + (x - 17) + ' 20 C' + (x - 17) + ' 2 ' + (x + 17) + ' 2 ' + (x + 17) + ' 20 Z" fill="#f4c44e"/>' +
      '<rect x="' + (x + 2) + '" y="3" width="8" height="6" rx="1.5" fill="#fff6c9"/>' +
      '<circle cx="' + (x + 6) + '" cy="26" r="4" fill="#fff"/><circle cx="' + (x + 7) + '" cy="27" r="2" fill="#111"/>' +
      '<path d="M' + (x + 2) + ' 34 Q' + (x + 8) + ' 38 ' + (x + 13) + ' 33" fill="none" stroke="#2a2522" stroke-width="2" stroke-linecap="round"/>';
  }

  /** Zeichnet eine Figur mit den übergebenen Beinen in ein <svg>. */
  function render(svg, legs, newGroup) {
    var n = Math.max(legs.length, 1);
    var width = 30 + (n - 1) * SPACING + 60;
    svg.setAttribute('viewBox', '0 0 ' + width + ' 76');

    var html = '<g class="bf-legs">';
    legs.forEach(function (leg, i) {
      var x = 30 + i * SPACING;
      var cls = 'bf-leg' + (leg.group === 'montan' ? ' bf-leg--montan' : '') + (leg.future ? ' bf-leg--future' : '') + (leg.group === newGroup ? ' is-new' : '');
      html += '<g class="' + cls + '" data-id="' + leg.id + '"><g class="bf-swing" style="--i:' + i + '">' +
        '<title>' + esc(leg.label) + '</title>' +
        '<path d="M' + x + ' 30 L' + (x - 6) + ' 52 L' + (x + 2) + ' 68" fill="none" stroke="' + leg.color + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<ellipse cx="' + (x + 5) + '" cy="69" rx="6.5" ry="3.2" fill="' + leg.color + '"/>' +
        '</g></g>';
    });
    html += '</g><g class="bf-body">';
    for (var i = 0; i < n; i++) {
      html += '<circle cx="' + (30 + i * SPACING) + '" cy="28" r="15.5" fill="' + (i % 2 ? '#5d5650' : '#6f6760') + '" stroke="#2a2522" stroke-width="2"/>';
    }
    html += headSvg(30 + (n - 1) * SPACING + 32) + '</g>';
    svg.innerHTML = html;
    return width;
  }

  /* ---------- Das Band am unteren Bildschirmrand ---------- */
  var grown = ['montan'];
  var state = 'normal';
  var toastTimer = null;
  var els = {};

  function renderBand(newGroup) {
    if (!els.svg) return;
    var legs = legsFor(grown);
    var width = render(els.svg, legs, newGroup);
    els.svg.style.width = Math.round(width * 70 / 76) + 'px';
    els.svg.classList.toggle('is-krise', state === 'krise');
    els.svg.classList.toggle('is-weak', state === 'weak');
    els.count.textContent = legs.filter(function (l) { return !l.future; }).length;
    renderPanel();
  }

  function renderPanel() {
    var html = '';
    GROUPS.forEach(function (g) {
      if (grown.indexOf(g.key) === -1) return;
      html += '<p class="bug__group">' + esc(g.name) + '</p><ul>';
      g.legs.forEach(function (label) {
        var weak = g.key === 'montan' && state === 'weak';
        var note = weak ? ' <span class="muted">(hat an Bedeutung verloren)</span>' : (g.future ? ' <span class="muted">(könnte ein neues Standbein werden)</span>' : '');
        html += '<li' + (weak ? ' class="is-weak"' : '') + '><span class="bug__dot" style="background:' + g.color + '"></span>' +
          esc(label) + note + '</li>';
      });
      html += '</ul>';
    });
    var missing = GROUPS.filter(function (g) { return !g.future && grown.indexOf(g.key) === -1; }).length;
    if (missing > 0) html += '<p class="muted" style="margin:10px 0 0">Weiter ausfahren – es wachsen noch mehr Beine!</p>';
    els.list.innerHTML = html;
  }

  function toast(text) {
    if (!els.toast) return;
    els.toast.textContent = text;
    els.toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('is-show'); }, 2800);
  }

  function groupByKey(key) {
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].key === key) return GROUPS[i];
    return null;
  }

  /** Lässt die Beine einer Gruppe wachsen (nur einmal). */
  function grow(key) {
    var g = groupByKey(key);
    if (!g || grown.indexOf(key) !== -1) return false;
    grown.push(key);
    renderBand(key);
    toast('+ ' + g.legs.join(', '));
    return true;
  }

  /** Alle Gruppen eines Abschnitts wachsen lassen (Sicherheitsnetz beim Weiterscrollen). */
  function growSection(sectionId) {
    GROUPS.forEach(function (g) { if (g.section === sectionId) grow(g.key); });
  }

  /** 'normal' | 'krise' | 'weak' */
  function setState(s) {
    if (s === state) return;
    state = s;
    if (!els.svg) return;
    els.svg.classList.toggle('is-krise', state === 'krise');
    els.svg.classList.toggle('is-weak', state === 'weak');
    renderPanel();
  }

  function initBand() {
    els.bug = document.getElementById('bug');
    els.svg = document.getElementById('bugSvg');
    els.count = document.getElementById('bugCount');
    els.toast = document.getElementById('bugToast');
    els.list = document.getElementById('bugList');
    els.panel = document.getElementById('bugPanel');
    els.stage = document.getElementById('bugStage');
    els.toggle = document.getElementById('bugToggle');
    if (!els.svg) return;

    renderBand(null);

    els.stage.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = els.panel.hidden;
      els.panel.hidden = !open;
      els.stage.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (!els.panel.hidden && !els.panel.contains(e.target)) {
        els.panel.hidden = true;
        els.stage.setAttribute('aria-expanded', 'false');
      }
    });
    els.toggle.addEventListener('click', function () {
      var collapsed = els.bug.classList.toggle('is-collapsed');
      els.toggle.setAttribute('aria-expanded', String(!collapsed));
      els.toggle.innerHTML = collapsed ? 'Tausend-<br>füßler ▸' : 'Tausend-<br>füßler ▾';
      els.panel.hidden = true;
      try { localStorage.setItem('ruhr-bug-collapsed', collapsed ? '1' : '0'); } catch (err) { /* egal */ }
    });
    try {
      if (localStorage.getItem('ruhr-bug-collapsed') === '1') els.toggle.click();
    } catch (err) { /* egal */ }
  }

  window.Tausendfuessler = {
    GROUPS: GROUPS,
    legsFor: legsFor,
    render: render,
    grow: grow,
    growSection: growSection,
    setState: setState,
    initBand: initBand
  };
})();
