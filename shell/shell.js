// Master deck: a sequence of shell cards (cover, agenda, acts, chapter openers, end) with each project's own
// reveal.js deck played inside an iframe between them. shell/bridge.js inside each deck answers our commands.

const ACTS = [
  { id: "I", title: "Arte 2D a partir de referências", lede: "Um pedido ou um screenshot vira arte pronta para o jogo." },
  { id: "II", title: "Do 3D ao sprite", lede: "Modelos, props, animações, efeitos e a câmera que transforma tudo em sprite." },
  { id: "III", title: "Agentes de ponta a ponta", lede: "Do pedido ao resultado: um agente que usa o PC, um roteiro que vira filme e o caso MechaBOT." },
];

const CHAPTERS = [
  { slug: "garaki", act: "I", name: "GARAKI", accent: "#ff7a45", img: "img/moba_rebuilt.jpg",
    line: "Um screenshot de jogo 2D vira os assets do jogo, prontos para o Phaser, no visual do original." },
  { slug: "pintoresco", act: "I", name: "Pintoresco", accent: "#f5b83a", img: "img/lava-map.jpg",
    line: "Um print do jogo vira um tileset pronto para pintar mapas." },
  { slug: "kamui", act: "I", name: "kamUI", accent: "#9b7bff", img: "img/genre-rpg-pixelfantasy_ornate.jpg",
    line: "A interface inteira do jogo, gerada a partir de um tema." },
  { slug: "forja", act: "II", name: "forja", accent: "#ff5a3c", img: "media/mech_fire.gif", fit: "contain",
    line: "Modelos 3D de jogo, com rig e animação, escritos em JSON pelo próprio agente." },
  { slug: "fox-wizard", act: "II", name: "Mago Raposa", accent: "#ef8f2a", img: "media/render_cycles.jpg", fit: "contain",
    line: "Um personagem low poly escrito em JSON, renderizado no Blender e jogável na Godot." },
  { slug: "fast-props", act: "II", name: "fast-props", accent: "#c6e264", img: "assets/wardrobe.gif", fit: "contain",
    line: "Props estilizados em minutos: formas simples no Blender e texturas pintadas por IA." },
  { slug: "marionete", act: "II", name: "Marionete", accent: "#5fe0b0", img: "media/combo_join.gif", fit: "contain",
    line: "Animação de jogo para qualquer modelo rigado, sem abrir um editor." },
  { slug: "effekseer-fx", act: "II", name: "effekseer_fx", accent: "#7ab8ff",
    img: "_ext/3d_vibes/effekseer_fx/effects/necro_summon_3d/necro_summon_3d.gif",
    line: "Efeitos de jogo escritos em código, compilados pelo Effekseer e entregues como GIF e sprite sheet." },
  { slug: "spritecam", act: "II", name: "spritecam", accent: "#ff9a3c", img: "media/lenhador_walk.gif", fit: "contain", pixel: true,
    line: "Modelo 3D entra. Sprite de jogo sai." },
  { slug: "shiki", act: "III", name: "SHIKI", accent: "#ff5d73", img: "media/app.jpg",
    line: "Você pede. Ele usa o seu PC: lê a tela, mexe o mouse e o teclado e para antes de pagar." },
  { slug: "shortboard", act: "III", name: "Shortboard Creator", accent: "#f2e04b", img: "cover.jpeg",
    line: "Do roteiro ao filme de anime, automático, com os mesmos personagens do primeiro ao último quadro." },
  { slug: "fabula", act: "III", name: "Fabula", accent: "#45d4ff", img: "img/hero.webp",
    line: "Você descreve em português. Ele escreve o prompt certo para cada modelo e entrega a arte do jogo." },
  { slug: "forja", page: "extra.html", act: "extra", name: "forja no jogo", accent: "#ff5a3c", img: "media/game_dome.png",
    line: "Mecha Domme rodando na Godot, com os assets do forja prontos para a engine." },
];
CHAPTERS.forEach((c, i) => { c.i = i; c.no = String(i + 1).padStart(2, "0"); c.dir = `decks/${c.slug}/`; c.src = c.dir + (c.page || ""); });
const thumb = (c) => c.dir + c.img;
const MAIN = CHAPTERS.filter((c) => c.act !== "extra");

// The whole talk as a flat list of steps.
const STEPS = [{ kind: "cover" }, { kind: "agenda" }];
for (const act of ACTS) {
  STEPS.push({ kind: "act", act });
  for (const c of CHAPTERS.filter((c) => c.act === act.id)) {
    STEPS.push({ kind: "chapter", c }, { kind: "deck", c });
  }
}
STEPS.push({ kind: "end" });
for (const c of CHAPTERS.filter((c) => c.act === "extra")) STEPS.push({ kind: "chapter", c }, { kind: "deck", c });

const $ = (sel, el = document) => el.querySelector(sel);
const stage = $("#stage"), framesEl = $("#frames"), wipe = $("#wipe"), hud = $("#hud");
const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

// ---------- cards ----------

function coverCard() {
  const imgs = MAIN.map(thumb);
  const row = (k) => {
    const list = imgs.slice(k * 4).concat(imgs.slice(0, k * 4));
    const cells = list.concat(list).map((src) => `<figure><img src="${src}" alt=""></figure>`).join("");
    return `<div class="row r${k}"><div class="track">${cells}</div></div>`;
  };
  return h(`<section class="card cover">
    <div class="wall" aria-hidden="true">${row(0)}${row(1)}${row(2)}</div>
    <div class="veil"></div>
    <div class="copy">
      <p class="kicker a1">Apresentação · novembro de 2026</p>
      <h1 class="a2">Projetos <em>recentes</em></h1>
      <p class="lede a3">Doze projetos construídos com agentes: arte 2D a partir de referências, um pipeline do 3D ao sprite e agentes que entregam de ponta a ponta.</p>
      <p class="hint a4"><kbd>→</kbd> avançar <kbd>←</kbd> voltar <kbd>G</kbd> agenda <kbd>F</kbd> tela cheia</p>
    </div>
  </section>`);
}

function agendaCard() {
  const cols = ACTS.map((a) => `<div class="act-col">
      <p class="act-id">Ato ${a.id}</p><h3>${a.title}</h3>
      <ol>${CHAPTERS.filter((c) => c.act === a.id).map((c) => `
        <li><button data-go="${c.i}" style="--accent:${c.accent}">
          <span class="no">${c.no}</span><span class="name">${c.name}</span>
          <img src="${thumb(c)}" alt="" class="${c.pixel ? "pixel" : ""}"></button></li>`).join("")}</ol>
    </div>`).join("");
  return h(`<section class="card agenda"><p class="kicker a1">Agenda</p><div class="cols a2">${cols}</div></section>`);
}

function actCard(act) {
  const items = CHAPTERS.filter((c) => c.act === act.id);
  return h(`<section class="card act">
    <div class="numeral" aria-hidden="true">${act.id}</div>
    <div class="copy">
      <p class="kicker a1">Ato ${act.id}</p>
      <h2 class="a2">${act.title}</h2>
      <p class="lede a3">${act.lede}</p>
      <ul class="a4">${items.map((c) => `<li style="--accent:${c.accent}"><span>${c.no}</span>${c.name}</li>`).join("")}</ul>
    </div>
  </section>`);
}

function chapterCard(c) {
  const act = ACTS.find((a) => a.id === c.act);
  return h(`<section class="card chapter" style="--accent:${c.accent}">
    <div class="glow"></div>
    <figure class="art ${c.fit === "contain" ? "contain" : ""}">
      <img src="${thumb(c)}" alt="" class="${c.pixel ? "pixel" : ""}">
    </figure>
    <div class="copy">
      <p class="kicker a1">${act ? `<span class="no">${c.no}</span> Ato ${act.id} · ${act.title}` : `<span class="no">+</span> Extra`}</p>
      <h2 class="a2">${c.name}</h2>
      <p class="lede a3">${c.line}</p>
    </div>
  </section>`);
}

function endCard() {
  return h(`<section class="card end">
    <div class="copy">
      <p class="kicker a1">Fim</p>
      <h2 class="a2">Obrigado.</h2>
      <p class="lede a3">Doze projetos, uma ideia: o agente faz o trabalho pesado e você decide o que fica.</p>
    </div>
    <div class="grid a4">${MAIN.map((c) => `<button data-go="${c.i}" style="--accent:${c.accent}">
      <img src="${thumb(c)}" alt="" class="${c.pixel ? "pixel" : ""}"><span>${c.no} ${c.name}</span></button>`).join("")}</div>
  </section>`);
}

const CARD = { cover: coverCard, agenda: agendaCard, end: endCard,
  act: (s) => actCard(s.act), chapter: (s) => chapterCard(s.c) };

// ---------- deck frames ----------

const frames = new Map(); // chapter index -> { el, ready, index, total, waiters }

function frameFor(c, atLast = false) {
  let f = frames.get(c.i);
  if (f) return f;
  const el = document.createElement("iframe");
  el.src = c.src + (atLast ? "?at=last" : "");
  el.title = c.name;
  el.allow = "autoplay; fullscreen";
  f = { el, ready: false, index: 1, total: 0, waiters: [] };
  frames.set(c.i, f);
  framesEl.appendChild(el);
  return f;
}

function keepFrames(around) {
  const keep = new Set([around - 1, around, around + 1]);
  for (const [i, f] of frames) if (!keep.has(i)) { f.el.remove(); frames.delete(i); }
}

function whenReady(f) {
  return f.ready ? Promise.resolve() : new Promise((res) => {
    f.waiters.push(res);
    setTimeout(res, 6000); // a deck that never reports in still gets shown
  });
}

const send = (f, cmd) => f.el.contentWindow.postMessage({ ns: "shell", cmd }, "*");

window.addEventListener("message", (e) => {
  const d = e.data;
  if (!d || d.ns !== "deck") return;
  const entry = [...frames].find(([, f]) => f.el.contentWindow === e.source);
  if (!entry) return;
  const [i, f] = entry;
  if (d.type === "ready" || d.type === "state") {
    f.index = d.index; f.total = d.total;
    if (d.type === "ready") { f.ready = true; f.waiters.splice(0).forEach((r) => r()); }
    if (cur().kind === "deck" && cur().c.i === i) updateHud();
  } else if (d.type === "end") go(at + 1);
  else if (d.type === "start") go(at - 1);
  else if (d.type === "key") onKey(d);
});

// ---------- navigation ----------

let at = 0, busy = false, cardEl = null, liveFrame = null;
const cur = () => STEPS[at];

function stepFromHash() {
  const n = parseInt((location.hash.match(/s=(\d+)/) || [])[1], 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), STEPS.length - 1) : 0;
}

function sweep(accent, dir, midway) {
  // Two panels cross the screen; the content swaps while they cover it.
  wipe.style.setProperty("--accent", accent);
  wipe.dataset.dir = dir;
  const [a, b] = wipe.children;
  const from = dir > 0 ? "-101%" : "101%", to = dir > 0 ? "101%" : "-101%";
  const opts = (delay) => ({ duration: 1150, delay, easing: "cubic-bezier(.77,0,.18,1)", fill: "both" });
  const frames = [{ transform: `translateX(${from})` }, { transform: "translateX(0)", offset: 0.45 },
    { transform: "translateX(0)", offset: 0.55 }, { transform: `translateX(${to})` }];
  wipe.classList.add("on");
  const anims = [a.animate(frames, opts(0)), b.animate(frames, opts(90))];
  setTimeout(midway, 650);
  return Promise.all(anims.map((x) => x.finished)).then(() => wipe.classList.remove("on"));
}

function showCard(step, dir) {
  const el = CARD[step.kind](step);
  el.dataset.dir = dir;
  stage.appendChild(el);
  const old = cardEl;
  cardEl = el;
  el.getBoundingClientRect(); // commit the start state so the entrance transitions run
  el.classList.add("in");
  if (old) { old.classList.add("out"); setTimeout(() => old.remove(), 900); }
}

function showDeck(step) {
  if (cardEl) { cardEl.remove(); cardEl = null; }
  const f = frames.get(step.c.i);
  if (liveFrame && liveFrame !== f) liveFrame.el.classList.remove("live");
  liveFrame = f;
  f.el.classList.add("live");
  f.el.focus();
}

function hideDeck() {
  if (liveFrame) { liveFrame.el.classList.remove("live"); liveFrame = null; }
  if (document.activeElement && document.activeElement.tagName === "IFRAME") document.activeElement.blur();
}

async function go(n, opts = {}) {
  if (busy || n < 0 || n >= STEPS.length || n === at && !opts.force) return;
  busy = true;
  const dir = n >= at ? 1 : -1, from = STEPS[at], to = STEPS[n];
  at = n;
  history.replaceState(null, "", `#s=${n}`);

  const chapterIdx = to.c ? to.c.i : from.c ? from.c.i : -1;
  // Preload the deck the next step needs, and the one after, so the swap never shows a blank frame.
  if (to.kind === "deck" || to.kind === "chapter") {
    const backIntoDeck = to.kind === "deck" && dir < 0;
    const f = frameFor(to.c, backIntoDeck);
    if (backIntoDeck && f.ready) send(f, "last");
    if (to.kind === "deck" && dir > 0 && f.ready) send(f, "first");
    const next = CHAPTERS[to.c.i + 1];
    if (next && to.kind === "deck") frameFor(next);
    keepFrames(to.c.i);
  }

  const crossing = to.kind === "deck" || from.kind === "deck" || opts.jump;
  if (crossing) {
    const accent = (to.c || from.c || {}).accent || "#f2efe8";
    const f = to.kind === "deck" ? frames.get(to.c.i) : null;
    if (f) await whenReady(f);
    await sweep(accent, dir, () => {
      if (to.kind === "deck") showDeck(to);
      else { hideDeck(); showCard(to, dir); }
      updateHud();
    });
  } else {
    showCard(to, dir);
    updateHud();
    await new Promise((r) => setTimeout(r, 450));
  }
  busy = false;
  if (chapterIdx < 0) keepFrames(-9);
}

function next() { const s = cur(); s.kind === "deck" ? send(frames.get(s.c.i), "next") : go(at + 1); }
function prev() { const s = cur(); s.kind === "deck" ? send(frames.get(s.c.i), "prev") : go(at - 1); }
function jumpToChapter(i) { go(STEPS.findIndex((s) => s.kind === "chapter" && s.c.i === i), { jump: true }); }

function onKey(e) {
  if (busy) return;
  const k = e.key;
  if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k)) e.shift ? prev() : next();
  else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) prev();
  else if (k === "Home") go(0, { jump: true });
  else if (k === "End") go(STEPS.findIndex((s) => s.kind === "end"), { jump: true });
  else if (["g", "G", "Escape", "o", "O"].includes(k)) go(1, { jump: true });
  else if (k === "f" || k === "F") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  pokeHud();
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();
  onKey({ key: e.key, shift: e.shiftKey });
});
stage.addEventListener("click", (e) => {
  const b = e.target.closest("[data-go]");
  if (b) jumpToChapter(Number(b.dataset.go));
});

// ---------- HUD ----------

$("#hud-bar").innerHTML = CHAPTERS.map((c) => `<span style="--accent:${c.accent}"><b></b></span>`).join("");
let hudTimer = 0;
function pokeHud() {
  hud.classList.add("show");
  clearTimeout(hudTimer);
  hudTimer = setTimeout(() => hud.classList.remove("show"), 2200);
}
document.addEventListener("mousemove", pokeHud);

function updateHud() {
  const s = cur(), segs = $("#hud-bar").children;
  const ci = s.c ? s.c.i : s.kind === "end" ? CHAPTERS.length : s.kind === "act"
    ? CHAPTERS.findIndex((c) => c.act === s.act.id) : -1;
  const f = s.kind === "deck" ? frames.get(s.c.i) : null;
  [...segs].forEach((seg, i) => {
    const fill = i < ci ? 1 : i > ci ? 0 : f && f.total ? f.index / f.total : 0;
    seg.firstChild.style.transform = `scaleX(${fill})`;
    seg.classList.toggle("now", i === ci && s.kind !== "end");
  });
  $("#hud-where").textContent = s.c ? `${s.c.no} · ${s.c.name}` : s.kind === "act" ? `Ato ${s.act.id} · ${s.act.title}`
    : { cover: "Projetos recentes", agenda: "Agenda", end: "Fim" }[s.kind];
  $("#hud-count").textContent = f && f.total ? `${f.index} / ${f.total}` : "";
}

// ---------- start ----------

function fit() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  document.documentElement.style.setProperty("--s", s);
}
addEventListener("resize", fit);
fit();
at = stepFromHash();
const first = STEPS[at];
if (first.kind === "deck" || first.kind === "chapter") frameFor(first.c);
if (first.kind === "deck") whenReady(frames.get(first.c.i)).then(() => { showDeck(first); updateHud(); });
else showCard(first, 1);
updateHud();
pokeHud();
