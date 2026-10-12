(() => {
  "use strict";

  const QUESTIONS_PER_ROUND = 10;
  const SECONDS_PER_QUESTION = 15;
  const BEST_KEY = "planetquiz.best";
  const SOUND_KEY = "planetquiz.sound";

  // Planet looks used for the floating planet above each question.
  const LOOKS = {
    mercury: { c1: "#c9c3bb", c2: "#7d7770" },
    venus:   { c1: "#ffe2a6", c2: "#d29a4c" },
    earth:   { c1: "#7fd3ff", c2: "#2462b5" },
    mars:    { c1: "#ff9a6b", c2: "#b23f1f" },
    jupiter: { c1: "#f4d2a2", c2: "#b9784a" },
    saturn:  { c1: "#fbe6b0", c2: "#c99b55", ring: true },
    uranus:  { c1: "#b8f3f3", c2: "#4fb3c2", ring: true },
    neptune: { c1: "#8fb2ff", c2: "#2d47b8" },
    sun:     { c1: "#fff3a0", c2: "#ff8a1e" },
    moon:    { c1: "#f1f1f1", c2: "#8a8a92" },
    pluto:   { c1: "#f0d9c4", c2: "#9b7a63" },
  };

  const BANK = [
    { q: "Which planet is biggest?", a: "Jupiter", w: ["Mars", "Venus", "Earth"], look: "jupiter",
      fact: "Jupiter is so big that <b>over 1,300 Earths</b> could fit inside it." },
    { q: "Which planet is closest to the Sun?", a: "Mercury", w: ["Venus", "Mars", "Earth"], look: "mercury",
      fact: "A year on Mercury lasts only <b>88 Earth days</b>." },
    { q: "Which planet is known as the Red Planet?", a: "Mars", w: ["Jupiter", "Venus", "Mercury"], look: "mars",
      fact: "Mars looks red because its soil is full of <b>iron oxide</b> — rust!" },
    { q: "Which planet has the most famous rings?", a: "Saturn", w: ["Neptune", "Mars", "Earth"], look: "saturn",
      fact: "Saturn's rings are mostly <b>chunks of ice and rock</b>, some as big as houses." },
    { q: "Which is the hottest planet?", a: "Venus", w: ["Mercury", "Mars", "Jupiter"], look: "venus",
      fact: "Venus's thick CO₂ atmosphere traps heat, reaching about <b>465 °C</b>." },
    { q: "How many planets are in our Solar System?", a: "8", w: ["9", "7", "10"], look: "earth",
      fact: "Pluto was reclassified as a <b>dwarf planet</b> in 2006." },
    { q: "Which planet spins on its side?", a: "Uranus", w: ["Saturn", "Neptune", "Venus"], look: "uranus",
      fact: "Uranus is tilted about <b>98°</b>, so it rolls around the Sun like a ball." },
    { q: "Which planet is farthest from the Sun?", a: "Neptune", w: ["Uranus", "Saturn", "Jupiter"], look: "neptune",
      fact: "Neptune has the fastest winds in the Solar System — over <b>2,000 km/h</b>." },
    { q: "What is the Great Red Spot?", a: "A giant storm", w: ["A volcano", "A crater", "An ocean"], look: "jupiter",
      fact: "Jupiter's Great Red Spot is a storm <b>wider than Earth</b> that has raged for centuries." },
    { q: "What is the Sun?", a: "A star", w: ["A planet", "A comet", "A moon"], look: "sun",
      fact: "The Sun holds about <b>99.8%</b> of all the mass in the Solar System." },
    { q: "Which planet has the most known moons?", a: "Saturn", w: ["Earth", "Mars", "Mercury"], look: "saturn",
      fact: "Saturn has <b>over 140</b> confirmed moons." },
    { q: "Which planet do we live on?", a: "Earth", w: ["Mars", "Venus", "Neptune"], look: "earth",
      fact: "Earth is the only planet known to have <b>liquid water on its surface</b>." },
    { q: "What is the name of Earth's natural satellite?", a: "The Moon", w: ["Phobos", "Titan", "Europa"], look: "moon",
      fact: "The Moon drifts about <b>3.8 cm</b> farther from Earth every year." },
    { q: "Which planet has the tallest volcano?", a: "Mars", w: ["Earth", "Venus", "Jupiter"], look: "mars",
      fact: "Olympus Mons on Mars is nearly <b>3× taller than Mount Everest</b>." },
    { q: "How long does sunlight take to reach Earth?", a: "About 8 minutes", w: ["About 8 seconds", "About 8 hours", "About 8 days"], look: "sun",
      fact: "Light travels <b>~150 million km</b> from the Sun to reach us." },
    { q: "Which planet has the shortest day?", a: "Jupiter", w: ["Earth", "Mercury", "Mars"], look: "jupiter",
      fact: "Jupiter spins once every <b>~10 hours</b>." },
    { q: "Which planet has a longer day than its year?", a: "Venus", w: ["Mars", "Earth", "Saturn"], look: "venus",
      fact: "One spin of Venus takes <b>243 Earth days</b>, but its year is only 225." },
    { q: "What is Pluto now classified as?", a: "Dwarf planet", w: ["Moon", "Asteroid", "Gas giant"], look: "pluto",
      fact: "Pluto has a giant <b>heart-shaped glacier</b> named Tombaugh Regio." },
    { q: "Which belt lies between Mars and Jupiter?", a: "Asteroid belt", w: ["Kuiper belt", "Van Allen belt", "Orion belt"], look: "mars",
      fact: "The largest object in the asteroid belt is the dwarf planet <b>Ceres</b>." },
    { q: "Which planet could float in a giant bathtub?", a: "Saturn", w: ["Jupiter", "Earth", "Mercury"], look: "saturn",
      fact: "Saturn is <b>less dense than water</b>!" },
    { q: "What colour does Neptune appear?", a: "Blue", w: ["Red", "Yellow", "Green"], look: "neptune",
      fact: "<b>Methane</b> in Neptune's atmosphere absorbs red light, making it look blue." },
    { q: "Which is the smallest planet?", a: "Mercury", w: ["Mars", "Venus", "Uranus"], look: "mercury",
      fact: "Mercury is only slightly bigger than <b>Earth's Moon</b>." },
    { q: "Which galaxy is our Solar System in?", a: "Milky Way", w: ["Andromeda", "Whirlpool", "Sombrero"], look: "sun",
      fact: "The Milky Way holds an estimated <b>100–400 billion stars</b>." },
    { q: "What are Jupiter, Saturn, Uranus and Neptune called?", a: "Giant planets", w: ["Rocky planets", "Dwarf planets", "Moons"], look: "jupiter",
      fact: "Uranus and Neptune are often called <b>ice giants</b>." },
  ];

  const RANKS = [
    { min: 0,  emoji: "🛰️", title: "Space Cadet" },
    { min: 4,  emoji: "🚀", title: "Rocket Rookie" },
    { min: 6,  emoji: "🌙", title: "Moon Walker" },
    { min: 8,  emoji: "🪐", title: "Planet Pro" },
    { min: 10, emoji: "🌟", title: "Galaxy Genius" },
  ];

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  // ---------- sound (WebAudio, no assets) ----------
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
    correct: (streak) => {
      const base = 520 + Math.min(streak, 6) * 40;
      [0, 4, 7, 12].forEach((s, i) => tone(base * Math.pow(2, s / 12), 0.14, "triangle", 0.13, i * 0.06));
    },
    wrong: () => { tone(220, 0.18, "sawtooth", 0.09); tone(160, 0.25, "sawtooth", 0.09, 0.12); },
    tick: () => tone(880, 0.04, "square", 0.04),
    win: () => [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.2, "triangle", 0.12, i * 0.08)),
  };

  // ---------- starfield ----------
  const starCanvas = $("stars");
  const sctx = starCanvas.getContext("2d");
  let stars = [];
  let shooting = null;
  function resizeStars() {
    const dpr = window.devicePixelRatio || 1;
    starCanvas.width = innerWidth * dpr;
    starCanvas.height = innerHeight * dpr;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((innerWidth * innerHeight) / 5000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.4 + 0.2,
      s: Math.random() * 0.25 + 0.03,
      p: Math.random() * Math.PI * 2,
    }));
  }
  let warp = 0;
  function drawStars(t) {
    sctx.clearRect(0, 0, innerWidth, innerHeight);
    const speed = 1 + warp * 18;
    for (const s of stars) {
      s.y += s.s * speed;
      if (s.y > innerHeight) { s.y = 0; s.x = Math.random() * innerWidth; }
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t / 900 + s.p));
      sctx.fillStyle = `rgba(220,228,255,${a})`;
      if (warp > 0.05) {
        sctx.fillRect(s.x, s.y, s.r, s.r + warp * 14);
      } else {
        sctx.beginPath();
        sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        sctx.fill();
      }
    }
    warp *= 0.94;
    if (!shooting && Math.random() < 0.004) {
      shooting = { x: Math.random() * innerWidth, y: Math.random() * innerHeight * 0.4, life: 1 };
    }
    if (shooting) {
      const { x, y } = shooting;
      const grad = sctx.createLinearGradient(x, y, x - 90, y - 40);
      grad.addColorStop(0, `rgba(255,255,255,${shooting.life})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      sctx.strokeStyle = grad;
      sctx.lineWidth = 2;
      sctx.beginPath();
      sctx.moveTo(x, y);
      sctx.lineTo(x - 90, y - 40);
      sctx.stroke();
      shooting.x += 9; shooting.y += 4; shooting.life -= 0.02;
      if (shooting.life <= 0) shooting = null;
    }
    requestAnimationFrame(drawStars);
  }

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
  const CONF_COLORS = ["#d98a7f", "#ffcf5c", "#4fd1a5", "#8fb2ff", "#ffffff", "#ef9f8f"];
  function burst(x, y, count = 40, power = 9) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const v = Math.random() * power + 2;
      confetti.push({
        x, y,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v - power * 0.5,
        w: Math.random() * 8 + 4,
        h: Math.random() * 5 + 3,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        c: CONF_COLORS[(Math.random() * CONF_COLORS.length) | 0],
        life: 1,
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

  // ---------- screens ----------
  function show(name) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $("screen-" + name).classList.add("active");
    window.scrollTo(0, 0);
  }

  function getBest() { return parseInt(store.get(BEST_KEY, "0"), 10) || 0; }
  function refreshHomeBest() {
    const best = getBest();
    $("home-best").hidden = best === 0;
    $("home-best-val").textContent = best;
  }

  // ---------- game state ----------
  const state = {
    round: [], index: 0, score: 0, streak: 0, bestStreak: 0, correct: 0,
    timeLeft: SECONDS_PER_QUESTION, timerId: null, locked: false, nextId: null, startedAt: 0,
  };

  const RING_LEN = 2 * Math.PI * 44;
  $("timer-ring").style.strokeDasharray = RING_LEN;

  function startGame() {
    sfx.click();
    clearTimers();
    state.round = shuffle(BANK).slice(0, QUESTIONS_PER_ROUND).map((item) => ({
      ...item,
      options: shuffle([item.a, ...item.w]),
    }));
    Object.assign(state, { index: 0, score: 0, streak: 0, bestStreak: 0, correct: 0 });
    $("q-total").textContent = QUESTIONS_PER_ROUND;
    $("score").textContent = "0";
    $("streak").textContent = "0";
    $("streak-box").classList.remove("hot");
    warp = 1;
    show("game");
    renderQuestion();
  }

  function renderQuestion() {
    const item = state.round[state.index];
    state.locked = false;
    $("q-num").textContent = state.index + 1;
    $("progress-fill").style.width = (state.index / QUESTIONS_PER_ROUND) * 100 + "%";
    $("fact").hidden = true;

    const card = $("question-card");
    $("question").textContent = item.q;
    card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");

    const look = LOOKS[item.look] || LOOKS.earth;
    const planet = $("planet");
    planet.style.setProperty("--c1", look.c1);
    planet.style.setProperty("--c2", look.c2);
    planet.classList.toggle("ringed", !!look.ring);
    planet.classList.remove("pop"); void planet.offsetWidth; planet.classList.add("pop");

    const opts = $("options");
    opts.innerHTML = "";
    item.options.forEach((text, i) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.dataset.value = text;
      b.innerHTML = `<span class="key">${i + 1}</span>`;
      b.appendChild(document.createTextNode(text));
      b.addEventListener("click", () => answer(b, text));
      opts.appendChild(b);
    });

    startTimer();
  }

  function startTimer() {
    state.timeLeft = SECONDS_PER_QUESTION;
    state.startedAt = performance.now();
    updateTimer(SECONDS_PER_QUESTION);
    let lastWhole = SECONDS_PER_QUESTION;
    state.timerId = setInterval(() => {
      const elapsed = (performance.now() - state.startedAt) / 1000;
      state.timeLeft = Math.max(0, SECONDS_PER_QUESTION - elapsed);
      updateTimer(state.timeLeft);
      const whole = Math.ceil(state.timeLeft);
      if (whole !== lastWhole) {
        lastWhole = whole;
        if (whole <= 5 && whole > 0) sfx.tick();
      }
      if (state.timeLeft <= 0) timeUp();
    }, 50);
  }

  function updateTimer(t) {
    const frac = t / SECONDS_PER_QUESTION;
    $("timer-ring").style.strokeDashoffset = RING_LEN * (1 - frac);
    $("timer-text").textContent = Math.ceil(t);
    const timer = $("timer");
    timer.classList.toggle("warn", t <= 8 && t > 4);
    timer.classList.toggle("danger", t <= 4 && t > 0);
  }

  function clearTimers() {
    clearInterval(state.timerId);
    clearTimeout(state.nextId);
    state.timerId = state.nextId = null;
  }

  function multiplier() { return Math.min(1 + state.streak * 0.25, 3); }

  function answer(btn, text) {
    if (state.locked) return;
    state.locked = true;
    clearInterval(state.timerId);
    const item = state.round[state.index];
    const buttons = [...$("options").children];
    buttons.forEach((b) => (b.disabled = true));

    if (text === item.a) {
      state.streak++;
      state.correct++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const timeBonus = Math.round(state.timeLeft * 10);
      const gained = Math.round((100 + timeBonus) * multiplier());
      state.score += gained;

      btn.classList.add("correct");
      buttons.forEach((b) => b !== btn && b.classList.add("dim"));
      sfx.correct(state.streak);
      flash("good");

      const r = btn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 30 + state.streak * 6, 8);
      floater(btn, `+${gained}`);
      if (state.streak >= 2) floater(btn, `${state.streak} in a row! ×${multiplier().toFixed(2).replace(/\.?0+$/, "")}`, true, 34);
      bump($("score"), state.score);
    } else {
      state.streak = 0;
      btn.classList.add("wrong");
      buttons.forEach((b) => {
        if (b.dataset.value === item.a) b.classList.add("correct");
        else if (b !== btn) b.classList.add("dim");
      });
      sfx.wrong();
      flash("bad");
      shakeScreen();
    }
    updateStreak();
    showFactAndContinue(item);
  }

  function timeUp() {
    if (state.locked) return;
    state.locked = true;
    clearInterval(state.timerId);
    const item = state.round[state.index];
    state.streak = 0;
    updateStreak();
    [...$("options").children].forEach((b) => {
      b.disabled = true;
      if (b.dataset.value === item.a) b.classList.add("correct");
      else b.classList.add("dim");
    });
    sfx.wrong();
    flash("bad");
    const qc = $("question-card");
    floater(qc, "⏰ Time's up!", true, 0);
    showFactAndContinue(item);
  }

  function showFactAndContinue(item) {
    const fact = $("fact");
    fact.innerHTML = "💡 " + item.fact;
    fact.hidden = false;
    $("progress-fill").style.width = ((state.index + 1) / QUESTIONS_PER_ROUND) * 100 + "%";
    state.nextId = setTimeout(nextQuestion, 2300);
  }

  function nextQuestion() {
    state.index++;
    if (state.index >= QUESTIONS_PER_ROUND) endGame();
    else { warp = 0.5; renderQuestion(); }
  }

  function updateStreak() {
    const el = $("streak");
    const prev = el.textContent;
    el.textContent = state.streak;
    if (String(state.streak) !== prev && state.streak > 0) {
      el.parentElement.classList.remove("bump"); void el.offsetWidth; el.parentElement.classList.add("bump");
    }
    $("streak-box").classList.toggle("hot", state.streak >= 3);
  }

  function bump(el, value) {
    // Count up the score for a satisfying tick.
    const from = parseInt(el.textContent, 10) || 0;
    const start = performance.now();
    const dur = 500;
    (function step(now) {
      const k = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(from + (value - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(start);
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  }

  function floater(anchor, text, small = false, offsetY = 0) {
    const layer = $("float-layer");
    const host = $("screen-game").getBoundingClientRect();
    const r = anchor.getBoundingClientRect();
    const f = document.createElement("div");
    f.className = "floater" + (small ? " small" : "");
    f.textContent = text;
    f.style.left = r.left - host.left + r.width / 2 + "px";
    f.style.top = r.top - host.top - 10 - offsetY + "px";
    layer.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }

  function flash(kind) {
    const cls = "flash-" + kind;
    document.body.classList.remove("flash-good", "flash-bad");
    void document.body.offsetWidth;
    document.body.classList.add(cls);
    setTimeout(() => document.body.classList.remove(cls), 500);
  }

  function shakeScreen() {
    const el = $("screen-game");
    el.classList.remove("shake-screen"); void el.offsetWidth; el.classList.add("shake-screen");
  }

  function endGame() {
    clearTimers();
    const prevBest = getBest();
    const isBest = state.score > prevBest;
    if (isBest) store.set(BEST_KEY, String(state.score));
    const best = Math.max(prevBest, state.score);

    const rank = RANKS.filter((r) => state.correct >= r.min).pop();
    $("rank-emoji").textContent = rank.emoji;
    $("rank-title").textContent = rank.title;
    $("new-best").hidden = !isBest;
    $("stat-correct").textContent = `${state.correct}/${QUESTIONS_PER_ROUND}`;
    $("stat-streak").textContent = state.bestStreak;
    $("stat-best").textContent = best;
    $("final-score").textContent = "0";

    show("results");
    refreshHomeBest();
    warp = 1;

    // Count up the final score.
    const el = $("final-score");
    const start = performance.now();
    (function step(now) {
      const k = Math.min((now - start) / 1200, 1);
      el.textContent = Math.round(state.score * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(start);

    if (isBest || state.correct >= 7) {
      sfx.win();
      const fire = (i) => {
        burst(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.2 + Math.random() * 0.3), 70, 12);
        if (i < 4) setTimeout(() => fire(i + 1), 280);
      };
      fire(0);
    }
  }

  function quit() {
    clearTimers();
    sfx.click();
    show("home");
  }

  // ---------- modal ----------
  let lastFocus = null;
  function openHowto() {
    sfx.click();
    lastFocus = document.activeElement;
    $("modal-howto").hidden = false;
    $("btn-close-howto").focus();
  }
  function closeHowto() {
    sfx.click();
    $("modal-howto").hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  // ---------- wire up ----------
  $("btn-play").addEventListener("click", startGame);
  $("btn-again").addEventListener("click", startGame);
  $("btn-home").addEventListener("click", () => { sfx.click(); show("home"); });
  $("btn-quit").addEventListener("click", quit);
  $("btn-howto").addEventListener("click", openHowto);
  $("btn-close-howto").addEventListener("click", closeHowto);
  $("modal-howto").addEventListener("click", (e) => { if (e.target.id === "modal-howto") closeHowto(); });

  const toggle = $("sound-toggle");
  toggle.checked = soundOn;
  toggle.addEventListener("change", () => {
    soundOn = toggle.checked;
    store.set(SOUND_KEY, soundOn ? "1" : "0");
    sfx.click();
  });

  document.addEventListener("keydown", (e) => {
    if (!$("modal-howto").hidden) {
      if (e.key === "Escape") closeHowto();
      return;
    }
    if (!$("screen-game").classList.contains("active")) return;
    if (e.key === "Escape") return quit();
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) {
      const b = $("options").children[n - 1];
      if (b && !b.disabled) b.click();
    }
  });

  addEventListener("resize", () => { resizeStars(); resizeConfetti(); });
  resizeStars();
  resizeConfetti();
  requestAnimationFrame(drawStars);
  refreshHomeBest();
})();
