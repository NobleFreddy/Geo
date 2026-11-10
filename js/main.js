/* =========================================================
   Steuerung: Schacht-Tiefenmesser, Fahrplan, Wachstum des
   Tausendfüßlers, Präsentationsmodus, Begriffserklärungen
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sections = Array.prototype.slice.call(document.querySelectorAll('main .station'));
  var slides = Array.prototype.slice.call(document.querySelectorAll('main .slide'));
  var info = sections.map(function (s) {
    return {
      el: s,
      id: s.id,
      depth: parseFloat(s.getAttribute('data-depth')) || 0,
      dir: s.getAttribute('data-dir') || 'down',
      short: s.getAttribute('data-short') || '',
      title: s.getAttribute('data-title') || ''
    };
  });
  var MIN_D = -0.18, MAX_D = 1.06;
  var active = -1;
  var maxReached = 0;
  var presenting = false;
  var current = 0;
  var Bug = window.Tausendfuessler;

  function depthToPct(d) { return ((d - MIN_D) / (MAX_D - MIN_D)) * 100; }
  function sectionIndexOf(el) { return sections.indexOf(el.closest('.station')); }

  /* ---------- Fahrplan ---------- */
  var fahrplan = document.getElementById('fahrplan');
  var btnFahrplan = document.getElementById('btnFahrplan');
  var fahrplanLinks = [];

  function buildFahrplan() {
    var list = document.getElementById('fahrplanList');
    info.forEach(function (s, i) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + s.id;
      a.innerHTML = '<span class="fahrplan__dir" aria-hidden="true">' + (s.dir === 'down' ? '▼' : '▲') + '</span>' +
        '<span><span class="fahrplan__short">' + s.short + '</span>' + s.title.split('·').pop().trim() + '</span>';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        closeFahrplan();
        goToSection(i);
      });
      li.appendChild(a);
      list.appendChild(li);
      fahrplanLinks.push(a);
    });
    btnFahrplan.addEventListener('click', function (e) {
      e.stopPropagation();
      if (fahrplan.hidden) openFahrplan(); else closeFahrplan();
    });
    document.addEventListener('click', function (e) {
      if (!fahrplan.hidden && !fahrplan.contains(e.target)) closeFahrplan();
    });
  }
  function openFahrplan() { fahrplan.hidden = false; btnFahrplan.setAttribute('aria-expanded', 'true'); }
  function closeFahrplan() { fahrplan.hidden = true; btnFahrplan.setAttribute('aria-expanded', 'false'); }

  /* ---------- Schacht-Leiste ---------- */
  var track = document.getElementById('shaftTrack');
  var cage, cable, cageLabel, marks = [];

  function buildShaft() {
    var ground = depthToPct(0);
    var html = '<div class="shaft__sky" style="height:' + ground + '%"></div>' +
      '<div class="shaft__earth" style="top:' + ground + '%"></div>' +
      '<div class="shaft__guide" style="left:calc(50% - 17px)"></div>' +
      '<div class="shaft__guide" style="left:calc(50% + 15px)"></div>' +
      '<div class="shaft__ground" style="top:' + ground + '%"></div>' +
      '<div class="shaft__level" style="top:' + depthToPct(0.5) + '%"><span style="left:auto;right:6px">1. Sohle</span></div>' +
      '<div class="shaft__level" style="top:' + depthToPct(1) + '%"><span style="left:auto;right:6px">2. Sohle</span></div>' +
      '<div class="shaft__cable" id="shaftCable"></div>' +
      '<div class="shaft__cage" id="shaftCage"><span class="shaft__cage-label" id="cageLabel"></span></div>';
    track.innerHTML = html;
    info.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'shaft__mark';
      b.style.top = depthToPct(s.depth) + '%';
      b.style.left = s.dir === 'down' ? 'calc(50% - 34px)' : 'calc(50% + 34px)';
      b.setAttribute('aria-label', s.title);
      b.innerHTML = '<span class="shaft__tip">' + (s.dir === 'down' ? '▼ ' : '▲ ') + s.title + '</span>';
      b.addEventListener('click', function () { goToSection(i); });
      track.appendChild(b);
      marks.push(b);
    });
    cage = document.getElementById('shaftCage');
    cable = document.getElementById('shaftCable');
    cageLabel = document.getElementById('cageLabel');
  }

  var meterFill = document.getElementById('meterFill');
  function setDepth(d) {
    var pct = depthToPct(d);
    if (cage) {
      cage.style.top = pct + '%';
      cable.style.height = pct + '%';
    }
    if (meterFill) meterFill.style.width = Math.max(0, Math.min(1, d)) * 100 + '%';
  }

  /* ---------- Aktiver Abschnitt ---------- */
  var statusLabel = document.getElementById('statusLabel');
  var statusDir = document.getElementById('statusDir');
  var krisenIndex = sections.findIndex ? sections.findIndex(function (s) { return s.id === 'sohle2'; }) : 2;

  function setActive(i) {
    if (i < 0 || i === active) return;
    active = i;
    var s = info[i];
    statusLabel.textContent = s.title;
    statusDir.classList.toggle('is-up', s.dir === 'up');
    if (cageLabel) cageLabel.textContent = s.short;
    fahrplanLinks.forEach(function (a, k) { a.classList.toggle('is-active', k === i); });
    if (i > maxReached) maxReached = i;
    marks.forEach(function (m, k) {
      m.classList.toggle('is-active', k === i);
      m.classList.toggle('is-visited', k <= maxReached);
    });

    if (Bug) {
      Bug.setState(i === krisenIndex ? 'krise' : (i > krisenIndex ? 'weak' : 'normal'));
      // Sicherheitsnetz: Beine früherer Abschnitte wachsen spätestens jetzt
      for (var k = 0; k < i; k++) Bug.growSection(info[k].id);
    }
  }

  var centers = [];
  function measure() {
    centers = sections.map(function (s) { return s.offsetTop + s.offsetHeight / 2; });
  }

  var ticking = false;
  function onScroll() {
    if (presenting || ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var mid = window.scrollY + window.innerHeight * 0.5;
      var idx = 0;
      for (var i = 0; i < sections.length; i++) {
        if (mid >= sections[i].offsetTop) idx = i;
      }
      setActive(idx);

      var d = info[0].depth;
      if (mid <= centers[0]) d = info[0].depth;
      else if (mid >= centers[centers.length - 1]) d = info[info.length - 1].depth;
      else {
        for (var k = 0; k < centers.length - 1; k++) {
          if (mid >= centers[k] && mid < centers[k + 1]) {
            var t = (mid - centers[k]) / (centers[k + 1] - centers[k]);
            d = info[k].depth + (info[k + 1].depth - info[k].depth) * t;
            break;
          }
        }
      }
      setDepth(d);
    });
  }

  /* ---------- Förderkorb-Fahrt (Übergang) ---------- */
  var transitEl = document.getElementById('transit');
  var transitText = document.getElementById('transitText');
  function transit(dir, text, midCallback) {
    if (reduceMotion || !transitEl) { midCallback(); return; }
    transitText.textContent = text || 'Glück auf!';
    transitEl.classList.remove('is-down', 'is-up');
    void transitEl.offsetWidth;
    transitEl.classList.add('is-on', dir === 'up' ? 'is-up' : 'is-down');
    setTimeout(midCallback, 380);
    setTimeout(function () { transitEl.classList.remove('is-on'); }, 820);
  }

  function goToSection(i) {
    if (presenting) {
      var idx = slides.indexOf(sections[i].querySelector('.slide'));
      showSlide(idx);
      return;
    }
    sections[i].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Präsentationsmodus ---------- */
  var presentNav = document.getElementById('presentNav');
  var pCount = document.getElementById('pCount');
  var mainEl = document.getElementById('inhalt');

  function slideNearestViewport() {
    var best = 0, bestDist = Infinity;
    slides.forEach(function (s, i) {
      var r = s.getBoundingClientRect();
      var dist = Math.abs(r.top + Math.min(r.height, window.innerHeight) / 2 - window.innerHeight / 2);
      if (r.bottom > 0 && dist < bestDist) { bestDist = dist; best = i; }
    });
    return best;
  }

  function showSlide(i, animate) {
    if (i < 0 || i >= slides.length) return;
    var oldSection = sectionIndexOf(slides[current]);
    var newSection = sectionIndexOf(slides[i]);
    var apply = function () {
      slides.forEach(function (s, k) { s.classList.toggle('is-current', k === i); });
      sections.forEach(function (s, k) { s.classList.toggle('has-current', k === newSection); });
      current = i;
      mainEl.scrollTop = 0;
      setActive(newSection);
      setDepth(info[newSection].depth);
      pCount.textContent = (i + 1) + ' / ' + slides.length;
      var focusTarget = slides[i].querySelector('h1, h2, h3');
      if (focusTarget) { focusTarget.setAttribute('tabindex', '-1'); focusTarget.focus({ preventScroll: true }); }
    };
    if (animate && newSection !== oldSection) {
      var up = info[newSection].depth < info[oldSection].depth;
      transit(up ? 'up' : 'down', info[newSection].short, apply);
    } else {
      apply();
    }
  }

  function enterPresent() {
    if (presenting) return;
    closeFahrplan();
    current = slideNearestViewport();
    presenting = true;
    document.body.classList.add('is-present');
    showSlide(current, false);
    var root = document.documentElement;
    if (root.requestFullscreen) {
      root.requestFullscreen().catch(function () { /* Vollbild nicht erlaubt – egal */ });
    }
  }

  function exitPresent() {
    if (!presenting) return;
    presenting = false;
    document.body.classList.remove('is-present');
    slides.forEach(function (s) { s.classList.remove('is-current'); });
    sections.forEach(function (s) { s.classList.remove('has-current'); });
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
    measure();
    slides[current].scrollIntoView({ block: 'start' });
    onScroll();
  }

  function isTyping(t) {
    if (!t) return false;
    var tag = t.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTyping(e.target)) return;
    var k = e.key;
    if (k === 'p' || k === 'P') { e.preventDefault(); if (presenting) exitPresent(); else enterPresent(); return; }
    if (!presenting) return;
    if (k === 'Escape') { exitPresent(); return; }
    var onButton = e.target && (e.target.tagName === 'BUTTON' || e.target.getAttribute('role') === 'button');
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !onButton)) { e.preventDefault(); showSlide(current + 1, true); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); showSlide(current - 1, true); }
    else if (k === 'Home') { e.preventDefault(); showSlide(0, true); }
    else if (k === 'End') { e.preventDefault(); showSlide(slides.length - 1, true); }
  });

  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && presenting) exitPresent();
  });

  function initPresent() {
    document.getElementById('btnPresent').addEventListener('click', enterPresent);
    Array.prototype.forEach.call(document.querySelectorAll('[data-action="present"]'), function (b) {
      b.addEventListener('click', enterPresent);
    });
    document.getElementById('pPrev').addEventListener('click', function () { showSlide(current - 1, true); });
    document.getElementById('pNext').addEventListener('click', function () { showSlide(current + 1, true); });
    document.getElementById('pExit').addEventListener('click', exitPresent);
    if (presentNav) presentNav.setAttribute('aria-label', 'Präsentationssteuerung');
  }

  /* ---------- Einfahren-Knopf ---------- */
  function initEinfahren() {
    var btn = document.getElementById('btnEinfahren');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (presenting) { showSlide(current + 1, true); return; }
      transit('down', '1. Sohle', function () {
        document.getElementById('sohle1').scrollIntoView({ behavior: 'auto', block: 'start' });
      });
    });
  }

  /* ---------- Beine wachsen beim Hineinscrollen ---------- */
  function initGrowTriggers() {
    if (!Bug || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          Bug.grow(en.target.getAttribute('data-grow'));
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.45 });
    Array.prototype.forEach.call(document.querySelectorAll('[data-grow]'), function (el) {
      // Phasen im Zeitstrahl wachsen per Klick (siehe interaktionen.js)
      if (!el.classList.contains('zeit__panel')) io.observe(el);
    });
  }

  /* ---------- Begriffserklärungen ---------- */
  var glossar = {};
  var pop = document.getElementById('popover');
  var popTitle = document.getElementById('popTitle');
  var popText = document.getElementById('popText');
  var popOwner = null;

  function initGlossar() {
    Array.prototype.forEach.call(document.querySelectorAll('#glossar dt'), function (dt) {
      var dd = dt.nextElementSibling;
      glossar[dt.getAttribute('data-key')] = {
        title: dt.textContent.trim(),
        text: dd ? dd.textContent.trim() : '',
        luecke: dd ? dd.classList.contains('is-luecke') : true
      };
    });
    document.addEventListener('click', function (e) {
      var term = e.target.closest ? e.target.closest('.term') : null;
      if (term) {
        e.stopPropagation();
        if (popOwner === term && !pop.hidden) { closePop(); return; }
        openPop(term);
        return;
      }
      if (!pop.hidden && !pop.contains(e.target)) closePop();
    });
    document.getElementById('popClose').addEventListener('click', closePop);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) closePop(); });
    window.addEventListener('scroll', function () { if (!pop.hidden) closePop(); }, { passive: true });
    if (mainEl) mainEl.addEventListener('scroll', function () { if (!pop.hidden) closePop(); }, { passive: true });
  }

  function openPop(term) {
    var key = term.getAttribute('data-term');
    var g = glossar[key] || { title: term.textContent.trim(), text: '', luecke: true };
    popTitle.textContent = g.title;
    popText.textContent = g.luecke ? '✎ Erklärung ergänzen – in unserem Material noch nicht erklärt.' : g.text;
    pop.classList.toggle('is-luecke', g.luecke);
    pop.hidden = false;
    popOwner = term;
    var r = term.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var top = r.bottom + 8;
    if (top + ph > window.innerHeight - 12) top = Math.max(12, r.top - ph - 8);
    var left = Math.min(Math.max(12, r.left), window.innerWidth - pw - 12);
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
    document.getElementById('popClose').focus({ preventScroll: true });
  }

  function closePop() {
    pop.hidden = true;
    if (popOwner) { popOwner.focus({ preventScroll: true }); popOwner = null; }
  }

  /* ---------- Start ---------- */
  function init() {
    buildFahrplan();
    buildShaft();
    if (Bug) Bug.initBand();
    if (window.Interaktionen) window.Interaktionen.init();
    initPresent();
    initEinfahren();
    initGrowTriggers();
    initGlossar();
    measure();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); onScroll(); });
    window.addEventListener('load', function () { measure(); onScroll(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
