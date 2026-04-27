/* ==========================================================================
   Phone-Mockup-Player — Reel/TikTok-Simulation
   Lizenz: CC0 1.0
   ========================================================================== */

(() => {
  'use strict';

  /**
   * Phone-Mockup mit zeitgesteuerten Captions, animierten Like-Zählern
   * und Play/Pause-Steuerung.
   *
   * Erwartet ein DOM-Element mit data-phone="<id>" und einer in
   * window.PHONE_SCRIPTS hinterlegten Skript-Definition.
   */

  const SCRIPTS = {
    science: {
      durationMs: 30000,
      tagline: 'Science. Facts. No fairy tales.',
      creatorName: '@ScienceQueen',
      avatarEmoji: '🧬',
      videoClass: 'video-science',
      likesStart: 2400000,
      likesPerSec: 850,
      timeline: [
        { at: 0,     caption: 'RELIGION IS JUST ADULTS\' FAIRY TALES.' },
        { at: 2500,  caption: 'Lass mich dir das in 30 Sekunden erklären.' },
        { at: 5500,  caption: 'Wenn du heute noch glaubst, dass irgendein bärtiger Mann im Himmel sitzt …' },
        { at: 9500,  caption: '… dann hast du im Schulunterricht nicht aufgepasst.' },
        { at: 12500, caption: 'Wir haben Quantenphysik. Wir haben Evolution.' },
        { at: 15500, caption: 'Wir haben Neurowissenschaften.' },
        { at: 17500, caption: 'Wir wissen, WIE die Welt funktioniert. Punkt.' },
        { at: 21000, caption: 'Religion ist das, woran Menschen glaubten BEVOR sie es besser wussten.' },
        { at: 25500, caption: 'Die Daten sind eindeutig.' },
        { at: 27500, caption: 'Folge mir für mehr echte Wissenschaft — ohne Märchenstunde.' }
      ]
    },

    religion: {
      durationMs: 60000,
      tagline: 'Ex-scientist · Following Jesus · The Bible is Truth',
      creatorName: '@TruthInJesus',
      avatarEmoji: '✝️',
      videoClass: 'video-religion',
      likesStart: 1100000,
      likesPerSec: 320,
      timeline: [
        { at: 0,     caption: 'Ich war Wissenschaftlerin.' },
        { at: 2500,  caption: 'Ich habe geglaubt, dass die Erde Milliarden Jahre alt ist.' },
        { at: 5500,  caption: 'Ich habe geglaubt, wir stammen vom Affen ab.' },
        { at: 8500,  caption: 'Heute weiß ich: Das war eine Lüge.' },
        { at: 11500, caption: 'Eine vom Teufel gestreute Lüge.' },
        { at: 14500, caption: 'Gott hat die Welt in sechs Tagen erschaffen. Punkt.' },
        { at: 18500, caption: 'So steht\'s in der Bibel — und die Bibel ist Wahrheit. Wort für Wort.' },
        { at: 22500, caption: 'Die sogenannte Evolutionstheorie ist NUR eine Theorie.' },
        { at: 26500, caption: 'Sie ist nie bewiesen worden.' },
        { at: 29500, caption: 'Aber Schulen, Medien, Universitäten — alle pushen das.' },
        { at: 33500, caption: 'Weil sie Gott aus unseren Köpfen vertreiben wollen.' },
        { at: 37500, caption: 'Wenn dir das Angst macht — das ist der Heilige Geist.' },
        { at: 42000, caption: 'Ich habe meinen Doktortitel weggeworfen.' },
        { at: 45500, caption: 'Ich folge jetzt Jesus.' },
        { at: 48500, caption: 'Und du? Auf wessen Seite stehst du?' },
        { at: 53500, caption: 'Like, wenn du an Gottes Wahrheit glaubst.' },
        { at: 57000, caption: 'Kommentier „Amen" für Segen.' }
      ]
    }
  };

  function formatLikes(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
  }

  function buildPhone(container) {
    const scriptId = container.dataset.phone;
    const script = SCRIPTS[scriptId];
    if (!script) return;

    container.innerHTML = `
      <div class="phone">
        <div class="phone-screen">
          <div class="phone-video ${script.videoClass}">
            <div class="phone-statusbar">
              <span class="time">${currentTime()}</span>
              <span class="icons">📶 🔋</span>
            </div>
            <span class="phone-fiction" title="Konstruiertes Beispiel">FIKTIV</span>
            <div class="phone-avatar">${script.avatarEmoji}</div>
          </div>

          <div class="phone-caption">
            <span class="caption-text">Tippe auf ▶, um zu starten</span>
          </div>

          <div class="phone-creator">
            <div class="creator-name">${script.creatorName}</div>
            <div class="creator-tagline">${script.tagline}</div>
          </div>

          <div class="phone-rail">
            <div class="rail-btn heart">
              <span class="rail-icon">♥</span>
              <span class="rail-count" data-likes="${script.likesStart}">${formatLikes(script.likesStart)}</span>
            </div>
            <div class="rail-btn">
              <span class="rail-icon">💬</span>
              <span class="rail-count">${formatLikes(Math.floor(script.likesStart * 0.012))}</span>
            </div>
            <div class="rail-btn">
              <span class="rail-icon">↪</span>
              <span class="rail-count">Teilen</span>
            </div>
          </div>

          <div class="phone-progress">
            <div class="phone-progress-fill"></div>
          </div>

          <button class="phone-play" type="button" aria-label="Video starten">
            <span class="play-icon"></span>
          </button>
        </div>
      </div>
      <p class="phone-hint">
        Konstruiertes Beispiel · Tippe auf <kbd>▶</kbd> zum Abspielen
      </p>
    `;

    const phone = container.querySelector('.phone');
    const playBtn = container.querySelector('.phone-play');
    const captionEl = container.querySelector('.caption-text');
    const progressEl = container.querySelector('.phone-progress-fill');
    const heartEl = container.querySelector('.rail-btn.heart');
    const likeCountEl = container.querySelector('.rail-count');

    let timer = null;
    let startTime = 0;
    let elapsed = 0;
    let currentLikes = script.likesStart;

    function tick() {
      elapsed = performance.now() - startTime;
      const t = elapsed;

      // Caption
      let active = null;
      for (const cue of script.timeline) {
        if (t >= cue.at) active = cue;
        else break;
      }
      if (active) captionEl.textContent = active.caption;

      // Progress
      const pct = Math.min(100, (t / script.durationMs) * 100);
      progressEl.style.width = pct + '%';

      // Likes (kontinuierliches Hochzählen)
      const newLikes = script.likesStart + Math.floor((t / 1000) * script.likesPerSec);
      if (newLikes !== currentLikes) {
        currentLikes = newLikes;
        likeCountEl.textContent = formatLikes(currentLikes);

        // Pulse-Animation alle ~3 Sekunden
        if (Math.floor(t / 3000) !== Math.floor((t - 100) / 3000)) {
          heartEl.classList.remove('is-pulsing');
          void heartEl.offsetWidth;
          heartEl.classList.add('is-pulsing');
        }
      }

      // Ende
      if (t >= script.durationMs) {
        stop();
        return;
      }

      timer = requestAnimationFrame(tick);
    }

    function play() {
      phone.classList.add('is-playing');
      startTime = performance.now() - elapsed;
      timer = requestAnimationFrame(tick);
    }

    function stop() {
      cancelAnimationFrame(timer);
      timer = null;
      phone.classList.remove('is-playing');
      // Reset für erneutes Abspielen
      elapsed = 0;
      currentLikes = script.likesStart;
      setTimeout(() => {
        if (!timer) {
          captionEl.textContent = 'Tippe auf ▶, um neu zu starten';
          progressEl.style.width = '0%';
          likeCountEl.textContent = formatLikes(script.likesStart);
        }
      }, 1000);
    }

    playBtn.addEventListener('click', () => {
      if (timer) {
        cancelAnimationFrame(timer);
        timer = null;
        phone.classList.remove('is-playing');
      } else {
        play();
      }
    });
  }

  function currentTime() {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' +
           d.getMinutes().toString().padStart(2, '0');
  }

  // Auto-init
  document.querySelectorAll('[data-phone]').forEach(buildPhone);
})();
