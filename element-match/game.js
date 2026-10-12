(() => {
  "use strict";

  const TOP_SCORES = 5;
  const SCORES_KEY = (l) => "elementmatch.scores." + l;
  const LEVEL_KEY = "elementmatch.level";
  const SOUND_KEY = "elementmatch.sound";

  const LEVELS = {
    easy:   { label: "Easy",   pairs: 6,  cols: 4, peek: 3000 },
    medium: { label: "Medium", pairs: 8,  cols: 4, peek: 2000 },
    hard:   { label: "Hard",   pairs: 10, cols: 5, peek: 1500 },
  };

  // [symbol, name, atomic number, category, fact]
  const POOLS = {
    easy: [
      ["H", "Hydrogen", 1, "Nonmetal", "Hydrogen is the <b>most common element</b> in the universe."],
      ["He", "Helium", 2, "Noble gas", "Helium makes your voice squeaky because sound travels <b>faster</b> through it."],
      ["Li", "Lithium", 3, "Alkali metal", "Lithium powers the <b>batteries</b> in phones and laptops."],
      ["C", "Carbon", 6, "Nonmetal", "Diamonds and pencil lead are <b>both pure carbon</b>."],
      ["N", "Nitrogen", 7, "Nonmetal", "About <b>78%</b> of the air you breathe is nitrogen."],
      ["O", "Oxygen", 8, "Nonmetal", "Oxygen is the <b>most common element</b> in Earth's crust."],
      ["Ne", "Neon", 10, "Noble gas", "Neon glows <b>red-orange</b> in signs."],
      ["Mg", "Magnesium", 12, "Alkaline earth", "Magnesium burns with a <b>blinding white</b> flame."],
      ["Al", "Aluminium", 13, "Metal", "Aluminium cans can be recycled <b>forever</b>."],
      ["Si", "Silicon", 14, "Metalloid", "Silicon is at the heart of every <b>computer chip</b>."],
      ["S", "Sulfur", 16, "Nonmetal", "Sulfur gives rotten eggs their <b>stinky smell</b>."],
      ["Cl", "Chlorine", 17, "Halogen", "Chlorine keeps <b>swimming pools</b> clean."],
      ["Ca", "Calcium", 20, "Alkaline earth", "Calcium builds strong <b>bones and teeth</b>."],
      ["Zn", "Zinc", 30, "Metal", "Zinc coats steel to stop it from <b>rusting</b>."],
    ],
    medium: [
      ["B", "Boron", 5, "Metalloid", "Boron is used to make heat-proof <b>Pyrex glass</b>."],
      ["F", "Fluorine", 9, "Halogen", "Fluorine in toothpaste helps protect your <b>teeth</b>."],
      ["P", "Phosphorus", 15, "Nonmetal", "Phosphorus is on the tip of every <b>match</b>."],
      ["Ar", "Argon", 18, "Noble gas", "Argon is the <b>third most common</b> gas in our air."],
      ["Ti", "Titanium", 22, "Metal", "Titanium is as strong as steel but <b>much lighter</b>."],
      ["Cr", "Chromium", 24, "Metal", "Chromium makes car parts <b>shiny</b>."],
      ["Mn", "Manganese", 25, "Metal", "Manganese makes steel <b>tougher</b>."],
      ["Co", "Cobalt", 27, "Metal", "Cobalt gives glass a deep <b>blue</b> colour."],
      ["Ni", "Nickel", 28, "Metal", "The US 5-cent coin is called a <b>nickel</b>."],
      ["Br", "Bromine", 35, "Halogen", "Bromine is one of only two elements that are <b>liquid</b> at room temperature."],
      ["I", "Iodine", 53, "Halogen", "Iodine turns <b>starch blue-black</b>."],
      ["Pt", "Platinum", 78, "Metal", "Platinum is <b>rarer than gold</b>."],
      ["U", "Uranium", 92, "Actinide", "Uranium fuels <b>nuclear power</b> plants."],
      ["Ne", "Neon", 10, "Noble gas", "Neon glows <b>red-orange</b> in signs."],
    ],
    hard: [
      ["Na", "Sodium", 11, "Alkali metal", "Na comes from the Latin <b>natrium</b>."],
      ["K", "Potassium", 19, "Alkali metal", "K comes from <b>kalium</b>. Bananas are full of it."],
      ["Fe", "Iron", 26, "Metal", "Fe comes from the Latin <b>ferrum</b>. Earth's core is mostly iron."],
      ["Cu", "Copper", 29, "Metal", "Cu comes from <b>cuprum</b>. The Statue of Liberty is copper."],
      ["Ag", "Silver", 47, "Metal", "Ag comes from <b>argentum</b>, which also named Argentina."],
      ["Sn", "Tin", 50, "Metal", "Sn comes from the Latin <b>stannum</b>."],
      ["Sb", "Antimony", 51, "Metalloid", "Sb comes from <b>stibium</b>, used as ancient eyeliner."],
      ["W", "Tungsten", 74, "Metal", "W comes from <b>wolfram</b>. It has the highest melting point of any metal."],
      ["Au", "Gold", 79, "Metal", "Au comes from the Latin <b>aurum</b>, “shining dawn”."],
      ["Hg", "Mercury", 80, "Metal", "Hg comes from <b>hydrargyrum</b>, “liquid silver”."],
      ["Pb", "Lead", 82, "Metal", "Pb comes from <b>plumbum</b>, which gave us the word plumber."],
      ["Kr", "Krypton", 36, "Noble gas", "Krypton is real, but it <b>won't</b> weaken Superman."],
      ["Xe", "Xenon", 54, "Noble gas", "Xenon lights up bright <b>car headlights</b>."],
      ["Ra", "Radium", 88, "Alkaline earth", "Radium <b>glows</b> in the dark."],
    ],
  };

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
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

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
    flip: () => tone(700 + Math.random() * 120, 0.05, "triangle", 0.07),
    match: (combo) => {
      const base = 520 + Math.min(combo, 6) * 45;
      [0, 4, 7, 12].forEach((s, i) => tone(base * Math.pow(2, s / 12), 0.14, "triangle", 0.12, i * 0.06));
    },
    miss: () => { tone(260, 0.12, "sawtooth", 0.07); tone(200, 0.18, "sawtooth", 0.07, 0.1); },
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
  const CONF_COLORS = ["#d4877e", "#8fb6d8", "#353e5c", "#f2b84b", "#e9a093"];
  function burst(x, y, count = 30, power = 8) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const v = Math.random() * power + 2;
      confetti.push({
        x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - power * 0.5,
        w: Math.random() * 8 + 4, h: Math.random() * 5 + 3,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
        c: CONF_COLORS[(Math.random() * CONF_COLORS.length) | 0], life: 1,
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

  // ---------- best scores (fewest moves, then fastest) ----------
  function getScores(level) {
    try {
      const list = JSON.parse(store.get(SCORES_KEY(level), "[]"));
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }
  function addScore(level, entry) {
    const list = getScores(level);
    list.push(entry);
    list.sort((a, b) => a.moves - b.moves || a.time - b.time || a.t - b.t);
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
      const date = new Date(s.t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      li.innerHTML = `<span class="meta">${fmtTime(s.time)} · ${date}</span><span class="pts">${s.moves} moves</span>`;
      ol.appendChild(li);
    }
  }

  // ---------- game state ----------
  const savedLevel = store.get(LEVEL_KEY, "easy");
  const state = {
    level: LEVELS[savedLevel] ? savedLevel : "easy",
    open: [], moves: 0, matched: 0, combo: 0, bestCombo: 0,
    started: false, startAt: 0, timerId: null, busy: true, missId: null, peekIds: [], lastT: 0,
  };

  function setLevel(level) {
    state.level = level;
    store.set(LEVEL_KEY, level);
    document.querySelectorAll(".level").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.level === level)));
    renderScores();
  }

  function clearTimers() {
    clearInterval(state.timerId);
    clearTimeout(state.missId);
    state.peekIds.forEach(clearTimeout);
    state.timerId = state.missId = null;
    state.peekIds = [];
  }

  function elapsed() { return state.started ? (performance.now() - state.startAt) / 1000 : 0; }

  function startGame() {
    sfx.click();
    clearTimers();
    const cfg = LEVELS[state.level];
    const picks = shuffle(POOLS[state.level]).slice(0, cfg.pairs);
    const cards = [];
    picks.forEach(([sym, name, num, cat, fact], id) => {
      cards.push({ id, kind: "sym", sym, name, num, cat, fact });
      cards.push({ id, kind: "name", sym, name, num, cat, fact });
    });

    Object.assign(state, { open: [], moves: 0, matched: 0, combo: 0, bestCombo: 0, started: false, busy: true });
    $("moves").textContent = "0";
    $("time").textContent = "0:00";
    $("pairs").textContent = "0";
    $("pairs-total").textContent = cfg.pairs;
    $("links").innerHTML = "";
    setFact("Find a symbol and its matching element name.");

    const board = $("board");
    board.style.setProperty("--cols", cfg.cols);
    board.innerHTML = "";
    shuffle(cards).forEach((c, i) => {
      const b = document.createElement("button");
      b.className = "tile";
      b.style.animationDelay = i * 35 + "ms";
      b.setAttribute("aria-label", "Hidden card");
      b._card = c;
      const front = c.kind === "sym"
        ? `<span class="num">${c.num}</span><span class="sym">${c.sym}</span><span class="cat">${c.cat}</span>`
        : `<span class="nm${c.name.length > 7 ? " long" : ""}">${c.name}</span>`;
      b.innerHTML = `<span class="tile-inner"><span class="face back"></span><span class="face front">${front}</span></span>`;
      b.addEventListener("click", () => flip(b));
      board.appendChild(b);
    });

    show("game");
    peek(cfg.peek);
  }

  // Show every card briefly so players can memorize, then flip them down.
  function peek(ms) {
    const tiles = [...$("board").children];
    const dealMs = tiles.length * 35 + 450;
    setBanner("Get ready…");
    state.peekIds.push(setTimeout(() => {
      tiles.forEach((t) => t.classList.add("up"));
      setBanner("Memorize! 👀", true);
      sfx.flip();
    }, dealMs));
    state.peekIds.push(setTimeout(() => {
      tiles.forEach((t) => t.classList.remove("up"));
      setBanner("Go!", true);
      sfx.go();
      state.busy = false;
    }, dealMs + ms));
  }

  function setBanner(text, pop = false, combo = false) {
    const el = $("banner");
    el.textContent = text;
    el.classList.toggle("combo", combo);
    if (pop) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
  }

  function setFact(html) {
    const el = $("fact");
    el.innerHTML = html;
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  }

  function startClock() {
    state.started = true;
    state.startAt = performance.now();
    state.timerId = setInterval(() => { $("time").textContent = fmtTime(elapsed()); }, 250);
  }

  function flip(tile) {
    if (state.busy || tile.classList.contains("up") || tile.classList.contains("matched")) return;
    // Clicking a third card while a miss is still showing: hide the miss right away.
    if (state.open.length === 2) hideMiss();
    if (!state.started) startClock();

    tile.classList.add("up");
    const c = tile._card;
    tile.setAttribute("aria-label", c.kind === "sym" ? `Symbol ${c.sym}` : c.name);
    sfx.flip();
    state.open.push(tile);
    if (state.open.length < 2) return;

    state.moves++;
    bump($("moves"), state.moves);
    const [a, b] = state.open;
    if (a._card.id === b._card.id) onMatch(a, b);
    else onMiss(a, b);
  }

  function onMatch(a, b) {
    state.open = [];
    state.matched++;
    state.combo++;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    [a, b].forEach((t) => { t.classList.remove("up"); t.classList.add("matched"); t.disabled = true; });
    bump($("pairs"), state.matched);
    sfx.match(state.combo);
    drawLink(a, b);

    const c = a._card;
    setFact(`<b>${c.sym} = ${c.name}</b> · ${c.fact}`);
    if (state.combo >= 2) setBanner(`🔥 Combo ×${state.combo}!`, true, true);
    else setBanner(["Nice!", "Match!", "Great!", "Bonded! ⚗️"][(Math.random() * 4) | 0], true);

    const r = b.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 20 + state.combo * 8, 7);

    if (state.matched === LEVELS[state.level].pairs) {
      state.busy = true;
      clearInterval(state.timerId);
      state.peekIds.push(setTimeout(endGame, 900));
    }
  }

  function onMiss(a, b) {
    state.combo = 0;
    a.classList.add("wrong");
    b.classList.add("wrong");
    sfx.miss();
    setBanner("Not a pair", true);
    state.missId = setTimeout(hideMiss, 900);
  }

  function hideMiss() {
    clearTimeout(state.missId);
    state.open.forEach((t) => {
      t.classList.remove("up", "wrong");
      t.setAttribute("aria-label", "Hidden card");
    });
    state.open = [];
  }

  // Dashed bond line between a matched pair, like the reference art.
  function drawLink(a, b) {
    const svg = $("links");
    const host = svg.getBoundingClientRect();
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    const x1 = ra.left - host.left + ra.width / 2, y1 = ra.top - host.top + ra.height / 2;
    const x2 = rb.left - host.left + rb.width / 2, y2 = rb.top - host.top + rb.height / 2;
    const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 40 - Math.abs(x2 - x1) * 0.15;
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", `M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`);
    svg.appendChild(p);
    setTimeout(() => p.remove(), 1500);
  }

  function bump(el, value) {
    el.textContent = value;
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  }

  function endGame() {
    clearTimers();
    const cfg = LEVELS[state.level];
    const time = elapsed();
    const entry = { moves: state.moves, time: Math.round(time), t: Date.now() };
    const place = addScore(state.level, entry);
    state.lastT = place ? entry.t : 0;

    const stars = state.moves <= cfg.pairs + 2 ? 3 : state.moves <= Math.round(cfg.pairs * 1.8) ? 2 : 1;
    [...$("stars").children].forEach((s, i) => s.classList.toggle("on", i < stars));
    $("rank-title").textContent = ["Lab Rookie", "Chem Champ", "Lab Legend"][stars - 1];
    $("rank-sub").textContent = cfg.label;
    $("new-best").hidden = place !== 1;
    $("placed").textContent = place > 1 ? `You placed #${place} on the ${cfg.label} best scores!` : "";
    $("stat-moves").textContent = state.moves;
    $("stat-time").textContent = fmtTime(time);
    $("stat-combo").textContent = "×" + state.bestCombo;

    show("results");
    renderScores(state.lastT);
    sfx.win();
    const fire = (i) => {
      burst(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.15 + Math.random() * 0.3), 60, 11);
      if (i < stars + 1) setTimeout(() => fire(i + 1), 280);
    };
    fire(0);
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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("screen-game").classList.contains("active")) goHome();
  });

  addEventListener("resize", resizeConfetti);
  resizeConfetti();
  paintSound();
  setLevel(state.level);
})();
