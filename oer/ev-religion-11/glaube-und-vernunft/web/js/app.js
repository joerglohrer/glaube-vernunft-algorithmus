/* ==========================================================================
   Glaube, Vernunft und der Algorithmus — Mini-Site
   Lizenz: CC0 1.0
   ========================================================================== */

(() => {
  'use strict';

  const STORAGE_KEY = 'gva-analyse-v1';
  const MODE_KEY = 'gva-mode-v1';

  /* ---------- Modus-Umschalter (Schüler:in / Lehrkraft) ---------- */

  const btnStudent = document.getElementById('mode-student');
  const btnTeacher = document.getElementById('mode-teacher');

  function setMode(mode) {
    if (mode === 'teacher') {
      document.body.classList.add('teacher-mode');
      btnTeacher.classList.add('is-active');
      btnTeacher.setAttribute('aria-pressed', 'true');
      btnStudent.classList.remove('is-active');
      btnStudent.setAttribute('aria-pressed', 'false');
    } else {
      document.body.classList.remove('teacher-mode');
      btnStudent.classList.add('is-active');
      btnStudent.setAttribute('aria-pressed', 'true');
      btnTeacher.classList.remove('is-active');
      btnTeacher.setAttribute('aria-pressed', 'false');
    }
    try { localStorage.setItem(MODE_KEY, mode); } catch (_) {}
  }

  btnStudent.addEventListener('click', () => setMode('student'));
  btnTeacher.addEventListener('click', () => setMode('teacher'));

  // Initial mode aus localStorage oder Default
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'teacher') setMode('teacher');
  } catch (_) {}

  /* ---------- Phase-Nav: Aktiver Abschnitt ---------- */

  const phaseLinks = document.querySelectorAll('.phase-link');
  const phases = document.querySelectorAll('.phase[id^="phase-"]');

  function updateActivePhase() {
    let active = null;
    const scrollY = window.scrollY + 120;
    phases.forEach(p => {
      if (p.offsetTop <= scrollY) active = p.id;
    });
    phaseLinks.forEach(link => {
      const target = link.getAttribute('href').slice(1);
      link.classList.toggle('is-active', target === active);
    });
  }

  let scrollTimer;
  window.addEventListener('scroll', () => {
    if (scrollTimer) return;
    scrollTimer = setTimeout(() => {
      updateActivePhase();
      scrollTimer = null;
    }, 80);
  });

  updateActivePhase();

  /* ---------- Analysebogen: Persistenz + Export ---------- */

  const form = document.querySelector('.analysis-form');

  if (form) {
    const fields = form.querySelectorAll('[data-field], input[name="mat"], input[name="einordnung"]');

    function loadAnalysis() {
      let data;
      try {
        data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      } catch (_) {
        data = {};
      }

      fields.forEach(el => {
        const key = el.dataset.field || el.name + ':' + el.value;
        if (data[key] === undefined) return;
        if (el.type === 'checkbox' || el.type === 'radio') {
          el.checked = !!data[key];
        } else {
          el.value = data[key];
        }
      });
    }

    function saveAnalysis() {
      const data = {};
      fields.forEach(el => {
        const key = el.dataset.field || el.name + ':' + el.value;
        if (el.type === 'checkbox' || el.type === 'radio') {
          data[key] = el.checked;
        } else {
          data[key] = el.value;
        }
      });
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
    }

    fields.forEach(el => {
      el.addEventListener('input', saveAnalysis);
      el.addEventListener('change', saveAnalysis);
    });

    loadAnalysis();

    /* Kopieren */

    document.getElementById('copy-analysis').addEventListener('click', async () => {
      const lines = [];
      lines.push('# Mein Analyse-Ergebnis');
      lines.push('');

      const mat = form.querySelector('input[name="mat"]:checked');
      lines.push('**Material:** ' + (mat ? mat.value : '—'));
      lines.push('');

      lines.push('## 1. Kernaussage');
      lines.push(form.querySelector('[data-field="kernaussage"]').value || '—');
      lines.push('');

      lines.push('## 2. Rhetorische Strategien');
      const rhetorMap = {
        'r-zuspitzung': 'Zuspitzung / Schwarz-Weiß',
        'r-strohmann': 'Strohmann-Argument',
        'r-adhominem': 'Ad-hominem',
        'r-autoritaet': 'Autoritätsbehauptung ohne Beleg',
        'r-emotion': 'Emotionaler Appell',
        'r-whatabout': 'Whataboutism',
        'r-immunis': 'Immunisierung',
        'r-zeugnis': 'Persönliches Zeugnis statt Argument',
        'r-binaer': 'Binäre Frage am Schluss'
      };
      Object.entries(rhetorMap).forEach(([k, label]) => {
        const el = form.querySelector(`[data-field="${k}"]`);
        if (el && el.checked) lines.push('- ' + label);
      });
      lines.push('');

      lines.push('## 3. Mediale Strategien');
      const mediaMap = {
        'm-hook': 'Hook in den ersten 3 Sek.',
        'm-kurz': 'Sehr kurze Form',
        'm-polari': 'Polarisierung als Engagement-Treiber',
        'm-visual': 'Visuelle Verstärkung',
        'm-aufruf': 'Like/Kommentar-Aufruf',
        'm-gemein': 'Inszenierung von Gemeinschaft'
      };
      Object.entries(mediaMap).forEach(([k, label]) => {
        const el = form.querySelector(`[data-field="${k}"]`);
        if (el && el.checked) lines.push('- ' + label);
      });
      lines.push('');

      lines.push('## 4. Einordnung');
      const ein = form.querySelector('input[name="einordnung"]:checked');
      const einMap = { szient: 'Szientismus', fund: 'Religiöser Fundamentalismus', anderes: 'Etwas Drittes' };
      lines.push(ein ? einMap[ein.value] : '—');
      lines.push('');
      lines.push('**Begründung:** ' + (form.querySelector('[data-field="begruendung"]').value || '—'));
      lines.push('');

      lines.push('## 5. Differenzierte Gegenstimme');
      lines.push(form.querySelector('[data-field="gegenstimme"]').value || '—');

      const text = lines.join('\n');
      try {
        await navigator.clipboard.writeText(text);
        flash('copy-analysis', '✅ kopiert');
      } catch (_) {
        // Fallback: textarea + select
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); flash('copy-analysis', '✅ kopiert'); }
        catch (_) { flash('copy-analysis', '❌ konnte nicht kopieren'); }
        document.body.removeChild(ta);
      }
    });

    /* Reset */

    document.getElementById('reset-analysis').addEventListener('click', () => {
      if (!confirm('Wirklich alle Antworten zurücksetzen?')) return;
      fields.forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
      });
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    });

    function flash(id, msg) {
      const btn = document.getElementById(id);
      const orig = btn.textContent;
      btn.textContent = msg;
      setTimeout(() => { btn.textContent = orig; }, 1500);
    }
  }

  /* ---------- Wortzähler für den Schreibauftrag ---------- */

  const kommentar = document.getElementById('kommentar');
  const wordCount = document.getElementById('word-count');

  if (kommentar && wordCount) {
    function countWords() {
      const text = kommentar.value.trim();
      const n = text.length === 0 ? 0 : text.split(/\s+/).length;
      wordCount.textContent = n + ' Wörter';
      wordCount.classList.toggle('over-limit', n > 150);
    }

    kommentar.addEventListener('input', countWords);

    // Auto-save Kommentar
    const COMMENT_KEY = 'gva-kommentar-v1';
    try {
      const saved = localStorage.getItem(COMMENT_KEY);
      if (saved) {
        kommentar.value = saved;
        countWords();
      }
    } catch (_) {}

    kommentar.addEventListener('input', () => {
      try { localStorage.setItem(COMMENT_KEY, kommentar.value); } catch (_) {}
    });
  }

  /* ---------- Brain-Dump (Phase 1) auch persistieren ---------- */

  const brainDump = document.querySelector('.brain-dump textarea');
  if (brainDump) {
    const BRAIN_KEY = 'gva-braindump-v1';
    try {
      const saved = localStorage.getItem(BRAIN_KEY);
      if (saved) brainDump.value = saved;
    } catch (_) {}
    brainDump.addEventListener('input', () => {
      try { localStorage.setItem(BRAIN_KEY, brainDump.value); } catch (_) {}
    });
  }
})();
