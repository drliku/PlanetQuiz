(() => {
  "use strict";

  const TOP_SCORES = 5;
  const MAZES_PER_RUN = 3;
  const SCORES_KEY = (l) => "neuronmaze.scores." + l;
  const LEVEL_KEY = "neuronmaze.level";
  const SOUND_KEY = "neuronmaze.sound";

  // Kahoot-style: reaching the brain instantly is worth 1000, dropping to 500 at
  // the time limit. If the signal fades before it gets there, the maze scores 0.
  const MAX_POINTS = 1000;
  const SPARK_POINTS = 100;
  const SPARK_SECONDS = 3;
  const SPARKS_PER_MAZE = 3;
  const STEP_MS = 75;

  const LEVELS = {
    easy:   { label: "Easy",   cols: 7,  rows: 5, seconds: 20 },
    medium: { label: "Medium", cols: 10, rows: 7, seconds: 28 },
    hard:   { label: "Hard",   cols: 13, rows: 9, seconds: 38 },
  };

  // Wall bits per cell, with the step and the opposite wall for each direction.
  const DIRS = {
    N: { dx: 0, dy: -1, bit: 1, opp: 4 },
    E: { dx: 1, dy: 0, bit: 2, opp: 8 },
    S: { dx: 0, dy: 1, bit: 4, opp: 1 },
    W: { dx: -1, dy: 0, bit: 8, opp: 2 },
  };

  const COLORS = {
    wall: "#6c86a6", trail: "#f2d45c", signal: "#d4877e", brain: "#f3dcd6", brainLine: "#d9b3aa", spark: "#f2d45c",
  };

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const rand = (n) => Math.floor(Math.random() * n);

  // ---------- sound ----------
  let soundOn = store.get(SOUND_KEY, "1") === "1";
  let actx = null;
  function tone(freq, dur = 0.12, type = "sine", vol = 0.15, delay = 0) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime + delay;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch { /* audio unavailable */ }
  }
  const sfx = {
    click: () => tone(520, 0.06, "triangle", 0.08),
    step: () => tone(300 + rand(60), 0.03, "triangle", 0.035),
    bump: () => tone(120, 0.06, "square", 0.04),
    spark: () => { tone(1320, 0.08, "triangle", 0.1); tone(1760, 0.12, "triangle", 0.1, 0.06); },
    beat: () => { tone(90, 0.08, "sine", 0.25); tone(80, 0.1, "sine", 0.2, 0.14); },
    goal: () => [0, 4, 7, 12].forEach((s, i) => tone(523 * Math.pow(2, s / 12), 0.16, "triangle", 0.13, i * 0.07)),
    fade: () => [0, -3, -7, -12].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.22, "sawtooth", 0.06, i * 0.12)),
    go: () => { tone(660, 0.1, "square", 0.06); tone(990, 0.16, "square", 0.06, 0.1); },
    win: () => [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.2, "triangle", 0.12, i * 0.08)),
  };

  // ---------- confetti ----------
  const confCanvas = $("confetti");
  const cctx = confCanvas.getContext("2d");
  let confetti = [];
  let confRunning = false;
  function resizeConfetti() {
    const dpr = window.devicePixelRatio || 1;
    confCanvas.width = innerWidth * dpr;
    confCanvas.height = innerHeight * dpr;
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const CONF_COLORS = ["#d4877e", "#f2d45c", "#6c86a6", "#353e5c", "#f3dcd6"];
  function burst(x, y, count = 30, power = 8) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const v = Math.random() * power + 2;
      confetti.push({
        x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - power * 0.5,
        w: Math.random() * 8 + 4, h: Math.random() * 5 + 3,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
        c: CONF_COLORS[rand(CONF_COLORS.length)], life: 1,
      });
    }
    if (!confRunning) { confRunning = true; requestAnimationFrame(drawConfetti); }
  }
  function drawConfetti() {
    cctx.clearRect(0, 0, innerWidth, innerHeight);
    confetti = confetti.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of confetti) {
      p.vy += 0.28; p.vx *= 0.985;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.006;
      cctx.save();
      cctx.globalAlpha = Math.max(p.life, 0);
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot);
      cctx.fillStyle = p.c;
      cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cctx.restore();
    }
    if (confetti.length) requestAnimationFrame(drawConfetti);
    else { confRunning = false; cctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  // ---------- maze ----------
  // Recursive backtracker: long winding corridors, exactly one route between any two cells.
  function makeMaze(cols, rows) {
    const cells = new Array(cols * rows).fill(15);
    const seen = new Uint8Array(cols * rows);
    const stack = [rand(cols * rows)];
    seen[stack[0]] = 1;
    while (stack.length) {
      const i = stack[stack.length - 1];
      const x = i % cols, y = (i / cols) | 0;
      const options = [];
      for (const k in DIRS) {
        const d = DIRS[k];
        const nx = x + d.dx, ny = y + d.dy;
        if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny * cols + nx]) options.push([d, ny * cols + nx]);
      }
      if (!options.length) { stack.pop(); continue; }
      const [d, n] = options[rand(options.length)];
      cells[i] &= ~d.bit;
      cells[n] &= ~d.opp;
      seen[n] = 1;
      stack.push(n);
    }
    return {
      cols, rows, cells,
      start: { x: 0, y: rows - 1 },
      goal: { x: cols - 1, y: 0 },
    };
  }
  function canMove(m, x, y, dir) {
    const d = DIRS[dir];
    const nx = x + d.dx, ny = y + d.dy;
    return nx >= 0 && ny >= 0 && nx < m.cols && ny < m.rows && !(m.cells[y * m.cols + x] & d.bit);
  }
  function openings(m, x, y) { return Object.keys(DIRS).filter((k) => canMove(m, x, y, k)); }
  function solve(m) {
    const prev = new Int32Array(m.cols * m.rows).fill(-1);
    const startI = m.start.y * m.cols + m.start.x;
    const goalI = m.goal.y * m.cols + m.goal.x;
    const q = [startI];
    prev[startI] = startI;
    while (q.length) {
      const i = q.shift();
      if (i === goalI) break;
      const x = i % m.cols, y = (i / m.cols) | 0;
      for (const k of openings(m, x, y)) {
        const n = (y + DIRS[k].dy) * m.cols + x + DIRS[k].dx;
        if (prev[n] === -1) { prev[n] = i; q.push(n); }
      }
    }
    const path = [];
    for (let i = goalI; ; i = prev[i]) {
      path.unshift({ x: i % m.cols, y: (i / m.cols) | 0 });
      if (i === startI) break;
    }
    return path;
  }

  // ---------- drawing ----------
  function fitCanvas(canvas, m, maxW) {
    const pad = 10;
    const cell = Math.max(16, Math.floor((maxW - pad * 2) / m.cols));
    const w = cell * m.cols + pad * 2;
    const h = cell * m.rows + pad * 2;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, cell, pad, w, h };
  }

  function drawBrain(ctx, cx, cy, r, t) {
    const s = 1 + Math.sin(t / 300) * 0.05;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.shadowColor = "rgba(243,220,214,.8)";
    ctx.shadowBlur = r * 0.9;
    ctx.fillStyle = COLORS.brain;
    const lobes = [[-0.45, 0.05, 0.55], [0.45, 0.05, 0.55], [-0.2, -0.3, 0.5], [0.25, -0.3, 0.5], [0, 0.25, 0.5]];
    for (const [x, y, rr] of lobes) { ctx.beginPath(); ctx.arc(x * r, y * r, rr * r, 0, Math.PI * 2); ctx.fill(); }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = COLORS.brainLine;
    ctx.lineWidth = Math.max(1.5, r * 0.09);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6); ctx.quadraticCurveTo(r * 0.15, -r * 0.1, 0, r * 0.5);
    ctx.moveTo(-r * 0.55, -r * 0.1); ctx.quadraticCurveTo(-r * 0.3, r * 0.05, -r * 0.5, r * 0.3);
    ctx.moveTo(r * 0.55, -r * 0.1); ctx.quadraticCurveTo(r * 0.3, r * 0.05, r * 0.5, r * 0.3);
    ctx.stroke();
    ctx.restore();
  }

  function drawSpark(ctx, cx, cy, r, t) {
    const s = 0.8 + Math.sin(t / 180 + cx) * 0.2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t / 900);
    ctx.scale(s, s);
    ctx.shadowColor = COLORS.spark;
    ctx.shadowBlur = r * 1.2;
    ctx.fillStyle = COLORS.spark;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rr = i % 2 ? r * 0.35 : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // view: { m, ctx, cell, pad, w, h, trail, pos {x,y}, sparks, strength, t, burstAt }
  function drawScene(v) {
    const { ctx, cell, pad, m, t } = v;
    const cx = (x) => pad + x * cell + cell / 2;
    const cy = (y) => pad + y * cell + cell / 2;
    ctx.clearRect(0, 0, v.w, v.h);

    // Walls
    ctx.strokeStyle = COLORS.wall;
    ctx.lineWidth = Math.max(3, cell * 0.13);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let y = 0; y < m.rows; y++) {
      for (let x = 0; x < m.cols; x++) {
        const c = m.cells[y * m.cols + x];
        const x0 = pad + x * cell, y0 = pad + y * cell;
        if (c & 1) { ctx.moveTo(x0, y0); ctx.lineTo(x0 + cell, y0); }
        if (c & 8) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + cell); }
        if (x === m.cols - 1 && c & 2) { ctx.moveTo(x0 + cell, y0); ctx.lineTo(x0 + cell, y0 + cell); }
        if (y === m.rows - 1 && c & 4) { ctx.moveTo(x0, y0 + cell); ctx.lineTo(x0 + cell, y0 + cell); }
      }
    }
    ctx.stroke();

    // Sparks
    for (const s of v.sparks) if (!s.got) drawSpark(ctx, cx(s.x), cy(s.y), cell * 0.22, t);

    // Brain
    drawBrain(ctx, cx(m.goal.x), cy(m.goal.y), cell * 0.36, t);

    // Trail: the route back to the start, dashed like the reference art
    if (v.trail.length) {
      ctx.save();
      ctx.strokeStyle = COLORS.trail;
      ctx.lineWidth = Math.max(2.5, cell * 0.09);
      ctx.setLineDash([cell * 0.16, cell * 0.14]);
      ctx.lineDashOffset = -t / 40;
      ctx.beginPath();
      v.trail.forEach((p, i) => (i ? ctx.lineTo(cx(p.x), cy(p.y)) : ctx.moveTo(cx(p.x), cy(p.y))));
      ctx.lineTo(cx(v.pos.x), cy(v.pos.y));
      ctx.stroke();
      ctx.restore();
    }

    // Signal: glow pulses and dims as the signal fades
    const px = cx(v.pos.x), py = cy(v.pos.y);
    const str = Math.max(0, Math.min(1, v.strength));
    const r = cell * 0.27;
    const pulse = 1 + Math.sin(t / (str < 0.25 ? 90 : 220)) * 0.15;
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.35 * str;
    ctx.fillStyle = COLORS.signal;
    ctx.beginPath(); ctx.arc(px, py, r * 1.7 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.45 + 0.55 * str;
    ctx.shadowColor = COLORS.signal;
    ctx.shadowBlur = cell * 0.5 * str;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Ripple when something is collected
    if (v.ripple) {
      const k = (t - v.ripple.t) / 500;
      if (k < 1) {
        ctx.save();
        ctx.strokeStyle = v.ripple.color;
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx(v.ripple.x), cy(v.ripple.y), cell * (0.3 + k), 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      } else v.ripple = null;
    }
  }

  // ---------- hero demo: a signal solving a maze on loop ----------
  const hero = { canvas: $("hero"), m: null, path: [], i: 0, at: 0, view: null };
  function heroReset() {
    hero.m = makeMaze(8, 4);
    hero.path = solve(hero.m);
    hero.i = 0;
    hero.at = performance.now();
    const maxW = Math.min(hero.canvas.parentElement.clientWidth - 28, 420);
    hero.view = { ...fitCanvas(hero.canvas, hero.m, maxW), m: hero.m, trail: [hero.path[0]], pos: { ...hero.path[0] }, sparks: [], strength: 1, t: 0 };
  }
  function heroFrame(now) {
    if ($("screen-home").classList.contains("active") && hero.view) {
      const stepMs = 170;
      const k = Math.max(0, now - hero.at) / stepMs;
      const i = Math.floor(k);
      if (i >= hero.path.length + 6) heroReset();
      else {
        const a = hero.path[Math.min(i, hero.path.length - 1)];
        const b = hero.path[Math.min(i + 1, hero.path.length - 1)];
        const f = k - i;
        hero.view.trail = hero.path.slice(0, Math.min(i, hero.path.length - 1) + 1);
        hero.view.pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
        hero.view.t = now;
        drawScene(hero.view);
      }
    }
    requestAnimationFrame(heroFrame);
  }

  // ---------- screens ----------
  function show(name) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $("screen-" + name).classList.add("active");
    window.scrollTo(0, 0);
  }

  // ---------- best scores ----------
  function getScores(level) {
    try {
      const list = JSON.parse(store.get(SCORES_KEY(level), "[]"));
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function addScore(level, entry) {
    const list = getScores(level);
    list.push(entry);
    list.sort((a, b) => b.points - a.points || a.time - b.time || a.t - b.t);
    const top = list.slice(0, TOP_SCORES);
    store.set(SCORES_KEY(level), JSON.stringify(top));
    return top.indexOf(entry) + 1;
  }
  function renderScores(highlightT) {
    $("scores-mode").textContent = LEVELS[state.level].label;
    const ol = $("score-list");
    ol.innerHTML = "";
    const list = getScores(state.level);
    if (!list.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No scores yet. Press Start to set one!";
      ol.appendChild(li);
      return;
    }
    for (const s of list) {
      const li = document.createElement("li");
      if (s.t === highlightT) li.className = "fresh";
      li.innerHTML = `<span class="meta">${s.cleared}/${MAZES_PER_RUN} mazes · ${fmtTime(s.time)}</span><span class="pts">${s.points.toLocaleString()}</span>`;
      ol.appendChild(li);
    }
  }

  // ---------- game state ----------
  const savedLevel = store.get(LEVEL_KEY, "easy");
  const state = {
    level: LEVELS[savedLevel] ? savedLevel : "easy",
    phase: "idle",           // idle | intro | play | between
    mazeIndex: 0, points: 0, cleared: 0, sparks: 0, totalTime: 0,
    m: null, view: null, player: { x: 0, y: 0 }, anim: null,
    held: null, queued: null, dash: null,
    startAt: 0, deadline: 0, lastBeat: 0, timers: [], lastT: 0,
  };
  const cfg = () => LEVELS[state.level];

  function setLevel(level) {
    state.level = level;
    store.set(LEVEL_KEY, level);
    document.querySelectorAll(".level").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.level === level)));
    renderScores();
  }

  function later(fn, ms) { state.timers.push(setTimeout(fn, ms)); }
  function clearTimers() { state.timers.forEach(clearTimeout); state.timers = []; }

  function startGame() {
    sfx.click();
    clearTimers();
    Object.assign(state, { mazeIndex: 0, points: 0, cleared: 0, sparks: 0, totalTime: 0 });
    $("score").textContent = "0";
    $("sparks").textContent = "0";
    $("maze-total").textContent = MAZES_PER_RUN;
    show("game");
    loadMaze();
  }

  function loadMaze() {
    const c = cfg();
    const m = makeMaze(c.cols, c.rows);
    state.m = m;
    state.player = { ...m.start };
    state.anim = null;
    state.held = state.queued = state.dash = null;

    // Sparks sit on random cells away from the start and the brain.
    const sparks = [];
    while (sparks.length < SPARKS_PER_MAZE) {
      const x = rand(c.cols), y = rand(c.rows);
      const nearStart = x + (c.rows - 1 - y) < 2;
      const atGoal = x === m.goal.x && y === m.goal.y;
      if (!nearStart && !atGoal && !sparks.some((s) => s.x === x && s.y === y)) sparks.push({ x, y, got: false });
    }

    const wrap = $("maze-wrap");
    const maxW = Math.min(wrap.clientWidth - 20, 580);
    state.view = { ...fitCanvas($("maze"), m, maxW), m, trail: [{ ...m.start }], pos: { ...m.start }, sparks, strength: 1, t: 0, ripple: null };
    $("maze-num").textContent = state.mazeIndex + 1;
    paintSignal(1, MAX_POINTS);

    state.phase = "intro";
    overlay(`Maze ${state.mazeIndex + 1} of ${MAZES_PER_RUN}<small>Get the signal to the brain!</small>`);
    later(() => overlay("Ready…"), 900);
    later(() => {
      overlay(null);
      sfx.go();
      state.phase = "play";
      state.startAt = performance.now();
      state.deadline = state.startAt + c.seconds * 1000;
    }, 1500);
  }

  function overlay(html) {
    const el = $("overlay");
    if (!html) { el.hidden = true; return; }
    el.innerHTML = html;
    el.hidden = false;
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  }

  function speedPoints(now) {
    const k = Math.min(Math.max((now - state.startAt) / (cfg().seconds * 1000), 0), 1);
    return Math.round(MAX_POINTS * (1 - k / 2));
  }

  function paintSignal(strength, pts) {
    $("signal-fill").style.width = Math.max(0, Math.min(1, strength)) * 100 + "%";
    $("worth").textContent = pts;
    $("signal").classList.toggle("low", strength < 0.25);
  }

  // ---------- movement ----------
  function tryStep(dir, now) {
    const m = state.m;
    const { x, y } = state.player;
    if (!canMove(m, x, y, dir)) {
      if (!state.dash) { sfx.bump(); }
      state.dash = null;
      return false;
    }
    const d = DIRS[dir];
    const to = { x: x + d.dx, y: y + d.dy };
    state.anim = { from: { x, y }, to, start: now, dir };
    state.player = to;
    sfx.step();
    // Keep a clean route: stepping back onto the previous cell rewinds the trail.
    const trail = state.view.trail;
    const prev = trail[trail.length - 2];
    if (prev && prev.x === to.x && prev.y === to.y) trail.pop();
    else trail.push(to);
    return true;
  }

  function arrive(now) {
    const { x, y } = state.player;
    const v = state.view;
    for (const s of v.sparks) {
      if (!s.got && s.x === x && s.y === y) {
        s.got = true;
        state.sparks++;
        state.points += SPARK_POINTS;
        state.deadline += SPARK_SECONDS * 1000;
        $("sparks").textContent = state.sparks;
        bump($("score"), state.points.toLocaleString());
        v.ripple = { x, y, t: now, color: COLORS.spark };
        sfx.spark();
        floatText(`+${SPARK_SECONDS}s  +${SPARK_POINTS}`, x, y);
      }
    }
    if (x === state.m.goal.x && y === state.m.goal.y) finishMaze(true, now);
  }

  // A dash keeps going down a corridor until it reaches a junction, a dead end or the brain.
  function continueDash() {
    if (!state.dash) return null;
    const { x, y } = state.player;
    const open = openings(state.m, x, y);
    const atGoal = x === state.m.goal.x && y === state.m.goal.y;
    if (atGoal || open.length !== 2 || !open.includes(state.dash)) { state.dash = null; return null; }
    return state.dash;
  }

  function frame(now) {
    if (state.view && $("screen-game").classList.contains("active")) {
      const v = state.view;
      if (state.phase === "play") {
        // Movement
        if (state.anim && now - state.anim.start >= STEP_MS) {
          state.anim = null;
          arrive(now);
        }
        if (!state.anim && state.phase === "play") {
          const dir = state.queued || continueDash() || state.held;
          state.queued = null;
          if (dir) tryStep(dir, now);
        }
        // Signal strength and points
        const left = state.deadline - now;
        const strength = left / (cfg().seconds * 1000);
        if (state.phase === "play") {
          paintSignal(strength, speedPoints(now));
          if (strength < 0.25 && now - state.lastBeat > 700) { state.lastBeat = now; sfx.beat(); }
          if (left <= 0) finishMaze(false, now);
        }
        v.strength = strength;
      }
      // Draw the signal between cells while it moves
      if (state.anim) {
        const f = Math.min((now - state.anim.start) / STEP_MS, 1);
        const { from, to } = state.anim;
        v.pos = { x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f };
      } else v.pos = { ...state.player };
      v.t = now;
      drawScene(v);
    }
    requestAnimationFrame(frame);
  }

  function finishMaze(reached, now) {
    state.phase = "between";
    state.anim = null;
    state.held = state.queued = state.dash = null;
    const used = Math.min(now - state.startAt, cfg().seconds * 1000 + 60000) / 1000;
    state.totalTime += used;
    if (reached) {
      const pts = speedPoints(now);
      state.points += pts;
      state.cleared++;
      bump($("score"), state.points.toLocaleString());
      sfx.goal();
      const word = pts >= 900 ? "⚡ Lightning fast!" : pts >= 750 ? "Quick thinking!" : "Signal received!";
      overlay(`🧠 +${pts}<small>${word}</small>`);
      const r = $("maze").getBoundingClientRect();
      burst(r.right - r.width * 0.1, r.top + r.height * 0.15, 60, 10);
    } else {
      sfx.fade();
      $("maze-wrap").classList.remove("shake"); void $("maze-wrap").offsetWidth; $("maze-wrap").classList.add("shake");
      overlay(`Signal faded…<small>No points for this maze</small>`);
    }
    later(() => {
      state.mazeIndex++;
      if (state.mazeIndex >= MAZES_PER_RUN) endGame();
      else loadMaze();
    }, 1600);
  }

  function floatText(text, x, y) {
    const v = state.view;
    const wrap = $("maze-wrap");
    const canvas = $("maze");
    const f = document.createElement("div");
    f.className = "floater";
    f.textContent = text;
    f.style.left = canvas.offsetLeft + v.pad + x * v.cell + v.cell / 2 + "px";
    f.style.top = canvas.offsetTop + v.pad + y * v.cell + "px";
    wrap.appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }

  function bump(el, value) {
    el.textContent = value;
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  }

  function endGame() {
    clearTimers();
    state.phase = "idle";
    overlay(null);
    const c = cfg();
    const entry = { points: state.points, cleared: state.cleared, time: Math.round(state.totalTime), t: Date.now() };
    const place = state.points > 0 ? addScore(state.level, entry) : 0;
    state.lastT = place ? entry.t : 0;

    const ratio = state.points / (MAZES_PER_RUN * MAX_POINTS);
    const stars = ratio >= 0.85 ? 3 : ratio >= 0.65 ? 2 : state.cleared > 0 ? 1 : 0;
    [...$("stars").children].forEach((s, i) => s.classList.toggle("on", i < stars));
    $("rank-title").textContent = ["Signal Lost", "Neuron Novice", "Synapse Sprinter", "Brain Boss"][stars];
    $("rank-sub").textContent = c.label;
    $("new-best").hidden = place !== 1;
    $("placed").textContent = place > 1 ? `You placed #${place} on the best scores!` : "";
    $("stat-cleared").textContent = `${state.cleared}/${MAZES_PER_RUN}`;
    $("stat-sparks").textContent = state.sparks;
    $("stat-time").textContent = fmtTime(state.totalTime);
    $("final-score").textContent = "0";

    show("results");
    renderScores(state.lastT);

    const el = $("final-score");
    const start = performance.now();
    (function step(now) {
      const k = Math.min((now - start) / 1200, 1);
      el.textContent = Math.round(state.points * (1 - Math.pow(1 - k, 3))).toLocaleString();
      if (k < 1) requestAnimationFrame(step);
    })(start);

    if (stars > 0) {
      sfx.win();
      const fire = (i) => {
        burst(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.15 + Math.random() * 0.3), 60, 11);
        if (i < stars) setTimeout(() => fire(i + 1), 280);
      };
      fire(0);
    }
  }

  function goHome() {
    clearTimers();
    state.phase = "idle";
    overlay(null);
    sfx.click();
    renderScores(state.lastT);
    show("home");
    heroReset();
  }

  // ---------- input ----------
  const KEYS = {
    ArrowUp: "N", ArrowRight: "E", ArrowDown: "S", ArrowLeft: "W",
    w: "N", d: "E", s: "S", a: "W", W: "N", D: "E", S: "S", A: "W",
  };
  document.addEventListener("keydown", (e) => {
    if (!$("screen-game").classList.contains("active")) return;
    if (e.key === "Escape") return goHome();
    const dir = KEYS[e.key];
    if (!dir) return;
    e.preventDefault();
    if (state.phase !== "play") return;
    state.dash = null;
    if (!e.repeat) state.queued = dir;
    state.held = dir;
  });
  document.addEventListener("keyup", (e) => {
    if (KEYS[e.key] && state.held === KEYS[e.key]) state.held = null;
  });
  addEventListener("blur", () => { state.held = null; });

  // On-screen pad: tap to step, hold to keep moving.
  document.querySelectorAll(".pad").forEach((b) => {
    const dir = b.dataset.dir;
    const release = () => { b.classList.remove("held"); if (state.held === dir) state.held = null; };
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      b.classList.add("held");
      if (state.phase !== "play") return;
      state.dash = null;
      state.queued = dir;
      state.held = dir;
    });
    b.addEventListener("pointerup", release);
    b.addEventListener("pointercancel", release);
  });

  // Swipe on the maze: dash down the corridor.
  let swipe = null;
  const mazeWrap = $("maze-wrap");
  mazeWrap.addEventListener("pointerdown", (e) => { swipe = { x: e.clientX, y: e.clientY }; });
  mazeWrap.addEventListener("pointerup", (e) => {
    if (!swipe || state.phase !== "play") { swipe = null; return; }
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "E" : "W") : (dy > 0 ? "S" : "N");
    state.queued = dir;
    state.dash = dir;
  });

  // ---------- wire up ----------
  $("btn-play").addEventListener("click", startGame);
  $("btn-again").addEventListener("click", startGame);
  $("btn-home").addEventListener("click", goHome);
  $("btn-quit").addEventListener("click", goHome);
  document.querySelectorAll(".level").forEach((b) =>
    b.addEventListener("click", () => { sfx.click(); setLevel(b.dataset.level); })
  );

  const soundBtn = $("sound-btn");
  const paintSound = () => {
    soundBtn.textContent = soundOn ? "🔊" : "🔇";
    soundBtn.setAttribute("aria-pressed", String(soundOn));
  };
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    store.set(SOUND_KEY, soundOn ? "1" : "0");
    paintSound();
    sfx.click();
  });

  addEventListener("resize", () => {
    resizeConfetti();
    if ($("screen-home").classList.contains("active")) heroReset();
  });
  resizeConfetti();
  paintSound();
  setLevel(state.level);
  heroReset();
  requestAnimationFrame(heroFrame);
  requestAnimationFrame(frame);
})();
