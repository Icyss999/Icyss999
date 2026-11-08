#!/usr/bin/env node
// Builds assets/pet-fight.svg: Rascal, the desktop pet from my Quickshell
// config, in a fight to the death with its double from the other side of a
// workspace rift -- cut like an anime fight: shot after shot, the camera
// pushing in, whipping round, tilting, shaking; eye close-ups, smears and
// afterimages, impact frames, a beam struggle.
//
// The pet, its poses, the nano suit, the lightning, the impact stars, the
// web strands and the souvenirs are all drawn by its own sprite code
// (Pet/pet-art.js), in its own colours. Plain SVG + CSS, no scripts, so
// GitHub plays it.
//
//   node scripts/build-pet-fight.mjs [path/to/pet-art.js]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ART_JS = process.argv[2] || process.env.PET_ART
    || path.join(os.homedir(), ".config/quickshell-cc/Pet/pet-art.js");
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/pet-fight.svg");

// A seeded random, so every build draws the same lightning.
function mulberry32(a) {
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rnd = mulberry32(20261108);
const R = (a, b) => a + rnd() * (b - a);

// pet-art.js is a QML JavaScript library: drop the pragma and it runs as is.
const Art = vm.createContext({ __rnd: rnd });
vm.runInContext(fs.readFileSync(ART_JS, "utf8").replace(/^\s*\.pragma\s+library.*$/m, ""), Art, { filename: ART_JS });
vm.runInContext("Math.random = __rnd;", Art);

// Frame rates, from PetConfig.qml next to it.
const FPS = (() => {
    const out = { idle: 3, annoyed: 4, run: 12, fly: 6, charge: 9, zap: 5, dizzy: 4 };
    try {
        const qml = fs.readFileSync(path.join(path.dirname(ART_JS), "PetConfig.qml"), "utf8");
        const block = qml.match(/property var fps:\s*\(\{([\s\S]*?)\}\)/)[1];
        for (const [, k, v] of block.matchAll(/(\w+):\s*([\d.]+)/g)) out[k] = +v;
    } catch { /* the defaults above */ }
    return out;
})();

// ---------------------------------------------------------------- colours

// PetConfig.colors, wallpaper accents baked in (as in pet-rift-kick.svg).
const PAL = {
    "#": "#211E30", c: "#70BE60", C: "#50924C", u: "#D8E2E4", s: "#91CEF5",
    w: "#F6F6FA", g: "#C8CCE0", m: "#928E9E", e: "#211E30", p: "#D6CBF5",
    b: "#6EB4F0", h: "#FFFFFF", r: "#E84855", y: "#FAD250", n: "#91CEF5",
    t: "#F2F2F8", R: "#A2B8C9", B: "#78C8FF", D: "#285A8C", L: "#C4C8D6",
    G: "#6E7080", H: "#F0703C", k: "#7B4A2B",
    P: "#A9B1C2", Q: "#727A8C", V: "#DDE1EA", X: "#F0C050", Z: "#6EE7FF", N: "#5CDCFF", F: "#D8FDFF"
};
// PetConfig.riftTwinColors: its double from the other side.
const TWIN = { ...PAL, c: "#5B4A8C", C: "#3E3166", u: "#A99AE0", s: "#FF4FD8", e: "#FF4FD8",
               w: "#D9D4EC", g: "#AAA2C8", m: "#6D6390", p: "#FF86C8", R: "#E3A6DC" };
// Pet.qml's boltColors (white-hot, pale cyan, electric cyan, a blue halo);
// the twin's lightning in its own colours.
const CYAN = { h: "#FFFFFF", y: "#D4F8FF", B: "#5CCFFF", N: "#3399FF@.45" };
const PINK = { h: "#FFFFFF", y: "#FFD6F5", B: "#FF4FD8", N: "#FF4FD8@.4" };
const GOLDEN = { h: "#FFFFFF", y: "#FFF3B0", B: "#FFC43A", N: "#FF9F1A@.4" };
// Strands (PetPower): core, glow, webbing, crosshair.
const WEB = { h: "#FFFFFF", n: "#91CEF5", g: "#C8CCE0", r: "#E84855" };
const RIFT = { h: "#FFFFFF", a: "#DCC6FF", b: "#A46BFF", d: "#4B2A8C", k: "#12081F", n: "#A46BFF@.5" };
const DUST = { a: "#F2EDE4", b: "#D8D1C6", c: "#AAA49C" };
const mono = (fill, keep = {}) => new Proxy({}, { get: (_, ch) => ch === "__key" ? `mono:${fill}:${JSON.stringify(keep)}` : keep[ch] || fill });
const INK = "#0B0B12", PAPER = "#F6F6FA", GRAY = "#8B949E";

const r3 = (n) => Math.round(n * 1000) / 1000;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------------------------------------------------------------- drawing

function paint(paths, pal) {
    let s = "";
    for (const ch of Object.keys(paths)) {
        const v = pal[ch];
        if (!v || !paths[ch]) continue;
        const [fill, alpha] = v.split("@");
        s += `<path fill="${fill}"${alpha ? ` fill-opacity="${alpha}"` : ""} d="${paths[ch]}"/>`;
    }
    return s;
}
// A character grid as pixel art, `px` user units a pixel. Each drawing goes
// into <defs> once and is reused from there, however many shots show it.
const sprites = new Map(), spriteDefs = [];
const palKey = (pal) => pal.__key || JSON.stringify(pal);
function pix(rows, px, x = 0, y = 0, { flip = false, pal = PAL } = {}) {
    const key = `${flip ? 1 : 0}|${palKey(pal)}|${rows.join("/")}`;
    let id = sprites.get(key);
    if (!id) {
        id = `s${sprites.size.toString(36)}`;
        sprites.set(key, id);
        spriteDefs.push(`<g id="${id}">${paint(Art.paths(rows, flip), pal)}</g>`);
    }
    return `<use href="#${id}" transform="translate(${r1(x)} ${r1(y)}) scale(${px})"/>`;
}
// Ready-made shapes ({ paths, origin }) with their origin at (x, y).
function shapes(sh, px, x, y, pal) {
    return `<g transform="translate(${r3(x + sh.origin[0] * px)} ${r3(y + sh.origin[1] * px)}) scale(${px})">${paint(sh.paths, pal)}</g>`;
}
const r1 = (n) => Math.round(n * 10) / 10;
const rect = (x, y, w, h, fill, extra = "") => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}"${extra}/>`;
const place = (html, x, y) => `<g transform="translate(${r3(x)} ${r3(y)})">${html}</g>`;

// ---------------------------------------------------------------- the clock

class Scene {
    constructor(W, H, D) { Object.assign(this, { W, H, D, css: [], n: 0, loops: new Set(), shots: new Set() }); }
    uid(p) { return p + (this.n++).toString(36); }
    P(t) { return `${r3(Math.max(0, Math.min(100, (t / this.D) * 100)))}%`; }

    // @keyframes from [t, declarations, easing?], the ends filled in.
    keyframes(name, steps) {
        const s = steps.slice().sort((a, b) => a[0] - b[0]);
        if (s[0][0] > 0) s.unshift([0, s[0][1]]);
        if (s.at(-1)[0] < this.D) s.push([this.D, s.at(-1)[1]]);
        const byPct = new Map();
        for (const [t, decl, ease] of s) byPct.set(this.P(t), `${decl}${ease ? `;animation-timing-function:${ease}` : ""}`);
        return `@keyframes ${name}{${[...byPct].map(([p, d]) => `${p}{${d}}`).join("")}}`;
    }
    rule(id, steps, decl) { this.css.push(`${this.keyframes(id, steps)}.${id}{${decl}}`); }

    // Shown only within these windows ([from, to] s).
    win(content, windows, { still = false } = {}) {
        const id = this.uid("w"), steps = [[0, "opacity:0"]];
        for (const [a, b] of windows) { steps.push([a, "opacity:1"]); if (b < this.D) steps.push([b, "opacity:0"]); }
        this.rule(id, steps, `animation:${id} ${this.D}s step-end infinite;opacity:${still ? 1 : 0}`);
        return `<g class="${id}">${content}</g>`;
    }
    // One after another from t0, dt each; the last one stays till `until`.
    seq(list, t0, dt, until) {
        return list.map((c, i) => this.win(c, [[t0 + i * dt, i === list.length - 1 && until ? until : t0 + (i + 1) * dt]])).join("");
    }
    // Frames cycling at `fps` on their own clock.
    loop(list, fps) {
        const N = list.length;
        if (N === 1) return list[0];
        const T = N / fps;
        this.loops.add(N);
        return list.map((f, i) => `<g class="f${N}${i ? "" : " k0"}" style="animation-duration:${r3(T)}s`
            + `${i ? `;animation-delay:${r3(((i - N) * T) / N)}s` : ""}">${f}</g>`).join("");
    }
    // Moved along [t, x, y, rotate, scale, easing] (the easing runs from that
    // point to the next), turning and scaling round `origin`.
    move(content, pts, { origin = [0, 0], still } = {}) {
        const id = this.uid("m");
        const steps = pts.map(([t, x, y, r = 0, s = 1, e]) => [t, `transform:translate(${r3(x)}px,${r3(y)}px) rotate(${r3(r)}deg) scale(${r3(s)})`, e]);
        this.rule(id, steps, `animation:${id} ${this.D}s linear infinite;transform-origin:${r3(origin[0])}px ${r3(origin[1])}px`);
        return `<g class="${id}"${still ? ` transform="translate(${still[0]} ${still[1]})"` : ""}>${content}</g>`;
    }
    // The camera: [t, cx, cy, zoom, roll, easing] -- the world point (cx, cy)
    // in the middle of the picture, zoomed and rolled round it.
    camera(content, pts) {
        const id = this.uid("c");
        const steps = pts.map(([t, cx, cy, z, r = 0, e]) => [t,
            `transform:translate(${this.W / 2}px,${this.H / 2}px) rotate(${r3(r)}deg) scale(${r3(z)}) translate(${r3(-cx)}px,${r3(-cy)}px)`, e]);
        this.rule(id, steps, `animation:${id} ${this.D}s linear infinite;transform-origin:0 0`);
        return `<g class="${id}">${content}</g>`;
    }
    // Shaking: [t0, duration, amplitude] jolts, dying away.
    quake(content, jolts) {
        const id = this.uid("q"), pts = [[0, "transform:translate(0px,0px)"]];
        for (const [t0, dur, amp] of jolts) {
            for (let k = 0; k * 0.04 < dur; k++) {
                const a = amp * (1 - (k * 0.04) / dur);
                pts.push([t0 + k * 0.04, `transform:translate(${r3(R(-a, a))}px,${r3(R(-a, a))}px)`]);
            }
            pts.push([t0 + dur, "transform:translate(0px,0px)"]);
        }
        this.rule(id, pts, `animation:${id} ${this.D}s linear infinite`);
        return `<g class="${id}">${content}</g>`;
    }
    // Opacity along [t, value, easing].
    fade(content, pts, { base = 0 } = {}) {
        const id = this.uid("o");
        this.rule(id, pts.map(([t, v, e]) => [t, `opacity:${v}`, e]), `animation:${id} ${this.D}s linear infinite;opacity:${base}`);
        return `<g class="${id}">${content}</g>`;
    }
    // A one-off: at t0, it waits `hold`, then flies off by (dx, dy), turning
    // `r` and scaling s0 -> s1 round `origin`, by t0 + dur; fading out ("o")
    // or in and out ("io").
    shot(content, t0, dur, { dx = 0, dy = 0, r = 0, s0 = 1, s1 = 1, ease = "ease-out", origin, mode = "o", hold = 0 } = {}) {
        dur = Math.round(dur * 100) / 100; hold = Math.round(hold * 20) / 20;
        const k = `${mode}${Math.round(dur * 100)}h${Math.round(hold * 100)}`;
        if (!this.shots.has(k)) {
            this.shots.add(k);
            const p = (dur / this.D) * 100, h = (hold / this.D) * 100;
            const start = "transform:translate(0px,0px) rotate(0deg) scale(var(--s0))", end = "transform:translate(var(--dx),var(--dy)) rotate(var(--r)) scale(var(--s1))";
            const mid = mode === "io" ? `${r3(p * 0.15)}%{opacity:1}${r3(p * 0.7)}%{opacity:1}` : hold ? `${r3(h)}%{opacity:1;${start}}` : "";
            this.css.push(`@keyframes s${k}{0%{opacity:${mode === "io" ? 0 : 1};${start}}${mid}`
                + `${r3(p)}%{opacity:0;${end}}100%{opacity:0;${end}}}.s${k}{animation:s${k} ${this.D}s ease-out infinite;opacity:0;--dx:0px;--dy:0px;--r:0deg;--s0:1;--s1:1}`);
        }
        // (Only what differs from the defaults above.)
        const st = [`animation-delay:${r3(t0)}s`];
        if (ease !== "ease-out") st.push(`animation-timing-function:${ease}`);
        if (dx) st.push(`--dx:${r1(dx)}px`);
        if (dy) st.push(`--dy:${r1(dy)}px`);
        if (r) st.push(`--r:${Math.round(r)}deg`);
        if (s0 !== 1) st.push(`--s0:${r3(s0)}`);
        if (s1 !== 1) st.push(`--s1:${r3(s1)}`);
        if (origin) st.push(`transform-origin:${r1(origin[0])}px ${r1(origin[1])}px`);
        return `<g class="s${k}" style="${st.join(";")}">${content}</g>`;
    }

    svg(body, label, defs) {
        const sizes = [...this.loops].sort();
        const loops = sizes.map((N) => `@keyframes f${N}{0%{opacity:1}${r3(100 / N)}%{opacity:0}100%{opacity:0}}.f${N}{animation-name:f${N}}`).join("\n");
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.W} ${this.H}" width="${this.W}" height="${this.H}" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}">
<defs>${defs}</defs>
<style>
.twk{animation:twk 3.4s ease-in-out infinite;opacity:.2}
@keyframes twk{0%,100%{opacity:.15}50%{opacity:.9}}
.rise{animation:rise .26s linear infinite;opacity:0}
@keyframes rise{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
.drift{animation:drift 3s linear infinite;opacity:0}
@keyframes drift{0%{opacity:0;transform:translate(0,0)}15%{opacity:.85}85%{opacity:.85}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
.pop{animation:pop .5s step-end infinite;opacity:0}
@keyframes pop{0%{opacity:1}40%{opacity:0}100%{opacity:0}}
.scroll{animation:scroll .4s linear infinite}
@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-1600px)}}
${loops}
${sizes.map((N) => `.f${N}`).join(",")}{opacity:0;animation-timing-function:step-end;animation-iteration-count:infinite}
.k0{opacity:1}
${this.css.join("\n")}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
${body}
</svg>
`;
    }
}

// ---------------------------------------------------------------- the world

// The picture is 960 x 720 and the background transparent; the world is
// laid out in the same units, the camera framing it shot by shot.
const W = 960, H = 720, D = 23;
const GROUND = 600, PX = 8, fx = 5, bfx = 5, K = PX / 7;
const TOP = GROUND - Art.H * PX;                // a pet's art top, standing
const S = new Scene(W, H, D);

const MODS = { rim: true, face: "raccoon" };
const pose = (st, f = 0, m = {}) => Art.pose(st, f, { ...MODS, ...m });
const frames = (st, m = {}) => Array.from({ length: Art.FRAMES[st] || 1 }, (_, f) => pose(st, f, m));
const ARMOR = { wear: "armor" };

// Pets drawn at (0, 0): Rascal facing right, the twin facing left.
const rA = (rows, pal = PAL) => pix(rows, PX, 0, 0, { pal });
const tA = (rows, pal = TWIN) => pix(rows, PX, 0, 0, { flip: true, pal });
const rLoop = (st, m = {}, pal = PAL) => S.loop(frames(st, m).map((r) => rA(r, pal)), FPS[st] || 4);
const tLoop = (st, m = {}, pal = TWIN) => S.loop(frames(st, m).map((r) => tA(r, pal)), FPS[st] || 4);
// Moved through the world: [t, x, y, rotate, scale, easing] of its art's
// top-left, turning round the middle of it.
const C0 = [(Art.W * PX) / 2, (Art.H * PX) / 2];
const actor = (html, pts) => S.move(html, pts.map(([t, x, y, r = 0, s = 1, e]) => [t, x, y, r, s, e]), { origin: C0 });
// Afterimages: the same moves a beat behind, fading, in one colour.
const ghosts = (html, pts, n = 3, lag = 0.035, opacity = 0.5) => Array.from({ length: n }, (_, k) =>
    `<g opacity="${r3(opacity * (1 - k / n))}">${actor(html, pts.map(([t, ...rest]) => [t + lag * (k + 1), ...rest]))}</g>`).join("");

// Landmarks in a pet's art (art pixels, facing right): its face, eyes, the
// middle of its body, the core of the suit, its visor, its paws.
const FACE = [Art.X0 + 5.5, Art.TOP + 6.5], MID = [Art.X0 + 5.5, Art.TOP + 10], CORE = Art.NANO_CORE;
const VISOR = [Art.X0 + 5.5, Art.TOP + 5.5], EYE = [Art.X0 + 7.5, Art.TOP + 6.5];
// A landmark of Rascal (facing right) or the twin (facing left) whose art
// top-left is at (x, y).
const rAt = (x, y, p) => [x + p[0] * PX, y + p[1] * PX];
const tAt = (x, y, p) => [x + (Art.W - p[0]) * PX, y + p[1] * PX];
const paw = (state) => [Art.holdAt(state)[0] + 0.5, Art.holdAt(state)[1] + 0.5];
const grip = (state) => [Art.gripAt(state)[0] + 0.5, Art.gripAt(state)[1] + 0.5];

const RIFT_C = [480, 412];

// ---------------------------------------------------------------- effects

// Effects.qml's little ones, drawn the same way.
const STEPS8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
// A crackle of static: a little zigzag, gone in a flicker.
function arc(x, y, t, { life = R(0.15, 0.27), colors = { h: "#E8FBFF", b: "#5CCFFF" } } = {}) {
    const n = 3 + Math.floor(rnd() * 6), d = Math.round(rnd() * 8) % 8;
    let cx = 0, cy = 0, kink = 0, s = rect(x, y, fx, fx, colors.b);
    for (let i = 1; i < n; i++) {
        const q = rnd();
        kink = q < 0.35 ? (kink > 0 ? -1 : 1) : q < 0.5 ? 0 : kink;
        const st = STEPS8[(d + kink + 8) % 8];
        cx += st[0]; cy += st[1];
        s += rect(x + cx * fx, y + cy * fx, fx, fx, i === n - 1 ? colors.b : colors.h);
    }
    return S.win(s, [[t, t + life]]);
}
// Static round a point: `n` crackles within r0..r1, from t over dt.
const crackle = (x, y, n, r0, r1, t, dt, colors) => Array.from({ length: n }, () => {
    const a = R(0, 2 * Math.PI), r = R(r0, r1) * K;
    return arc(x + Math.cos(a) * r, y + Math.sin(a) * r, t + R(0, dt), colors ? { colors } : {});
}).join("");
// A streak of light rising off something.
const ember = (x, y, t, { vy = -R(160, 320), len = 2 + Math.floor(rnd() * 3), life = R(0.26, 0.42), color = "#FFD84A" } = {}) =>
    S.shot(rect(x, y, fx, len * fx, color), t, life, { dy: vy * K * life });
// A cloud of dust billowing out as it drifts, thinning away.
function puff(x, y, t, { from = 2, to = 5, dx = 0, dy = -20, life = 0.7, opacity = 0.8, mode = "o" } = {}) {
    const r = Math.round(to), rows = [];
    for (let j = -r; j < r; j++) {
        let row = "";
        for (let i = -r; i < r; i++) {
            const d = Math.hypot(i + 0.5, j + 0.5) / r;
            row += d > 1 ? " " : d > 0.75 ? "c" : d > 0.4 ? "b" : "a";
        }
        rows.push(row);
    }
    return S.shot(`<g opacity="${opacity}">${pix(rows, fx, x - r * fx, y - r * fx, { pal: DUST })}</g>`, t, life,
        { dx: dx * K, dy: dy * K, s0: from / to, s1: 1, origin: [x, y], ease: "cubic-bezier(.2,.7,.4,1)", mode });
}
const dustRing = (x, t, n = 10, spread = 120) => Array.from({ length: n }, (_, i) => {
    const dir = i % 2 ? 1 : -1;
    return puff(x + dir * R(0, 20), GROUND - 10, t + i * 0.012, { to: [8, 6, 5][i % 3], dx: dir * R(spread * 0.4, spread), dy: -R(8, 40), life: R(0.6, 1.1) });
}).join("");
// Rock: cells of a chunk of ground, lit by the lightning.
function rockBody(bit) {
    let cells = [[0, 0]];
    if (!bit) {
        const q = rnd(), w = q < 0.3 ? 2 : q < 0.65 ? 3 : q < 0.9 ? 4 : 5, h = w === 2 ? 2 : w - 1 + Math.floor(rnd() * 2);
        cells = [];
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
            const corner = (i === 0 || i === w - 1) && (j === 0 || j === h - 1);
            if (!(corner && w * h > 4 && rnd() < 0.45)) cells.push([i - (w >> 1), j - (h >> 1)]);
        }
    }
    const ys = cells.map((c) => c[1]), xs = cells.map((c) => c[0]);
    const colour = ([i, j]) => j === Math.min(...ys) ? "#C4F4FF" : i === Math.max(...xs) ? "#4FB0E0" : i === Math.min(...xs) ? "#4A6380" : "#2A3748";
    return { html: cells.map((c) => rect(c[0] * fx - fx / 2, c[1] * fx - fx / 2, fx, fx, colour(c))).join(""), bottom: Math.max(...ys) };
}
// A chunk flung off at (vx, vy) px/s, tumbling a quarter turn at a time till
// it comes down.
function rock(x, y, t, { vx = 0, vy = -400, bit = false, life = 1.6, g = 1500 } = {}) {
    vx *= K; vy *= K; g *= K;
    const { html, bottom } = rockBody(bit);
    const floor = GROUND - (bottom + 1) * fx + fx / 2;
    const lands = (-vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, floor - y))) / g;
    const steps = [[0, `transform:translate(${x}px,${y}px);opacity:0`], [t - 0.001, `transform:translate(${x}px,${y}px);opacity:0`]];
    for (let s = 0; s <= lands + 1e-6; s += 0.08) {
        const tt = Math.min(s, lands);
        steps.push([t + tt, `transform:translate(${r3(x + vx * tt)}px,${r3(Math.min(floor, y + vy * tt + 0.5 * g * tt * tt))}px);opacity:1`]);
    }
    const rest = `transform:translate(${r3(x + vx * lands)}px,${r3(floor)}px)`;
    steps.push([t + lands, `${rest};opacity:1`], [t + life - 0.25, `${rest};opacity:1`], [t + life, `${rest};opacity:0`]);
    const id = S.uid("k"), spin = S.uid("q"), turns = [[0, "transform:rotate(0deg)"]];
    const every = R(0.06, 0.15);
    for (let s = 0, k = Math.floor(rnd() * 4); s < lands; s += every, k++) turns.push([t + s, `transform:rotate(${(k % 4) * 90}deg)`]);
    S.rule(id, steps, `animation:${id} ${D}s linear infinite;opacity:0`);
    S.rule(spin, turns, `animation:${spin} ${D}s step-end infinite`);
    return `<g class="${id}"><g class="${spin}">${html}</g></g>`;
}
// A chunk lifting off the ground in slow motion with the power coming off
// it, turning slowly, hanging there -- till `blast`, when it's blown away.
function floatRock(x, t0, blast, hover, away) {
    const { html } = rockBody(rnd() < 0.3);
    const y0 = GROUND - fx, up = t0 + R(0.5, 0.8), y1 = y0 - hover;
    const steps = [[0, `transform:translate(${x}px,${y0}px);opacity:0`], [t0 - 0.001, `transform:translate(${x}px,${y0}px);opacity:0`],
        [t0, `transform:translate(${x}px,${y0}px);opacity:1`, "cubic-bezier(.2,.7,.3,1)"]];
    let t = up, k = 0;
    while (t < blast) { steps.push([t, `transform:translate(${x}px,${r3(y1 - (k % 2 ? 6 : 0))}px);opacity:1`, "ease-in-out"]); t += 0.35; k++; }
    steps.push([blast, `transform:translate(${x}px,${r3(y1)}px);opacity:1`, "cubic-bezier(.2,.8,.3,1)"],
        [blast + 0.4, `transform:translate(${r3(x + away[0])}px,${r3(y1 + away[1])}px);opacity:0`]);
    const id = S.uid("k"), spin = S.uid("q"), turn = R(-70, 70);
    S.rule(id, steps, `animation:${id} ${D}s linear infinite;opacity:0`);
    S.rule(spin, [[0, "transform:rotate(0deg)"], [t0, "transform:rotate(0deg)"], [blast, `transform:rotate(${r3(turn)}deg)`]], `animation:${spin} ${D}s linear infinite`);
    return `<g class="${id}"><g class="${spin}">${html}</g></g>`;
}
// A pixel shockwave: a ring of sparks flying out, a cross of light flaring
// and shrinking away.
function burst(x, y, t, { radius = 56, sparks = 16, glint = 90, life = 0.38, color = "#FFD84A", trail = "#5CCFFF" } = {}) {
    radius *= K; glint *= K;
    let s = "";
    for (let i = 0; i < sparks; i++) {
        const a = (i / sparks) * 2 * Math.PI + R(-0.2, 0.2), r = radius * R(0.75, 1.15);
        s += S.shot(rect(x - fx / 2, y - fx / 2, fx, fx, i % 2 ? "#FFFFFF" : color), t, life, { dx: Math.cos(a) * r, dy: Math.sin(a) * r, ease: "cubic-bezier(.2,.8,.3,1)" });
        s += S.shot(rect(x - fx / 2, y - fx / 2, fx, fx, trail), t + 0.03, life, { dx: Math.cos(a) * r * 0.7, dy: Math.sin(a) * r * 0.7, ease: "cubic-bezier(.2,.8,.3,1)" });
    }
    s += S.shot(rect(x - glint / 2, y - 3, glint, 6, "#FFFFFF") + rect(x - 3, y - glint / 2, 6, glint, "#FFFFFF"), t, life * 0.8, { s0: 1, s1: 0.1, origin: [x, y] });
    return s;
}
// A ring of air blown out from a blow: round, or flattened along the ground.
const ring = (x, y, t, { r = 120, flat = 1, color = "#FFFFFF", width = 6, life = 0.42 } = {}) =>
    S.shot(`<ellipse cx="${r3(x)}" cy="${r3(y)}" rx="${r3(r)}" ry="${r3(r * flat)}" fill="none" stroke="${color}" stroke-width="${width}" shape-rendering="geometricPrecision"/>`,
        t, life, { s0: 0.15, s1: 1, origin: [x, y], ease: "cubic-bezier(.1,.7,.3,1)" });
// Light bursting off a hit.
const flare = (x, y, r, t, peak = 1, dur = 0.35, grad = "flare") =>
    S.fade(`<circle cx="${r3(x)}" cy="${r3(y)}" r="${r3(r)}" fill="url(#${grad})"/>`, [[t - 0.001, 0], [t, peak, "ease-out"], [t + dur, 0]]);
// Pet.qml's impactAt: a comic star, small, big, then middling.
function impact(x, y, t, { big = true, size = 1, pal = CYAN } = {}) {
    const set = [Art.impact(6 * size, 7), Art.impact(13 * size, 8), Art.impact(9 * size, 8)];
    const steps = big ? [[0, 0, 0.06], [1, 0.06, 0.11], [2, 0.17, 0.11]] : [[0, 0, 0.05], [2, 0.05, 0.09]];
    return steps.map(([k, a, d]) => {
        const rows = set[k], n = rows.length;
        return S.win(pix(rows, fx, x - (n * fx) / 2, y - (n * fx) / 2, { pal: { ...pal } }), [[t + a, t + a + d]]);
    }).join("");
}
// The works for a blow landing at (x, y): star, light, ring, sparks.
const hit = (x, y, t, { size = 1, pal = CYAN, color = "#FFFFFF", trail = "#5CCFFF", ringR = 110 } = {}) =>
    impact(x, y, t, { size, pal }) + flare(x, y, 120 * K * size, t, 1, 0.3) + ring(x, y, t, { r: ringR * K * size, color: trail })
    + burst(x, y, t, { radius: 56 * size, sparks: 14, glint: 90 * size, color, trail });
// Lightning (Art.bolt) from `a` to `b`, one drawing.
function boltDraw(b, x, y, pal, pieces = [0]) {
    let s = "";
    for (const k of pieces) s += paint(b.pieces[k].paths, pal);
    return `<g transform="translate(${r1(x + b.origin[0] * bfx)} ${r1(y + b.origin[1] * bfx)}) scale(${bfx})">${s}</g>`;
}
const boltOnce = (a, b, pal, opts = {}) => boltDraw(Art.bolt((b[0] - a[0]) / bfx, (b[1] - a[1]) / bfx, { pieces: 1, ...opts }), a[0], a[1], pal);
// A bolt that shoots across piece by piece, hangs there redrawn every few
// frames (on 4s, like hand-drawn lightning), then strobes, thins and goes.
function bolt(a, b, t0, { grow = 0.09, hold = 0.45, fadeOut = 0.32, pal = CYAN, opts = {}, redraws = 2 } = {}) {
    const dx = (b[0] - a[0]) / bfx, dy = (b[1] - a[1]) / bfx, N = 10;
    const first = Art.bolt(dx, dy, { pieces: N, ...opts });
    let s = "";
    for (let k = 0; k < N; k++) s += S.win(boltDraw(first, a[0], a[1], pal, [k]), [[t0 + (grow * k) / N, t0 + grow + 0.066]]);
    s += S.win(S.loop(Array.from({ length: redraws }, () => boltOnce(a, b, pal, opts)), 15), [[t0 + grow + 0.066, t0 + grow + hold]]);
    const thin = boltOnce(a, b, pal, { ...opts, scale: 0.5 });
    const t1 = t0 + grow + hold, q = fadeOut / 5;
    s += S.win(thin, [[t1 + q, t1 + 2 * q], [t1 + 3 * q, t1 + 3.6 * q], [t1 + 4.2 * q, t1 + 5 * q]]);
    return s;
}
// An aura (Pet.qml's: the pet's shape, glowing, round it), drawn at (0, 0).
const aura = (rows, color, { flip = false, k = 1.35, blur = "aura" } = {}) =>
    `<g filter="url(#${blur})">${pix(rows, PX * k, -(Art.W * PX * (k - 1)) / 2, -Art.H * PX * (k - 1), { flip, pal: mono(color) })}</g>`;
const effect = (name, x, y, pal = PAL, k = fx) => { const rows = Art.effect(name); return pix(rows, k, x - (rows[0].length * k) / 2, y - (rows.length * k) / 2, { pal }); };
// A glint off an eye: a little cross of light popping.
const glint = (x, y, t, color = "#FFFFFF", size = 3) => S.shot(
    rect(x - size / 2, y - size * 3, size, size * 6, color) + rect(x - size * 3, y - size / 2, size * 6, size, color), t, 0.3,
    { s0: 0.2, s1: 1.2, origin: [x, y], mode: "io", ease: "ease-out" });
// Speed lines streaking past in the world, along (ux, uy).
const streaks = (x0, y0, x1, y1, t, n, { spread = 60, colors = ["#FFFFFF", "#8FE0FF", "#5CCFFF"], len = [60, 160], life = [0.14, 0.26] } = {}) => {
    const ang = Math.atan2(y1 - y0, x1 - x0), deg = (ang * 180) / Math.PI;
    return Array.from({ length: n }, (_, i) => {
        const u = R(-0.1, 1), off = (i % 2 ? 1 : -1) * R(8, spread) * K, l = R(...len) * K;
        const x = x0 + (x1 - x0) * u - Math.sin(ang) * off, y = y0 + (y1 - y0) * u + Math.cos(ang) * off;
        const line = `<g transform="translate(${r3(x)} ${r3(y)}) rotate(${r3(deg)})">${rect(0, 0, l, i % 3 ? 3 : 6, colors[i % colors.length])}</g>`;
        return S.shot(line, t + u * 0.06, R(...life), { dx: Math.cos(ang) * R(40, 140) * K, dy: Math.sin(ang) * R(40, 140) * K });
    }).join("");
};

// The dimensional rift (Rift.qml's look, worked out per pixel here): a tall
// tear with a vortex swirling inside, a white-hot jagged rim and a dithered
// halo of its dimension's colour. `open` 0 a slit .. 1 open.
function riftRows(open, phase, seed) {
    const A = 7, B = 24, pad = 4;
    const a = Math.max(0.9, A * Math.min(open, 1.25)), b = B * Math.min(1.15, 0.45 + 0.55 * Math.min(1, open * 1.5) + Math.max(0, open - 1) * 0.4);
    const cols = 2 * Math.ceil(A * 1.25 + pad + 2), rows = 2 * Math.ceil(B * 1.15 + pad + 2), cx = cols / 2, cy = rows / 2, out = [];
    for (let y = 0; y < rows; y++) {
        let row = "";
        for (let x = 0; x < cols; x++) {
            const u = (x + 0.5 - cx) / a, v = (y + 0.5 - cy) / b, d = Math.hypot(u, v), th = Math.atan2(v, u);
            const edge = 1 + 0.1 * Math.sin(th * 7 + seed) + 0.06 * Math.sin(th * 13 + seed * 2.3);
            const radial = Math.hypot(u * a, v * b), dpx = radial * (1 - edge / Math.max(d, 1e-6));
            if (dpx <= -2.2) {
                const swirl = Math.sin(3 * th + 7 * d - phase);
                row += d < 0.25 ? "k" : swirl > 0.45 ? "a" : swirl > -0.15 ? "b" : d < 0.55 ? "k" : "d";
            } else if (dpx <= -1) row += "a";
            else if (dpx <= 0.3) row += "h";
            else if (dpx <= pad && (x + y) % 2 === 0) row += "n";
            else row += " ";
        }
        out.push(row);
    }
    return out;
}

// Manga focus lines: thin wedges closing in on (cx, cy), in picture units.
function focus(cx, cy, n, inner, fill) {
    let s = "";
    for (let i = 0; i < n; i++) {
        const a = (i / n) * 2 * Math.PI + R(-0.08, 0.08), w = R(0.012, 0.035), ri = inner * R(0.75, 1.35), ro = 1800;
        const p = (ang, r) => `${Math.round(cx + Math.cos(ang) * r)},${Math.round(cy + Math.sin(ang) * r)}`;
        s += `<polygon points="${p(a - w, ro)} ${p(a + w, ro)} ${p(a, ri)}" fill="${fill}" shape-rendering="geometricPrecision"/>`;
    }
    return s;
}

const defs = [];
// ---- backdrops: abstract backgrounds behind the intense close-ups, the way
// anime drops the set for speed lines in a sakuga cut. In picture units.
const flat = (fill) => rect(-40, -40, W + 80, H + 80, fill);
// Lines streaming past at `angle` degrees.
const backdrops = new Map();
const once = (key, make) => {
    if (!backdrops.has(key)) { const id = `bd${backdrops.size}`; backdrops.set(key, id); defs.push(`<g id="${id}">${make()}</g>`); }
    return `<use href="#${backdrops.get(key)}"/>`;
};
function speedBG(bg, line, angle, period = 0.4) {
    const lines = once(`speed${line}`, () => {
        let out = "";
        for (let i = 0; i < 40; i++) {
            const y = Math.round(R(H / 2 - 800, H / 2 + 800)), x = Math.round(R(0, 1600)), l = Math.round(R(120, 420)), h = rnd() < 0.25 ? 6 : 3;
            out += rect(x - 320, y, l, h, line) + rect(x + 1280, y, l, h, line);
        }
        return out;
    });
    return flat(bg) + `<g transform="rotate(${angle} ${W / 2} ${H / 2})"><g class="scroll" style="animation-duration:${period}s">${lines}</g></g>`;
}
// Focus lines closing in, redrawn on 2s (boiling, like hand-drawn ones).
const focusBG = (bg, line, cx = W / 2, cy = H / 2, inner = 230) =>
    flat(bg) + S.loop([0, 1].map((k) => once(`focus${line}${cx},${cy},${k}`, () => focus(cx, cy, 40, inner, line))), 8);

// Pixel letters, 5 x 7, for the signature.
const FONT = {
    I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
    Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
    L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"]
};
const plainWord = (word) => FONT.I.map((_, y) => [...word].map((ch) => FONT[ch][y].replace(/#/g, "c").replace(/\./g, " ")).join(" "));

// ---------------------------------------------------------------- the set

defs.push(`<clipPath id="frame"><rect width="${W}" height="${H}" rx="16"/></clipPath>
<radialGradient id="riftGlow"><stop offset="0" stop-color="#A46BFF" stop-opacity=".42"/><stop offset="1" stop-color="#A46BFF" stop-opacity="0"/></radialGradient>
<radialGradient id="flare"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".3" stop-color="#E6FBFF" stop-opacity=".6"/><stop offset="1" stop-color="#8FE0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="pinkFlare"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".3" stop-color="#FFD6F5" stop-opacity=".6"/><stop offset="1" stop-color="#FF4FD8" stop-opacity="0"/></radialGradient>
<radialGradient id="goldFlare"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset=".35" stop-color="#FFE98A" stop-opacity=".55"/><stop offset="1" stop-color="#FFC43A" stop-opacity="0"/></radialGradient>
<radialGradient id="starGlow"><stop offset="0" stop-color="#8FE0FF" stop-opacity=".7"/><stop offset="1" stop-color="#8FE0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="dark"><stop offset="0" stop-color="#05060A" stop-opacity=".85"/><stop offset=".6" stop-color="#05060A" stop-opacity=".55"/><stop offset="1" stop-color="#05060A" stop-opacity="0"/></radialGradient>
<filter id="aura" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>`);

// The night sky. Easter egg: some of its stars are a constellation that
// spells ICYCLE. All fight long they pass for ordinary stars, among decoys;
// when it's all over they light up and join the dots.
const STROKES = {
    I: [[[0, 0], [2, 0]], [[1, 0], [1, 4]], [[0, 4], [2, 4]]],
    C: [[[2.2, 0.5], [1.1, 0], [0, 0.9], [0, 3.1], [1.1, 4], [2.2, 3.5]]],
    Y: [[[0, 0], [1.1, 1.9]], [[2.2, 0], [1.1, 1.9]], [[1.1, 1.9], [1.1, 4]]],
    L: [[[0, 0], [0, 4], [2, 4]]],
    E: [[[2, 0], [0, 0], [0, 4], [2, 4]], [[0, 2], [1.6, 2]]]
};
const SKY = { x: 318, y: 86, u: 15, step: 54 };
let constellationLit = "";
{
    const twinkle = (x, y, delay) => `<g transform="translate(${x} ${y})"><g class="twk" style="animation-delay:${delay}s">`
        + `${rect(3, 0, 3, 9, "#9DB4D3")}${rect(0, 3, 9, 3, "#9DB4D3")}${rect(3, 3, 3, 3, "#FFFFFF")}</g></g>`;
    let sky = "";
    for (let i = 0; i < 150; i++) {
        const x = Math.round(R(-260, W + 260)), y = Math.round(R(-760, GROUND - 200));
        sky += i % 7 === 0 ? twinkle(x, y, -R(0, 3.4).toFixed(1)) : rect(x, y, 3, 3, GRAY, ` opacity="${R(0.25, 0.65).toFixed(2)}"`);
    }
    const box = [SKY.x - 30, SKY.y - 30, SKY.x + 6 * SKY.step + 10, SKY.y + 4 * SKY.u + 30];
    for (let i = 0; i < 34; i++)
        sky += rect(Math.round(R(box[0], box[2])), Math.round(R(box[1], box[3])), i % 3 ? 2 : 3, i % 3 ? 2 : 3, GRAY, ` opacity="${R(0.25, 0.6).toFixed(2)}"`);
    [..."ICYCLE"].forEach((ch, i) => {
        const ox = SKY.x + i * SKY.step, P = ([x, y]) => [r3(ox + x * SKY.u), r3(SKY.y + y * SKY.u)];
        const dots = new Map(), lines = [];
        for (const stroke of STROKES[ch]) stroke.forEach((p, k) => { const q = P(p); dots.set(q.join(), q); if (k) lines.push([P(stroke[k - 1]), q]); });
        let letter = lines.map(([a, b]) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#4AB4F0" stroke-width="2" opacity=".85" shape-rendering="geometricPrecision"/>`).join("");
        for (const [x, y] of dots.values()) {
            const sz = rnd() < 0.5 ? 2 : 3;
            sky += rect(x - sz / 2, y - sz / 2, sz, sz, GRAY, ` opacity="${R(0.25, 0.6).toFixed(2)}"`);
            letter += `<circle cx="${x}" cy="${y}" r="11" fill="url(#starGlow)"/>` + rect(x - 3.5, y - 3.5, 7, 7, "#2F8FD8") + rect(x - 1.5, y - 1.5, 3, 3, "#FFFFFF");
        }
        constellationLit += S.fade(letter, [[21.2 + i * 0.16, 0], [21.65 + i * 0.16, 1], [22.3, 1], [22.6, 0]]);
    });
    // The ground: just a line, like the rest of the README.
    defs.push(`<g id="world">${sky}${rect(-1200, GROUND, W + 2400, 3, GRAY, ' opacity=".35"')}</g>`);
}
const world = `<use href="#world"/>`;

// The rift, swirling between them in the background, drawn once.
{
    const at = (rows) => pix(rows, fx, RIFT_C[0] - (rows[0].length * fx) / 2, RIFT_C[1] - (rows.length * fx) / 2, { pal: RIFT });
    [0, 2.1, 4.2].forEach((ph, i) => defs.push(`<g id="rift${i}">${at(riftRows(1, ph, i * 1.7))}</g>`));
    [[1, 0.14], [3, 0.8]].forEach(([i, o]) => defs.push(`<g id="riftOpen${i}">${at(riftRows(o, i, 3 + i))}</g>`));
    [0.55, 0.2, 0.03].forEach((o, i) => defs.push(`<g id="riftShut${i}">${at(riftRows(o, i * 2, 9 + i))}</g>`));
}
const use = (id) => `<use href="#${id}"/>`;
const riftGlow = `<ellipse cx="${RIFT_C[0]}" cy="${RIFT_C[1]}" rx="230" ry="210" fill="url(#riftGlow)"/><ellipse cx="${RIFT_C[0]}" cy="${GROUND + 2}" rx="110" ry="10" fill="#A46BFF" opacity=".22"/>`;
const rift = () => riftGlow + S.loop([0, 1, 2].map((i) => use(`rift${i}`)), 10);
// The rift somewhere else, scaled: (x, y) its middle.
const riftAt = (x, y, k, html) => `<g transform="translate(${r3(x)} ${r3(y)}) scale(${k}) translate(${-RIFT_C[0]} ${-RIFT_C[1]})">${html}</g>`;

// ---------------------------------------------------------------- shots

const shots = [];
// A shot: from t0 to t1, the world through the camera, a backdrop behind
// it and anything in front of it in picture units; shaken by `quake`.
function shot(t0, t1, { cam, bg = "", worldHtml = "", fg = "", quake }) {
    let view = S.camera(worldHtml, cam);
    if (quake) view = S.quake(view, quake);
    shots.push(S.win(bg + view + fg, [[t0, t1]]));
}
// An impact frame: the picture turned to ink and paper -- silhouettes and
// focus lines, held for a frame or two.
function impactFrame(t0, t1, { cam, ground, ink, figures, at = [W / 2, H / 2], inner = 120, n = 36, extra = "" }) {
    shot(t0, t1, { cam, bg: flat(ground) + focus(at[0], at[1], n, inner, ink), worldHtml: figures(ink), fg: extra });
}
const sil = (rows, x, y, fill, { flip = false, eyes } = {}) => pix(rows, PX, x, y, { flip, pal: mono(fill, eyes ? { e: eyes } : {}) });

// Where they start: Rascal on the left, the twin on the right, the rift
// open between them.
const RX = 150, TXs = 660;

// ---- 1. the standoff (0-2.3): wide, still, wind; the camera creeping in.
{
    let wind = "";
    for (let i = 0; i < 22; i++) {
        const x = R(80, 1100), y = R(GROUND - 260, GROUND - 4), dur = R(2.2, 3.6);
        wind += `<g class="drift" style="animation-duration:${r3(dur)}s;animation-delay:-${r3(R(0, dur))}s;--dx:-${r3(R(240, 420))}px;--dy:${r3(R(-30, 10))}px">`
            + rect(x, y, i % 3 ? 6 : 10, 2, i % 4 ? "#C8CCE0" : "#FFFFFF", ' opacity=".7"') + "</g>";
    }
    const r = actor(rLoop("idle"), [[0, RX, TOP]]), t = actor(tLoop("annoyed"), [[0, TXs, TOP]]);
    shot(0, 2.3, { cam: [[0, 480, 410, 1.0, 0, "cubic-bezier(.3,0,.3,1)"], [2.3, 470, 440, 1.14, -1.5]], worldHtml: world + rift() + r + t + wind });
}

// ---- 2. extreme close-up: Rascal's eyes narrow.
{
    const face = rAt(RX, TOP, FACE), eye = rAt(RX, TOP, EYE);
    const html = place(S.win(rA(pose("idle")), [[2.3, 2.62]]) + S.win(rA(pose("annoyed")), [[2.62, 3.0]]), RX, TOP)
        + glint(eye[0] + 6, eye[1] - 4, 2.66, "#FFFFFF", 2);
    shot(2.3, 3.0, { bg: speedBG("#0B1020", "#1C2C4A", 0, 0.5), cam: [[2.3, face[0], face[1], 7.0, -5], [3.0, face[0], face[1] - 2, 7.7, -6]], worldHtml: html });
}
// ---- 3. ...and the twin's, glinting magenta.
{
    const face = tAt(TXs, TOP, FACE), eye = tAt(TXs, TOP, EYE);
    const html = place(tA(pose("annoyed")), TXs, TOP) + glint(eye[0] - 6, eye[1] - 4, 3.22, "#FFD6F5", 2);
    shot(3.0, 3.7, { bg: speedBG("#1A0716", "#3A1238", 180, 0.5), cam: [[3.0, face[0], face[1], 7.0, 5], [3.7, face[0], face[1] - 2, 7.7, 6]], worldHtml: html });
}

// ---- 4. they go: low angle, both dashing in with afterimages.
const CLASH = [480, GROUND - 76];
const RC = CLASH[0] - 17 * PX, TC = CLASH[0] - 1 * PX;   // where they meet
{
    const rPts = [[3.7, RX, TOP], [3.86, RX, TOP, 0, 1, "cubic-bezier(.5,0,.9,.7)"], [4.42, RC, TOP]];
    const tPts = [[3.7, TXs, TOP], [3.86, TXs, TOP, 0, 1, "cubic-bezier(.5,0,.9,.7)"], [4.42, TC, TOP]];
    const rBody = S.win(rA(pose("land")), [[3.7, 3.86]]) + S.win(rLoop("run"), [[3.86, 4.42]]);
    const tBody = S.win(tA(pose("land")), [[3.7, 3.86]]) + S.win(tLoop("run"), [[3.86, 4.42]]);
    const html = world + rift()
        + S.win(ghosts(rLoop("run", {}, mono("#5CCFFF")), rPts) + ghosts(tLoop("run", {}, mono("#FF4FD8")), tPts), [[3.9, 4.42]])
        + actor(rBody, rPts) + actor(tBody, tPts)
        + dustRing(RX + 70, 3.86, 4, 60) + dustRing(TXs + 70, 3.86, 4, 60)
        + streaks(RX, CLASH[1], RC + 100, CLASH[1], 4.0, 10) + streaks(TXs + 140, CLASH[1], TC + 40, CLASH[1], 4.0, 10, { colors: ["#FFFFFF", "#FFD6F5", "#FF4FD8"] });
    shot(3.7, 4.42, { cam: [[3.7, 470, 556, 1.75, -6, "ease-in"], [4.42, 480, 545, 2.05, -3]], worldHtml: html });
}

// ---- 5. the clash: two impact frames, then the shockwave.
{
    const cam = [[4.42, CLASH[0], CLASH[1] + 10, 2.05, -3]];
    const figures = (ink, eyes) => sil(pose("run"), RC, TOP, ink, { eyes }) + sil(pose("run"), TC, TOP, ink, { flip: true, eyes });
    impactFrame(4.42, 4.49, { cam, ground: INK, ink: PAPER, figures: (c) => figures(c, INK), n: 40, inner: 110 });
    impactFrame(4.49, 4.56, { cam, ground: PAPER, ink: INK, figures: (c) => figures(c, PAPER), n: 34, inner: 130 });
    const rPts = [[4.56, RC, TOP, 0, 1, "cubic-bezier(.1,.8,.3,1)"], [4.9, RC - 60, TOP]];
    const tPts = [[4.56, TC, TOP, 0, 1, "cubic-bezier(.1,.8,.3,1)"], [4.9, TC + 60, TOP]];
    const html = world + rift()
        + actor(rA(pose("land")), rPts) + actor(tA(pose("land")), tPts)
        + hit(CLASH[0], CLASH[1], 4.56, { size: 1.6, ringR: 150 }) + ring(CLASH[0], GROUND, 4.56, { r: 340, flat: 0.12, width: 5, life: 0.5 })
        + dustRing(CLASH[0], 4.58, 12, 200)
        + Array.from({ length: 10 }, (_, i) => rock(CLASH[0] + R(-30, 30), GROUND - 6, 4.58, { bit: i > 5, vx: R(-240, 240), vy: -R(300, 700), life: R(1, 1.4) })).join("");
    shot(4.56, 4.92, { cam: [[4.56, 480, 520, 1.55, 2], [4.92, 480, 515, 1.45, 3]], worldHtml: html, quake: [[4.56, 0.36, 16]] });
}

// ---- 6. the exchange: blow for blow, a cut for each.
{
    // c1: Rascal's strike lands.
    const rx = 300, tx = 452, fist = rAt(rx, TOP, paw("cast"));
    const smear = [24, 48].map((d, i) => `<g opacity="${i ? 0.18 : 0.35}">${place(sil(pose("cast"), 0, 0, "#8FE0FF"), rx - d, TOP)}</g>`).join("");
    let html = S.win(smear, [[4.92, 5.02]]) + place(rA(pose("cast")), rx, TOP)
        + actor(tA(pose("fall")), [[4.92, tx, TOP], [4.97, tx, TOP, 0, 1, "cubic-bezier(.1,.8,.3,1)"], [5.22, tx + 60, TOP - 16, 8]])
        + hit(fist[0] + 6, fist[1], 4.97, { size: 0.9 }) + streaks(rx - 60, fist[1], fist[0], fist[1], 4.92, 6);
    shot(4.92, 5.22, { bg: focusBG("#0A1428", "#1F4A78", 620, 360), cam: [[4.92, 466, 520, 2.6, 12], [5.22, 476, 520, 2.8, 13]], worldHtml: html, quake: [[4.97, 0.2, 7]] });

    // c2: the twin's comes straight back.
    const tx2 = 476, rx2 = 330, fist2 = tAt(tx2, TOP, paw("cast"));
    const smear2 = [24, 48].map((d, i) => `<g opacity="${i ? 0.18 : 0.35}">${place(sil(pose("cast"), 0, 0, "#FF86C8", { flip: true }), tx2 + d, TOP)}</g>`).join("");
    html = S.win(smear2, [[5.22, 5.32]]) + place(tA(pose("cast")), tx2, TOP)
        + actor(rA(pose("fall")), [[5.22, rx2, TOP], [5.27, rx2, TOP, 0, 1, "cubic-bezier(.1,.8,.3,1)"], [5.52, rx2 - 60, TOP - 16, -8]])
        + hit(fist2[0] - 6, fist2[1], 5.27, { size: 0.9, pal: PINK, trail: "#FF4FD8", color: "#FFD6F5" })
        + streaks(tx2 + 200, fist2[1], fist2[0], fist2[1], 5.22, 6, { colors: ["#FFFFFF", "#FFD6F5", "#FF4FD8"] });
    shot(5.22, 5.52, { bg: focusBG("#1A0716", "#5E1C52", 340, 360), cam: [[5.22, 494, 520, 2.6, -14], [5.52, 484, 520, 2.8, -15]], worldHtml: html, quake: [[5.27, 0.2, 7]] });

    // c3: the world on its side -- an uppercut, the twin thrown up.
    const up = rAt(390, TOP - 40, [Art.X0 + 9, Art.TOP + 1]);
    html = actor(rA(pose("jump")), [[5.52, 390, TOP - 10, 0, 1, "ease-out"], [5.62, 390, TOP - 50]])
        + actor(tA(pose("fall")), [[5.52, 420, TOP - 110], [5.58, 420, TOP - 110, 0, 1, "cubic-bezier(.1,.8,.3,1)"], [5.82, 450, TOP - 230, 120]])
        + hit(up[0], up[1] - 10, 5.58, { size: 1 });
    shot(5.52, 5.82, { bg: speedBG("#0D0F1A", "#262F4A", 90, 0.3), cam: [[5.52, 460, TOP - 40, 2.1, -90], [5.82, 462, TOP - 60, 2.3, -84]], worldHtml: html, quake: [[5.58, 0.2, 8]] });

    // c4: way back -- two specks trading blows in the sky, flash after flash.
    const mid = [480, 250];
    html = world + rift()
        + S.seq([[380, 200, 470, 200], [392, 214, 474, 190], [370, 190, 482, 214]].map(([a, b, c, d]) =>
            place(rA(pose("fall")), a, b) + place(tA(pose("fall")), c, d)), 5.82, 0.1, 6.12)
        + [5.85, 5.95, 6.05].map((t, i) => hit(mid[0] + (i - 1) * 12, mid[1] + 60 + (i % 2) * 14, t, { size: 0.8, ringR: 160, pal: i % 2 ? PINK : CYAN, trail: i % 2 ? "#FF4FD8" : "#5CCFFF" })).join("");
    shot(5.82, 6.12, { cam: [[5.82, 480, 330, 0.72, 0], [6.12, 480, 330, 0.78, 1]], worldHtml: html, quake: [[5.85, 0.25, 4]] });

    // c5: the twin's blow catches Rascal full in the face.
    const rx5 = 300, ry5 = 280, face = rAt(rx5, ry5, FACE), fist5 = [face[0] + 34, face[1] + 4];
    const tx5 = fist5[0] - (Art.W - paw("cast")[0]) * PX, ty5 = fist5[1] - paw("cast")[1] * PX;
    html = S.win(place(rA(pose("alert")), rx5, ry5) + place(tA(pose("cast")), tx5, ty5), [[6.12, 6.2]])
        + actor(rA(pose("dizzy")), [[6.26, rx5, ry5, 0, 1, "cubic-bezier(.1,.8,.3,1)"], [6.42, rx5 - 70, ry5 - 10, -35]])
        + S.win(place(tA(pose("cast")), tx5 + 20, ty5), [[6.26, 6.42]])
        + hit(face[0] + 26, face[1], 6.26, { size: 1.1, pal: PINK, trail: "#FF4FD8", color: "#FFD6F5" });
    shot(6.12, 6.2, { bg: flat("#0D0F1A"), cam: [[6.12, face[0] + 20, face[1], 4.6, 8]], worldHtml: html });
    impactFrame(6.2, 6.26, { cam: [[6.2, face[0] + 20, face[1], 4.6, 8]], ground: "#E84855", ink: INK, figures: (c) => sil(pose("dizzy"), rx5, ry5, c, { eyes: "#E84855" }) + sil(pose("cast"), tx5 + 10, ty5, c, { flip: true }), at: [W / 2 + 100, H / 2], inner: 160 });
    shot(6.26, 6.42, { bg: flat("#0D0F1A"), cam: [[6.26, face[0], face[1], 4.0, -6], [6.42, face[0] - 40, face[1], 3.5, -12]], worldHtml: html, quake: [[6.26, 0.16, 12]] });

    // c6: and up it goes.
    const pts = [[6.42, 300, TOP, 0, 1, "cubic-bezier(.1,.7,.4,1)"], [6.75, 300, 40, 540]];
    html = world + rift() + ghosts(rA(pose("fall"), mono("#5CCFFF")), pts, 3, 0.03) + actor(rA(pose("fall")), pts)
        + dustRing(384, 6.42, 8, 120) + ring(384, GROUND, 6.42, { r: 240, flat: 0.12, width: 4 })
        + streaks(384, GROUND, 384, 40, 6.42, 14, { len: [80, 220] });
    shot(6.42, 6.75, { cam: [[6.42, 384, 470, 1.5, 6, "ease-out"], [6.75, 384, 220, 1.4, 8]], worldHtml: html });
}

// ---- 7. in the air: the twin tears out of a rift above it and spikes it down.
{
    const pts = [[6.75, 290, 40, 540, 1, "cubic-bezier(.2,.8,.4,1)"], [7.45, 290, -230, 790], [7.55, 290, -230, 800, 1, "cubic-bezier(.6,0,.9,.6)"], [7.9, 290, 420, 980]];
    const body = rAt(290, -230, MID);
    const kick = [body[0] + 4, body[1] - 30];
    const tx = kick[0] - (Art.W - paw("cast")[0]) * PX, ty = kick[1] - paw("cast")[1] * PX;
    const tPts = [[7.2, tx + 30, ty - 160, -200, 0.4, "cubic-bezier(.2,.8,.3,1)"], [7.42, tx + 10, ty - 30, -20, 1], [7.5, tx, ty, 0, 1]];
    const small = [riftAt(tx + 72, ty - 150, 0.45, use("riftOpen1")), riftAt(tx + 72, ty - 150, 0.45, use("riftOpen3")), riftAt(tx + 72, ty - 150, 0.45, use("rift0"))];
    const html = S.seq(small, 7.12, 0.06, 7.7)
        + S.win(ghosts(rA(pose("fall"), mono("#5CCFFF")), pts, 3, 0.03), [[7.55, 8.05]])
        + actor(rA(pose("fall")), pts)
        + S.win(actor(tA(pose("fall")), tPts), [[7.2, 7.5]]) + S.win(place(tA(pose("cast")), tx, ty), [[7.5, 8.05]])
        + hit(kick[0], kick[1] + 10, 7.55, { size: 1.3, pal: PINK, trail: "#FF4FD8", color: "#FFD6F5", ringR: 140 })
        + streaks(body[0], body[1] - 100, body[0], body[1] + 500, 7.56, 14, { len: [100, 260] });
    shot(6.75, 8.05, {
        bg: speedBG("#090C18", "#18223C", -90, 0.35),
        cam: [[6.75, 384, 120, 1.6, 8, "cubic-bezier(.2,.8,.4,1)"], [7.35, 384, -140, 1.65, 6], [7.55, 384, -160, 1.75, 3, "ease-out"], [8.05, 384, -120, 1.6, 2]],
        worldHtml: html, quake: [[7.55, 0.3, 12]]
    });
}

// ---- 8. the slam: it hits the ground like a meteor.
const RD = 300;  // where it lands
{
    const land = rAt(RD, TOP, MID);
    let dust = "";
    for (let i = 0; i < 18; i++)
        dust += puff(land[0] + R(-80, 80), GROUND - R(6, 60), 8.13 + R(0, 0.1), { to: [10, 8, 7, 6][i % 4], dx: R(-160, 160), dy: -R(20, 90), life: R(1.4, 2.2), opacity: 0.9 });
    let cracks = "";
    for (let i = 0; i < 6; i++) {
        let qx = land[0] + R(-10, 10), qy = GROUND + 1, pts = `${r3(qx)},${qy}`;
        const dir = i % 2 ? 1 : -1;
        for (let k = 0; k < 4; k++) { qx += dir * R(12, 34); qy += R(1, 6); pts += ` ${Math.round(qx)},${Math.round(qy)}`; }
        cracks += `<polyline points="${pts}" fill="none" stroke="#211E30" stroke-width="4"/>`;
    }
    const html = world + rift()
        + actor(rA(pose("fall")), [[8.05, RD, -260, 980, 1, "ease-in"], [8.13, RD, TOP, 1080]])
        + S.win(place(cracks, 0, 0), [[8.13, 8.7]])
        + hit(land[0], GROUND - 20, 8.13, { size: 1.8, ringR: 120 }) + ring(land[0], GROUND, 8.13, { r: 420, flat: 0.1, width: 6, life: 0.55 })
        + dust + Array.from({ length: 14 }, (_, i) => rock(land[0] + R(-40, 40), GROUND - 6, 8.14, { bit: i > 7, vx: R(-300, 300), vy: -R(300, 800), life: R(1.2, 1.6) })).join("");
    shot(8.05, 8.7, { cam: [[8.05, 430, 470, 1.25, -7], [8.7, 430, 480, 1.2, -5]], worldHtml: html, quake: [[8.13, 0.5, 18]] });
}

// ---- 9. silence. The dust hangs; the twin lands, looks -- and in the dust,
// two eyes light up.
{
    const land = rAt(RD, TOP, MID), TL = 640;
    let dust = "";
    for (let i = 0; i < 14; i++)
        dust += puff(land[0] + R(-90, 90), GROUND - R(10, 80), 8.6 + R(0, 0.3), { to: [11, 9, 8][i % 3], dx: R(-40, 40), dy: -R(10, 30), life: R(1.5, 2.1), opacity: 0.85, mode: "io" });
    const glowEyes = `<g filter="url(#soft)">${pix(Art.eyesGlow(), PX, RD, TOP, { pal: { y: "#FFE45C" } })}</g>` + pix(Art.eyesGlow(), PX, RD, TOP, { pal: { y: "#FFF7C2" } });
    const html = world + rift()
        + `<ellipse cx="${land[0]}" cy="${GROUND - 50}" rx="170" ry="90" fill="url(#dark)" opacity=".6"/>` + dust
        + actor(S.win(tA(pose("fall")), [[8.7, 9.2]]) + S.win(tA(pose("land")), [[9.2, 9.45]]) + S.win(tLoop("annoyed"), [[9.45, 9.85]]),
            [[8.7, TL, -120, 0, 1, "ease-in"], [9.2, TL, TOP]])
        + puff(TL + 70, GROUND - 8, 9.2, { to: 5, dx: -30, dy: -10 }) + puff(TL + 70, GROUND - 8, 9.2, { to: 5, dx: 30, dy: -10 })
        + S.fade(glowEyes, [[9.45, 0], [9.6, 1]]);
    shot(8.7, 9.85, { cam: [[8.7, 470, 480, 1.2, -2, "ease-in-out"], [9.85, 470, 490, 1.42, 0]], worldHtml: html });

    // The eyes, close up, in the dark.
    const face = rAt(RD, TOP, FACE);
    const motes = Array.from({ length: 16 }, () => {
        const dur = R(2, 3.4);
        return `<g class="drift" style="animation-duration:${r3(dur)}s;animation-delay:-${r3(R(0, dur))}s;--dx:${r3(R(-80, 80))}px;--dy:-${r3(R(40, 120))}px">${rect(R(0, W), R(0, H), 4, 4, "#3A4052")}</g>`;
    }).join("");
    shot(9.85, 10.3, {
        bg: flat("#06070C") + motes, cam: [[9.85, face[0], face[1], 7.0, 0], [10.3, face[0], face[1] - 2, 7.8, -2]],
        worldHtml: place(rA(pose("idle"), mono("#11151F", { R: "#1A2030" })), RD, TOP) + S.fade(glowEyes, [[9.85, 0.6], [10.05, 1], [10.1, 0.7], [10.15, 1]])
    });
}

// ---- 10. the nano suit: the dust blown away, plate flowing over it from
// the core, the camera circling; then the visor lights.
{
    const core = rAt(RD, TOP, CORE), land = rAt(RD, TOP, MID);
    const nanoOn = [0.08, 0.17, 0.27, 0.37, 0.47, 0.57, 0.67, 0.77, 0.87, 0.95].map((t) => rA(pose("idle", 0, { ...ARMOR, nano: t, visor: 0 })));
    const visorOn = [1, 2, 3, 4, 5, 6].map((k) => rA(pose("idle", 0, { ...ARMOR, visor: k / 7 })));
    let swarm = "";
    for (let i = 0; i < 30; i++) {
        const a = R(0, 6.28), r = R(60, 140) * K, ox = Math.cos(a) * r, oy = Math.sin(a) * r;
        swarm += S.shot(effect("nano", core[0] + ox, core[1] + oy), 10.42 + i * 0.02, R(0.22, 0.34), { dx: -ox * 0.95, dy: -oy * 0.95, ease: "ease-in" });
    }
    let blown = "";
    for (let i = 0; i < 12; i++) {
        const a = R(-3.0, -0.1);
        blown += puff(land[0] + Math.cos(a) * 40, land[1] + Math.sin(a) * 30 + 30, 10.3, { to: [9, 7, 6][i % 3], dx: Math.cos(a) * R(160, 300), dy: Math.sin(a) * R(60, 160), life: R(0.5, 0.8) });
    }
    const html = world + rift() + blown + ring(land[0], land[1], 10.3, { r: 260, color: "#8FE0FF", width: 5 })
        + place(S.win(rA(pose("idle")), [[10.3, 10.46]]) + S.seq(nanoOn, 10.46, 0.06) + S.seq(visorOn, 11.06, 0.032, 11.25), RD, TOP)
        + S.win(effect("core", ...core), [[10.36, 10.66]]) + swarm;
    shot(10.3, 11.25, { cam: [[10.3, land[0], land[1] - 10, 2.6, -10, "ease-in-out"], [11.25, land[0], land[1] - 16, 2.95, 6]], worldHtml: html, quake: [[10.3, 0.25, 6]] });

    const visor = rAt(RD, TOP, VISOR);
    const flash = S.shot(rect(0, H / 2 - 52, W, 6, "#FFFFFF") + rect(0, H / 2 - 50, W, 2, "#8FE0FF"), 11.3, 0.5, { s0: 0.1, s1: 1, origin: [W / 2, H / 2 - 50], mode: "io" });
    shot(11.25, 11.9, {
        bg: flat("#05060B"), cam: [[11.25, visor[0], visor[1] + 4, 6.0, 0], [11.9, visor[0], visor[1] + 4, 6.6, 0]],
        worldHtml: place(rA(pose("idle", 0, ARMOR)), RD, TOP) + S.win(effect("flash", visor[0] + 10, visor[1]), [[11.3, 11.55]]), fg: flash
    });
}

// ---- 11. dogfight: jets, the twin's bolts missing by a hair, a stream of
// lightning back, web strands to hold it.
const AIR = [430, 190], TL = 640;
{
    const pts = [[11.9, RD, TOP, 0, 1, "ease-in"], [12.12, 340, 330, -8, 1, "ease-in-out"], [12.25, 400, 230, 10, 1, "ease-in-out"], [12.38, 380, 160, -10, 1, "ease-out"], [12.55, ...AIR, 0, 1]];
    const feet = [Art.X0 + 5.5, Art.H];
    const flame = (dx, delay) => `<g class="rise" style="animation-delay:${delay}s;--dx:${R(-4, 4).toFixed(1)}px;--dy:34px">${effect("flame", feet[0] * PX + dx, feet[1] * PX + 10)}</g>`;
    const jets = flame(-16, 0) + flame(16, -0.13) + flame(0, -0.07);
    const flyer = rLoop("fly", ARMOR) + jets;
    const tp = tAt(TL, TOP, paw("cast"));
    const misses = [[12.0, [250, 220]], [12.2, [330, 120]], [12.36, [300, 60]]];
    let html = world + rift() + ghosts(rLoop("fly", ARMOR, mono("#5CCFFF")), pts, 3, 0.04) + actor(flyer, pts)
        + place(S.win(tA(pose("land")), [[11.9, 12.0]]) + S.win(tA(pose("cast")), [[12.0, 12.55]]), TL, TOP)
        + puff(RD + 84, GROUND - 8, 11.92, { to: 7, dx: -50, dy: -16 }) + puff(RD + 84, GROUND - 8, 11.92, { to: 6, dx: 50, dy: -12 })
        + misses.map(([t, aim]) => bolt(tp, aim, t, { grow: 0.06, hold: 0.12, fadeOut: 0.12, pal: PINK, opts: { forks: 0 }, redraws: 1 })).join("");
    shot(11.9, 12.55, { cam: [[11.9, 420, 470, 1.5, 10, "ease-in-out"], [12.55, 480, 320, 1.4, 5]], worldHtml: html });

    // The stream of lightning: over its shoulder, down at the twin.
    const hand = rAt(...AIR, grip("charge")), body = tAt(TL, TOP, MID);
    const zapped = tA(pose("alert"), mono("#FFF4FE", { "#": "#2A1640", e: "#2A1640" }));
    html = world + place(rLoop("charge", ARMOR) + jets, ...AIR) + place(S.loop([tA(pose("alert")), zapped], 14), TL, TOP)
        + S.win(S.loop([0, 1, 2].map(() => boltOnce(hand, body, CYAN, { scale: 0.6, forks: 1 })), 16), [[12.6, 12.95]])
        + flare(...body, 140, 12.6, 0.8, 0.35) + crackle(...body, 12, 14, 56, 12.6, 0.3);
    shot(12.55, 12.95, { cam: [[12.55, 560, 390, 1.55, -12], [12.95, 572, 396, 1.68, -12]], worldHtml: html, quake: [[12.6, 0.35, 4]] });

    // Web strands: the twin bound where it stands.
    const hand2 = rAt(...AIR, grip("zap"));
    const targets = [[body[0], body[1], 1], [body[0] - 60 * K, GROUND - 2, 0], [body[0] + 64 * K, GROUND - 2, 0]].map(([x, y, m]) => [(x - hand2[0]) / fx, (y - hand2[1]) / fx, m]);
    const growing = [0.3, 0.55, 0.8].map((g) => shapes(Art.strands(targets, 0, g), fx, hand2[0], hand2[1], WEB));
    const rippling = [0, 1.2, 2.4].map((ph) => shapes(Art.strands(targets, ph, 1), fx, hand2[0], hand2[1], WEB));
    html = world + rift() + place(rLoop("zap", ARMOR) + jets, ...AIR) + place(tLoop("annoyed"), TL, TOP)
        + S.seq(growing, 12.95, 0.05) + S.win(S.loop(rippling, 10), [[13.1, 13.6]]) + S.win(place(webbed(0, 0), TL, TOP), [[13.1, 13.6]]);
    shot(12.95, 13.6, { cam: [[12.95, 600, 440, 1.75, 8, "ease-in"], [13.6, 630, 470, 2.2, 10]], worldHtml: html });
}

// The twin, webbed: a web over its art at (x, y).
function webbed(x, y) {
    const c = [x + (Art.W - MID[0]) * PX, y + (MID[1] + 1) * PX], rr = 14, rows = [];
    for (let j = -rr; j <= rr; j++) {
        let row = "";
        for (let i = -rr; i <= rr; i++) {
            const d = Math.hypot(i, j), a = ((Math.atan2(j, i) / Math.PI) * 4 + 8) % 1;
            row += d > rr ? " " : (a < 0.09 || a > 0.91) || Math.abs(d - 6) < 0.5 || Math.abs(d - 11) < 0.5 ? "g" : " ";
        }
        rows.push(row);
    }
    return `<g opacity=".85">${pix(rows, fx, c[0] - rr * fx, c[1] - rr * fx, { pal: WEB })}</g>`;
}

// ---- 12. the charge: down, suit off -- then the ground gives up the ghost:
// gold aura, rocks lifting in slow motion, lightning climbing round it.
const RB = 200;  // where it stands for the end of it
{
    const core = rAt(RB, TOP, CORE);
    const nanoOff = [0.75, 0.5, 0.25, 0.06].map((t) => rA(pose("idle", 0, { ...ARMOR, nano: t, visor: 0 })));
    let html = world + rift() + place(tLoop("annoyed") + webbed(0, 0), TL, TOP)
        + actor(S.win(rLoop("fly", ARMOR), [[13.6, 13.78]]) + S.win(rA(pose("land", 0, ARMOR)), [[13.78, 13.84]]) + S.seq(nanoOff, 13.84, 0.04, 14.0),
            [[13.6, ...AIR, 0, 1, "ease-in"], [13.78, RB, TOP]])
        + dustRing(RB + 84, 13.78, 6, 90)
        + Array.from({ length: 12 }, () => { const a = R(0, 6.28), r = R(20, 80) * K; return S.shot(effect("nano", core[0] + Math.cos(a) * r, core[1] + Math.sin(a) * r), 13.84 + R(0, 0.12), 0.18, { dx: -Math.cos(a) * r, dy: -Math.sin(a) * r, ease: "ease-in" }); }).join("");
    shot(13.6, 14.0, { cam: [[13.6, 420, 480, 1.45, 0], [14.0, 400, 490, 1.55, -2]], worldHtml: html, quake: [[13.78, 0.2, 8]] });

    // The charge itself.
    const x = RB + MID[0] * PX;
    const cols = [0, 1, 2, 3].map((i) => ({ dx: (i % 2 ? 1 : -1) * R(20, 80) * K, h: R(0.7, 1.25), lean: R(-24, 24) * K }));
    const columns = [0.25, 0.6, 0.95].map((p) => [0, 1].map(() => cols.map((c) => {
        const h = (60 + 200 * p) * c.h * K;
        return boltOnce([x + c.dx - c.lean, GROUND - h], [x + c.dx, GROUND], CYAN, { scale: 0.42, forks: rnd() < 0.3 ? 1 : 0 });
    }).join("")));
    let rocks = "";
    for (let i = 0; i < 16; i++) rocks += floatRock(x + R(-130, 130), 14.0 + R(0, 0.35), 17.25, R(40, 190), [R(300, 700), R(-200, 100)]);
    html = world + rift() + place(tLoop("annoyed") + webbed(0, 0), TL, TOP)
        + columns.map((pair, i) => S.win(S.loop(pair, 14), [[14.0 + i * 0.3, 14.0 + (i + 1) * 0.3]])).join("")
        + place(S.fade(aura(pose("land"), "#FFC43A"), [[14.0, 0], [14.15, 1]]) + rA(pose("land")), RB, TOP)
        + rocks
        + Array.from({ length: 16 }, () => ember(x + R(-30, 30) * K, GROUND - R(0, 40) * K, 14.0 + R(0, 0.85), { color: ["#FFD84A", "#FFE98A", "#FFFFFF"][Math.floor(rnd() * 3)] })).join("")
        + crackle(x, GROUND - 60, 10, 20, 70, 14.0, 0.85);
    shot(14.0, 14.9, { cam: [[14.0, 330, 500, 1.55, 0, "ease-in"], [14.9, 330, 500, 1.9, -5]], worldHtml: html, quake: [[14.0, 0.9, 3]] });

    // The twin tears the web apart, its own aura up.
    const tb = tAt(TL, TOP, MID);
    const shreds = Array.from({ length: 20 }, () => { const a = R(0, 6.28); return S.shot(rect(tb[0], tb[1], fx * 2, fx, "#E8ECF4"), 14.95, 0.35, { dx: Math.cos(a) * R(80, 200), dy: Math.sin(a) * R(80, 200), r: R(-180, 180), origin: tb }); }).join("");
    html = place(S.fade(aura(pose("land"), "#FF4FD8", { flip: true }), [[14.9, 0.4], [15.0, 1]]) + tA(pose("land")), TL, TOP)
        + S.win(webbed(TL, TOP), [[14.9, 14.95]]) + shreds + crackle(...tb, 8, 20, 60, 14.9, 0.2, { h: "#FFE6F8", b: "#FF4FD8" });
    shot(14.9, 15.15, { bg: focusBG("#1A0716", "#5E1C52"), cam: [[14.9, tb[0], tb[1] - 20, 3.0, 10], [15.15, tb[0], tb[1] - 24, 3.3, 11]], worldHtml: html, quake: [[14.95, 0.2, 6]] });

    // Rascal's eye, gold.
    const eye = rAt(RB, TOP, EYE);
    html = place(rA(pose("annoyed"), { ...PAL, e: "#FFD84A" }), RB, TOP) + glint(eye[0] + 4, eye[1] - 2, 15.2, "#FFF7C2", 2);
    shot(15.15, 15.4, { bg: speedBG("#170F02", "#4A360C", 0, 0.3), cam: [[15.15, eye[0], eye[1], 8.5, -4], [15.4, eye[0], eye[1], 9.2, -4]], worldHtml: html });
}

// ---- 13. the beam struggle: its lightning against the twin's, the point
// where they meet shoved one way, then the other.
{
    const rp = rAt(RB, TOP, grip("charge")), tp = tAt(TL, TOP, grip("charge"));
    const clashAt = (xc) => {
        const c = [xc, rp[1]];
        return boltOnce(rp, c, CYAN, { scale: 0.75, forks: 0 }) + boltOnce(tp, c, PINK, { scale: 0.75, forks: 0 })
            + `<circle cx="${xc}" cy="${c[1]}" r="${90}" fill="url(#flare)"/>`
            + S.loop([Art.impact(11, 9), Art.impact(13, 8)].map((rows) => pix(rows, fx, xc - (rows.length * fx) / 2, c[1] - (rows.length * fx) / 2, { pal: { ...CYAN } })), 12);
    };
    const fighters = place(S.fade(aura(pose("charge"), "#FFC43A"), [[15.4, 1]]) + rLoop("charge"), RB, TOP)
        + place(S.fade(aura(pose("charge"), "#FF4FD8", { flip: true }), [[15.4, 1]]) + tLoop("charge"), TL, TOP);
    const steps = (list) => list.map(([t0, t1, xc]) => S.win(clashAt(xc), [[t0, t1]])).join("");
    let html = world + rift() + fighters + steps([[15.4, 15.62, 490], [15.62, 15.82, 462], [15.82, 16.0, 432]])
        + crackle(470, rp[1], 12, 30, 90, 15.4, 0.6);
    shot(15.4, 16.0, { cam: [[15.4, 440, 480, 1.3, 0], [16.0, 440, 480, 1.4, 0]], worldHtml: html, quake: [[15.4, 0.6, 5]] });

    // Close: Rascal, straining...
    const rf = rAt(RB, TOP, FACE);
    html = place(S.fade(aura(pose("charge"), "#FFC43A"), [[16.0, 1]]) + rLoop("charge"), RB, TOP)
        + boltOnce(rp, [rp[0] + 420, rp[1]], CYAN, { scale: 0.75, forks: 0 }) + flare(rp[0] + 380, rp[1], 260, 16.0, 0.9, 0.3, "pinkFlare");
    shot(16.0, 16.3, { bg: focusBG("#0A1428", "#1F4A78", 760, 380), cam: [[16.0, rf[0] + 40, rf[1] + 20, 3.4, -9], [16.3, rf[0] + 40, rf[1] + 20, 3.65, -10]], worldHtml: html, quake: [[16.0, 0.3, 6]] });
    // ...the twin, straining...
    const tf = tAt(TL, TOP, FACE);
    html = place(S.fade(aura(pose("charge"), "#FF4FD8", { flip: true }), [[16.3, 1]]) + tLoop("charge"), TL, TOP)
        + boltOnce(tp, [tp[0] - 420, tp[1]], PINK, { scale: 0.75, forks: 0 }) + flare(tp[0] - 380, tp[1], 260, 16.3, 0.9, 0.3);
    shot(16.3, 16.6, { bg: focusBG("#1A0716", "#5E1C52", 200, 380), cam: [[16.3, tf[0] - 40, tf[1] + 20, 3.4, 9], [16.6, tf[0] - 40, tf[1] + 20, 3.65, 10]], worldHtml: html, quake: [[16.3, 0.3, 6]] });

    // ...and the lot goes up.
    html = world + rift() + fighters + steps([[16.6, 16.74, 462], [16.74, 16.86, 520], [16.86, 16.92, 576]])
        + hit(560, rp[1], 16.92, { size: 2.2, ringR: 200 }) + flare(560, rp[1], 520, 16.92, 1, 0.5)
        + Array.from({ length: 12 }, (_, i) => puff(560 + R(-60, 60), rp[1] + R(-40, 40), 16.95, { to: [10, 8, 7][i % 3], dx: R(-200, 200), dy: R(-120, 60), life: R(0.8, 1.2) })).join("");
    shot(16.6, 17.0, { cam: [[16.6, 440, 480, 1.4, 0, "ease-in"], [17.0, 470, 480, 1.55, 3]], worldHtml: html, quake: [[16.6, 0.3, 6], [16.92, 0.1, 18]] });
}

// ---- 14. the end of it: its eye through the smoke -- the thunder slash --
// impact frames -- white.
{
    const eye = rAt(RB, TOP, EYE);
    shot(17.0, 17.2, {
        bg: flat("#08090E"), cam: [[17.0, eye[0], eye[1], 8.5, 3], [17.2, eye[0], eye[1], 9.4, 3]],
        worldHtml: place(rA(pose("annoyed"), mono("#151A26", { e: "#FFE45C" })), RB, TOP) + glint(eye[0] + 4, eye[1] - 2, 17.05, "#FFF7C2", 2)
    });

    const from = rAt(RB, TOP, MID), to = [rAt(800, TOP, MID)[0], from[1]];
    let html = world + rift() + place(tA(pose("alert")), TL, TOP)
        + bolt(from, to, 17.2, { grow: 0.08, hold: 0.25, fadeOut: 0.2, opts: { floor: (GROUND - from[1]) / bfx - 7 } })
        + streaks(from[0], from[1], to[0], to[1], 17.2, 16) + dustRing(from[0], 17.2, 6, 100);
    shot(17.2, 17.38, { cam: [[17.2, 500, 500, 1.4, -6], [17.38, 520, 500, 1.5, -6]], worldHtml: html, quake: [[17.2, 0.18, 10]] });

    const cam = [[17.38, 700, 520, 2.0, -6]];
    const mid = rAt(TL, TOP, MID);
    const figs = (ink, eyes) => sil(pose("run"), 760, TOP, ink, { eyes }) + sil(pose("alert"), TL, TOP, ink, { flip: true, eyes });
    const slashArt = Art.bolt((to[0] - from[0]) / bfx, 0, { pieces: 1, scale: 1.1 });
    const slash = (fill) => boltDraw(slashArt, from[0], mid[1], mono(fill, { N: `${fill}@.35` }));
    // Easter egg: the artist's signature, in the corner of a white one.
    const sign = plainWord("ICYCLE"), sx = W - 44 - sign[0].length * 4, sy = H - 44 - 7 * 4;
    const signature = rect(sx - 8, sy - 8, sign[0].length * 4 + 16, 7 * 4 + 16, PAPER) + pix(sign, 4, sx, sy, { pal: { c: INK } });
    impactFrame(17.38, 17.45, { cam, ground: INK, ink: PAPER, figures: (c) => figs(c, INK) + slash(c), inner: 140, n: 40 });
    impactFrame(17.45, 17.52, { cam, ground: PAPER, ink: INK, figures: (c) => figs(c, PAPER) + slash(c), inner: 120, extra: signature });
    impactFrame(17.52, 17.59, { cam: [[17.52, 700, 520, 2.4, 4]], ground: "#E84855", ink: INK, figures: (c) => figs(c, "#E84855") + slash(c), inner: 160 });
    impactFrame(17.59, 17.66, { cam: [[17.59, 700, 520, 2.6, -10]], ground: INK, ink: PAPER, figures: (c) => figs(c, "#FFD84A") + slash("#FFD84A"), inner: 100, n: 46 });
    impactFrame(17.66, 17.73, { cam: [[17.66, 700, 520, 2.2, 0]], ground: PAPER, ink: INK, figures: (c) => figs(c, PAPER), inner: 150 });
}

// ---- 15. after: it stands with its back to the twin. A beat. The twin
// cracks, comes apart pixel by pixel, and the rift drinks it in, and shuts.
{
    const RF = 800;
    const twinRows = pose("alert");
    let dust = "";
    twinRows.forEach((row, y) => [...row].forEach((ch, i) => {
        if (ch === " " || !TWIN[ch]) return;
        const col = Art.W - 1 - i, x0 = TL + col * PX, y0 = TOP + y * PX;
        const hold = (col / (Art.W - 1)) * 0.6 + R(0, 0.25);
        const dx = (RIFT_C[0] - x0) * R(0.55, 0.95) + R(-30, 30), dy = (RIFT_C[1] - y0) * R(0.5, 0.95) + R(-50, 10);
        dust += S.shot(rect(x0, y0, PX, PX, TWIN[ch].split("@")[0]), 18.9, hold + 0.95, { dx, dy, s1: 0.35, hold, r: R(-90, 90), ease: "cubic-bezier(.5,0,.8,.6)", origin: [x0 + PX / 2, y0 + PX / 2] });
    }));
    let cracks = "";
    for (let i = 0; i < 4; i++) {
        let x = TL + R(30, 110), y = TOP + R(10, 40);
        for (let k = 0; k < 12; k++) { cracks += rect(x, y, PX / 2, PX / 2, "#FFFFFF"); x += R(-1, 1) * PX * 0.6; y += PX * 0.55; }
    }
    const html = world
        + S.win(rift(), [[17.73, 20.0]]) + S.seq([use("riftShut0"), use("riftShut1"), use("riftShut2")], 20.0, 0.07)
        + flare(...RIFT_C, 220, 20.24, 0.9, 0.3, "pinkFlare") + burst(...RIFT_C, 20.24, { radius: 70, sparks: 14, color: "#DCC6FF", trail: "#A46BFF" })
        + place(S.win(rA(pose("land")), [[17.73, 18.3]]) + S.win(rLoop("idle"), [[18.3, 20.4]]), RF, TOP)
        + S.win(place(tA(twinRows), TL, TOP) + S.win(cracks, [[18.5, 18.9]]), [[17.73, 18.9]]) + dust
        + crackle(rAt(RF, TOP, MID)[0], rAt(RF, TOP, MID)[1], 10, 14, 60, 17.75, 0.9)
        + S.fade(boltOnce(rAt(RB, TOP, MID), [rAt(RF, TOP, MID)[0], rAt(RB, TOP, MID)[1]], CYAN, { scale: 0.35 }), [[17.73, 0.8], [18.1, 0]]);
    shot(17.73, 20.4, { cam: [[17.73, 640, 480, 1.35, 4, "ease-out"], [20.4, 600, 470, 1.12, 0]], worldHtml: html });
    // Whiting out from the blow.
    shots.push(S.fade(flat("#FFFFFF"), [[17.729, 0], [17.73, 1, "ease-out"], [18.2, 0]]));

    // ---- 16. the stars come out.
    shot(20.4, D, {
        cam: [[20.4, 600, 470, 1.12, 0, "cubic-bezier(.4,0,.2,1)"], [21.7, 560, 262, 1.0, 0], [D, 560, 254, 1.0, 0]],
        worldHtml: world + place(rLoop("idle"), RF, TOP) + constellationLit
    });
}

// In from nothing, out to nothing (the loop's seam).
const body = S.fade(`<g clip-path="url(#frame)">\n${shots.join("\n")}\n</g>`, [[0, 0], [0.45, 1], [D - 0.6, 1], [D, 0]], { base: 1 });
const svg = S.svg(body, "An anime-style fight to the death between Rascal, a pixel raccoon in a green dino hood, and its purple double from a workspace rift: eye close-ups, a dash and clash, a rapid exchange, a slam, the nano suit, a dogfight, a thunder charge, a beam struggle, impact frames, and the double coming apart into the rift", defs.join("\n") + spriteDefs.join(""));
fs.writeFileSync(OUT, svg);
console.log(`${path.basename(OUT)}  ${W}x${H}  ${(svg.length / 1024).toFixed(1)} KB, ${S.n} animations`);
