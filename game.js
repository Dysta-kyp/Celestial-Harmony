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

  /* ===== Game Data & Storage ===== */
  var THEMES = [
    ['🐱', 'Kucing'],
    ['🐶', 'Anjing'],
    ['🍎', 'Apel'],
    ['⭐', 'Bintang'],
    ['🐉', 'Naga'],
    ['⚔️', 'Pedang'],
    ['💎', 'Permata'],
    ['🔥', 'Api'],
    ['🍄', 'Jamur'],
    ['🌙', 'Bulan']
  ];

  var FAMILIES = [
    'Tap',
    'Hitung',
    'Ingat Urutan',
    'Tebak Angka',
    'Cari Beda',
    'Hitung Jumlah',
    'Urutkan Angka',
    'Cari Pasangan',
    'Mana Lebih Besar',
    'Uji Refleks'
  ];

  var GAMES = Array.from({ length: 100 }, function (_, n) {
    var familyIndex = n % 10;
    var k = Math.floor(n / 10);
    var theme = THEMES[(familyIndex + k * 3) % 10];
    var isVeryEasy = k < 5;
    return {
      id: n + 1,
      familyIndex: familyIndex,
      familyName: FAMILIES[familyIndex],
      tierLevel: k % 5,
      isVeryEasy: isVeryEasy,
      points: isVeryEasy ? 1 : 2,
      icon: theme[0],
      themeLabel: theme[1],
      name: FAMILIES[familyIndex] + ' ' + theme[1]
    };
  });

  var KEY_PLAYER = 'celestial_harmony_player_name';
  var KEY_COMPLETED = 'celestial_harmony_completed_games';
  var KEY_LB = 'celestial_harmony_local_leaderboard';

  function sanitizeName(raw) {
    return String(raw || '')
      .trim()
      .replace(/[.#$[\]/\\<>]/g, '')
      .slice(0, 24);
  }

  function loadJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function makeNumericOptions(answer, count) {
    var set = [answer];
    var guard = 0;
    while (set.length < count && guard < 40) {
      guard++;
      var cand = Math.max(0, answer + randInt(-3, 3));
      if (set.indexOf(cand) === -1) set.push(cand);
    }
    var fb = 0;
    while (set.length < count) {
      fb++;
      if (set.indexOf(answer + fb) === -1) set.push(answer + fb);
    }
    return shuffle(set);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initStarfield();

    var playerName = '';
    try {
      playerName = localStorage.getItem(KEY_PLAYER) || '';
    } catch (e) {}

    var completedGames = loadJson(KEY_COMPLETED, {});
    var leaderboardMap = loadJson(KEY_LB, {});

    var diffFilter = 'all';
    var famFilter = 'all';
    var searchQ = '';

    var playerInput = document.getElementById('player-input');
    var playerForm = document.getElementById('player-form');
    var playerNotice = document.getElementById('player-notice');
    var statCompleted = document.getElementById('stat-completed');
    var statPoints = document.getElementById('stat-points');
    var progressFill = document.getElementById('progress-fill');
    var lbList = document.getElementById('leaderboard-list');
    var familySelect = document.getElementById('family-filter');
    var searchInput = document.getElementById('search-input');
    var gamesGrid = document.getElementById('games-grid');

    var modal = document.getElementById('game-modal');
    var modalTitle = document.getElementById('modal-title');
    var modalMeta = document.getElementById('modal-meta');
    var modalBody = document.getElementById('modal-body');
    var modalClose = document.getElementById('modal-close');

    if (playerName) playerInput.value = playerName;

    FAMILIES.forEach(function (fam) {
      var opt = document.createElement('option');
      opt.value = fam;
      opt.textContent = fam;
      familySelect.appendChild(opt);
    });

    function renderStats() {
      var keys = Object.keys(completedGames);
      var count = keys.length;
      var pts = keys.reduce(function (sum, k) {
        return sum + (Number(completedGames[k]) || 0);
      }, 0);
      statCompleted.textContent = count + ' / 100';
      statPoints.textContent = pts + ' Poin';
      progressFill.style.width = Math.min(100, count) + '%';
    }

    function renderLeaderboard() {
      lbList.innerHTML = '';
      var entries = Object.keys(leaderboardMap).map(function (k) {
        return leaderboardMap[k];
      });
      entries.sort(function (a, b) {
        if (b.points !== a.points) return b.points - a.points;
        return b.completedCount - a.completedCount;
      });

      if (!entries.length) {
        var empty = document.createElement('p');
        empty.className = 'lb-empty';
        empty.textContent =
          'Belum ada skor tercatat. Isi namamu lalu selesaikan satu mini game untuk tampil di sini.';
        lbList.appendChild(empty);
        return;
      }

      entries.slice(0, 8).forEach(function (entry, idx) {
        var isSelf = Boolean(playerName) && entry.name.toLowerCase() === playerName.toLowerCase();
        var row = document.createElement('div');
        row.className = 'lb-row' + (isSelf ? ' self' : '');

        var left = document.createElement('div');
        left.className = 'lb-left';
        var rank = document.createElement('span');
        rank.className = 'lb-rank';
        rank.textContent = '#' + (idx + 1);
        var nm = document.createElement('span');
        nm.className = 'lb-name';
        nm.textContent = entry.name + (isSelf ? ' (Kamu)' : '');
        left.appendChild(rank);
        left.appendChild(nm);

        var right = document.createElement('div');
        right.className = 'lb-right';
        var gc = document.createElement('span');
        gc.className = 'lb-games';
        gc.textContent = entry.completedCount + ' game';
        var gp = document.createElement('span');
        gp.className = 'lb-pts';
        gp.textContent = entry.points + ' poin';
        right.appendChild(gc);
        right.appendChild(gp);

        row.appendChild(left);
        row.appendChild(right);
        lbList.appendChild(row);
      });
    }

    function recordWin(game) {
      var gKey = 'g' + game.id;
      var alreadyDone = Boolean(completedGames[gKey]);
      completedGames[gKey] = game.points;
      saveJson(KEY_COMPLETED, completedGames);

      var totalPts = Object.keys(completedGames).reduce(function (sum, k) {
        return sum + (Number(completedGames[k]) || 0);
      }, 0);
      var totalCount = Object.keys(completedGames).length;

      if (playerName) {
        var pKey = playerName.toLowerCase();
        var record = leaderboardMap[pKey] || { name: playerName, games: {}, points: 0, completedCount: 0 };
        record.name = playerName;
        record.games = record.games || {};
        record.games[gKey] = game.points;
        record.points = Object.keys(record.games).reduce(function (s, k) {
          return s + (Number(record.games[k]) || 0);
        }, 0);
        record.completedCount = Object.keys(record.games).length;
        leaderboardMap[pKey] = record;
        saveJson(KEY_LB, leaderboardMap);
      }

      renderStats();
      renderLeaderboard();
      renderGamesGrid();

      if (!playerName) {
        return 'Skor tersimpan lokal. Isi nama guild untuk masuk ke Papan Skor.';
      }
      if (!alreadyDone) {
        return '+' + game.points + ' poin ditambahkan! Total poin kamu: ' + totalPts + ' (' + totalCount + ' game).';
      }
      return 'Game sudah pernah diselesaikan. Total poin kamu: ' + totalPts + '.';
    }

    function renderGamesGrid() {
      gamesGrid.innerHTML = '';
      var q = searchQ.trim().toLowerCase();
      var list = GAMES.filter(function (g) {
        if (diffFilter === 'very-easy' && !g.isVeryEasy) return false;
        if (diffFilter === 'easy' && g.isVeryEasy) return false;
        if (famFilter !== 'all' && g.familyName !== famFilter) return false;
        if (
          q &&
          g.name.toLowerCase().indexOf(q) === -1 &&
          String(g.id).indexOf(q) === -1 &&
          g.themeLabel.toLowerCase().indexOf(q) === -1
        ) {
          return false;
        }
        return true;
      });

      if (!list.length) {
        var empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'Tidak ada mini game yang cocok dengan pencarianmu.';
        gamesGrid.appendChild(empty);
        return;
      }

      list.forEach(function (g) {
        var isDone = Boolean(completedGames['g' + g.id]);
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'game-card' + (isDone ? ' done' : '');

        var ic = document.createElement('span');
        ic.className = 'game-icon';
        ic.textContent = g.icon;

        var nm = document.createElement('div');
        nm.className = 'game-name';
        nm.textContent = g.name;

        var meta = document.createElement('div');
        meta.className = 'game-meta';
        meta.textContent = '#' + g.id + ' · ' + (g.isVeryEasy ? 'Sangat Mudah' : 'Mudah') + ' · ' + g.points + 'p';

        card.appendChild(ic);
        card.appendChild(nm);
        card.appendChild(meta);

        if (isDone) {
          var badge = document.createElement('div');
          badge.className = 'game-done-badge';
          badge.textContent = '✓ Selesai';
          card.appendChild(badge);
        }

        card.addEventListener('click', function () {
          openGameModal(g);
        });
        gamesGrid.appendChild(card);
      });
    }

    /* ===== Mini Game Engine Runner & Timer Cleanup ===== */
    var activeTimers = [];

    function registerTimer(id) {
      activeTimers.push(id);
      return id;
    }

    function clearTimers() {
      activeTimers.forEach(function (id) {
        window.clearTimeout(id);
      });
      activeTimers = [];
    }

    function closeGameModal() {
      clearTimers();
      modal.classList.add('hidden');
      modalBody.innerHTML = '';
    }

    function showResult(game, won, summary) {
      clearTimers();
      var info = won ? recordWin(game) : 'Belum berhasil mendapatkan poin. Coba lagi!';
      modalBody.innerHTML = '';

      var box = document.createElement('div');
      box.className = 'result-box';

      var icon = document.createElement('div');
      icon.className = 'result-icon';
      icon.textContent = won ? '🏆' : '💫';

      var heading = document.createElement('h4');
      heading.textContent = won ? 'Berhasil!' : 'Belum Berhasil';

      var pSum = document.createElement('p');
      pSum.className = 'result-summary';
      pSum.textContent = summary;

      var pInfo = document.createElement('p');
      pInfo.className = 'result-sub';
      pInfo.textContent = info;

      var actions = document.createElement('div');
      actions.className = 'result-actions';

      var btnAgain = document.createElement('button');
      btnAgain.type = 'button';
      btnAgain.className = 'btn-gold';
      btnAgain.textContent = '↻ Main Lagi';
      btnAgain.addEventListener('click', function () {
        openGameModal(game);
      });

      var btnBack = document.createElement('button');
      btnBack.type = 'button';
      btnBack.className = 'btn-outline';
      btnBack.textContent = 'Kembali';
      btnBack.addEventListener('click', closeGameModal);

      actions.appendChild(btnAgain);
      actions.appendChild(btnBack);

      box.appendChild(icon);
      box.appendChild(heading);
      box.appendChild(pSum);
      box.appendChild(pInfo);
      box.appendChild(actions);
      modalBody.appendChild(box);
    }

    function openGameModal(game) {
      clearTimers();
      modalTitle.textContent = game.icon + ' ' + game.name;
      modalMeta.textContent = '#' + game.id + ' · ' + (game.isVeryEasy ? 'Sangat Mudah' : 'Mudah') + ' · ' + game.points + ' Poin';
      modalBody.innerHTML = '';
      modal.classList.remove('hidden');

      switch (game.familyIndex) {
        case 0:
          runTapGame(game);
          break;
        case 1:
          runQuizGame(game, 'math');
          break;
        case 2:
          runSequenceGame(game);
          break;
        case 3:
          runGuessNumberGame(game);
          break;
        case 4:
          runOddOneOutGame(game);
          break;
        case 5:
          runQuizGame(game, 'count');
          break;
        case 6:
          runOrderNumbersGame(game);
          break;
        case 7:
          runMemoryPairsGame(game);
          break;
        case 8:
          runQuizGame(game, 'compare');
          break;
        case 9:
          runReflexGame(game);
          break;
      }
    }

    /* 0: Tap */
    function runTapGame(game) {
      var target = (game.isVeryEasy ? 5 : 10) + game.tierLevel * 2;
      var size = game.isVeryEasy ? 68 : 52;
      var count = 0;
      var start = Date.now();

      var bar = document.createElement('div');
      bar.className = 'engine-bar';
      bar.innerHTML = '<span>Tap ikon ' + game.icon + ' secepatnya</span>';
      var counter = document.createElement('span');
      counter.className = 'engine-mono';
      counter.textContent = '0 / ' + target;
      bar.appendChild(counter);

      var arena = document.createElement('div');
      arena.className = 'tap-arena';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tap-target';
      btn.style.width = size + 'px';
      btn.style.height = size + 'px';
      btn.textContent = game.icon;

      function moveBtn() {
        var w = Math.max(size + 16, arena.clientWidth || 320);
        var h = 280;
        btn.style.left = randInt(8, Math.max(8, w - size - 8)) + 'px';
        btn.style.top = randInt(8, Math.max(8, h - size - 8)) + 'px';
      }

      btn.addEventListener('click', function () {
        count += 1;
        counter.textContent = count + ' / ' + target;
        if (count >= target) {
          var elapsed = ((Date.now() - start) / 1000).toFixed(1);
          showResult(game, true, target + ' ketukan selesai dalam ' + elapsed + ' detik');
        } else {
          moveBtn();
        }
      });

      arena.appendChild(btn);
      modalBody.appendChild(bar);
      modalBody.appendChild(arena);
      moveBtn();
    }

    /* 1, 5, 8: Quiz Engine */
    function runQuizGame(game, mode) {
      var totalRounds = mode === 'compare' ? 6 : 5;
      var passThreshold = mode === 'compare' ? 4 : 3;
      var round = 1;
      var correct = 0;

      var bar = document.createElement('div');
      bar.className = 'engine-bar';
      var roundLabel = document.createElement('span');
      var scoreLabel = document.createElement('span');
      scoreLabel.className = 'engine-mono';
      bar.appendChild(roundLabel);
      bar.appendChild(scoreLabel);

      var promptBox = document.createElement('div');
      promptBox.className = 'quiz-prompt';
      var optRow = document.createElement('div');
      optRow.className = 'option-row';

      modalBody.appendChild(bar);
      modalBody.appendChild(promptBox);
      modalBody.appendChild(optRow);

      function nextQuestion() {
        roundLabel.textContent = 'Soal ' + round + '/' + totalRounds;
        scoreLabel.textContent = 'Benar: ' + correct;
        optRow.innerHTML = '';

        var q;
        if (mode === 'math') {
          var maxN = game.isVeryEasy ? 5 + game.tierLevel : 10 + game.tierLevel * 3;
          var a = randInt(1, maxN);
          var b = randInt(1, maxN);
          var op = game.isVeryEasy || game.tierLevel % 2 === 1 ? '+' : '-';
          if (op === '-' && a < b) {
            var tmp = a;
            a = b;
            b = tmp;
          }
          var ans = op === '+' ? a + b : a - b;
          q = { prompt: a + ' ' + op + ' ' + b + ' = ?', options: makeNumericOptions(ans, 3), answer: ans };
        } else if (mode === 'count') {
          var n = randInt(1, (game.isVeryEasy ? 3 : 5) + game.tierLevel);
          q = { prompt: game.icon.repeat(n), options: makeNumericOptions(n, 3), answer: n };
        } else {
          var maxV = game.isVeryEasy ? 15 : 100;
          var x = randInt(1, maxV);
          var y = randInt(1, maxV);
          while (y === x) y = randInt(1, maxV);
          q = { prompt: 'Mana yang lebih besar: ' + x + ' atau ' + y + '?', options: [x, y], answer: Math.max(x, y) };
        }

        promptBox.textContent = q.prompt;
        q.options.forEach(function (opt) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'option-btn';
          btn.textContent = String(opt);
          btn.addEventListener('click', function () {
            if (opt === q.answer) correct += 1;
            if (round >= totalRounds) {
              showResult(
                game,
                correct >= passThreshold,
                'Benar ' + correct + ' dari ' + totalRounds + ' soal (minimal ' + passThreshold + ' benar)'
              );
            } else {
              round += 1;
              nextQuestion();
            }
          });
          optRow.appendChild(btn);
        });
      }

      nextQuestion();
    }

    /* 2: Sequence Memory */
    function runSequenceGame(game) {
      var len = (game.isVeryEasy ? 2 : 4) + game.tierLevel;
      var tIdx = 0;
      for (var t = 0; t < THEMES.length; t++) {
        if (THEMES[t][0] === game.icon) {
          tIdx = t;
          break;
        }
      }
      var palette = [0, 1, 2, 3].map(function (i) {
        return THEMES[(tIdx + i) % 10][0];
      });
      var seq = Array.from({ length: len }, function () {
        return randInt(0, 3);
      });
      var phase = 'WATCH';
      var step = 0;

      var bar = document.createElement('div');
      bar.className = 'engine-bar';
      var msg = document.createElement('span');
      msg.textContent = 'Perhatikan urutan yang muncul...';
      var status = document.createElement('span');
      status.className = 'engine-mono';
      status.textContent = 'Menonton';
      bar.appendChild(msg);
      bar.appendChild(status);

      var stage = document.createElement('div');
      stage.className = 'seq-stage';
      stage.textContent = '·';

      var grid = document.createElement('div');
      grid.className = 'grid-4';

      var buttons = palette.map(function (ic, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cell-btn';
        btn.textContent = ic;
        btn.disabled = true;
        btn.addEventListener('click', function () {
          if (phase !== 'REPEAT') return;
          if (idx !== seq[step]) {
            showResult(game, false, 'Salah urutan pada langkah ke-' + (step + 1) + ' dari ' + len + '.');
            return;
          }
          step += 1;
          status.textContent = step + '/' + len;
          if (step >= len) {
            showResult(game, true, 'Semua ' + len + ' urutan berhasil diingat!');
          }
        });
        grid.appendChild(btn);
        return btn;
      });

      modalBody.appendChild(bar);
      modalBody.appendChild(stage);
      modalBody.appendChild(grid);

      seq.forEach(function (choice, i) {
        registerTimer(
          window.setTimeout(function () {
            stage.textContent = palette[choice];
          }, i * 850 + 250)
        );
        registerTimer(
          window.setTimeout(function () {
            stage.textContent = '·';
          }, i * 850 + 750)
        );
      });

      registerTimer(
        window.setTimeout(function () {
          phase = 'REPEAT';
          msg.textContent = 'Giliranmu! Ulangi urutannya';
          status.textContent = '0/' + len;
          stage.textContent = '👇';
          buttons.forEach(function (b) {
            b.disabled = false;
          });
        }, len * 850 + 300)
      );
    }

    /* 3: Guess Number */
    function runGuessNumberGame(game) {
      var maxN = game.isVeryEasy ? 10 + game.tierLevel * 5 : 30 + game.tierLevel * 10;
      var target = randInt(1, maxN);
      var attempts = 0;

      var p = document.createElement('p');
      p.innerHTML = 'Tebak angka rahasia antara <strong class="engine-mono">1</strong> sampai <strong class="engine-mono">' + maxN + '</strong>';

      var form = document.createElement('form');
      form.className = 'guess-form';
      var input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = String(maxN);
      input.className = 'guess-input';
      input.placeholder = '?';

      var btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = 'btn-gold';
      btn.textContent = 'Tebak';

      form.appendChild(input);
      form.appendChild(btn);

      var hint = document.createElement('p');
      hint.className = 'result-sub';
      hint.textContent = 'Masukkan angka antara 1 sampai ' + maxN + ' · Tebakan ke-0';

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var val = Number(input.value);
        if (!Number.isInteger(val) || val < 1 || val > maxN) {
          hint.textContent = 'Masukkan angka bulat antara 1 dan ' + maxN + '.';
          return;
        }
        attempts += 1;
        input.value = '';
        if (val === target) {
          showResult(game, true, 'Tepat! Angka ' + target + ' ditemukan dalam ' + attempts + ' tebakan.');
          return;
        }
        hint.textContent =
          (val < target ? val + ' terlalu kecil — coba lebih besar.' : val + ' terlalu besar — coba lebih kecil.') +
          ' · Tebakan ke-' +
          attempts;
      });

      modalBody.appendChild(p);
      modalBody.appendChild(form);
      modalBody.appendChild(hint);
      input.focus();
    }

    /* 4: Odd One Out */
    function runOddOneOutGame(game) {
      var totalRounds = 5;
      var gridSize = game.isVeryEasy ? 3 : 4;
      var tIdx = 0;
      for (var t = 0; t < THEMES.length; t++) {
        if (THEMES[t][0] === game.icon) {
          tIdx = t;
          break;
        }
      }
      var oddIcon = THEMES[(tIdx + randInt(1, 9)) % 10][0];
      var round = 1;
      var correct = 0;

      var bar = document.createElement('div');
      bar.className = 'engine-bar';
      var left = document.createElement('span');
      left.textContent = 'Cari satu ikon yang berbeda';
      var right = document.createElement('span');
      right.className = 'engine-mono';
      bar.appendChild(left);
      bar.appendChild(right);

      var grid = document.createElement('div');
      grid.className = gridSize === 3 ? 'grid-3' : 'grid-4';

      modalBody.appendChild(bar);
      modalBody.appendChild(grid);

      function renderRound() {
        right.textContent = 'Ronde ' + round + '/' + totalRounds + ' · Benar ' + correct;
        grid.innerHTML = '';
        var oddCell = randInt(0, gridSize * gridSize - 1);
        for (var i = 0; i < gridSize * gridSize; i++) {
          (function (idx) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'cell-btn';
            b.textContent = idx === oddCell ? oddIcon : game.icon;
            b.addEventListener('click', function () {
              if (idx === oddCell) correct += 1;
              if (round >= totalRounds) {
                showResult(
                  game,
                  correct >= 3,
                  'Benar ' + correct + ' dari ' + totalRounds + ' ronde (minimal 3 benar)'
                );
              } else {
                round += 1;
                renderRound();
              }
            });
            grid.appendChild(b);
          })(i);
        }
      }

      renderRound();
    }

    /* 6: Order Numbers */
    function runOrderNumbersGame(game) {
      var totalCount = (game.isVeryEasy ? 4 : 8) + game.tierLevel;
      var nums = shuffle(
        Array.from({ length: totalCount }, function (_, i) {
          return i + 1;
        })
      );
      var nextNum = 1;
      var start = Date.now();

      var bar = document.createElement('div');
      bar.className = 'engine-bar';
      var left = document.createElement('span');
      left.textContent = 'Tap angka berurutan mulai dari 1';
      var right = document.createElement('span');
      right.className = 'engine-mono';
      right.textContent = 'Berikutnya: 1 / ' + totalCount;
      bar.appendChild(left);
      bar.appendChild(right);

      var grid = document.createElement('div');
      grid.className = 'grid-4';

      nums.forEach(function (num) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cell-btn';
        b.style.fontFamily = '"JetBrains Mono", monospace';
        b.style.fontSize = '18px';
        b.textContent = String(num);
        b.addEventListener('click', function () {
          if (num !== nextNum) {
            b.classList.add('wrong');
            registerTimer(
              window.setTimeout(function () {
                b.classList.remove('wrong');
              }, 350)
            );
            return;
          }
          b.classList.add('cleared');
          b.disabled = true;
          if (num === totalCount) {
            var elapsed = ((Date.now() - start) / 1000).toFixed(1);
            showResult(game, true, 'Angka 1 sampai ' + totalCount + ' selesai dalam ' + elapsed + ' detik');
          } else {
            nextNum += 1;
            right.textContent = 'Berikutnya: ' + nextNum + ' / ' + totalCount;
          }
        });
        grid.appendChild(b);
      });

      modalBody.appendChild(bar);
      modalBody.appendChild(grid);
    }

    /* 7: Memory Pairs */
    function runMemoryPairsGame(game) {
      var pairs = (game.isVeryEasy ? 2 : 4) + Math.floor(game.tierLevel / 2);
      var icons = shuffle(
        THEMES.map(function (t) {
          return t[0];
        })
      ).slice(0, pairs);
      var deck = shuffle(icons.concat(icons));
      var flipped = [];
      var matched = [];
      var locked = false;
      var moves = 0;

      var bar = document.createElement('div');
      bar.className = 'engine-bar';
      var left = document.createElement('span');
      left.textContent = 'Cocokkan semua pasangan kartu';
      var right = document.createElement('span');
      right.className = 'engine-mono';
      right.textContent = 'Langkah: 0 · 0/' + pairs;
      bar.appendChild(left);
      bar.appendChild(right);

      var grid = document.createElement('div');
      grid.className = 'grid-4';

      var cards = deck.map(function (icon, idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cell-btn';
        b.textContent = '✦';

        b.addEventListener('click', function () {
          if (locked || flipped.indexOf(idx) !== -1 || matched.indexOf(idx) !== -1) return;
          flipped.push(idx);
          b.classList.add('open');
          b.textContent = icon;

          if (flipped.length < 2) return;
          moves += 1;
          var a = flipped[0];
          var c = flipped[1];
          if (deck[a] === deck[c]) {
            matched.push(a, c);
            cards[a].classList.remove('open');
            cards[c].classList.remove('open');
            cards[a].classList.add('matched');
            cards[c].classList.add('matched');
            cards[a].disabled = true;
            cards[c].disabled = true;
            flipped = [];
            right.textContent = 'Langkah: ' + moves + ' · ' + matched.length / 2 + '/' + pairs;
            if (matched.length === deck.length) {
              showResult(game, true, 'Semua ' + pairs + ' pasangan ditemukan dalam ' + moves + ' langkah');
            }
          } else {
            locked = true;
            right.textContent = 'Langkah: ' + moves + ' · ' + matched.length / 2 + '/' + pairs;
            registerTimer(
              window.setTimeout(function () {
                cards[a].classList.remove('open');
                cards[c].classList.remove('open');
                cards[a].textContent = '✦';
                cards[c].textContent = '✦';
                flipped = [];
                locked = false;
              }, 650)
            );
          }
        });

        grid.appendChild(b);
        return b;
      });

      modalBody.appendChild(bar);
      modalBody.appendChild(grid);
    }

    /* 9: Reflex */
    function runReflexGame(game) {
      var totalRounds = 3;
      var round = 1;
      var totalMs = 0;
      var phase = 'WAIT';
      var readyAt = 0;

      var bar = document.createElement('div');
      bar.className = 'engine-bar';
      var left = document.createElement('span');
      left.textContent = 'Tunggu warna hijau lalu tap secepatnya';
      var right = document.createElement('span');
      right.className = 'engine-mono';
      bar.appendChild(left);
      bar.appendChild(right);

      var pad = document.createElement('button');
      pad.type = 'button';
      pad.className = 'reflex-pad';

      function schedule() {
        clearTimers();
        phase = 'WAIT';
        right.textContent = 'Ronde ' + round + '/' + totalRounds;
        pad.className = 'reflex-pad';
        pad.textContent = 'Tunggu hijau...';
        var delay = randInt(900, (game.isVeryEasy ? 2000 : 2800) + game.tierLevel * 250);
        registerTimer(
          window.setTimeout(function () {
            phase = 'READY';
            readyAt = Date.now();
            pad.className = 'reflex-pad ready';
            pad.textContent = 'TAP SEKARANG!';
          }, delay)
        );
      }

      pad.addEventListener('click', function () {
        if (phase === 'EARLY') return;
        if (phase === 'WAIT') {
          clearTimers();
          phase = 'EARLY';
          pad.className = 'reflex-pad early';
          pad.textContent = 'Terlalu cepat! Mengulang ronde...';
          registerTimer(
            window.setTimeout(function () {
              schedule();
            }, 900)
          );
          return;
        }
        var diff = Date.now() - readyAt;
        totalMs += diff;
        if (round >= totalRounds) {
          var avg = Math.round(totalMs / totalRounds);
          showResult(game, true, 'Rata-rata waktu refleks: ' + avg + ' ms');
        } else {
          round += 1;
          schedule();
        }
      });

      modalBody.appendChild(bar);
      modalBody.appendChild(pad);
      schedule();
    }

    /* Event Listeners */
    playerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var cleaned = sanitizeName(playerInput.value);
      if (!cleaned) {
        playerNotice.textContent = 'Masukkan nama anggota guild yang valid.';
        return;
      }
      playerName = cleaned;
      playerInput.value = cleaned;
      try {
        localStorage.setItem(KEY_PLAYER, cleaned);
      } catch (err) {}
      playerNotice.textContent = 'Profil aktif: ' + cleaned;
    });

    document.querySelectorAll('.seg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        diffFilter = btn.getAttribute('data-diff') || 'all';
        document.querySelectorAll('.seg-btn').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        renderGamesGrid();
      });
    });

    familySelect.addEventListener('change', function () {
      famFilter = familySelect.value;
      renderGamesGrid();
    });

    searchInput.addEventListener('input', function () {
      searchQ = searchInput.value;
      renderGamesGrid();
    });

    var randomBtn = document.getElementById('btn-random-game');
    if (randomBtn) {
      randomBtn.addEventListener('click', function () {
        var unplayed = GAMES.filter(function (g) {
          return !completedGames['g' + g.id];
        });
        var pool = unplayed.length ? unplayed : GAMES;
        var pick = pool[Math.floor(Math.random() * pool.length)];
        if (pick) openGameModal(pick);
      });
    }

    modalClose.addEventListener('click', closeGameModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeGameModal();
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeGameModal();
      }
    });

    renderStats();
    renderLeaderboard();
    renderGamesGrid();
  });
})();
