(function () {
  'use strict';

  /* ===== Self-contained Starfield Background ===== */
  function initStarfield() {
    var canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var w = 0;
    var h = 0;
    var stars = [];
    var rafId = null;

    function createStars() {
      var count = Math.min(115, Math.max(55, Math.floor((w * h) / 15000)));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.7 + Math.random() * 1.4,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          phase: Math.random() * Math.PI * 2,
          speed: 0.012 + Math.random() * 0.018,
          isGold: Math.random() < 0.25
        });
      }
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createStars();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (!reducedMotion) {
          s.x += s.vx;
          s.y += s.vy;
          s.phase += s.speed;
          if (s.x < 0) s.x = w;
          if (s.x > w) s.x = 0;
          if (s.y < 0) s.y = h;
          if (s.y > h) s.y = 0;
        }
        var alpha = 0.35 + (Math.sin(s.phase) + 1) * 0.3;
        ctx.fillStyle = s.isGold
          ? 'rgba(212, 175, 106, ' + alpha.toFixed(2) + ')'
          : 'rgba(220, 232, 255, ' + alpha.toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(draw);
      }
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
    window.addEventListener('beforeunload', function () {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    });
  }

  /* ===== Novel 5 Bab Data ===== */
  var CHAPTERS = [
    {
      id: 1,
      roman: 'I',
      shortTitle: 'Bintang Pertama',
      title: 'Bab 1 · Bintang Pertama',
      subtitle: 'Awal mula di tepi dataran tinggi Toram',
      symbol: '✦',
      paragraphs: [
        'Malam itu langit Toram berwarna biru tua, dan seorang petualang bernama Kurozawa berdiri sendirian di tepi dataran tinggi. Ia lelah bertarung tanpa tempat pulang. Di kejauhan, sebuah bintang berpendar lebih terang dari yang lain, seolah memanggilnya.',
        'Ia bersumpah akan membangun tempat di mana tidak ada petualang yang berjuang sendirian.'
      ]
    },
    {
      id: 2,
      roman: 'II',
      shortTitle: 'Kawan Setia',
      title: 'Bab 2 · Kawan Setia',
      subtitle: 'Api unggun kecil yang menyatukan mereka',
      symbol: '🔥',
      paragraphs: [
        'Satu per satu mereka datang: Katsuo dengan tawanya yang keras, Ferisn yang tenang, Rey yang tajam, dan Ultras yang tak pernah mundur. Mereka tidak sempurna, tetapi mereka tetap tinggal.',
        'Dari api unggun kecil itulah lahir ikatan pertama.'
      ]
    },
    {
      id: 3,
      roman: 'III',
      shortTitle: 'Nama di Langit',
      title: 'Bab 3 · Nama di Langit',
      subtitle: 'Restu sang naga perak',
      symbol: '🐉',
      paragraphs: [
        'Mereka mencari nama yang pantas. Kurozawa menatap langit dan melihat bintang-bintang bergerak selaras. Maka lahirlah nama itu: Celestial Harmony.',
        'Sebuah naga perak melintas di atas mereka, seakan merestui.'
      ]
    },
    {
      id: 4,
      roman: 'IV',
      shortTitle: 'Divisi & Terompet',
      title: 'Bab 4 · Divisi dan Terompet',
      subtitle: 'Satu tubuh dalam barisan divisi',
      symbol: '🎺',
      paragraphs: [
        'Anggota baru berdatangan hingga satu kelompok tak lagi cukup. Para Tukang Rekrut meniup terompet di tiap kota, dan tiap terompet membawa tiga jiwa baru.',
        'Sejak itu guild terbagi menjadi divisi, bergerak seperti satu tubuh.'
      ]
    },
    {
      id: 5,
      roman: 'V',
      shortTitle: 'Ascendant Realms',
      title: 'Bab 5 · Ascendant Realms',
      subtitle: 'Langkah awal menuju cakrawala baru',
      symbol: '👑',
      paragraphs: [
        'Guild itu kini dikenal sebagai Ascendant Realms, penguasa langit yang tidak lupa pada tanah tempat mereka bermula. Namun ini barulah permulaan.',
        'Kisah selanjutnya menanti di Season 1.'
      ]
    }
  ];

  /* ===== Novel Reader Logic ===== */
  function initNovel() {
    var cardsContainer = document.getElementById('chapter-cards');
    var stage = document.getElementById('tome-stage');
    var counterEl = document.getElementById('tome-counter');
    var titleEl = document.getElementById('chapter-title');
    var subtitleEl = document.getElementById('chapter-subtitle');
    var bodyEl = document.getElementById('chapter-body');
    var progressEl = document.getElementById('tome-progress');
    var progressFillEl = document.getElementById('tome-progress-fill');
    var prevBtn = document.getElementById('btn-prev-chapter');
    var nextBtn = document.getElementById('btn-next-chapter');
    if (!cardsContainer || !stage) return;

    var currentIdx = 0;

    function renderChapter(idx) {
      var ch = CHAPTERS[idx];
      counterEl.textContent = '📖 Bab ' + ch.id + ' dari ' + CHAPTERS.length;
      titleEl.textContent = ch.title;
      subtitleEl.textContent = ch.subtitle;
      progressEl.textContent = (idx + 1) + ' / ' + CHAPTERS.length;
      if (progressFillEl) {
        progressFillEl.style.width = ((idx + 1) / CHAPTERS.length) * 100 + '%';
      }
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === CHAPTERS.length - 1;

      bodyEl.innerHTML = '';
      ch.paragraphs.forEach(function (text, pIdx) {
        var p = document.createElement('p');
        p.className = pIdx === 0 ? 'dropcap' : 'indented';
        p.textContent = text;
        bodyEl.appendChild(p);
      });

      cardsContainer.querySelectorAll('.chapter-card').forEach(function (btn, bIdx) {
        var active = bIdx === idx;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function goToChapter(nextIdx) {
      var clamped = Math.max(0, Math.min(CHAPTERS.length - 1, nextIdx));
      if (clamped === currentIdx) return;
      var animClass = clamped > currentIdx ? 'turning-next' : 'turning-prev';
      currentIdx = clamped;
      stage.classList.add(animClass);
      window.setTimeout(function () {
        renderChapter(currentIdx);
        stage.classList.remove(animClass);
      }, 170);
    }

    CHAPTERS.forEach(function (ch, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.role = 'tab';
      btn.className = 'chapter-card' + (idx === 0 ? ' active' : '');
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');

      var roman = document.createElement('span');
      roman.className = 'chapter-roman';
      roman.textContent = 'Bab ' + ch.roman;

      var sym = document.createElement('span');
      sym.className = 'chapter-symbol';
      sym.textContent = ch.symbol;

      var shortT = document.createElement('span');
      shortT.className = 'chapter-short';
      shortT.textContent = ch.shortTitle;

      btn.appendChild(roman);
      btn.appendChild(sym);
      btn.appendChild(shortT);
      btn.addEventListener('click', function () {
        goToChapter(idx);
      });
      cardsContainer.appendChild(btn);
    });

    prevBtn.addEventListener('click', function () {
      goToChapter(currentIdx - 1);
    });
    nextBtn.addEventListener('click', function () {
      goToChapter(currentIdx + 1);
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') goToChapter(currentIdx + 1);
      if (e.key === 'ArrowLeft') goToChapter(currentIdx - 1);
    });

    renderChapter(0);
  }

  /* ===== Web Audio Polyphonic Arpeggio Music Player ===== */
  var TRACKS = [
    {
      id: 0,
      title: 'Langit Malam',
      subtitle: 'Arpeggio lembut A minor · 72 BPM',
      padFreqs: [220, 261.63, 329.63],
      notes: [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63],
      tempoMs: 650
    },
    {
      id: 1,
      title: 'Naga Perak',
      subtitle: 'Harmoni G mayor megah · 80 BPM',
      padFreqs: [196, 246.94, 293.66],
      notes: [196, 246.94, 293.66, 369.99, 392, 293.66, 246.94, 293.66],
      tempoMs: 560
    },
    {
      id: 2,
      title: 'Pertempuran',
      subtitle: 'Ritme E minor penuh semangat · 96 BPM',
      padFreqs: [164.81, 220, 246.94],
      notes: [164.81, 196, 246.94, 329.63, 293.66, 246.94, 220, 196],
      tempoMs: 420
    }
  ];

  function initMusicPlayer() {
    var tracksEl = document.getElementById('music-tracks');
    var statusEl = document.getElementById('music-status');
    var eqEl = document.getElementById('music-eq');
    var volumeEl = document.getElementById('music-volume');
    if (!tracksEl) return;

    var audioCtx = null;
    var masterGain = null;
    var intervalId = null;
    var padOscs = [];
    var activeTrackId = null;

    function stopAudio() {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      padOscs.forEach(function (osc) {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      padOscs = [];
      if (eqEl) eqEl.classList.remove('playing');
    }

    function updateButtons() {
      tracksEl.querySelectorAll('.track-btn').forEach(function (btn, idx) {
        var playing = idx === activeTrackId;
        btn.classList.toggle('active', playing);
        var badge = btn.querySelector('.track-icon');
        if (badge) badge.textContent = playing ? '⏸' : '▶';
      });
      if (activeTrackId !== null) {
        statusEl.textContent = 'Sedang memutar: ' + TRACKS[activeTrackId].title;
      } else {
        statusEl.textContent = 'Pilih alunan musik latar untuk menemani saat membaca';
      }
    }

    function toggleTrack(trackId) {
      if (activeTrackId === trackId) {
        stopAudio();
        activeTrackId = null;
        updateButtons();
        return;
      }

      stopAudio();

      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      var vol = Number(volumeEl ? volumeEl.value : 0.35);
      masterGain = audioCtx.createGain();
      masterGain.gain.value = vol * 0.14;

      var filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1100;

      masterGain.connect(filter);
      filter.connect(audioCtx.destination);

      var track = TRACKS[trackId];
      track.padFreqs.forEach(function (freq, idx) {
        var osc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.value = freq / 2;
        g.gain.value = 0.18;
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        padOscs.push(osc);
      });

      var step = 0;
      function playPluck() {
        if (!audioCtx || audioCtx.state !== 'running') return;
        var now = audioCtx.currentTime;
        var freq = track.notes[step % track.notes.length];
        step += 1;

        var osc = audioCtx.createOscillator();
        var shimmerOsc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        var sg = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        shimmerOsc.type = 'triangle';
        shimmerOsc.frequency.value = freq * 2;

        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.42, now + 0.035);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.62);

        sg.gain.setValueAtTime(0.001, now);
        sg.gain.exponentialRampToValueAtTime(0.11, now + 0.025);
        sg.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(g);
        shimmerOsc.connect(sg);
        g.connect(masterGain);
        sg.connect(masterGain);
        osc.start(now);
        shimmerOsc.start(now);
        osc.stop(now + 0.66);
        shimmerOsc.stop(now + 0.42);
      }

      playPluck();
      intervalId = window.setInterval(playPluck, track.tempoMs);
      activeTrackId = trackId;
      if (eqEl) eqEl.classList.add('playing');
      updateButtons();
    }

    if (volumeEl) {
      volumeEl.addEventListener('input', function () {
        if (masterGain && audioCtx) {
          masterGain.gain.setTargetAtTime(Number(volumeEl.value) * 0.14, audioCtx.currentTime, 0.05);
        }
      });
    }

    TRACKS.forEach(function (track) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'track-btn';

      var info = document.createElement('div');
      info.className = 'track-info';
      var t = document.createElement('div');
      t.className = 'track-title';
      t.textContent = track.title;
      var s = document.createElement('div');
      s.className = 'track-sub';
      s.textContent = track.subtitle;
      info.appendChild(t);
      info.appendChild(s);

      var icon = document.createElement('span');
      icon.className = 'track-icon';
      icon.textContent = '▶';
      icon.setAttribute('aria-hidden', 'true');

      btn.appendChild(info);
      btn.appendChild(icon);
      btn.addEventListener('click', function () {
        toggleTrack(track.id);
      });
      tracksEl.appendChild(btn);
    });

    window.addEventListener('beforeunload', function () {
      stopAudio();
      if (audioCtx) {
        audioCtx.close();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initStarfield();
    initNovel();
    initMusicPlayer();
  });
})();
