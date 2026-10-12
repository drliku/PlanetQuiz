(() => {
  "use strict";

  const QUESTIONS_PER_ROUND = 10;
  const MAX_POINTS = 1000;          // Kahoot-style: instant answer = 1000, last second = 500
  const STREAK_BONUS = 100;         // per correct answer in a row, capped
  const STREAK_BONUS_CAP = 500;
  const TOP_SCORES = 5;
  const SCORES_KEY = (d) => "planetquiz.scores." + d;
  const DIFF_KEY = "planetquiz.difficulty";
  const SOUND_KEY = "planetquiz.sound";

  const DIFFICULTIES = {
    easy:   { label: "Easy",   seconds: 20 },
    medium: { label: "Medium", seconds: 15 },
    hard:   { label: "Hard",   seconds: 12 },
  };

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
    europa:  { c1: "#fff6e6", c2: "#b89c7a" },
    star:    { c1: "#ffffff", c2: "#9fb8ff" },
  };

  const BANKS = {
    easy: [
      { q: "Which planet is biggest?", a: "Jupiter", w: ["Mars", "Venus", "Earth"], look: "jupiter",
        fact: "Jupiter is so big that <b>over 1,300 Earths</b> could fit inside it." },
      { q: "Which planet is known as the Red Planet?", a: "Mars", w: ["Jupiter", "Venus", "Mercury"], look: "mars",
        fact: "Mars looks red because its soil is full of <b>iron oxide</b> — rust!" },
      { q: "Which planet has the most famous rings?", a: "Saturn", w: ["Mars", "Mercury", "Earth"], look: "saturn",
        fact: "Saturn's rings are mostly <b>chunks of ice and rock</b>." },
      { q: "Which planet do we live on?", a: "Earth", w: ["Mars", "Venus", "Neptune"], look: "earth",
        fact: "Earth is the only planet known to have <b>liquid water on its surface</b>." },
      { q: "What is the Sun?", a: "A star", w: ["A planet", "A comet", "A moon"], look: "sun",
        fact: "The Sun is a star, just like the ones you see at night — only <b>much closer</b>." },
      { q: "What goes around the Earth every month?", a: "The Moon", w: ["The Sun", "Mars", "Jupiter"], look: "moon",
        fact: "The Moon takes about <b>27 days</b> to orbit the Earth." },
      { q: "How many planets are in our Solar System?", a: "8", w: ["9", "5", "12"], look: "earth",
        fact: "There are <b>8 planets</b>. Pluto is now called a dwarf planet." },
      { q: "Which planet is closest to the Sun?", a: "Mercury", w: ["Neptune", "Mars", "Earth"], look: "mercury",
        fact: "Mercury zooms around the Sun in just <b>88 days</b>." },
      { q: "What colour does Neptune look?", a: "Blue", w: ["Red", "Yellow", "Green"], look: "neptune",
        fact: "<b>Methane gas</b> in Neptune's air makes it look blue." },
      { q: "What do the planets travel around?", a: "The Sun", w: ["The Moon", "Earth", "Jupiter"], look: "sun",
        fact: "All 8 planets <b>orbit the Sun</b>." },
      { q: "What is a person who travels to space called?", a: "Astronaut", w: ["Pilot", "Sailor", "Astronomer"], look: "earth",
        fact: "Astronauts on the Space Station see about <b>16 sunrises</b> every day." },
      { q: "What do astronauts ride into space?", a: "A rocket", w: ["A plane", "A balloon", "A helicopter"], look: "earth",
        fact: "A rocket must reach about <b>28,000 km/h</b> to stay in orbit." },
      { q: "Which of these is the hottest?", a: "The Sun", w: ["The Moon", "Earth", "Mars"], look: "sun",
        fact: "The surface of the Sun is about <b>5,500 °C</b>." },
      { q: "What is our galaxy called?", a: "Milky Way", w: ["Chocolate Way", "Star Road", "Sky Path"], look: "star",
        fact: "The Milky Way has <b>billions of stars</b>." },
      { q: "What is Pluto called now?", a: "Dwarf planet", w: ["Giant planet", "Star", "Comet"], look: "pluto",
        fact: "Pluto was renamed a <b>dwarf planet</b> in 2006." },
      { q: "Which planet is third from the Sun?", a: "Earth", w: ["Mars", "Venus", "Saturn"], look: "earth",
        fact: "Earth sits in the <b>“Goldilocks zone”</b> — not too hot, not too cold." },
    ],
    medium: [
      { q: "Which is the hottest planet?", a: "Venus", w: ["Mercury", "Mars", "Jupiter"], look: "venus",
        fact: "Venus's thick air traps heat, reaching about <b>465 °C</b>." },
      { q: "Which planet is farthest from the Sun?", a: "Neptune", w: ["Uranus", "Saturn", "Jupiter"], look: "neptune",
        fact: "Neptune takes <b>165 Earth years</b> to orbit the Sun once." },
      { q: "What is Jupiter's Great Red Spot?", a: "A giant storm", w: ["A volcano", "A crater", "An ocean"], look: "jupiter",
        fact: "The Great Red Spot is a storm <b>wider than Earth</b>." },
      { q: "Which planet has the tallest volcano?", a: "Mars", w: ["Earth", "Venus", "Jupiter"], look: "mars",
        fact: "Olympus Mons on Mars is nearly <b>3× taller than Everest</b>." },
      { q: "How long does sunlight take to reach Earth?", a: "About 8 minutes", w: ["About 8 seconds", "About 8 hours", "About 8 days"], look: "sun",
        fact: "Light travels <b>~150 million km</b> from the Sun to reach us." },
      { q: "Which is the smallest planet?", a: "Mercury", w: ["Mars", "Venus", "Uranus"], look: "mercury",
        fact: "Mercury is only a bit bigger than <b>Earth's Moon</b>." },
      { q: "What lies between Mars and Jupiter?", a: "Asteroid belt", w: ["Kuiper belt", "Ring of Fire", "Orion belt"], look: "mars",
        fact: "There are <b>millions of asteroids</b> in the belt." },
      { q: "Which planet spins on its side?", a: "Uranus", w: ["Saturn", "Neptune", "Venus"], look: "uranus",
        fact: "Uranus rolls around the Sun like a <b>bowling ball</b>." },
      { q: "Who was the first person to walk on the Moon?", a: "Neil Armstrong", w: ["Buzz Aldrin", "Yuri Gagarin", "Sally Ride"], look: "moon",
        fact: "“That's one small step for man…” — <b>July 20, 1969</b>." },
      { q: "In which year did humans first land on the Moon?", a: "1969", w: ["1959", "1979", "1989"], look: "moon",
        fact: "Apollo 11 landed in the <b>Sea of Tranquility</b>." },
      { q: "Which planet has moons called Phobos and Deimos?", a: "Mars", w: ["Jupiter", "Earth", "Venus"], look: "mars",
        fact: "Phobos and Deimos mean <b>“fear” and “dread”</b> in Greek." },
      { q: "What is Saturn's largest moon?", a: "Titan", w: ["Europa", "Io", "Phobos"], look: "saturn",
        fact: "Titan has <b>lakes of liquid methane</b>." },
      { q: "Which planet would float in a giant bathtub?", a: "Saturn", w: ["Jupiter", "Earth", "Mercury"], look: "saturn",
        fact: "Saturn is <b>less dense than water</b>!" },
      { q: "What are Jupiter and Saturn mostly made of?", a: "Gas", w: ["Rock", "Ice cream", "Metal"], look: "jupiter",
        fact: "Jupiter and Saturn are <b>gas giants</b>, mostly hydrogen and helium." },
      { q: "Which planet is Earth's closest neighbour?", a: "Venus", w: ["Mars", "Jupiter", "Mercury"], look: "venus",
        fact: "Venus is often called <b>Earth's twin</b> because of its size." },
      { q: "What was the first human-made satellite?", a: "Sputnik 1", w: ["Hubble", "Apollo 11", "Voyager 1"], look: "earth",
        fact: "Sputnik 1 launched in <b>1957</b>." },
    ],
    hard: [
      { q: "Which planet has a day longer than its year?", a: "Venus", w: ["Mercury", "Mars", "Neptune"], look: "venus",
        fact: "A Venus day is <b>243 Earth days</b>; its year is only 225." },
      { q: "How many hours is a day on Jupiter?", a: "About 10", w: ["About 24", "About 40", "About 2"], look: "jupiter",
        fact: "Jupiter is the <b>fastest-spinning</b> planet." },
      { q: "Which moon is thought to hide an ocean under its ice?", a: "Europa", w: ["Phobos", "Titan", "Deimos"], look: "europa",
        fact: "Europa's ocean may hold <b>twice as much water</b> as Earth's oceans." },
      { q: "What share of the Solar System's mass is in the Sun?", a: "About 99.8%", w: ["About 50%", "About 75%", "About 90%"], look: "sun",
        fact: "Everything else — planets, moons, asteroids — is just <b>0.2%</b>." },
      { q: "What is the largest object in the asteroid belt?", a: "Ceres", w: ["Vesta", "Eros", "Pallas"], look: "pluto",
        fact: "Ceres is a <b>dwarf planet</b> about 940 km wide." },
      { q: "What does a light-year measure?", a: "Distance", w: ["Time", "Speed", "Brightness"], look: "star",
        fact: "One light-year is about <b>9.46 trillion km</b>." },
      { q: "What is the closest star to the Sun?", a: "Proxima Centauri", w: ["Sirius", "Polaris", "Betelgeuse"], look: "star",
        fact: "Proxima Centauri is about <b>4.24 light-years</b> away." },
      { q: "Which spacecraft is the farthest from Earth?", a: "Voyager 1", w: ["Voyager 2", "New Horizons", "Pioneer 10"], look: "neptune",
        fact: "Voyager 1 left the Solar System's bubble in <b>2012</b>." },
      { q: "Which planet has the fastest winds?", a: "Neptune", w: ["Jupiter", "Earth", "Saturn"], look: "neptune",
        fact: "Neptune's winds top <b>2,000 km/h</b>." },
      { q: "What is the region of icy bodies beyond Neptune called?", a: "Kuiper belt", w: ["Asteroid belt", "Oort ring", "Van Allen belt"], look: "pluto",
        fact: "Pluto is one of the biggest <b>Kuiper belt</b> objects." },
      { q: "How many Earth days is a year on Mercury?", a: "88", w: ["365", "59", "224"], look: "mercury",
        fact: "Mercury is the <b>fastest planet</b>, at about 47 km/s." },
      { q: "Which planet is tilted about 98°?", a: "Uranus", w: ["Neptune", "Saturn", "Mars"], look: "uranus",
        fact: "Each Uranus pole gets <b>42 years</b> of sunlight, then 42 of darkness." },
      { q: "What is the heart-shaped region on Pluto called?", a: "Tombaugh Regio", w: ["Olympus Mons", "Valles Marineris", "Mare Imbrium"], look: "pluto",
        fact: "It's named after <b>Clyde Tombaugh</b>, who discovered Pluto in 1930." },
      { q: "Which planet has the most volcanic moon, Io?", a: "Jupiter", w: ["Saturn", "Uranus", "Mars"], look: "jupiter",
        fact: "Io has over <b>400 active volcanoes</b>." },
      { q: "About how many Earths fit inside the Sun?", a: "1.3 million", w: ["1,300", "13,000", "130 million"], look: "sun",
        fact: "The Sun is about <b>109 times wider</b> than Earth." },
      { q: "Which planet has a hexagon-shaped storm at its pole?", a: "Saturn", w: ["Jupiter", "Neptune", "Uranus"], look: "saturn",
        fact: "Saturn's hexagon is wider than <b>two Earths</b>." },
    ],
  };

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

  // ---------- high scores ----------
  function getScores(diff) {
    try {
      const list = JSON.parse(store.get(SCORES_KEY(diff), "[]"));
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  // Returns the 1-based place of the new score, or 0 if it didn't make the table.
  function addScore(diff, entry) {
    const list = getScores(diff);
    list.push(entry);
    list.sort((a, b) => b.score - a.score || a.t - b.t);
    const top = list.slice(0, TOP_SCORES);
    store.set(SCORES_KEY(diff), JSON.stringify(top));
    return top.indexOf(entry) + 1;
  }
  function renderScores(highlightT) {
    const diff = state.diff;
    $("scores-mode").textContent = DIFFICULTIES[diff].label;
    const ol = $("score-list");
    ol.innerHTML = "";
    const list = getScores(diff);
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
      const date = new Date(s.t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      li.innerHTML = `<span class="meta">${s.correct}/${QUESTIONS_PER_ROUND} correct · ${date}</span><span class="pts">${s.score.toLocaleString()}</span>`;
      ol.appendChild(li);
    }
  }

  // ---------- game state ----------
  const state = {
    diff: DIFFICULTIES[store.get(DIFF_KEY, "easy")] ? store.get(DIFF_KEY, "easy") : "easy",
    round: [], index: 0, score: 0, streak: 0, bestStreak: 0, correct: 0, totalTime: 0,
    timeLeft: 0, timerId: null, locked: false, nextId: null, startedAt: 0, lastT: 0,
  };
  const limit = () => DIFFICULTIES[state.diff].seconds;

  function setDifficulty(diff) {
    state.diff = diff;
    store.set(DIFF_KEY, diff);
    document.querySelectorAll(".diff").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.diff === diff)));
    renderScores();
  }

  const RING_LEN = 2 * Math.PI * 44;
  $("timer-ring").style.strokeDasharray = RING_LEN;

  function startGame() {
    sfx.click();
    clearTimers();
    state.round = shuffle(BANKS[state.diff]).slice(0, QUESTIONS_PER_ROUND).map((item) => ({
      ...item,
      options: shuffle([item.a, ...item.w]),
    }));
    Object.assign(state, { index: 0, score: 0, streak: 0, bestStreak: 0, correct: 0, totalTime: 0 });
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

  // Kahoot formula: points drop linearly from 1000 to 500 over the time limit.
  function speedPoints(elapsed) {
    const k = Math.min(Math.max(elapsed / limit(), 0), 1);
    return Math.round(MAX_POINTS * (1 - k / 2));
  }

  function startTimer() {
    state.timeLeft = limit();
    state.startedAt = performance.now();
    updateTimer(limit());
    let lastWhole = limit();
    state.timerId = setInterval(() => {
      const elapsed = (performance.now() - state.startedAt) / 1000;
      state.timeLeft = Math.max(0, limit() - elapsed);
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
    const frac = t / limit();
    $("timer-ring").style.strokeDashoffset = RING_LEN * (1 - frac);
    $("timer-text").textContent = Math.ceil(t);
    $("worth-val").textContent = speedPoints(limit() - t);
    const timer = $("timer");
    timer.classList.toggle("warn", frac <= 0.5 && frac > 0.25);
    timer.classList.toggle("danger", frac <= 0.25 && t > 0);
  }

  function clearTimers() {
    clearInterval(state.timerId);
    clearTimeout(state.nextId);
    state.timerId = state.nextId = null;
  }

  function answer(btn, text) {
    if (state.locked) return;
    state.locked = true;
    clearInterval(state.timerId);
    const elapsed = (performance.now() - state.startedAt) / 1000;
    state.totalTime += Math.min(elapsed, limit());
    const item = state.round[state.index];
    const buttons = [...$("options").children];
    buttons.forEach((b) => (b.disabled = true));

    if (text === item.a) {
      const base = speedPoints(elapsed);
      const bonus = Math.min(state.streak * STREAK_BONUS, STREAK_BONUS_CAP);
      state.streak++;
      state.correct++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const gained = base + bonus;
      state.score += gained;

      btn.classList.add("correct");
      buttons.forEach((b) => b !== btn && b.classList.add("dim"));
      sfx.correct(state.streak);
      flash("good");

      const r = btn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 30 + state.streak * 6, 8);
      floater(btn, `+${gained}`);
      const label = elapsed < limit() * 0.25 ? "⚡ Lightning fast!" : elapsed < limit() * 0.5 ? "Quick!" : "Correct!";
      floater(btn, bonus ? `${label} +${bonus} streak bonus` : label, true, 34);
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
    state.totalTime += limit();
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
    floater($("question-card"), "⏰ Time's up!", true, 0);
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
    const entry = { score: state.score, correct: state.correct, t: Date.now() };
    const place = state.score > 0 ? addScore(state.diff, entry) : 0;
    state.lastT = place ? entry.t : 0;
    const isBest = place === 1;

    const rank = RANKS.filter((r) => state.correct >= r.min).pop();
    $("rank-emoji").textContent = rank.emoji;
    $("rank-title").textContent = rank.title;
    $("rank-sub").textContent = DIFFICULTIES[state.diff].label;
    $("new-best").hidden = !isBest;
    $("placed").textContent = place > 1 ? `You placed #${place} on the ${DIFFICULTIES[state.diff].label} high scores!` : "";
    $("stat-correct").textContent = `${state.correct}/${QUESTIONS_PER_ROUND}`;
    $("stat-streak").textContent = state.bestStreak;
    $("stat-speed").textContent = (state.totalTime / QUESTIONS_PER_ROUND).toFixed(1) + "s";
    $("final-score").textContent = "0";

    show("results");
    renderScores(state.lastT);
    warp = 1;

    // Count up the final score.
    const el = $("final-score");
    const start = performance.now();
    (function step(now) {
      const k = Math.min((now - start) / 1200, 1);
      el.textContent = Math.round(state.score * (1 - Math.pow(1 - k, 3))).toLocaleString();
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

  function goHome() {
    clearTimers();
    sfx.click();
    renderScores(state.lastT);
    show("home");
  }

  // ---------- wire up ----------
  $("btn-play").addEventListener("click", startGame);
  $("btn-again").addEventListener("click", startGame);
  $("btn-home").addEventListener("click", goHome);
  $("btn-quit").addEventListener("click", goHome);
  document.querySelectorAll(".diff").forEach((b) =>
    b.addEventListener("click", () => { sfx.click(); setDifficulty(b.dataset.diff); })
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

  document.addEventListener("keydown", (e) => {
    if (!$("screen-game").classList.contains("active")) return;
    if (e.key === "Escape") return goHome();
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
  paintSound();
  setDifficulty(state.diff);
})();
