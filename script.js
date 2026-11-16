(function () {
  'use strict';

  /* ===== Starfield, Constellation Lines & Shooting Stars ===== */
  function initStarfield() {
    var canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var w = 0;
    var h = 0;
    var stars = [];
    var shooters = [];
    var rafId = null;

    function createStars() {
      var count = Math.min(130, Math.max(60, Math.floor((w * h) / 14000)));
      stars = [];
      for (var i = 0; i < count; i++) {
        var depth = 0.25 + Math.random() * 0.75;
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (0.65 + Math.random() * 1.45) * depth,
          vx: (Math.random() - 0.5) * 0.14 * depth,
          vy: (Math.random() - 0.5) * 0.14 * depth,
          phase: Math.random() * Math.PI * 2,
          speed: 0.012 + Math.random() * 0.018,
          isGold: Math.random() < 0.24
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

    function spawnShooter() {
      shooters.push({
        x: Math.random() * w * 0.8 + w * 0.1,
        y: Math.random() * h * 0.4,
        vx: 7 + Math.random() * 5,
        vy: 2.5 + Math.random() * 2.5,
        life: 0,
        maxLife: 45 + Math.random() * 20
      });
    }

    function drawFrame() {
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

      /* Subtle Constellation Lines */
      var maxDistSq = 125 * 125;
      for (var a = 0; a < stars.length; a++) {
        for (var b = a + 1; b < stars.length; b++) {
          var dx = stars[a].x - stars[b].x;
          var dy = stars[a].y - stars[b].y;
          var dSq = dx * dx + dy * dy;
          if (dSq < maxDistSq) {
            var lineAlpha = (1 - Math.sqrt(dSq) / 125) * 0.12;
            ctx.strokeStyle =
              stars[a].isGold && stars[b].isGold
                ? 'rgba(212, 175, 106, ' + (lineAlpha * 1.4).toFixed(3) + ')'
                : 'rgba(130, 158, 255, ' + lineAlpha.toFixed(3) + ')';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(stars[a].x, stars[a].y);
            ctx.lineTo(stars[b].x, stars[b].y);
            ctx.stroke();
          }
        }
      }

      /* Shooting Stars */
      if (!reducedMotion) {
        if (Math.random() < 0.008 && shooters.length < 2) {
          spawnShooter();
        }
        for (var k = shooters.length - 1; k >= 0; k--) {
          var sh = shooters[k];
          sh.x += sh.vx;
          sh.y += sh.vy;
          sh.life += 1;
          var p = sh.life / sh.maxLife;
          var opacity = Math.sin(p * Math.PI) * 0.85;
          var grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 8, sh.y - sh.vy * 8);
          grad.addColorStop(0, 'rgba(235, 208, 148, ' + opacity.toFixed(2) + ')');
          grad.addColorStop(1, 'rgba(212, 175, 106, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(sh.x - sh.vx * 8, sh.y - sh.vy * 8);
          ctx.stroke();

          if (sh.life >= sh.maxLife) {
            shooters.splice(k, 1);
          }
        }
      }

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    }

    resize();
    window.addEventListener('resize', resize);
    drawFrame();

    window.addEventListener('beforeunload', function () {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    });
  }

  /* ===== Interactive Profil Pemimpin & Silsilah ===== */
  var PROFILES = {
    kurozawa: {
      crest: '👑',
      name: 'Kurozawa',
      role: 'Ketua Guild · Pemimpin Tertinggi Ascendant Realms',
      bio: 'Pendiri sekaligus pemegang arah langkah Celestial Harmony. Memastikan tidak ada satu pun petualang yang bertarung sendirian di dunia Toram Online.',
      specialty: 'Strategi Guild & Penjaga Bintang Pertama',
      coordination: 'Seluruh 18 Divisi Guild',
      branchPath: ''
    },
    katsuo: {
      crest: '🛡️',
      name: 'Katsuo',
      role: 'Wakil 1 · Kapten Divisi Garis Depan',
      bio: 'Tangan kanan pertama yang membawa semangat dan tawa di garis depan. Mengkoordinasikan misi raid serta pelatihan anggota baru.',
      specialty: 'Serangan Terpadu & Moral Pasukan',
      coordination: 'Divisi 1, 4, 7, 10, 13, 16',
      branchPath: 'M 300 0 L 300 22 L 100 22 L 100 44'
    },
    ferisn: {
      crest: '🛡️',
      name: 'Ferisn',
      role: 'Wakil 2 · Kapten Divisi Strategi',
      bio: 'Sosok tenang di balik keseimbangan guild. Menata jadwal divisi, pembagian sumber daya, serta keharmonisan antar-tukang rekrut.',
      specialty: 'Taktik & Tata Kelola Divisi',
      coordination: 'Divisi 2, 5, 8, 11, 14, 17',
      branchPath: 'M 300 0 L 300 44'
    },
    rey: {
      crest: '🛡️',
      name: 'Rey',
      role: 'Wakil 3 · Kapten Divisi Penjelajah',
      bio: 'Pengintai tajam yang selalu siap membuka jalur baru di wilayah berbahaya serta membina calon petualang berbakat.',
      specialty: 'Ekspedisi & Pembinaan Rekrutan',
      coordination: 'Divisi 3, 6, 9, 12, 15, 18',
      branchPath: 'M 300 0 L 300 22 L 500 22 L 500 44'
    }
  };

  function initSilsilah() {
    var nodes = document.querySelectorAll('[data-profile-id]');
    var card = document.getElementById('profile-card');
    var crestEl = document.getElementById('profile-crest');
    var nameEl = document.getElementById('profile-name');
    var roleEl = document.getElementById('profile-role');
    var bioEl = document.getElementById('profile-bio');
    var specEl = document.getElementById('profile-specialty');
    var coordEl = document.getElementById('profile-coordination');
    var branchEl = document.getElementById('silsilah-active-branch');
    if (!card || !nodes.length) return;

    nodes.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-profile-id');
        var data = PROFILES[id];
        if (!data) return;

        nodes.forEach(function (n) {
          n.classList.remove('active');
        });
        btn.classList.add('active');
        if (branchEl) {
          branchEl.setAttribute('d', data.branchPath || '');
        }

        card.classList.add('switching');
        window.setTimeout(function () {
          crestEl.textContent = data.crest;
          nameEl.textContent = data.name;
          roleEl.textContent = data.role;
          bioEl.textContent = data.bio;
          specEl.textContent = data.specialty;
          if (coordEl) coordEl.textContent = data.coordination;
          card.classList.remove('switching');
        }, 140);
      });
    });
  }

  /* ===== 18 Divisi Tukang Rekrut Interactive Grid ===== */
  var CAPTAINS = ['Katsuo', 'Ferisn', 'Rey'];
  var NAMED_MEMBERS = { 0: ['Ultras'] };

  var DIVISIONS = Array.from({ length: 18 }, function (_, i) {
    var custom = NAMED_MEMBERS[i] || [];
    var members = [0, 1, 2].map(function (j) {
      return custom[j] || 'Anggota ' + (j + 1);
    });
    return {
      id: i + 1,
      name: 'Divisi ' + (i + 1),
      captain: CAPTAINS[i % CAPTAINS.length],
      members: members,
      hasNamed: custom.length > 0
    };
  });

  function initDivisions() {
    var grid = document.getElementById('recruiter-grid');
    var detailBox = document.getElementById('division-detail');
    var titleEl = document.getElementById('division-title');
    var captainEl = document.getElementById('division-captain');
    var membersEl = document.getElementById('division-members');
    if (!grid || !detailBox) return;

    var selectedId = 1;

    function renderDetail(div) {
      titleEl.textContent = '🎺 ' + div.name + ' · Tukang Rekrut';
      captainEl.textContent = div.captain;
      membersEl.innerHTML = '';

      div.members.forEach(function (m) {
        var filled = m.indexOf('Anggota ') !== 0;
        var slot = document.createElement('div');
        slot.className = 'member-slot' + (filled ? ' filled' : '');
        slot.textContent = (filled ? '✦ ' : '○ ') + m;
        membersEl.appendChild(slot);
      });
    }

    DIVISIONS.forEach(function (div) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'recruiter-btn' + (div.id === selectedId ? ' active' : '');
      btn.setAttribute('data-div-id', String(div.id));

      var icon = document.createElement('span');
      icon.className = 'recruiter-trumpet';
      icon.textContent = '🎺';
      icon.setAttribute('aria-hidden', 'true');

      var label = document.createElement('span');
      label.className = 'recruiter-label';
      label.textContent = 'Div ' + div.id;

      var status = document.createElement('span');
      status.className = 'recruiter-status';
      status.textContent = div.hasNamed ? 'Aktif' : '3 Slot';

      btn.appendChild(icon);
      btn.appendChild(label);
      btn.appendChild(status);

      btn.addEventListener('click', function () {
        if (selectedId === div.id) return;
        selectedId = div.id;
        grid.querySelectorAll('.recruiter-btn').forEach(function (el) {
          el.classList.toggle('active', el.getAttribute('data-div-id') === String(div.id));
        });
        detailBox.classList.add('switching');
        window.setTimeout(function () {
          renderDetail(div);
          detailBox.classList.remove('switching');
        }, 120);
      });

      grid.appendChild(btn);
    });

    renderDetail(DIVISIONS[0]);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initStarfield();
    initSilsilah();
    initDivisions();
  });
})();
