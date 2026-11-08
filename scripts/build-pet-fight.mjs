#!/usr/bin/env node
// Builds assets/pet-fight.svg: Rascal, the desktop pet from my Quickshell
// config, fighting its double from the other side of a workspace rift, using
// everything it can do. The pet, its poses, the nano suit, the lightning, the
// impact stars and the web strands are all drawn by its own sprite code
// (Pet/pet-art.js), in its own colours; the timing follows Pet.qml's moves,
// slowed down a little so you can see them. Plain SVG + CSS, no scripts, so
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
    const out = { idle: 3, annoyed: 4, fly: 6, charge: 9, zap: 5, dynamo: 14, flex: 3 };
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
// Strands (PetPower): core, glow, webbing, crosshair.
const WEB = { h: "#FFFFFF", n: "#91CEF5", g: "#C8CCE0", r: "#E84855" };
const RIFT = { h: "#FFFFFF", a: "#DCC6FF", b: "#A46BFF", d: "#4B2A8C", k: "#12081F", n: "#A46BFF@.5" };
const DUST = { a: "#F2EDE4", b: "#D8D1C6", c: "#AAA49C" };
const mono = (fill, keep = {}) => new Proxy({}, { get: (_, ch) => keep[ch] || fill });
const INK = "#0B0B12";

const SANS = "Inter, 'Segoe UI', Roboto, Arial, sans-serif";
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
// A character grid as pixel art, `px` user units a pixel.
function pix(rows, px, x = 0, y = 0, { flip = false, pal = PAL } = {}) {
    return `<g transform="translate(${r3(x)} ${r3(y)}) scale(${px})">${paint(Art.paths(rows, flip), pal)}</g>`;
}
// Ready-made shapes ({ paths, origin }) with their origin at (x, y).
function shapes(sh, px, x, y, pal) {
    return `<g transform="translate(${r3(x + sh.origin[0] * px)} ${r3(y + sh.origin[1] * px)}) scale(${px})">${paint(sh.paths, pal)}</g>`;
}
const rect = (x, y, w, h, fill, extra = "") => `<rect x="${r3(x)}" y="${r3(y)}" width="${r3(w)}" height="${r3(h)}" fill="${fill}"${extra}/>`;

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

    // Shown only within these windows ([from, to] s).
    win(content, windows, { still = false } = {}) {
        const id = this.uid("w"), steps = [[0, "opacity:0"]];
        for (const [a, b] of windows) { steps.push([a, "opacity:1"]); if (b < this.D) steps.push([b, "opacity:0"]); }
        this.css.push(`${this.keyframes(id, steps)}.${id}{animation:${id} ${this.D}s step-end infinite;opacity:${still ? 1 : 0}}`);
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
        this.css.push(`${this.keyframes(id, steps)}.${id}{animation:${id} ${this.D}s linear infinite;transform-origin:${r3(origin[0])}px ${r3(origin[1])}px}`);
        return `<g class="${id}"${still ? ` transform="translate(${still[0]} ${still[1]})"` : ""}>${content}</g>`;
    }
    // Opacity along [t, value, easing].
    fade(content, pts) {
        const id = this.uid("o");
        this.css.push(`${this.keyframes(id, pts.map(([t, v, e]) => [t, `opacity:${v}`, e]))}.${id}{animation:${id} ${this.D}s linear infinite;opacity:0}`);
        return `<g class="${id}">${content}</g>`;
    }
    // A one-off: at t0, for `dur`, flies off by (dx, dy), turning `r` and
    // scaling s0 -> s1 round `origin`, fading out ("o") or in and out ("io").
    shot(content, t0, dur, { dx = 0, dy = 0, r = 0, s0 = 1, s1 = 1, ease = "ease-out", origin, mode = "o" } = {}) {
        const k = `${mode}${Math.round(dur * 100)}`;
        if (!this.shots.has(k)) {
            this.shots.add(k);
            const p = (dur / this.D) * 100, end = "transform:translate(var(--dx),var(--dy)) rotate(var(--r)) scale(var(--s1))";
            const mid = mode === "io" ? `${r3(p * 0.15)}%{opacity:1}${r3(p * 0.7)}%{opacity:1}` : "";
            this.css.push(`@keyframes s${k}{0%{opacity:${mode === "io" ? 0 : 1};transform:translate(0px,0px) rotate(0deg) scale(var(--s0))}${mid}`
                + `${r3(p)}%{opacity:0;${end}}100%{opacity:0;${end}}}.s${k}{animation:s${k} ${this.D}s infinite;opacity:0}`);
        }
        const o = origin ? `;transform-origin:${r3(origin[0])}px ${r3(origin[1])}px` : "";
        return `<g class="s${k}" style="animation-delay:${r3(t0)}s;animation-timing-function:${ease};--dx:${r3(dx)}px;--dy:${r3(dy)}px;--r:${r3(r)}deg;--s0:${s0};--s1:${s1}${o}">${content}</g>`;
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
.pop{animation:pop .5s step-end infinite;opacity:0}
@keyframes pop{0%{opacity:1}40%{opacity:0}100%{opacity:0}}
.dash{animation-timing-function:linear;animation-iteration-count:infinite}
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

// ---------------------------------------------------------------- the stage

const W = 960, H = 440, D = 21.2;
const GROUND = 388, px = 7, fx = 4, bfx = 3;
const TOP = GROUND - Art.H * px;                // the pets' art top: 280
const S = new Scene(W, H, D);

const MODS = { rim: true, face: "raccoon" };
const pose = (st, f = 0, m = {}) => Art.pose(st, f, { ...MODS, ...m });
const frames = (st, m = {}) => Array.from({ length: Art.FRAMES[st] || 1 }, (_, f) => pose(st, f, m));
const ARMOR = { wear: "armor" };

// Rascal: drawn at (0, 0) inside its mover. A point of its art (art
// pixels, facing right) at its position (x, y).
const me = (rows, pal = PAL) => pix(rows, px, 0, 0, { pal });
const at = (x, y, p) => [x + p[0] * px, y + p[1] * px];
// The twin: faces left, standing at TX (before its knock back) .
const TX = 620, KNOCK = 40;
const twin = (rows, pal = TWIN) => pix(rows, px, TX, TOP, { flip: true, pal });
const tat = (p, knocked = true) => [TX + (knocked ? KNOCK : 0) + (Art.W - p[0]) * px, TOP + p[1] * px];

const CORE = Art.NANO_CORE, HEAD = [Art.HEAD_X, Art.HEAD_Y], MID = [Art.X0 + 5.5, Art.TOP + 10];
const RIFT_C = [872, 252];
// Where Rascal is: home, where it lands after flying, where the thunder
// slash takes it, up in the air. cx(): the middle of its body there.
const HOME = 140, LAND = 240, DEST = 528, AIR = [320, 108];
const cx = (x) => x + MID[0] * px;

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
// A streak of light rising off something.
const ember = (x, y, t, { vy = -R(160, 320), len = 2 + Math.floor(rnd() * 3), life = R(0.26, 0.42), color = "#FFD84A" } = {}) =>
    S.shot(rect(x, y, fx, len * fx, color), t, life, { dy: vy * life });
// A cloud of dust billowing out as it drifts, thinning away.
function puff(x, y, t, { from = 2, to = 5, dx = 0, dy = -20, life = 0.7 } = {}) {
    const r = Math.round(to), rows = [];
    for (let j = -r; j < r; j++) {
        let row = "";
        for (let i = -r; i < r; i++) {
            const d = Math.hypot(i + 0.5, j + 0.5) / r;
            row += d > 1 ? " " : d > 0.75 ? "c" : d > 0.4 ? "b" : "a";
        }
        rows.push(row);
    }
    return S.shot(`<g opacity=".8">${pix(rows, fx, x - r * fx, y - r * fx, { pal: DUST })}</g>`, t, life,
        { dx, dy, s0: from / to, s1: 1, origin: [x, y], ease: "cubic-bezier(.2,.7,.4,1)" });
}
// A chunk of broken ground, lit by the lightning, flung off at (vx, vy)
// px/s and tumbling a quarter turn at a time till it comes down.
function rock(x, y, t, { vx = 0, vy = -400, bit = false, life = 1.6, g = 1500 } = {}) {
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
    const body = cells.map((c) => rect(c[0] * fx - fx / 2, c[1] * fx - fx / 2, fx, fx, colour(c))).join("");
    const floor = GROUND - (Math.max(...ys) + 1) * fx + fx / 2;
    const lands = (-vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, floor - y))) / g;
    const steps = [[0, `transform:translate(${x}px,${y}px);opacity:0`], [t - 0.001, `transform:translate(${x}px,${y}px);opacity:0`]];
    for (let s = 0; s <= lands + 1e-6; s += 0.05) {
        const tt = Math.min(s, lands);
        steps.push([t + tt, `transform:translate(${r3(x + vx * tt)}px,${r3(Math.min(floor, y + vy * tt + 0.5 * g * tt * tt))}px);opacity:1`]);
    }
    const rest = `transform:translate(${r3(x + vx * lands)}px,${r3(floor)}px)`;
    steps.push([t + lands, `${rest};opacity:1`], [t + life - 0.25, `${rest};opacity:1`], [t + life, `${rest};opacity:0`]);
    const id = S.uid("k"), spin = S.uid("q"), turns = [[0, "transform:rotate(0deg)"]];
    const every = R(0.06, 0.15);
    for (let s = 0, k = Math.floor(rnd() * 4); s < lands; s += every, k++) turns.push([t + s, `transform:rotate(${(k % 4) * 90}deg)`]);
    S.css.push(`${S.keyframes(id, steps)}.${id}{animation:${id} ${D}s linear infinite;opacity:0}`
        + `${S.keyframes(spin, turns)}.${spin}{animation:${spin} ${D}s step-end infinite}`);
    return `<g class="${id}"><g class="${spin}">${body}</g></g>`;
}
// A pixel shockwave: a ring of sparks flying out, a cross of light flaring
// and shrinking away.
function burst(x, y, t, { radius = 56, sparks = 16, glint = 90, life = 0.38, color = "#FFD84A", trail = "#5CCFFF" } = {}) {
    let s = "";
    for (let i = 0; i < sparks; i++) {
        const a = (i / sparks) * 2 * Math.PI + R(-0.2, 0.2), r = radius * R(0.75, 1.15);
        s += S.shot(rect(x - fx / 2, y - fx / 2, fx, fx, i % 2 ? "#FFFFFF" : color), t, life, { dx: Math.cos(a) * r, dy: Math.sin(a) * r, ease: "cubic-bezier(.2,.8,.3,1)" });
        s += S.shot(rect(x - fx / 2, y - fx / 2, fx, fx, trail), t + 0.03, life, { dx: Math.cos(a) * r * 0.7, dy: Math.sin(a) * r * 0.7, ease: "cubic-bezier(.2,.8,.3,1)" });
    }
    s += S.shot(rect(x - glint / 2, y - 3, glint, 6, "#FFFFFF") + rect(x - 3, y - glint / 2, 6, glint, "#FFFFFF"), t, life * 0.8, { s0: 1, s1: 0.1, origin: [x, y] });
    return s;
}
// Pet.qml's impactAt: a comic star behind it, small, big, then middling.
function impact(x, y, t, { big = true, size = 1, pal = CYAN } = {}) {
    const set = [Art.impact(6 * size, 7), Art.impact(13 * size, 8), Art.impact(9 * size, 8)];
    const steps = big ? [[0, 0, 0.06], [1, 0.06, 0.11], [2, 0.17, 0.11]] : [[0, 0, 0.05], [2, 0.05, 0.09]];
    return steps.map(([k, a, d]) => {
        const rows = set[k], n = rows.length;
        return S.win(pix(rows, fx, x - (n * fx) / 2, y - (n * fx) / 2, { pal: { ...pal } }), [[t + a, t + a + d]]);
    }).join("");
}
// A bolt of lightning (Art.bolt) from `a` to `b`: it shoots across piece by
// piece, hangs there redrawn every few frames (on 4s, like hand-drawn
// lightning), then strobes, thins and goes.
function boltDraw(b, x, y, pal, pieces) {
    let s = "";
    for (const k of pieces) s += paint(b.pieces[k].paths, pal);
    return `<g transform="translate(${r3(x + b.origin[0] * bfx)} ${r3(y + b.origin[1] * bfx)}) scale(${bfx})">${s}</g>`;
}
function bolt(a, b, t0, { grow = 0.09, hold = 0.45, fadeOut = 0.32, pal = CYAN, opts = {} } = {}) {
    const dx = (b[0] - a[0]) / bfx, dy = (b[1] - a[1]) / bfx, K = 10;
    const first = Art.bolt(dx, dy, { pieces: K, ...opts });
    let s = "";
    for (let k = 0; k < K; k++) s += S.win(boltDraw(first, a[0], a[1], pal, [k]), [[t0 + (grow * k) / K, t0 + grow + 0.066]]);
    const redraws = [0, 1, 2].map(() => boltDraw(Art.bolt(dx, dy, { pieces: 1, ...opts }), a[0], a[1], pal, [0]));
    s += S.win(S.loop(redraws, 15), [[t0 + grow + 0.066, t0 + grow + hold]]);
    const thin = [0.65, 0.4].map((sc) => boltDraw(Art.bolt(dx, dy, { pieces: 1, scale: sc, ...opts }), a[0], a[1], pal, [0]));
    const t1 = t0 + grow + hold, q = fadeOut / 5;
    s += S.win(thin[0], [[t1 + q, t1 + 2 * q]]) + S.win(thin[1], [[t1 + 3 * q, t1 + 3.6 * q], [t1 + 4.2 * q, t1 + 5 * q]]);
    return s;
}
// A golden aura (Pet.qml's: the pet's shape, glowing gold, round it).
const glow = (rows, color, { flip = false, x = 0, y = 0, k = 1.3 } = {}) =>
    `<g filter="url(#aura)">${pix(rows, px * k, x - (Art.W * px * (k - 1)) / 2, y - Art.H * px * (k - 1), { flip, pal: mono(color) })}</g>`;
// A speech bubble like pet-rift-kick.svg's, its tail's tip at (tx, ty).
function bubble(text, tx, ty, { size = 19, left = false } = {}) {
    const w = Math.round(30 + text.length * size * 0.6), h = 40;
    const x = left ? tx - w + 20 : tx - 20, y = ty - h - 10;
    return rect(x, y, w, h, "#17191C", ' rx="12"') + rect(tx, ty - 12, 10, 6, "#17191C") + rect(left ? tx + 4 : tx, ty - 6, 6, 6, "#17191C")
        + `<text x="${x + w / 2}" y="${y + 27}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="${size}" fill="#FFFFFF" stroke="#91CEF5" stroke-width=".6" paint-order="stroke">${esc(text)}</text>`;
}
function say(text, tx, ty, a, b, opts) {
    const id = S.uid("b"), off = "opacity:0;transform:scale(.4)", on = "opacity:1;transform:scale(1)";
    S.css.push(`${S.keyframes(id, [[0, off], [a, off, "cubic-bezier(.2,.8,.3,1.3)"], [a + 0.22, on], [b - 0.14, on], [b, "opacity:0;transform:scale(.85)"]])}`
        + `.${id}{animation:${id} ${D}s infinite;opacity:0;transform-origin:${tx}px ${ty}px}`);
    return `<g class="${id}">${bubble(text, tx, ty, opts)}</g>`;
}
const effect = (name, x, y, pal = PAL, k = fx) => { const rows = Art.effect(name); return pix(rows, k, x - (rows[0].length * k) / 2, y - (rows.length * k) / 2, { pal }); };

// The dimensional rift (Rift.qml's look, worked out per pixel here): a tall
// tear with a vortex swirling inside, a white-hot jagged rim and a dithered
// halo of its dimension's colour. `open` 0 a slit .. 1 open.
function riftRows(open, phase, seed) {
    const A = 8, B = 24, pad = 4;
    const a = Math.max(0.9, A * Math.min(open, 1.25)), b = B * Math.min(1.15, 0.45 + 0.55 * Math.min(1, open * 1.5) + Math.max(0, open - 1) * 0.4);
    const cols = 2 * (A * 1.25 + pad + 2), rows = 2 * (B * 1.15 + pad + 2), cx = cols / 2, cy = rows / 2, out = [];
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
const riftAt = (rows) => pix(rows, fx, RIFT_C[0] - (rows[0].length * fx) / 2, RIFT_C[1] - (rows.length * fx) / 2, { pal: RIFT });

// Manga focus lines for the impact frames: thin wedges closing in on (cx, cy).
function focus(cx, cy, n, inner, fill) {
    let s = "";
    for (let i = 0; i < n; i++) {
        const a = (i / n) * 2 * Math.PI + R(-0.08, 0.08), w = R(0.012, 0.035), ri = inner * R(0.75, 1.35), ro = 1400;
        const p = (ang, r) => `${r3(cx + Math.cos(ang) * r)},${r3(cy + Math.sin(ang) * r)}`;
        s += `<polygon points="${p(a - w, ro)} ${p(a + w, ro)} ${p(a, ri)}" fill="${fill}"/>`;
    }
    return s;
}
// The card's edge, jagged, from under (x0, bottom) round and back: the
// lightning that crawls round the frame (FrameCharge).
function edgeBolt(inset, x0, dir) {
    const l = inset, r = W - inset, t = inset, b = H - inset;
    const corners = dir > 0 ? [[x0, b], [r, b], [r, t], [l, t], [l, b], [x0, b]] : [[x0, b], [l, b], [l, t], [r, t], [r, b], [x0, b]];
    const pts = [];
    let len = 0;
    for (let i = 1; i < corners.length; i++) {
        const [ax, ay] = corners[i - 1], [bx, by] = corners[i], seg = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(seg / 14));
        for (let k = i === 1 ? 0 : 1; k <= n; k++) {
            const f = k / n, j = k === 0 || k === n ? 0 : Math.round(R(-2, 2)) * 2;
            const nx = (by - ay) / seg, ny = -(bx - ax) / seg;
            pts.push([Math.round(ax + (bx - ax) * f + nx * j), Math.round(ay + (by - ay) * f + ny * j)]);
        }
    }
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return { points: pts.map((p) => p.join(",")).join(" "), len };
}

// ---------------------------------------------------------------- the fight
//
//  0     dark; it gets its torch out and sweeps the beam round
//  1.9   something in the beam: a rift tears open
//  3.0   its double shoots out of it, spinning ("rematch.")
//  5.6   a crouch, its aura up -- and a bolt of lightning across
//  6.9   the nano suit flows on from the core; the double's bolt bounces off
//  8.3   jets: up into the air, a stream of lightning, then web strands
// 11.0   down, suit off; the dynamo: lightning races round the frame
// 13.6   the thunder charge: the screen darkens, gold aura, rocks, lightning
// 14.6   gone -- the thunder slash -- impact frames
// 14.96  the double's knocked back through the rift; the rift snaps shut
// 16.6   flex. "gg"

const L = []; // layers, back to front
const back = [], pets = [], front = [], top = [];

// ---- the stage
const defs = `<clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070A14"/><stop offset="1" stop-color="#161C2E"/></linearGradient>
<radialGradient id="riftGlow"><stop offset="0" stop-color="#A46BFF" stop-opacity=".45"/><stop offset="1" stop-color="#A46BFF" stop-opacity="0"/></radialGradient>
<radialGradient id="torchGlow"><stop offset="0" stop-color="#FAD250" stop-opacity=".35"/><stop offset="1" stop-color="#FAD250" stop-opacity="0"/></radialGradient>
<filter id="aura" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>`;

L.push(rect(0, 0, W, H, "url(#sky)"));
const twinkle = (x, y, delay) => `<g transform="translate(${x} ${y})"><g class="twk" style="animation-delay:${delay}s">`
    + `${rect(2, 0, 2, 6, "#9DB4D3")}${rect(0, 2, 6, 2, "#9DB4D3")}${rect(2, 2, 2, 2, "#FFFFFF")}</g></g>`;
for (let i = 0; i < 46; i++) {
    const x = Math.round(R(16, W - 16)), y = Math.round(R(12, GROUND - 120));
    L.push(i % 6 === 0 ? twinkle(x, y, -R(0, 3.4).toFixed(1)) : rect(x, y, 2, 2, "#8B949E", ` opacity="${R(0.25, 0.7).toFixed(2)}"`));
}
// The ground: dark earth, a lit top edge, some pebbles.
L.push(rect(0, GROUND, W, H - GROUND, "#121722") + rect(0, GROUND, W, 3, "#2C3650") + rect(0, GROUND + 3, W, 3, "#1B2233"));
for (let i = 0; i < 40; i++) L.push(rect(Math.round(R(0, W) / 4) * 4, Math.round(R(GROUND + 10, H - 6) / 4) * 4, 4, 4, "#1E2638"));

// ---- the rift: a slit in the torch beam at 1.9, open by 2.4, swirling,
// swelling as the double goes back through it, snapped shut at 16.4.
{
    const swirl = [0, 2.1, 4.2].map((ph, i) => riftAt(riftRows(1, ph, i * 1.7)));
    const opening = [0.02, 0.12, 0.4, 0.75].map((o, i) => riftAt(riftRows(o, i, 3 + i)));
    const swell = [1.12, 1.22].map((o, i) => riftAt(riftRows(o, i * 2, 9 + i)));
    const closing = [0.55, 0.2, 0.03].map((o, i) => riftAt(riftRows(o, i, 12 + i)));
    back.push(S.fade(`<ellipse cx="${RIFT_C[0]}" cy="${RIFT_C[1]}" rx="190" ry="170" fill="url(#riftGlow)"/>`
        + `<ellipse cx="${RIFT_C[0]}" cy="${GROUND + 2}" rx="90" ry="9" fill="#A46BFF" opacity=".25"/>`,
        [[1.9, 0], [2.5, 1], [16.0, 1], [16.25, 1.3], [16.45, 0]]));
    back.push(S.seq(opening, 1.9, 0.13));
    back.push(S.win(S.loop(swirl, 10), [[2.42, 15.9]]));
    back.push(S.seq(swell, 15.9, 0.16));
    back.push(S.seq(closing, 16.22, 0.07));
    // Sparks crackling round it.
    for (let i = 0; i < 9; i++) {
        const a = R(0, 2 * Math.PI);
        back.push(S.win(`<g class="pop" style="animation-duration:${R(0.5, 1.1).toFixed(2)}s;animation-delay:-${R(0, 1).toFixed(2)}s">`
            + `${rect(RIFT_C[0] + Math.cos(a) * R(36, 60), RIFT_C[1] + Math.sin(a) * R(60, 108), fx, fx, i % 2 ? "#DCC6FF" : "#FFFFFF")}</g>`, [[2.5, 15.9]]));
    }
    // Snapped shut: a flash and a ring of sparks.
    front.push(burst(RIFT_C[0], RIFT_C[1], 16.43, { radius: 70, sparks: 14, glint: 120, color: "#DCC6FF", trail: "#A46BFF" }));
}

// ---- the screen darkening (under the pets: they blaze against it)
const dim = S.fade(rect(0, 0, W, H, INK), [[0, 0.55], [1.9, 0.55], [2.6, 0.1], [3.2, 0], [5.6, 0], [5.75, 0.25], [6.05, 0.25],
    [6.2, 0], [13.6, 0], [13.8, 0.62], [14.96, 0.62], [15.3, 0]]);

// ---- the torch: out, on, the beam sweeping round to where the rift opens
{
    const hold = at(HOME, TOP, Art.holdAt("aim"));
    const aims = [[700, 190], [800, 340], [910, 170], RIFT_C];
    const torchFor = (tx, ty, on) => {
        const ang = (Math.atan2(-(ty - hold[1]), tx - hold[0]) * 180) / Math.PI, tf = Art.flashlight(ang, on);
        const x0 = hold[0] - tf.grip[0] * fx, y0 = hold[1] - tf.grip[1] * fx, lens = [x0 + tf.lens[0] * fx, y0 + tf.lens[1] * fx];
        const beam = Art.beam((tx - lens[0]) / fx, (ty - lens[1]) / fx, 2, 15), spot = Art.spot(11);
        const light = on ? `<g opacity=".3">${shapes(beam, fx, lens[0], lens[1], { y: "#FAD250", h: "#FFFFFF" })}</g>`
            + `<g opacity=".35">${shapes(spot, fx, tx, ty, { h: "#FFFFFF", y: "#FAD250", g: "#FAD250@.5" })}</g>` : "";
        return light + pix(tf.rows, fx, x0, y0);
    };
    front.push(S.win(torchFor(...aims[0], false), [[0.2, 0.5]]));
    front.push(S.seq(aims.map((a) => torchFor(a[0], a[1], true)), 0.5, 0.35, 2.6));
}

// ---- Rascal
{
    const pose1 = (rows, windows, opts) => S.win(me(rows), windows, opts);
    const looped = (st, m, windows, opts) => S.win(S.loop(frames(st, m).map((r) => me(r)), FPS[st] || 4), windows, opts);
    const parts = [];

    // Its aura, behind it: up for the cast, flaring off it; up again for the
    // thunder charge, gone with it, flaring where it lands.
    parts.push(S.fade(glow(pose("land"), "#FFC43A"), [[5.6, 0], [5.76, 0.9], [6.0, 0.85], [6.65, 0, "ease-in"], [13.6, 0], [13.76, 1],
        [14.6, 1, "step-end"], [14.61, 0, "step-end"], [14.96, 0.85], [15.6, 0, "ease-in"]]));
    // Its legs glowing as it runs the dynamo.
    parts.push(S.win(`<g opacity=".9">${S.loop(frames("dynamo", { legsOnly: true }).map((r) => glow(r, "#FFD84A", { k: 1 })), FPS.dynamo)}</g>`, [[12.0, 13.6]]));

    parts.push(pose1(pose("aim"), [[0, 2.6]]));
    parts.push(pose1(pose("alert"), [[2.6, 3.4]]));
    parts.push(looped("annoyed", {}, [[3.4, 5.6]]));
    parts.push(pose1(pose("land"), [[5.6, 6.0], [13.6, 14.6], [14.96, 15.6]]));
    parts.push(pose1(pose("cast"), [[6.0, 6.9]]));

    // The nano suit flowing on from the core, the visor booting back to front.
    const nanoOn = [0.08, 0.17, 0.27, 0.37, 0.47, 0.57, 0.67, 0.77, 0.87, 0.95].map((t) => me(pose("idle", 0, { ...ARMOR, nano: t, visor: 0 })));
    const visorOn = [1, 2, 3, 4, 5, 6].map((k) => me(pose("idle", 0, { ...ARMOR, visor: k / 7 })));
    parts.push(pose1(pose("idle"), [[6.9, 6.96]]));
    parts.push(S.seq(nanoOn, 6.96, 0.06));
    parts.push(S.seq(visorOn, 7.56, 0.032));
    parts.push(looped("idle", ARMOR, [[7.75, 8.3]]));
    parts.push(looped("fly", ARMOR, [[8.3, 9.3], [11.0, 11.5]]));
    parts.push(looped("charge", ARMOR, [[9.3, 10.1]]));
    parts.push(looped("zap", ARMOR, [[10.1, 11.0]]));
    // ...and back into the core.
    const visorOff = [0.6, 0.3].map((v) => me(pose("idle", 0, { ...ARMOR, visor: v })));
    const nanoOff = [0.9, 0.78, 0.65, 0.52, 0.4, 0.28, 0.16, 0.06].map((t) => me(pose("idle", 0, { ...ARMOR, nano: t, visor: 0 })));
    parts.push(S.seq(visorOff, 11.5, 0.05));
    parts.push(S.seq(nanoOff, 11.6, 0.05));
    parts.push(looped("dynamo", {}, [[12.0, 13.6]]));
    parts.push(looped("idle", {}, [[15.6, 16.6]]));
    parts.push(looped("flex", {}, [[16.6, D]], { still: true }));

    // Jets: flames under its feet whenever it's in the air.
    const feet = [Art.X0 + 5.5, Art.H];
    const flame = (dx, delay) => `<g class="rise" style="animation-delay:${delay}s;--dx:${R(-4, 4).toFixed(1)}px;--dy:30px">`
        + `${effect("flame", feet[0] * px + dx, feet[1] * px + 8)}</g>`;
    parts.push(S.win(flame(-14, 0) + flame(14, -0.13) + flame(0, -0.07), [[8.3, 11.5]]));
    // Sparks off its feet on the dynamo.
    const sparks = [[3, 16.5], [11, 17], [1, 14], [13, 15], [7, 17.4]].map(([sx, sy], i) =>
        `<g class="pop" style="animation-duration:${(0.36 + i * 0.07).toFixed(2)}s;animation-delay:-${(i * 0.11).toFixed(2)}s">`
        + `${effect(i % 2 ? "sparkle" : "bolt", sx * px, sy * px)}</g>`).join("");
    parts.push(S.win(sparks, [[12.0, 13.6]]));
    // Flexing: sparkles.
    const twinkles = [[2, 6], [17, 5], [3, 13], [18, 12]].map(([sx, sy], i) =>
        `<g class="pop" style="animation-duration:${(0.7 + i * 0.13).toFixed(2)}s;animation-delay:-${(i * 0.2).toFixed(2)}s">${effect("sparkle", sx * px, sy * px)}</g>`).join("");
    parts.push(S.win(twinkles, [[16.7, D]]));

    pets.push(S.move(parts.join(""), [
        [0, HOME, TOP], [8.3, HOME, TOP, 0, 1, "cubic-bezier(.4,0,.3,1)"], [9.3, ...AIR, 0, 1, "ease-in-out"],
        [9.7, AIR[0], AIR[1] - 8, 0, 1, "ease-in-out"], [10.1, ...AIR, 0, 1, "ease-in-out"], [10.55, AIR[0], AIR[1] - 8, 0, 1, "ease-in-out"],
        [11.0, ...AIR, 0, 1, "cubic-bezier(.5,0,.8,.6)"], [11.5, LAND, TOP], [14.6, LAND, TOP, 0, 1, "step-end"], [14.96, DEST, TOP]
    ], { still: [DEST, TOP] }));

    // "!" when the rift opens.
    front.push(S.win(effect("bang", ...at(HOME, TOP, [HEAD[0] + 2, HEAD[1] - 5]), PAL, 5), [[2.6, 3.3]]));
}

// ---- the double
{
    const parts = [], tw = (rows, windows, pal) => S.win(twin(rows, pal), windows);
    const looped = (st, windows) => S.win(S.loop(frames(st).map((r) => twin(r)), FPS[st] || 4), windows);
    parts.push(S.fade(glow(pose("land"), "#FF4FD8", { flip: true, x: TX, y: TOP }), [[7.4, 0], [7.55, 0.8], [7.78, 0.8], [8.3, 0, "ease-in"]]));
    parts.push(tw(pose("fall"), [[3.0, 3.9], [6.05, 6.6], [14.96, 15.9]]));
    parts.push(tw(pose("land"), [[3.9, 4.2], [6.6, 6.8], [7.4, 7.78]]));
    parts.push(looped("annoyed", [[4.2, 6.05], [6.8, 7.4], [8.3, 9.3], [10.25, 14.96]]));
    parts.push(tw(pose("cast"), [[7.78, 8.3]]));
    // Shocked: flashing to a white X-ray of itself.
    const zapped = twin(pose("alert"), mono("#FFF4FE", { "#": "#2A1640", e: "#2A1640" }));
    parts.push(S.win(S.loop([twin(pose("alert")), zapped], 14), [[9.3, 10.25]]));
    // Webbed up, struggling.
    {
        const c = [(Art.W - MID[0]) * px + TX, (MID[1] + 1) * px + TOP], rr = 14, rows = [];
        for (let y = -rr; y <= rr; y++) {
            let row = "";
            for (let x = -rr; x <= rr; x++) {
                const d = Math.hypot(x, y), a = ((Math.atan2(y, x) / Math.PI) * 4 + 8) % 1;
                row += d > rr ? " " : (a < 0.09 || a > 0.91) || Math.abs(d - 6) < 0.5 || Math.abs(d - 11) < 0.5 ? "g" : " ";
            }
            rows.push(row);
        }
        parts.push(S.win(`<g opacity=".85">${pix(rows, fx, c[0] - rr * fx, c[1] - rr * fx, { pal: WEB })}</g>`, [[10.25, 14.96]]));
    }
    const o = [TX + (Art.W - MID[0]) * px, TOP + MID[1] * px];
    const rift = [RIFT_C[0] - o[0], RIFT_C[1] - o[1]];
    pets.push(S.move(parts.join(""), [
        [0, ...rift, -200, 0.12], [3.0, ...rift, -200, 0.12, "cubic-bezier(.2,.8,.3,1)"], [3.45, 110, -130, -30, 1, "cubic-bezier(.6,0,.9,.4)"],
        [3.9, 0, 0, 0, 1], [6.05, 0, 0, 0, 1, "cubic-bezier(.2,.8,.3,1)"], [6.3, 30, -36, 0, 1, "ease-in"], [6.6, KNOCK, 0, 0, 1],
        [14.96, KNOCK, 0, 0, 1, "cubic-bezier(.2,.8,.3,1)"], [15.4, 140, -120, 380, 0.85, "cubic-bezier(.6,0,.9,.4)"], [15.9, ...rift, 760, 0.1]
    ], { origin: o }));
    front.push(say("rematch.", ...tat([HEAD[0] - 1, HEAD[1] - 1], false), 4.25, 5.05, { left: true }));
}

// ---- the lightning cast (5.6-6.9)
{
    const paw = at(HOME, TOP, Art.holdAt("cast")), hit = [TX + (Art.W - MID[0]) * px, TOP + MID[1] * px];
    for (let i = 0; i < 5; i++) front.push(arc(cx(HOME) + R(-24, 24), GROUND - R(6, 40), 5.6 + R(0, 0.22)));
    for (let i = 0; i < 6; i++) front.push(ember(cx(HOME) + R(-20, 20), GROUND - R(0, 20), 5.6 + R(0, 0.24), { len: 2, life: R(0.24, 0.36), vy: -R(140, 280) }));
    front.push(S.win(effect("flash", ...paw), [[6.0, 6.24]]));
    front.push(bolt(paw, hit, 6.0, { hold: 0.42 }));
    back.push(impact(hit[0], hit[1], 6.05));
    front.push(burst(hit[0], hit[1], 6.05, { color: "#FFFFFF" }));
    for (let i = 0; i < 7; i++) { const a = R(0, 6.28), r = R(10, 44); front.push(arc(hit[0] + Math.cos(a) * r, hit[1] + Math.sin(a) * r, 6.05 + R(0, 0.5))); }
}

// ---- suit up (6.9-7.75); the double's bolt bounces off it (7.78)
{
    const core = at(HOME, TOP, CORE);
    front.push(S.win(effect("core", ...core), [[6.9, 7.2]]));
    for (let i = 0; i < 26; i++) {
        const a = R(0, 6.28), r = R(55, 120), ox = Math.cos(a) * r, oy = Math.sin(a) * r;
        front.push(S.shot(effect("nano", core[0] + ox, core[1] + oy), 6.92 + i * 0.024, R(0.22, 0.34), { dx: -ox * 0.95, dy: -oy * 0.95, ease: "ease-in" }));
    }
    const visor = at(HOME, TOP, [HEAD[0] + 1.3, HEAD[1] + 5]);
    front.push(S.win(effect("flash", ...visor), [[7.75, 8.05]]));
    for (let i = 0; i < 8; i++) front.push(S.shot(effect("nano", ...core), 7.75, 0.34, { dx: R(-70, 70), dy: R(-70, 50) }));
    front.push(say("suit up!", ...at(HOME, TOP, [HEAD[0] + 1, HEAD[1] - 1]), 7.8, 8.4));

    const paw = tat([Art.holdAt("cast")[0], Art.holdAt("cast")[1]]), chest = at(HOME, TOP, MID);
    front.push(bolt(paw, chest, 7.78, { hold: 0.3, pal: PINK, opts: { forks: 1 } }));
    back.push(impact(chest[0] + 10, chest[1], 7.83, { big: false, pal: PINK }));
    front.push(burst(chest[0] + 10, chest[1], 7.83, { radius: 40, sparks: 10, glint: 60, color: "#FFD6F5", trail: "#FF4FD8" }));
}

// ---- flight, a stream of lightning, web strands (8.3-11.0)
{
    front.push(puff(cx(HOME), GROUND - 6, 8.3, { to: 6, dx: -40, dy: -14 }) + puff(cx(HOME), GROUND - 6, 8.32, { to: 5, dx: 40, dy: -10 }));
    const paw = at(AIR[0], AIR[1], Art.gripAt("charge")), body = [TX + KNOCK + (Art.W - MID[0]) * px, TOP + MID[1] * px];
    const stream = [0, 1, 2].map(() => boltDraw(Art.bolt((body[0] - paw[0]) / bfx, (body[1] - paw[1]) / bfx, { pieces: 1, scale: 0.55, forks: 1 }), paw[0], paw[1], CYAN, [0]));
    front.push(S.win(S.loop(stream, 16), [[9.35, 10.15]]));
    for (let i = 0; i < 10; i++) { const a = R(0, 6.28), r = R(14, 50); front.push(arc(body[0] + Math.cos(a) * r, body[1] + Math.sin(a) * r, 9.35 + R(0, 0.75))); }

    const hand = at(AIR[0], AIR[1], Art.gripAt("zap"));
    const targets = [[body[0], body[1], 1], [body[0] - 54, GROUND - 2, 0], [body[0] + 58, GROUND - 2, 0]]
        .map(([x, y, main]) => [(x - hand[0]) / fx, (y - hand[1]) / fx, main]);
    const growing = [0.3, 0.55, 0.8].map((g) => shapes(Art.strands(targets, 0, g), fx, hand[0], hand[1], WEB));
    const rippling = [0, 1.2, 2.4].map((ph) => shapes(Art.strands(targets, ph, 1), fx, hand[0], hand[1], WEB));
    front.push(S.seq(growing, 10.1, 0.05));
    front.push(S.win(S.loop(rippling, 10), [[10.25, 11.0]]));
    front.push(puff(cx(LAND), GROUND - 6, 11.5, { to: 6, dx: -36, dy: -12 }) + puff(cx(LAND), GROUND - 6, 11.52, { to: 5, dx: 36, dy: -10 }));
    // Suit off: back into the core.
    const core = at(LAND, TOP, CORE);
    for (let i = 0; i < 16; i++) {
        const a = R(0, 6.28), r = R(20, 80);
        front.push(S.shot(effect("nano", core[0] + Math.cos(a) * r, core[1] + Math.sin(a) * r), 11.55 + i * 0.026, 0.24, { dx: -Math.cos(a) * r, dy: -Math.sin(a) * r, ease: "ease-in" }));
    }
    front.push(S.win(effect("core", ...core), [[12.0, 12.26]]));
}

// ---- the dynamo: lightning racing round the frame (12.0-13.6)
{
    const x0 = Math.round(cx(LAND)), glowLine = (pts, w, c, o) => `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="miter" opacity="${o}"/>`;
    const hum = [0, 1, 2].map(() => { const e = edgeBolt(6, x0, 1); return glowLine(e.points, 2, "#5CCFFF", 0.7); });
    let pulses = "";
    for (const dir of [1, -1]) {
        const e = edgeBolt(6, x0, dir), id = S.uid("d");
        S.css.push(`@keyframes ${id}{from{stroke-dashoffset:0}to{stroke-dashoffset:-${r3(e.len / 2)}}}`);
        for (const [dly, c, w] of [[0, "#FFFFFF", 4], [-0.27, "#D4F8FF", 3]])
            pulses += `<polyline class="dash" style="animation-name:${id};animation-duration:.54s;animation-delay:${dly}s" points="${e.points}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="miter" stroke-dasharray="90 ${r3(e.len)}"/>`;
    }
    top.push(S.fade(`<g filter="url(#soft)">${hum[0].replace('stroke-width="2"', 'stroke-width="8"')}</g>` + S.loop(hum, 12) + pulses,
        [[12.0, 0], [12.25, 1], [13.6, 1], [13.9, 0]]));
}

// ---- the thunder charge (13.6-14.6)
{
    const x = cx(LAND), feet = GROUND;
    for (let i = 0; i < 12; i++) front.push(ember(x + R(-24, 24), feet - R(0, 34), 13.6 + R(0, 0.9), { color: ["#FFD84A", "#FFE98A", "#FFFFFF"][i % 3] }));
    for (let i = 0; i < 8; i++) front.push(arc(x + R(-34, 34), feet - R(6, 44), 13.62 + R(0, 0.85)));
    // The ground breaking up under it: rocks flung up, to come down after it's gone.
    for (let i = 0; i < 24; i++) {
        const bit = i >= 14, r = rock(x + R(-44, 44), feet - 4, 13.72 + R(0, 0.06), { bit, vx: R(-180, 180), vy: -R(bit ? 380 : 260, bit ? 820 : 680), life: R(1.3, 1.9) });
        (i % 3 === 0 ? front : back).push(r);
    }
    // Cracks in the ground, glowing.
    let cracks = "";
    for (let i = 0; i < 5; i++) {
        let cx = x + R(-10, 10), cy = feet + 1, pts = `${cx},${cy}`;
        const dir = i % 2 ? 1 : -1;
        for (let k = 0; k < 4; k++) { cx += dir * R(8, 22); cy += R(2, 9); pts += ` ${Math.round(cx)},${Math.round(cy)}`; }
        cracks += `<polyline points="${pts}" fill="none" stroke="#5CCFFF" stroke-width="5" opacity=".35"/><polyline points="${pts}" fill="none" stroke="#05070C" stroke-width="3"/>`;
    }
    back.push(S.win(cracks, [[13.72, D - 0.3]]));
    // Lightning streaming up round it, taller and taller.
    const cols = [0, 1, 2, 3].map((i) => ({ dx: (i % 2 ? 1 : -1) * R(18, 74), h: R(0.6, 1.2), lean: R(-24, 24) }));
    const columns = [0.15, 0.4, 0.65, 0.9].map((p) => [0, 1].map(() => cols.map((c) => {
        const h = (50 + 170 * p) * c.h;
        return boltDraw(Art.bolt(c.lean / bfx, h / bfx, { pieces: 1, scale: 0.42, forks: rnd() < 0.3 ? 1 : 0 }), x + c.dx - c.lean, feet - h, CYAN, [0]);
    }).join("")));
    columns.forEach((pair, i) => back.push(S.win(S.loop(pair, 14), [[13.7 + i * 0.225, 13.7 + (i + 1) * 0.225]])));
}

// ---- the thunder slash (14.6): gone, a bolt to where it lands, impact frames
{
    const from = [cx(LAND), GROUND - (Art.H * px) / 2], to = [cx(DEST), GROUND - (Art.H * px) / 2];
    const hit = [to[0] + 44, to[1] + 6];
    // Speed lines streaking past.
    for (let i = 0; i < 14; i++) {
        const y = from[1] + (i % 2 ? 1 : -1) * R(14, 60), x = R(from[0] - 30, from[0] + 200), len = R(60, 140);
        front.push(S.shot(rect(x, y, len, i % 3 ? 3 : 6, ["#FFFFFF", "#C9EEFF", "#8FE0FF"][i % 3]), 14.6 + ((x - from[0]) / 300) * 0.09, R(0.14, 0.26), { dx: R(40, 140) }));
    }
    front.push(bolt(from, to, 14.6, { grow: 0.1, hold: 0.62, fadeOut: 0.36, opts: { floor: (GROUND - from[1]) / bfx - 7 } }));
    front.push(burst(from[0], from[1], 14.6, { radius: 40, sparks: 12, glint: 64, life: 0.28 }));
    back.push(impact(from[0], from[1], 14.6, { big: false }));
    for (let i = 0; i < 9; i++) front.push(puff(from[0] - R(-14, 30), GROUND - 8, 14.6 + i * 0.016, { to: [8, 6, 4][i % 3], dx: -R(20, 100), dy: -R(10, 46), life: R(0.7, 1.25) }));

    // The impact frames: black, white, black -- silhouettes and focus lines.
    const sil = (fill, eyes) => pix(pose("run"), px, DEST, TOP, { pal: mono(fill, { e: eyes }) })
        + pix(pose("fall"), px, TX + KNOCK + 14, TOP - 10, { flip: true, pal: mono(fill, { e: eyes }) });
    const frameA = rect(0, 0, W, H, INK) + focus(hit[0], hit[1], 34, 130, "#F6F6FA") + sil("#F6F6FA", INK);
    const frameB = rect(0, 0, W, H, "#F6F6FA") + focus(hit[0], hit[1], 30, 110, INK) + sil(INK, "#F6F6FA");
    const frameC = rect(0, 0, W, H, INK) + focus(hit[0], hit[1], 40, 150, "#F6F6FA")
        + boltDraw(Art.bolt((to[0] - from[0]) / bfx, (to[1] - from[1]) / bfx, { pieces: 1 }), from[0], from[1], mono("#F6F6FA", { N: "#F6F6FA@.35" }), [0])
        + sil("#F6F6FA", "#FFD84A");
    top.push(S.seq([frameA, frameB, frameC], 14.7, 0.087));

    // Where it lands: the big star, a burst, chips flying back, static.
    back.push(impact(hit[0], hit[1], 14.96, { size: 1.5 }));
    front.push(burst(hit[0], hit[1], 14.96, { radius: 90, sparks: 22, glint: 150, life: 0.45 }));
    for (let i = 0; i < 16; i++) {
        const bit = i >= 7;
        (i % 2 ? front : back).push(rock(hit[0] + R(4, 20) + R(-10, 10), hit[1] + R(-20, 20), 14.96, { bit, vx: -R(60, bit ? 360 : 240) + R(-60, 60), vy: -R(60, 320), life: R(1.1, 1.6) }));
    }
    for (let i = 0; i < 9; i++) { const a = R(0, 6.28), r = R(14, 46); front.push(arc(to[0] + Math.cos(a) * r, to[1] + Math.sin(a) * r, 14.96 + (i < 3 ? R(0, 0.06) : R(0.06, 0.9)))); }
    for (let i = 0; i < 5; i++) { const u = R(0.1, 0.9); front.push(arc(from[0] + (to[0] - from[0]) * u + R(-10, 10), from[1] + R(-10, 10), 14.96 + R(0, 0.24))); }
}

// ---- the flash on each hit, and a shake
const flash = S.fade(rect(0, 0, W, H, "#FFFFFF"), [[6.04, 0], [6.05, 0.35], [6.16, 0, "ease-out"], [14.96, 0], [14.961, 0.85], [15.32, 0, "ease-out"],
    [16.42, 0], [16.43, 0.3], [16.6, 0]]);
const shakeId = S.uid("sh");
{
    const pts = [[0, "transform:translate(0px,0px)"]];
    const quake = (t0, dur, amp) => { for (let k = 0; k * 0.04 < dur; k++) { const a = amp * (1 - (k * 0.04) / dur); pts.push([t0 + k * 0.04, `transform:translate(${r3(R(-a, a))}px,${r3(R(-a, a))}px)`]); } pts.push([t0 + dur, "transform:translate(0px,0px)"]); };
    quake(6.05, 0.3, 5); quake(7.83, 0.16, 3); quake(14.96, 0.6, 12); quake(16.43, 0.2, 4);
    S.css.push(`${S.keyframes(shakeId, pts)}.${shakeId}{animation:${shakeId} ${D}s linear infinite}`);
}

// ---- the souvenir it brings back: a rubber duck out of the closing rift
{
    const duck = Art.SOUVENIRS.duck, w = duck[0].length * fx, h = duck.length * fx, land = [740, GROUND - h];
    const d = S.move(pix(duck, fx, land[0], land[1]), [[0, RIFT_C[0] - land[0] - w / 2, RIFT_C[1] - land[1] - h / 2, 0, 0.3], [16.44, RIFT_C[0] - land[0] - w / 2, RIFT_C[1] - land[1] - h / 2, 0, 0.3, "cubic-bezier(.2,.8,.3,1)"],
        [16.7, 40, -90, -180, 1, "cubic-bezier(.6,0,.9,.5)"], [17.0, 0, 0, -360, 1, "ease-out"], [17.12, 0, -10, -360, 1, "ease-in"], [17.24, 0, 0, -360, 1]], { origin: [land[0] + w / 2, land[1] + h / 2] });
    front.push(S.win(d, [[16.44, D]]));
}

front.push(say("gg", ...at(DEST, TOP, [HEAD[0] + 1, HEAD[1] - 1]), 17.0, 20.3));

// ---- the HUD: fighting-game health bars, "FIGHT!" and "K.O."
const FONT = {
    F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".####"],
    H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "!": ["#", "#", "#", "#", "#", ".", "#"],
    K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    ".": [".", ".", ".", ".", ".", ".", "#"]
};
// A word in chunky pixel letters drawn like the pet: each font pixel 2 x 2,
// a dark outline, the light rim outside it.
function pixelWord(word) {
    const gap = 3, widths = [...word].map((ch) => FONT[ch][0].length * 2);
    const w = widths.reduce((a, b) => a + b, 0) + gap * (word.length - 1) + 4, h = 18;
    const g = Array.from({ length: h }, () => Array(w).fill(" "));
    let ox = 2;
    [...word].forEach((ch, i) => {
        FONT[ch].forEach((row, y) => [...row].forEach((v, x) => {
            if (v !== "#") return;
            for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) g[2 + y * 2 + dy][ox + x * 2 + dx] = y >= 5 ? "C" : "c";
        }));
        ox += widths[i] + gap;
    });
    const near = (x, y, test, diag) => [[1, 0], [-1, 0], [0, 1], [0, -1], ...(diag ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [])]
        .some(([dx, dy]) => test((g[y + dy] || [])[x + dx]));
    const mark = (ch, test, diag) => {
        const hits = [];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === " " && near(x, y, test, diag)) hits.push([x, y]);
        hits.forEach(([x, y]) => (g[y][x] = ch));
    };
    mark("#", (c) => c === "c" || c === "C", true);
    mark("R", (c) => c === "#", false);
    return g.map((r) => r.join(""));
}
// Slammed onto the screen at `a`, gone at `b`.
function slam(word, cell, cy, a, b, pal) {
    const rows = pixelWord(word), w = rows[0].length * cell, h = rows.length * cell, id = S.uid("t");
    const big = "opacity:0;transform:scale(2.4)", on = "opacity:1;transform:scale(1)";
    S.css.push(`${S.keyframes(id, [[0, big], [a, big, "cubic-bezier(.5,0,.6,1)"], [a + 0.13, on], [a + 0.2, "opacity:1;transform:scale(1.08)"], [a + 0.27, on], [b - 0.18, on], [b, "opacity:0;transform:scale(1.2)"]])}`
        + `.${id}{animation:${id} ${D}s infinite;opacity:0;transform-origin:${W / 2}px ${cy}px}`);
    return `<g class="${id}">${pix(rows, cell, (W - w) / 2, cy - h / 2, { pal })}</g>`;
}
// Keyframed transforms on the clock: [t, transform, easing].
function tween(content, pts, origin) {
    const id = S.uid("v");
    S.css.push(`${S.keyframes(id, pts.map(([t, v, e]) => [t, `transform:${v}`, e]))}.${id}{animation:${id} ${D}s linear infinite;transform-origin:${origin[0]}px ${origin[1]}px}`);
    return `<g class="${id}">${content}</g>`;
}
// A health bar: [t, level, easing] points; a pale damage bar trails it down.
function hpBar(x, y, w, h, color, shade, name, right, hp, trail) {
    const o = [right ? x + w : x, y];
    const lv = (pts) => pts.map(([t, v, e]) => [t, `scaleX(${v})`, e]);
    const label = `<text x="${right ? x + w : x}" y="${y + h + 22}" text-anchor="${right ? "end" : "start"}" font-family="${SANS}" font-weight="800" font-size="15" letter-spacing="1.5" fill="#F2F2F8" stroke="#211E30" stroke-width="3" paint-order="stroke">${name}</text>`;
    return rect(x - 4, y - 4, w + 8, h + 8, "#211E30") + rect(x - 2, y - 2, w + 4, h + 4, "#A2B8C9") + rect(x, y, w, h, "#1A1426")
        + tween(rect(x, y, w, h, "#FFF3B0"), lv(trail), o)
        + tween(rect(x, y, w, h, color) + rect(x, y + h - 4, w, 4, shade) + rect(x, y + 2, w, 2, "#FFFFFF", ' opacity=".45"'), lv(hp), o)
        + label;
}
{
    const y = 22, h = 14, w = 330;
    const me = hpBar(64, y, w, h, "#70BE60", "#50924C", "RASCAL", false,
        [[0, 1], [7.83, 1, "step-end"], [7.86, 0.96]], [[0, 1], [8.2, 1, "ease-in-out"], [8.6, 0.96]]);
    const them = hpBar(W - 64 - w, y, w, h, "#FF4FD8", "#B02C94", "RIFT TWIN", true,
        [[0, 1], [6.05, 1, "step-end"], [6.08, 0.7], [9.35, 0.7], [10.15, 0.4], [14.96, 0.4, "step-end"], [14.99, 0]],
        [[0, 1], [6.4, 1, "ease-in-out"], [6.9, 0.7], [9.7, 0.7], [10.5, 0.4], [15.3, 0.4, "ease-in-out"], [15.9, 0]]);
    const vs = `<text x="${W / 2}" y="${y + h - 1}" text-anchor="middle" font-family="${SANS}" font-weight="900" font-style="italic" font-size="22" fill="#FAD250" stroke="#211E30" stroke-width="4" paint-order="stroke">VS</text>`;
    top.unshift(S.fade(me + them + vs, [[4.9, 0], [5.15, 1], [D - 0.9, 1], [D - 0.6, 0]]));
    const GOLD = { c: "#FAD250", C: "#F0703C", "#": "#211E30", R: "#FFFFFF" };
    const RED = { c: "#FF5A6A", C: "#B0303E", "#": "#211E30", R: "#FFFFFF" };
    top.push(slam("FIGHT!", 5, 150, 4.98, 5.62, GOLD));
    top.push(slam("K.O.", 7, 150, 15.05, 16.7, RED));
}

// ---- in from black, out to black
const curtain = S.fade(rect(0, 0, W, H, INK), [[0, 1], [0.7, 0], [D - 0.7, 0], [D, 1]]);

const body = `<g clip-path="url(#card)">
<g class="${shakeId}">
${L.join("\n")}
${dim}
${back.join("\n")}
${pets.join("\n")}
${front.join("\n")}
${flash}
</g>
${top.join("\n")}
${curtain}
</g>`;

const svg = S.svg(body, "Rascal, a pixel raccoon in a green dino hood, fights its purple double from a workspace rift: torch, lightning bolts, the nano suit, jet flight, web strands, the dynamo, a thunder-charged dash with impact frames, then a victory flex", defs);
fs.writeFileSync(OUT, svg);
console.log(`${path.basename(OUT)}  ${(svg.length / 1024).toFixed(1)} KB, ${S.n} animations`);
