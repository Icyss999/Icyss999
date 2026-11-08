#!/usr/bin/env node
// Builds assets/pet-fight.svg: Rascal, the desktop pet from my Quickshell
// config, in a fight to the death with its double from the other side of a
// workspace rift, across a ruined battlefield.
//
// Shot like an anime fight: a wide establishing shot of the whole field,
// then most of the fight in one continuous take -- the camera tracking the
// action across the field, whip-panning, rolling, punching in on the hits --
// then impact frames, the aftermath, the sky. The world has depth: far
// mountains, ruins, the ground, foreground rocks, each moving at its own
// speed as the camera moves.
//
// The pets, their poses, the nano suit, the lightning, the impact stars and
// the web strands are drawn by the pet's own sprite code (Pet/pet-art.js),
// in its own colours. Plain SVG + CSS, no scripts, so GitHub plays it.
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
    const out = { idle: 3, annoyed: 4, run: 12, fly: 6, charge: 9, zap: 5, jump: 1 };
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
const SMOKE = { a: "#9A9DA8", b: "#7C808C", c: "#5E626E" };
const FIRE = { h: "#FFFFFF", y: "#FFE45C", o: "#FF9F1A", r: "#E84855", d: "#8A2A3A" };
const STONE = { o: "#161A26", a: "#5A6782", b: "#414B63", c: "#2E364A", k: "#161A26" };
const mono = (fill, keep = {}) => new Proxy({}, { get: (_, ch) => ch === "__key" ? `mono:${fill}:${JSON.stringify(keep)}` : keep[ch] || fill });
const INK = "#0B0B12", PAPER = "#F6F6FA", GRAY = "#8B949E";

const r1 = (n) => Math.round(n * 10) / 10;
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
    return `<g transform="translate(${r1(x + sh.origin[0] * px)} ${r1(y + sh.origin[1] * px)}) scale(${px})">${paint(sh.paths, pal)}</g>`;
}
const rect = (x, y, w, h, fill, extra = "") => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}"${extra}/>`;
const place = (html, x, y) => `<g transform="translate(${r1(x)} ${r1(y)})">${html}</g>`;
// A disc of pixels, `r` across (half), coloured by how far out each is.
function disc(r, colour) {
    const rows = [];
    for (let j = -r; j < r; j++) {
        let row = "";
        for (let i = -r; i < r; i++) {
            const d = Math.hypot(i + 0.5, j + 0.5) / r;
            row += d > 1 ? " " : colour(d, i, j);
        }
        rows.push(row);
    }
    return rows;
}

// ---------------------------------------------------------------- easing

// CSS easings, worked out here too, so trails can follow a path exactly.
function cubicBezier(x1, y1, x2, y2) {
    const b = (u, a, c) => 3 * a * u * (1 - u) ** 2 + 3 * c * u * u * (1 - u) + u ** 3;
    return (t) => {
        let lo = 0, hi = 1, u = t;
        for (let i = 0; i < 28; i++) { u = (lo + hi) / 2; if (b(u, x1, x2) < t) lo = u; else hi = u; }
        return b(u, y1, y2);
    };
}
const EASE = { linear: (t) => t, ease: cubicBezier(0.25, 0.1, 0.25, 1), "ease-in": cubicBezier(0.42, 0, 1, 1),
               "ease-out": cubicBezier(0, 0, 0.58, 1), "ease-in-out": cubicBezier(0.42, 0, 0.58, 1), "step-end": (t) => (t < 1 ? 0 : 1) };
function easing(e) {
    if (!e) return EASE.linear;
    if (EASE[e]) return EASE[e];
    const m = e.match(/cubic-bezier\(([^)]+)\)/);
    return m ? cubicBezier(...m[1].split(",").map(Number)) : EASE.linear;
}
// Where something moving along [t, x, y, rotate, scale, easing] points is at t.
function pathAt(pts, t) {
    if (t <= pts[0][0]) return pts[0];
    for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1];
        if (t <= b[0]) {
            const f = easing(a[5])((t - a[0]) / (b[0] - a[0] || 1));
            return [t, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, (a[3] || 0) + ((b[3] || 0) - (a[3] || 0)) * f];
        }
    }
    return pts.at(-1);
}

// ---------------------------------------------------------------- the clock

const W = 960, H = 720, D = 24;
// The camera's parallax anchor: layers further back move less round it.
const ANCHOR = [1600, 700];

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
        const steps = pts.map(([t, x, y, r = 0, s = 1, e]) => [t, `transform:translate(${r1(x)}px,${r1(y)}px) rotate(${r1(r)}deg) scale(${r3(s)})`, e]);
        this.rule(id, steps, `animation:${id} ${this.D}s linear infinite;transform-origin:${r1(origin[0])}px ${r1(origin[1])}px`);
        return `<g class="${id}"${still ? ` transform="translate(${still[0]} ${still[1]})"` : ""}>${content}</g>`;
    }
    // The camera: [t, cx, cy, zoom, roll, easing] -- the world point (cx, cy)
    // in the middle of the picture, zoomed and rolled round it. A layer at
    // depth f (1 the action, less further back) moves and zooms less.
    camera(content, pts, f = 1) {
        const id = this.uid("c");
        const steps = pts.map(([t, cx, cy, z, r = 0, e]) => {
            const lx = ANCHOR[0] + f * (cx - ANCHOR[0]), ly = ANCHOR[1] + f * (cy - ANCHOR[1]), lz = z ** f;
            return [t, `transform:translate(${this.W / 2}px,${this.H / 2}px) rotate(${r1(r)}deg) scale(${r3(lz)}) translate(${r1(-lx)}px,${r1(-ly)}px)`, e];
        });
        this.rule(id, steps, `animation:${id} ${this.D}s linear infinite;transform-origin:0 0`);
        return `<g class="${id}">${content}</g>`;
    }
    // Shaking: [t0, duration, amplitude] jolts, dying away.
    quake(content, jolts) {
        const id = this.uid("q"), pts = [[0, "transform:translate(0px,0px)"]];
        for (const [t0, dur, amp] of jolts) {
            for (let k = 0; k * 0.04 < dur; k++) {
                const a = amp * (1 - (k * 0.04) / dur);
                pts.push([t0 + k * 0.04, `transform:translate(${r1(R(-a, a))}px,${r1(R(-a, a))}px)`]);
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
        dur = Math.round(dur * 20) / 20; hold = Math.round(hold * 20) / 20;
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
.plume{animation:plume 3s ease-out infinite;opacity:0}
@keyframes plume{0%{opacity:0;transform:translate(0,0) scale(.4)}20%{opacity:.7}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.6)}}
.pop{animation:pop .5s step-end infinite;opacity:0}
@keyframes pop{0%{opacity:1}40%{opacity:0}100%{opacity:0}}
.sway{animation:sway 1.6s ease-in-out infinite}
@keyframes sway{0%,100%{transform:skewX(0deg)}50%{transform:skewX(-14deg)}}
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

// The picture is 960 x 720, its background transparent; the battlefield is
// 3200 across, the camera framing it as it goes.
const GROUND = 900, PX = 10, fx = 6, bfx = 6, K = PX / 7;
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
const ghosts = (html, pts, n = 3, lag = 0.035, opacity = 0.45) => Array.from({ length: n }, (_, k) =>
    `<g opacity="${r3(opacity * (1 - k / n))}">${actor(html, pts.map(([t, ...rest]) => [t + lag * (k + 1), ...rest]))}</g>`).join("");

// Landmarks in a pet's art (art pixels, facing right).
const FACE = [Art.X0 + 5.5, Art.TOP + 6.5], MID = [Art.X0 + 5.5, Art.TOP + 10], CORE = Art.NANO_CORE;
const VISOR = [Art.X0 + 5.5, Art.TOP + 5.5];
const rAt = (x, y, p) => [x + p[0] * PX, y + p[1] * PX];
const tAt = (x, y, p) => [x + (Art.W - p[0]) * PX, y + p[1] * PX];
const paw = (state) => [Art.holdAt(state)[0] + 0.5, Art.holdAt(state)[1] + 0.5];
const grip = (state) => [Art.gripAt(state)[0] + 0.5, Art.gripAt(state)[1] + 0.5];

const RIFT_C = [1600, 690];

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
const PINK_ARC = { h: "#FFE6F8", b: "#FF4FD8" }, GOLD_ARC = { h: "#FFF7C2", b: "#FFC43A" };
// Static round a point: `n` crackles within r0..r1, from t over dt.
const crackle = (x, y, n, r0, r1, t, dt, colors) => Array.from({ length: n }, () => {
    const a = R(0, 2 * Math.PI), r = R(r0, r1) * K;
    return arc(x + Math.cos(a) * r, y + Math.sin(a) * r, t + R(0, dt), colors ? { colors } : {});
}).join("");
// A streak of light rising off something.
const ember = (x, y, t, { vy = -R(160, 320), len = 2 + Math.floor(rnd() * 3), life = R(0.26, 0.42), color = "#FFD84A", dx = 0 } = {}) =>
    S.shot(rect(x, y, fx, len * fx, color), t, life, { dy: vy * K * life, dx });
const embers = (x, y, t, n, spread, dt, colors = ["#FFD84A", "#FFE98A", "#FFFFFF"]) => Array.from({ length: n }, (_, i) =>
    ember(x + R(-spread, spread), y - R(0, spread * 0.6), t + R(0, dt), { color: colors[i % colors.length] })).join("");
// A cloud billowing out as it drifts, thinning away: dust, or smoke.
function puff(x, y, t, { from = 2, to = 5, dx = 0, dy = -20, life = 0.7, opacity = 0.8, mode = "o", pal = DUST } = {}) {
    const r = Math.round(to), rows = disc(r, (d) => d > 0.75 ? "c" : d > 0.4 ? "b" : "a");
    return S.shot(`<g opacity="${opacity}">${pix(rows, fx, x - r * fx, y - r * fx, { pal })}</g>`, t, life,
        { dx: dx * K, dy: dy * K, s0: from / to, s1: 1, origin: [x, y], ease: "cubic-bezier(.2,.7,.4,1)", mode });
}
const dustRing = (x, t, n = 10, spread = 120, y = GROUND - 10) => Array.from({ length: n }, (_, i) => {
    const dir = i % 2 ? 1 : -1;
    return puff(x + dir * R(0, 20), y, t + i * 0.012, { to: [8, 6, 5][i % 3], dx: dir * R(spread * 0.4, spread), dy: -R(8, 40), life: R(0.6, 1.1) });
}).join("");
// Rock: cells of a chunk of ground, lit by the lightning.
function rockBody(bit, big = 0) {
    let cells = [[0, 0]];
    if (!bit) {
        const q = rnd(), w = (q < 0.3 ? 2 : q < 0.65 ? 3 : q < 0.9 ? 4 : 5) + big, h = w === 2 ? 2 : w - 1 + Math.floor(rnd() * 2);
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
// it comes down and stays.
function rock(x, y, t, { vx = 0, vy = -400, bit = false, life = 1.6, g = 1500, big = 0, stay = false } = {}) {
    vx *= K; vy *= K; g *= K;
    const { html, bottom } = rockBody(bit, big);
    const floor = GROUND - (bottom + 1) * fx + fx / 2;
    const lands = (-vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, floor - y))) / g;
    const steps = [[0, `transform:translate(${r1(x)}px,${r1(y)}px);opacity:0`], [t - 0.001, `transform:translate(${r1(x)}px,${r1(y)}px);opacity:0`]];
    for (let s = 0; s <= lands + 1e-6; s += 0.08) {
        const tt = Math.min(s, lands);
        steps.push([t + tt, `transform:translate(${r1(x + vx * tt)}px,${r1(Math.min(floor, y + vy * tt + 0.5 * g * tt * tt))}px);opacity:1`]);
    }
    const rest = `transform:translate(${r1(x + vx * lands)}px,${r1(floor)}px)`;
    steps.push([t + lands, `${rest};opacity:1`]);
    if (!stay) steps.push([t + life - 0.25, `${rest};opacity:1`], [t + life, `${rest};opacity:0`]);
    const id = S.uid("k"), spin = S.uid("q"), turns = [[0, "transform:rotate(0deg)"]];
    const every = R(0.06, 0.15);
    for (let s = 0, k = Math.floor(rnd() * 4); s < lands; s += every, k++) turns.push([t + s, `transform:rotate(${(k % 4) * 90}deg)`]);
    S.rule(id, steps, `animation:${id} ${D}s linear infinite;opacity:0`);
    S.rule(spin, turns, `animation:${spin} ${D}s step-end infinite`);
    return `<g class="${id}"><g class="${spin}">${html}</g></g>`;
}
const debris = (x, y, t, n, { vx = [-260, 260], vy = [300, 760], life = [1.1, 1.6], stay = false } = {}) =>
    Array.from({ length: n }, (_, i) => rock(x + R(-30, 30), y, t + R(0, 0.04), { bit: i % 3 === 2, vx: R(...vx), vy: -R(...vy), life: R(...life), stay })).join("");
// A chunk lifting off the ground in slow motion with the power coming off
// it, turning slowly, hanging there -- till `blast`, when it's blown away.
function floatRock(x, t0, blast, hover, away) {
    const { html } = rockBody(rnd() < 0.3, rnd() < 0.3 ? 1 : 0);
    const y0 = GROUND - fx, up = t0 + R(0.5, 0.8), y1 = y0 - hover;
    const steps = [[0, `transform:translate(${r1(x)}px,${y0}px);opacity:0`], [t0 - 0.001, `transform:translate(${r1(x)}px,${y0}px);opacity:0`],
        [t0, `transform:translate(${r1(x)}px,${y0}px);opacity:1`, "cubic-bezier(.2,.7,.3,1)"]];
    let t = up, k = 0;
    while (t < blast) { steps.push([t, `transform:translate(${r1(x)}px,${r1(y1 - (k % 2 ? 8 : 0))}px);opacity:1`, "ease-in-out"]); t += 0.4; k++; }
    steps.push([blast, `transform:translate(${r1(x)}px,${r1(y1)}px);opacity:1`, "cubic-bezier(.2,.8,.3,1)"],
        [blast + 0.45, `transform:translate(${r1(x + away[0])}px,${r1(y1 + away[1])}px);opacity:0`]);
    const id = S.uid("k"), spin = S.uid("q"), turn = R(-90, 90);
    S.rule(id, steps, `animation:${id} ${D}s linear infinite;opacity:0`);
    S.rule(spin, [[0, "transform:rotate(0deg)"], [t0, "transform:rotate(0deg)"], [blast, `transform:rotate(${r1(turn)}deg)`]], `animation:${spin} ${D}s linear infinite`);
    return `<g class="${id}"><g class="${spin}">${html}</g></g>`;
}
// A pixel shockwave: a ring of sparks flying out with trails behind them, a
// cross of light flaring and shrinking away.
function burst(x, y, t, { radius = 56, sparks = 16, glint = 90, life = 0.38, color = "#FFD84A", trail = "#5CCFFF" } = {}) {
    radius *= K; glint *= K;
    let s = "";
    for (let i = 0; i < sparks; i++) {
        const a = (i / sparks) * 2 * Math.PI + R(-0.2, 0.2), r = radius * R(0.75, 1.25);
        s += S.shot(rect(x - fx / 2, y - fx / 2, fx, fx, i % 2 ? "#FFFFFF" : color), t, life, { dx: Math.cos(a) * r, dy: Math.sin(a) * r, ease: "cubic-bezier(.2,.8,.3,1)" });
        s += S.shot(rect(x - fx / 2, y - fx / 2, fx, fx, trail), t + 0.03, life, { dx: Math.cos(a) * r * 0.75, dy: Math.sin(a) * r * 0.75, ease: "cubic-bezier(.2,.8,.3,1)" });
        if (i % 2) s += S.shot(rect(x - fx / 4, y - fx / 4, fx / 2, fx / 2, trail), t + 0.06, life, { dx: Math.cos(a) * r * 0.5, dy: Math.sin(a) * r * 0.5, ease: "cubic-bezier(.2,.8,.3,1)" });
    }
    s += S.shot(rect(x - glint / 2, y - 4, glint, 8, "#FFFFFF") + rect(x - 4, y - glint / 2, 8, glint, "#FFFFFF"), t, life * 0.8, { s0: 1, s1: 0.1, origin: [x, y] });
    return s;
}
// A ring of air blown out from a blow: round, or flattened along the ground.
const ring = (x, y, t, { r = 120, flat = 1, color = "#FFFFFF", width = 6, life = 0.42 } = {}) =>
    S.shot(`<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r)}" ry="${r1(r * flat)}" fill="none" stroke="${color}" stroke-width="${width}" shape-rendering="geometricPrecision"/>`,
        t, life, { s0: 0.15, s1: 1, origin: [x, y], ease: "cubic-bezier(.1,.7,.3,1)" });
// Light bursting off a hit.
const flare = (x, y, r, t, peak = 1, dur = 0.35, grad = "flare") =>
    S.fade(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="url(#${grad})"/>`, [[t - 0.001, 0], [t, peak, "ease-out"], [t + dur, 0]]);
// Pet.qml's impactAt: a comic star, small, big, then middling.
function impact(x, y, t, { big = true, size = 1, pal = CYAN } = {}) {
    const set = [Art.impact(6 * size, 7), Art.impact(13 * size, 8), Art.impact(9 * size, 8)];
    const steps = big ? [[0, 0, 0.06], [1, 0.06, 0.11], [2, 0.17, 0.11]] : [[0, 0, 0.05], [2, 0.05, 0.09]];
    return steps.map(([k, a, d]) => {
        const rows = set[k], n = rows.length;
        return S.win(pix(rows, fx, x - (n * fx) / 2, y - (n * fx) / 2, { pal: { ...pal } }), [[t + a, t + a + d]]);
    }).join("");
}
// The works for a blow landing at (x, y): star, light, two rings, sparks, static.
const hit = (x, y, t, { size = 1, pink = false } = {}) => {
    const pal = pink ? PINK : CYAN, trail = pink ? "#FF4FD8" : "#5CCFFF", color = pink ? "#FFD6F5" : "#FFFFFF";
    return impact(x, y, t, { size, pal }) + flare(x, y, 130 * K * size, t, 1, 0.3, pink ? "pinkFlare" : "flare")
        + ring(x, y, t, { r: 110 * K * size, color: "#FFFFFF", width: 4 }) + ring(x, y, t + 0.04, { r: 80 * K * size, color: trail, width: 8, life: 0.36 })
        + burst(x, y, t, { radius: 60 * size, sparks: 16, glint: 100 * size, color, trail })
        + crackle(x, y, 5, 16, 50 * size, t, 0.3, pink ? PINK_ARC : undefined);
};
// A scorch mark on the ground where something hit hard; it stays.
const scorch = (x, t, size = 1) => S.win(`<ellipse cx="${r1(x)}" cy="${GROUND + 6}" rx="${r1(70 * size * K)}" ry="${r1(9 * size)}" fill="#07090E" opacity=".75"/>`
    + `<ellipse cx="${r1(x)}" cy="${GROUND + 4}" rx="${r1(40 * size * K)}" ry="${r1(4 * size)}" fill="#3A2028" opacity=".6"/>`, [[t, D]])
    + Array.from({ length: Math.round(6 * size) }, () => S.fade(rect(x + R(-50, 50) * size * K, GROUND + R(-2, 8), fx, fx / 2, "#FF9F1A"), [[t, 0], [t + 0.05, 1], [t + R(1, 2.2), 0, "ease-in"]])).join("");
// An explosion: a flash, a fireball swelling through white, yellow and
// orange to smoke, smoke rolling up, sparks, rings, debris, embers, a scorch.
function explosion(x, y, t, size = 1) {
    const r = Math.round(13 * size);
    const balls = [0.35, 0.6, 0.85, 1, 1.1].map((k, i) => {
        const rr = Math.max(2, Math.round(r * k));
        return disc(rr, (d, a, b) => {
            const n = d + ((a * 7 + b * 13) % 5) * 0.03;
            if (i === 4) return n > 0.7 ? "r" : n > 0.4 ? "d" : "o";
            return n < 0.3 - i * 0.05 ? "h" : n < 0.55 ? "y" : n < 0.8 ? "o" : (a + b) % 2 ? "r" : "o";
        });
    });
    let s = flare(x, y, 260 * size * K, t, 1, 0.5, "fireFlare")
        + S.seq(balls.map((rows) => pix(rows, fx, x - (rows.length * fx) / 2, y - (rows.length * fx) / 2, { pal: FIRE })), t, 0.075)
        + [[-1, -0.6], [1.1, -0.3]].map(([ox, oy], k) => S.seq(balls.slice(0, 4).map((rows) => pix(rows, fx * 0.55, x + ox * r * fx * 0.7 - (rows.length * fx * 0.55) / 2, y + oy * r * fx * 0.7 - (rows.length * fx * 0.55) / 2, { pal: FIRE })), t + 0.1 + k * 0.06, 0.06)).join("")
        + ring(x, y, t, { r: 150 * size * K, width: 5 }) + ring(x, y, t + 0.05, { r: 110 * size * K, color: "#FF9F1A", width: 10, life: 0.4 })
        + burst(x, y, t, { radius: 90 * size, sparks: 18, glint: 140 * size, color: "#FFE45C", trail: "#FF9F1A" })
        + embers(x, y, t + 0.05, Math.round(10 * size), 50 * size, 0.4, ["#FFD84A", "#FF9F1A", "#FFFFFF"]);
    for (let i = 0; i < Math.round(9 * size); i++)
        s += puff(x + R(-40, 40) * size, y + R(-30, 20) * size, t + 0.2 + R(0, 0.25), { pal: SMOKE, to: [10, 8, 7][i % 3] * Math.min(1.4, size), dx: R(-60, 60), dy: -R(90, 200), life: R(1.4, 2.3), opacity: 0.75, mode: "io" });
    if (GROUND - y < 160) s += dustRing(x, t + 0.02, Math.round(10 * size), 160 * size) + scorch(x, t, size) + debris(x, GROUND - 8, t, Math.round(8 * size), { stay: true, life: [1.4, 1.8] });
    return s;
}
// Lightning (Art.bolt) from `a` to `b`, one drawing, glowing.
function boltDraw(b, x, y, pal, pieces = [0]) {
    let s = "";
    for (const k of pieces) s += paint(b.pieces[k].paths, pal);
    return `<g transform="translate(${r1(x + b.origin[0] * bfx)} ${r1(y + b.origin[1] * bfx)}) scale(${bfx})" filter="url(#glow)">${s}</g>`;
}
const boltOnce = (a, b, pal, opts = {}) => boltDraw(Art.bolt((b[0] - a[0]) / bfx, (b[1] - a[1]) / bfx, { pieces: 1, ...opts }), a[0], a[1], pal);
// A bolt that shoots across piece by piece, hangs there redrawn every few
// frames (on 4s, like hand-drawn lightning), then strobes, thins and goes.
function bolt(a, b, t0, { grow = 0.09, hold = 0.45, fadeOut = 0.32, pal = CYAN, opts = {}, redraws = 2 } = {}) {
    const dx = (b[0] - a[0]) / bfx, dy = (b[1] - a[1]) / bfx, N = 8;
    const first = Art.bolt(dx, dy, { pieces: N, ...opts });
    let s = "";
    for (let k = 0; k < N; k++) s += S.win(boltDraw(first, a[0], a[1], pal, [k]), [[t0 + (grow * k) / N, t0 + grow + 0.066]]);
    s += S.win(S.loop(Array.from({ length: redraws }, () => boltOnce(a, b, pal, opts)), 15), [[t0 + grow + 0.066, t0 + grow + hold]]);
    const thin = boltOnce(a, b, pal, { ...opts, scale: 0.5 }), t1 = t0 + grow + hold, q = fadeOut / 5;
    s += S.win(thin, [[t1 + q, t1 + 2 * q], [t1 + 3 * q, t1 + 3.6 * q], [t1 + 4.2 * q, t1 + 5 * q]]);
    return s + crackle(...b, 6, 10, 40, t0 + grow, hold, pal === PINK ? PINK_ARC : undefined);
}
// An aura (Pet.qml's: the pet's shape, glowing, round it), drawn at (0, 0).
const aura = (rows, color, { flip = false, k = 1.35 } = {}) =>
    `<g filter="url(#aura)">${pix(rows, PX * k, -(Art.W * PX * (k - 1)) / 2, -Art.H * PX * (k - 1), { flip, pal: mono(color) })}</g>`;
const effect = (name, x, y, pal = PAL, k = fx) => { const rows = Art.effect(name); return pix(rows, k, x - (rows[0].length * k) / 2, y - (rows.length * k) / 2, { pal }); };
// A glint off an eye: a little cross of light popping.
const glint = (x, y, t, color = "#FFFFFF", size = 4) => S.shot(
    rect(x - size / 2, y - size * 3, size, size * 6, color) + rect(x - size * 3, y - size / 2, size * 6, size, color), t, 0.3,
    { s0: 0.2, s1: 1.2, origin: [x, y], mode: "io", ease: "ease-out" });
// Speed lines streaking past along a line.
const streaks = (x0, y0, x1, y1, t, n, { spread = 60, colors = ["#FFFFFF", "#8FE0FF", "#5CCFFF"], len = [60, 160], life = [0.14, 0.26] } = {}) => {
    const ang = Math.atan2(y1 - y0, x1 - x0), deg = (ang * 180) / Math.PI;
    return Array.from({ length: n }, (_, i) => {
        const u = R(-0.1, 1), off = (i % 2 ? 1 : -1) * R(8, spread) * K, l = R(...len) * K;
        const x = x0 + (x1 - x0) * u - Math.sin(ang) * off, y = y0 + (y1 - y0) * u + Math.cos(ang) * off;
        const line = `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(deg)})">${rect(0, 0, l, i % 3 ? 3 : 6, colors[i % colors.length])}</g>`;
        return S.shot(line, t + u * 0.06, R(...life), { dx: Math.cos(ang) * R(40, 140) * K, dy: Math.sin(ang) * R(40, 140) * K });
    }).join("");
};
// A trail left behind something moving along `pts` (art top-left), from t0
// to t1: specks of light where it was, fading.
const trail = (pts, t0, t1, colors, { every = 0.025, size = fx, life = 0.4, at = C0 } = {}) => {
    let s = "";
    for (let t = t0; t <= t1; t += every) {
        const [, x, y] = pathAt(pts, t), c = colors[Math.floor(rnd() * colors.length)];
        s += S.shot(rect(x + at[0] + R(-14, 14), y + at[1] + R(-14, 14), size, size, c), t, life, { dx: R(-10, 10), dy: R(-6, 14), s1: 0.3, origin: [x + at[0], y + at[1]] });
    }
    return s;
};
// Dust kicked up behind something running along the ground.
const kicks = (pts, t0, t1, dir, every = 0.06) => {
    let s = "";
    for (let t = t0; t <= t1; t += every) {
        const [, x] = pathAt(pts, t);
        s += puff(x + C0[0], GROUND - 8, t, { to: R(3, 5), dx: -dir * R(20, 60), dy: -R(10, 30), life: R(0.4, 0.7) });
    }
    return s;
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
const flat = (fill) => rect(-40, -40, W + 80, H + 80, fill);

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

const defs = [`<clipPath id="frame"><rect width="${W}" height="${H}" rx="16"/></clipPath>
<radialGradient id="riftGlow"><stop offset="0" stop-color="#A46BFF" stop-opacity=".42"/><stop offset="1" stop-color="#A46BFF" stop-opacity="0"/></radialGradient>
<radialGradient id="flare"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".3" stop-color="#E6FBFF" stop-opacity=".6"/><stop offset="1" stop-color="#8FE0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="pinkFlare"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".3" stop-color="#FFD6F5" stop-opacity=".6"/><stop offset="1" stop-color="#FF4FD8" stop-opacity="0"/></radialGradient>
<radialGradient id="fireFlare"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".3" stop-color="#FFE45C" stop-opacity=".55"/><stop offset="1" stop-color="#FF7A1A" stop-opacity="0"/></radialGradient>
<radialGradient id="goldGlow"><stop offset="0" stop-color="#FFE98A" stop-opacity=".55"/><stop offset="1" stop-color="#FFC43A" stop-opacity="0"/></radialGradient>
<radialGradient id="starGlow"><stop offset="0" stop-color="#8FE0FF" stop-opacity=".7"/><stop offset="1" stop-color="#8FE0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="moonGlow"><stop offset="0" stop-color="#DDE6F5" stop-opacity=".25"/><stop offset="1" stop-color="#DDE6F5" stop-opacity="0"/></radialGradient>
<radialGradient id="dark"><stop offset="0" stop-color="#05060A" stop-opacity=".85"/><stop offset=".6" stop-color="#05060A" stop-opacity=".5"/><stop offset="1" stop-color="#05060A" stop-opacity="0"/></radialGradient>
<filter id="aura" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10"/></filter>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`];
const use = (id) => `<use href="#${id}"/>`;
const stepped = (x0, x1, base, top, step) => {
    let d = `M${x0} ${base}`;
    for (let x = x0; x < x1; x += step) { const y = Math.round(top(x) / step) * step; d += `L${x} ${y}L${x + step} ${y}`; }
    return `${d}L${x1} ${base}Z`;
};

// ---- far: mountains, the moon, the stars. Easter egg: some of the stars are
// a constellation that spells ICYCLE. All fight long they pass for ordinary
// ones, among decoys; when it's all over they light up and join the dots.
const STROKES = {
    I: [[[0, 0], [2, 0]], [[1, 0], [1, 4]], [[0, 4], [2, 4]]],
    C: [[[2.2, 0.5], [1.1, 0], [0, 0.9], [0, 3.1], [1.1, 4], [2.2, 3.5]]],
    Y: [[[0, 0], [1.1, 1.9]], [[2.2, 0], [1.1, 1.9]], [[1.1, 1.9], [1.1, 4]]],
    L: [[[0, 0], [0, 4], [2, 4]]],
    E: [[[2, 0], [0, 0], [0, 4], [2, 4]], [[0, 2], [1.6, 2]]]
};
const SKY = { x: 1370, y: 325, u: 19, step: 66 };
let constellationLit = "";
{
    let far = "";
    const twinkle = (x, y, delay) => `<g transform="translate(${x} ${y})"><g class="twk" style="animation-delay:${delay}s">`
        + `${rect(3, 0, 3, 9, "#9DB4D3")}${rect(0, 3, 9, 3, "#9DB4D3")}${rect(3, 3, 3, 3, "#FFFFFF")}</g></g>`;
    for (let i = 0; i < 170; i++) {
        const x = Math.round(R(300, 2900)), y = Math.round(R(-200, 640));
        far += i % 8 === 0 ? twinkle(x, y, -R(0, 3.4).toFixed(1)) : rect(x, y, 3, 3, GRAY, ` opacity="${R(0.2, 0.6).toFixed(2)}"`);
    }
    const box = [SKY.x - 40, SKY.y - 40, SKY.x + 6 * SKY.step + 20, SKY.y + 4 * SKY.u + 40];
    for (let i = 0; i < 36; i++)
        far += rect(Math.round(R(box[0], box[2])), Math.round(R(box[1], box[3])), i % 3 ? 2 : 3, i % 3 ? 2 : 3, GRAY, ` opacity="${R(0.2, 0.55).toFixed(2)}"`);
    [..."ICYCLE"].forEach((ch, i) => {
        const ox = SKY.x + i * SKY.step, P = ([x, y]) => [r1(ox + x * SKY.u), r1(SKY.y + y * SKY.u)];
        const dots = new Map(), lines = [];
        for (const stroke of STROKES[ch]) stroke.forEach((p, k) => { const q = P(p); dots.set(q.join(), q); if (k) lines.push([P(stroke[k - 1]), q]); });
        let letter = lines.map(([a, b]) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#4AB4F0" stroke-width="2.4" opacity=".85" shape-rendering="geometricPrecision"/>`).join("");
        for (const [x, y] of dots.values()) {
            const sz = rnd() < 0.5 ? 2 : 3;
            far += rect(x - sz / 2, y - sz / 2, sz, sz, GRAY, ` opacity="${R(0.25, 0.55).toFixed(2)}"`);
            letter += `<circle cx="${x}" cy="${y}" r="13" fill="url(#starGlow)"/>` + rect(x - 4, y - 4, 8, 8, "#2F8FD8") + rect(x - 2, y - 2, 4, 4, "#FFFFFF");
        }
        constellationLit += S.fade(letter, [[21.4 + i * 0.16, 0], [21.85 + i * 0.16, 1], [23.3, 1], [23.7, 0]]);
    });
    // The moon.
    const moon = disc(8, (d, i, j) => (d > 0.85 ? "c" : (i * 3 + j * 5) % 11 === 0 || (i - 2) ** 2 + (j + 1) ** 2 < 5 ? "b" : "a"));
    far += `<circle cx="2050" cy="330" r="120" fill="url(#moonGlow)"/>` + pix(moon, 6, 2050 - 48, 330 - 48, { pal: { a: "#E2E8F2", b: "#C3CBDA", c: "#AEB7C9" } });
    // Two ranges of mountains, the nearer one lit along its ridge.
    const backTop = (x) => 760 - 150 * Math.abs(Math.sin(x / 260 + 0.6)) - 70 * Math.abs(Math.sin(x / 113 + 2)) - 30 * Math.sin(x / 41);
    const frontTop = (x) => 830 - 110 * Math.abs(Math.sin(x / 210 + 2.1)) - 50 * Math.abs(Math.sin(x / 87)) - 20 * Math.sin(x / 33 + 1);
    far += `<path d="${stepped(200, 3000, 1700, backTop, 8)}" fill="#161B2A"/>`
        + `<path d="${stepped(200, 3000, 1700, frontTop, 8)}" fill="#1D2436"/>`
        + `<path d="${stepped(200, 3000, 1700, frontTop, 8)}" fill="none" stroke="#2B3550" stroke-width="3" transform="translate(0 2)"/>`;
    defs.push(`<g id="far">${far}</g>`);
}

// ---- mid: rolling hills, broken arches and columns, a dead tree or two.
{
    let mid = `<path d="${stepped(0, 3200, 1500, (x) => 870 - 40 * Math.sin(x / 170) - 25 * Math.sin(x / 61 + 1), 6)}" fill="#1A2030"/>`;
    const col = (x, w, h, base = 1000) => {
        let s = rect(x, base - h, w, h + 400, "#232B3E") + rect(x, base - h, 6, h + 400, "#303B54");
        for (let i = 0; i < w; i += 6) s += rect(x + i, base - h - Math.round(R(0, 3)) * 6, 6, 18, "#232B3E");
        return s + rect(x - 6, base - h + 18, w + 12, 8, "#2A334A");
    };
    const arch = (x, w, h) => col(x, 30, h) + col(x + w - 30, 30, h - 30) + rect(x, 1000 - h - 24, w * 0.6, 24, "#283149") + rect(x, 1000 - h - 24, w * 0.6, 4, "#33405A");
    const tree = (x, h) => {
        let s = rect(x, 1000 - h, 10, h + 300, "#1F2636");
        for (let k = 0; k < 4; k++) { const y = 1000 - h + 20 + k * 26, dir = k % 2 ? 1 : -1, l = R(30, 60); s += rect(dir > 0 ? x + 10 : x - l, y, l, 6, "#1F2636") + rect(dir > 0 ? x + 10 + l - 6 : x - l, y - 18, 6, 18, "#1F2636"); }
        return s;
    };
    for (const [x, kind, a, b] of [[420, "col", 40, 150], [560, "arch", 170, 210], [860, "tree", 170], [1080, "col", 36, 110], [1330, "col", 48, 230],
        [1880, "arch", 200, 240], [2200, "tree", 150], [2380, "col", 42, 180], [2560, "col", 34, 90], [2760, "arch", 150, 170]])
        mid += kind === "col" ? col(x, a, b) : kind === "arch" ? arch(x, a, b) : tree(x, a);
    defs.push(`<g id="mid">${mid}</g>`);
}

// ---- the ground: dark earth, a lit edge, tufts, pebbles, boulders.
{
    let g = rect(-2000, GROUND, 7200, 900, "#131822") + rect(-2000, GROUND, 7200, 4, "#33405C") + rect(-2000, GROUND + 4, 7200, 5, "#1D2436");
    for (let i = 0; i < 160; i++) g += rect(Math.round(R(-200, 3400) / 6) * 6, Math.round(R(GROUND + 16, GROUND + 260) / 6) * 6, 6, 6, i % 3 ? "#1A202D" : "#202838");
    for (let i = 0; i < 70; i++) {
        const x = Math.round(R(-100, 3300) / 6) * 6;
        g += `<g class="sway" style="animation-delay:-${R(0, 1.6).toFixed(2)}s;transform-origin:${x}px ${GROUND}px">${rect(x, GROUND - 12, 6, 12, "#2C3B4E")}${rect(x + 6, GROUND - 18, 6, 18, "#344761")}${rect(x + 12, GROUND - 6, 6, 6, "#2C3B4E")}</g>`;
    }
    const boulder = (x, w, h) => {
        const rows = [];
        for (let j = 0; j < h; j++) {
            let row = "";
            for (let i = 0; i < w; i++) {
                const edge = Math.abs(i - w / 2 + 0.5) / (w / 2) + (j === 0 ? 0.3 : 0) - (j / h) * 0.3;
                row += edge > 0.95 ? " " : j === 0 || edge > 0.8 ? "o" : j < 2 ? "a" : i < w / 3 ? "b" : "c";
            }
            rows.push(row);
        }
        return pix(rows, fx, x, GROUND - h * fx + fx, { pal: STONE });
    };
    for (const [x, w, h] of [[240, 14, 8], [820, 9, 6], [2620, 16, 9], [2900, 10, 6], [3080, 12, 7]]) g += boulder(x, w, h);
    defs.push(`<g id="ground">${g}</g>`);
}

// ---- the rift, swirling between them, drawn once.
{
    const at = (rows) => pix(rows, fx, RIFT_C[0] - (rows[0].length * fx) / 2, RIFT_C[1] - (rows.length * fx) / 2, { pal: RIFT });
    [0, 2.1, 4.2].forEach((ph, i) => defs.push(`<g id="rift${i}">${at(riftRows(1, ph, i * 1.7))}</g>`));
    [0.55, 0.2, 0.03].forEach((o, i) => defs.push(`<g id="riftShut${i}">${at(riftRows(o, i * 2, 9 + i))}</g>`));
}
const riftGlow = `<ellipse cx="${RIFT_C[0]}" cy="${RIFT_C[1]}" rx="300" ry="280" fill="url(#riftGlow)"/><ellipse cx="${RIFT_C[0]}" cy="${GROUND + 2}" rx="150" ry="12" fill="#A46BFF" opacity=".22"/>`;
const rift = () => riftGlow + S.loop([0, 1, 2].map((i) => use(`rift${i}`)), 10);

// ---- the stone pillars: one stands to the end; one Rascal is put through.
const pillarRows = (h, broken) => {
    const rows = [];
    for (let j = 0; j < h; j++) {
        const cap = j < 3 || j >= h - 2, w = cap ? 12 : 10, pad = cap ? 0 : 1;
        let row = " ".repeat(pad);
        for (let i = 0; i < w; i++) row += i === 0 || i === w - 1 || j === 0 || j === h - 1 ? "o" : i < 3 ? "a" : i > w - 4 ? "c" : (j * 7 + i * 3) % 23 === 0 ? "k" : "b";
        rows.push(row + " ".repeat(pad));
    }
    if (broken) for (let j = 0; j < 6; j++) rows[j] = rows[j].split("").map((c, i) => (j < (i * 5 + 3) % 6 ? " " : c)).join("");
    return rows;
};
const PILLAR_H = 44, LPX = 1050, RPX = 2440;
const pillar = (x, h = PILLAR_H, broken = false) => pix(pillarRows(h, broken), fx, x, GROUND - h * fx, { pal: STONE });
// The top of the one it goes through, snapped off: where it stood, and its
// middle; it lands on its side 236 to the left.
const TOPPLE = { rows: pillarRows(PILLAR_H, false).slice(0, 28), x: LPX, y: GROUND - PILLAR_H * fx };
TOPPLE.c = [TOPPLE.x + 6 * fx, TOPPLE.y + 14 * fx];
const toppled = () => `<g transform="translate(-236 144) rotate(-90 ${TOPPLE.c[0]} ${TOPPLE.c[1]})">${pix(TOPPLE.rows, fx, TOPPLE.x, TOPPLE.y, { pal: STONE })}</g>`;

// ---------------------------------------------------------------- shots

const shots = [];
// A shot: from t0 to t1, the world through the camera -- far, mid, the
// action, the foreground, each at its own depth -- a backdrop behind and
// anything in front in picture units; shaken by `quake`.
function shot(t0, t1, { cam, main = "", far = use("far"), mid = use("mid"), ground = use("ground"), fg = "", bg = "", screen = "", quake }) {
    let view = (far ? S.camera(far, cam, 0.3) : "") + (mid ? S.camera(mid, cam, 0.6) : "") + S.camera((ground || "") + main, cam, 1) + (fg ? S.camera(fg, cam, 1.3) : "");
    if (quake) view = S.quake(view, quake);
    shots.push(S.win(bg + view + screen, [[t0, t1]]));
}
const sil = (rows, x, y, fill, { flip = false, eyes } = {}) => pix(rows, PX, x, y, { flip, pal: mono(fill, eyes ? { e: eyes } : {}) });
const wind = (n, x0, x1, y0, y1) => Array.from({ length: n }, (_, i) => {
    const dur = R(2.2, 3.6);
    return `<g class="drift" style="animation-duration:${r3(dur)}s;animation-delay:-${r3(R(0, dur))}s;--dx:-${r1(R(300, 520))}px;--dy:${r1(R(-40, 10))}px">`
        + rect(R(x0, x1), R(y0, y1), i % 3 ? 8 : 14, 3, i % 4 ? "#C8CCE0" : "#FFFFFF", ' opacity=".6"') + "</g>";
}).join("");
const floating = (n, x0, x1, y0, y1) => Array.from({ length: n }, (_, i) => {
    const dur = R(3, 5);
    return `<g class="drift" style="animation-duration:${r3(dur)}s;animation-delay:-${r3(R(0, dur))}s;--dx:${r1(R(-60, 60))}px;--dy:-${r1(R(120, 260))}px">`
        + rect(R(x0, x1), R(y0, y1), fx, fx, i % 3 ? "#FF9F1A" : "#FFD84A") + "</g>";
}).join("");

const R0 = 500, T0 = 2520;

// ---- 1. the whole battlefield (0-3): two specks at either end, the rift
// glowing between them, wind. The camera creeping in.
shot(0, 3.0, {
    cam: [[0, 1600, 560, 0.31, 0, "cubic-bezier(.3,0,.3,1)"], [3.0, 1600, 610, 0.37, -1.5]],
    main: rift() + pillar(LPX) + pillar(RPX) + place(rLoop("idle"), R0, TOP) + place(tLoop("annoyed"), T0, TOP) + wind(40, 200, 3200, 600, GROUND)
});
// ---- 2. each of them, low and close enough to see: Rascal sinking into
// its stance, static crawling over it...
shot(3.0, 3.6, {
    cam: [[3.0, R0 + 110, 820, 1.15, -7], [3.6, R0 + 110, 812, 1.28, -8]],
    main: rift() + pillar(LPX) + place(S.fade(aura(pose("land"), "#FFC43A"), [[3.0, 0], [3.2, 0.7], [3.4, 0.4], [3.6, 0.8]]) + rA(pose("land")), R0, TOP)
        + crackle(R0 + 100, TOP + 110, 10, 20, 70, 3.0, 0.6, GOLD_ARC) + wind(14, R0 - 200, R0 + 700, TOP, GROUND)
        + puff(R0 + 60, GROUND - 8, 3.05, { to: 6, dx: -50, dy: -10 }) + puff(R0 + 150, GROUND - 8, 3.05, { to: 6, dx: 50, dy: -10 })
});
// ...and the twin, eyes glinting.
shot(3.6, 4.2, {
    cam: [[3.6, T0 + 70, 820, 1.15, 7], [4.2, T0 + 70, 812, 1.28, 8]],
    main: rift() + pillar(RPX) + place(S.fade(aura(pose("land"), "#FF4FD8", { flip: true }), [[3.6, 0], [3.8, 0.7], [4.0, 0.4], [4.2, 0.8]]) + tA(pose("land")), T0, TOP)
        + crackle(T0 + 80, TOP + 110, 10, 20, 70, 3.6, 0.6, PINK_ARC) + glint(...tAt(T0, TOP, [Art.X0 + 7.5, Art.TOP + 6.5]).map((v, i) => v + (i ? -4 : -8)), 3.8, "#FFD6F5")
        + wind(14, T0 - 500, T0 + 400, TOP, GROUND)
});

// ---- 3. the one take (4.2-16.9): no cuts. The camera follows the fight
// across the whole field.
const ONE = [4.2, 16.9];
{
    const main = [];
    const at = (x, y, p) => rAt(x, y, p);

    // Where they go.
    const rPts = [
        [4.2, R0, TOP], [4.32, R0, TOP, 0, 1, "cubic-bezier(.5,0,.9,.6)"], [5.0, 1430, TOP, 0, 1, "ease-out"], [5.15, 1390, TOP, 0, 1, "ease-in"],
        [5.25, 1440, TOP], [5.6, 1440, TOP, 0, 1, "cubic-bezier(.1,.8,.3,1)"], [5.75, 1380, TOP, 0, 1, "ease-out"], [5.95, 1440, TOP - 220, 0, 1, "ease-in-out"],
        [6.15, 1430, TOP - 240, 0, 1, "ease-in"], [6.4, 1400, TOP], [6.6, 1400, TOP, 0, 1, "linear"], [6.8, 1060, TOP - 40, -20, 1, "linear"],
        [7.0, 760, TOP - 10, -40, 1, "ease-out"], [7.35, 640, TOP, 0], [9.2, 640, TOP, 0, 1, "ease-in"], [9.7, 1150, 300, 0, 1, "linear"],
        [9.95, 1360, 260, 0, 1, "linear"], [10.2, 1220, 380, 0, 1, "linear"], [10.45, 1420, 230, 0, 1, "ease-out"], [10.6, 1300, 300, 0, 1, "ease-in-out"],
        [11.0, 1320, 330, 0, 1, "ease-in-out"], [11.4, 1320, 330, 0, 1, "ease-in"], [11.7, 1200, TOP], [15.4, 1200, TOP, 0, 1, "ease-out"], [15.6, 1140, TOP],
        [16.6, 1140, TOP, 0, 1, "step-end"], [16.75, 2150, TOP], [16.9, 2150, TOP]
    ];
    const tPts = [
        [4.2, T0, TOP], [4.32, T0, TOP, 0, 1, "cubic-bezier(.5,0,.9,.6)"], [5.0, 1590, TOP, 0, 1, "ease-out"], [5.15, 1630, TOP],
        [5.3, 1630, TOP, 0, 1, "cubic-bezier(.1,.8,.3,1)"], [5.45, 1690, TOP, 0, 1, "ease-in"], [5.55, 1600, TOP], [5.75, 1600, TOP, 0, 1, "ease-out"],
        [5.95, 1560, TOP - 220, 0, 1, "ease-in-out"], [6.15, 1570, TOP - 240, 0, 1, "ease-in"], [6.4, 1600, TOP, 0, 1, "ease-out"], [6.55, 1530, TOP],
        [7.6, 1530, TOP, 0, 1, "cubic-bezier(.1,.8,.3,1)"], [7.95, 2050, TOP - 80, 300, 1, "ease-in"], [8.05, 2050, TOP, 360], [9.5, 2050, TOP, 360, 1, "ease-out"],
        [9.95, 1420, 250, 360, 1, "linear"], [10.2, 1620, 200, 360, 1, "ease-in-out"], [10.45, 1480, 220, 360, 1, "ease-out"], [10.6, 1650, 180, 360, 1, "linear"],
        [10.75, 1700, 200, 360, 1, "ease-in"], [11.0, 1900, TOP, 720], [15.4, 1900, TOP, 720, 1, "ease-out"], [15.6, 1950, TOP, 720], [16.9, 1950, TOP, 720]
    ];

    // ---- Rascal
    const jets = (() => {
        const feet = [Art.X0 + 5.5, Art.H];
        const flame = (dx, delay) => `<g class="rise" style="animation-delay:${delay}s;--dx:${R(-4, 4).toFixed(1)}px;--dy:40px">${effect("flame", feet[0] * PX + dx, feet[1] * PX + 12)}</g>`;
        return flame(-18, 0) + flame(18, -0.13) + flame(0, -0.07);
    })();
    const nanoOn = [0.08, 0.17, 0.27, 0.37, 0.47, 0.57, 0.67, 0.77, 0.87, 0.95].map((t) => rA(pose("idle", 0, { ...ARMOR, nano: t, visor: 0 })));
    const visorOn = [1, 2, 3, 4, 5, 6].map((k) => rA(pose("idle", 0, { ...ARMOR, visor: k / 7 })));
    const nanoOff = [0.75, 0.5, 0.25, 0.06].map((t) => rA(pose("idle", 0, { ...ARMOR, nano: t, visor: 0 })));
    const rBody = [
        S.fade(aura(pose("land"), "#FFC43A"), [[7.3, 0], [7.42, 0.9], [7.55, 0.85], [8.2, 0, "ease-in"], [11.95, 0], [12.1, 1], [13.0, 1, "step-end"], [13.01, 0],
            [16.3, 0], [16.4, 1], [16.6, 1, "step-end"], [16.61, 0], [16.75, 0.85], [17.2, 0]]),
        S.fade(aura(pose("charge"), "#FFC43A"), [[13.0, 0, "step-end"], [13.01, 1], [15.4, 1, "step-end"], [15.41, 0]]),
        S.win(rA(pose("land")), [[4.2, 4.32], [5.0, 5.15], [6.4, 6.6], [7.0, 7.55], [11.95, 13.0], [15.4, 16.6], [16.75, 16.9]]),
        S.win(rLoop("run"), [[4.32, 5.0]]),
        S.win(rA(pose("cast")), [[5.15, 5.6], [7.55, 8.45]]),
        S.win(rA(pose("fall")), [[5.6, 5.75], [6.6, 7.0]]),
        S.win(rA(pose("jump")), [[5.75, 6.4]]),
        S.win(rA(pose("idle")), [[8.45, 8.5]]),
        S.seq(nanoOn, 8.5, 0.05), S.seq(visorOn, 9.0, 0.025),
        S.win(rLoop("idle", ARMOR), [[9.15, 9.2]]),
        S.win(rLoop("fly", ARMOR) + jets, [[9.2, 10.6], [11.4, 11.7]]),
        S.win(rLoop("charge", ARMOR) + jets, [[10.6, 11.0]]),
        S.win(rLoop("zap", ARMOR) + jets, [[11.0, 11.4]]),
        S.win(rA(pose("land", 0, ARMOR)), [[11.7, 11.75]]),
        S.seq(nanoOff, 11.75, 0.05),
        S.win(rLoop("charge"), [[13.0, 15.4]])
    ].join("");
    main.push(S.win(ghosts(rLoop("run", {}, mono("#5CCFFF")), rPts), [[4.35, 5.0]]) + S.win(ghosts(rA(pose("fall"), mono("#5CCFFF")), rPts, 4, 0.03), [[6.6, 7.0]])
        + S.win(ghosts(rLoop("fly", ARMOR, mono("#5CCFFF")), rPts, 3, 0.04), [[9.2, 10.6]]));

    // ---- the twin
    const tBody = [
        S.fade(aura(pose("land"), "#FF4FD8", { flip: true }), [[6.4, 0], [6.5, 0.8], [6.9, 0, "ease-in"], [12.4, 0], [12.5, 1], [13.0, 1, "step-end"], [13.01, 0]]),
        S.fade(aura(pose("charge"), "#FF4FD8", { flip: true }), [[13.0, 0, "step-end"], [13.01, 1], [15.4, 1, "step-end"], [15.41, 0]]),
        S.win(tA(pose("land")), [[4.2, 4.32], [5.0, 5.15], [6.4, 6.5], [8.05, 8.3], [12.4, 13.0], [15.4, 16.6]]),
        S.win(tLoop("run"), [[4.32, 5.0]]),
        S.win(tLoop("annoyed"), [[5.15, 5.3], [6.9, 7.6], [8.3, 9.5], [11.0, 12.4]]),
        S.win(tA(pose("fall")), [[5.3, 5.45], [7.6, 8.05], [10.75, 11.0]]),
        S.win(tA(pose("cast")), [[5.45, 5.75], [6.5, 6.9]]),
        S.win(tA(pose("jump")), [[5.75, 6.4], [9.5, 10.6]]),
        S.win(S.loop([tA(pose("alert")), tA(pose("alert"), mono("#FFF4FE", { "#": "#2A1640", e: "#2A1640" }))], 14), [[10.6, 10.75]]),
        S.win(tLoop("charge"), [[13.0, 15.4]]),
        S.win(tA(pose("alert")), [[16.6, 16.9]]),
        S.win(webbed(), [[11.15, 12.4]])
    ].join("");
    main.push(S.win(ghosts(tLoop("run", {}, mono("#FF4FD8")), tPts), [[4.35, 5.0]]) + S.win(ghosts(tA(pose("fall"), mono("#FF4FD8")), tPts, 4, 0.03), [[7.6, 8.05]])
        + S.win(ghosts(tA(pose("jump"), mono("#FF4FD8")), tPts, 3, 0.04), [[9.5, 10.6]]));

    // ---- the dash and the clash (4.3-5.0)
    main.push(kicks(rPts, 4.36, 4.98, 1) + kicks(tPts, 4.36, 4.98, -1)
        + streaks(R0 + 100, TOP + 100, 1500, TOP + 100, 4.5, 10, { len: [100, 240] }) + streaks(T0, TOP + 100, 1700, TOP + 100, 4.5, 10, { len: [100, 240], colors: ["#FFFFFF", "#FFD6F5", "#FF4FD8"] }));
    const CL = [1600, 800];
    main.push(hit(...CL, 5.0, { size: 1.8 }) + ring(CL[0], GROUND, 5.0, { r: 520, flat: 0.1, width: 6, life: 0.55 })
        + dustRing(CL[0], 5.02, 16, 300) + debris(CL[0], GROUND - 8, 5.02, 12, { stay: true }) + scorch(CL[0], 5.0, 1.2) + embers(CL[0], CL[1], 5.05, 10, 60, 0.3));

    // ---- the exchange (5.15-6.6)
    main.push(hit(...at(1440, TOP, paw("cast")), 5.3) + streaks(1300, 810, 1620, 810, 5.18, 6));
    main.push(hit(...tAt(1600, TOP, paw("cast")), 5.6, { pink: true }) + streaks(1900, 810, 1600, 810, 5.48, 6, { colors: ["#FFFFFF", "#FFD6F5", "#FF4FD8"] }));
    main.push(dustRing(1500, 5.75, 6, 90) + dustRing(1680, 5.75, 6, 90));
    main.push(hit(1590, 615, 5.95, { size: 1.2 }) + hit(1590, 600, 6.15, { size: 1.2, pink: true }) + streaks(1590, 300, 1590, 900, 6.15, 8));
    main.push(dustRing(1500, 6.4, 6, 80) + dustRing(1700, 6.4, 6, 80));
    // The twin's heavy blow, and Rascal through the pillar.
    main.push(hit(1555, 815, 6.6, { size: 1.6, pink: true }) + streaks(1600, 800, 700, 790, 6.6, 18, { len: [140, 320] }) + trail(rPts, 6.6, 7.0, ["#FFFFFF", "#8FE0FF"], { every: 0.02 }));
    main.push(S.win(pillar(LPX), [[0, 6.8]]) + S.win(pillar(LPX, 16, true), [[6.8, D]])
        + S.win(S.move(pix(TOPPLE.rows, fx, TOPPLE.x, TOPPLE.y, { pal: STONE }), [[6.8, 0, 0, 0, 1, "ease-in"], [7.1, -110, 10, -35, 1, "ease-in"], [7.32, -236, 144, -90]], { origin: TOPPLE.c }), [[6.8, D]])
        + dustRing(LPX - 200, 7.32, 12, 200) + debris(LPX - 200, GROUND - 10, 7.32, 8, { stay: true }) + ring(LPX - 200, GROUND, 7.32, { r: 260, flat: 0.12, width: 4 })
        + Array.from({ length: 16 }, (_, i) => rock(LPX + 30, GROUND - R(100, 260), 6.8 + R(0, 0.05), { big: i % 3, vx: -R(150, 520), vy: -R(100, 420), stay: i % 2 === 0, life: R(1.2, 1.8) })).join("")
        + Array.from({ length: 8 }, (_, i) => puff(LPX + 30, GROUND - R(60, 240), 6.8 + i * 0.02, { to: [9, 7, 6][i % 3], dx: -R(60, 200), dy: R(-60, 30), life: R(0.8, 1.3) })).join("")
        + flare(LPX + 30, GROUND - 160, 160, 6.8, 0.8, 0.25));
    // It skids to a stop, gouging a trench.
    main.push(kicks(rPts, 7.0, 7.33, 1, 0.04) + S.fade(rect(660, GROUND + 2, 330, 6, "#07090E"), [[7.0, 0], [7.35, 0.9], [D, 0.9]]));

    // ---- lightning across the whole field (7.35-8.4)
    main.push(crackle(at(640, TOP, MID)[0], TOP + 120, 8, 20, 70, 7.35, 0.2, GOLD_ARC) + embers(at(640, TOP, MID)[0], GROUND, 7.35, 8, 40, 0.2));
    const tCenter = tAt(1530, TOP, MID);
    main.push(S.win(effect("flash", ...at(640, TOP, paw("cast"))), [[7.55, 7.8]]) + bolt(at(640, TOP, paw("cast")), tCenter, 7.55, { hold: 0.5 }));
    main.push(explosion(tCenter[0], tCenter[1], 7.6, 1.2));
    // The twin crashes down by the far pillar.
    main.push(dustRing(2125, 8.05, 12, 200) + scorch(2125, 8.05, 1) + debris(2125, GROUND - 8, 8.05, 10, { stay: true }) + ring(2125, GROUND, 8.05, { r: 300, flat: 0.1, width: 4 }));
    main.push(pillar(RPX));

    // ---- suit up and take off (8.45-9.7)
    const core = at(640, TOP, CORE);
    main.push(S.win(effect("core", ...core), [[8.45, 8.75]])
        + Array.from({ length: 30 }, (_, i) => { const a = R(0, 6.28), r = R(80, 180) * K, ox = Math.cos(a) * r, oy = Math.sin(a) * r; return S.shot(effect("nano", core[0] + ox, core[1] + oy), 8.47 + i * 0.017, R(0.22, 0.34), { dx: -ox * 0.95, dy: -oy * 0.95, ease: "ease-in" }); }).join("")
        + S.win(effect("flash", ...at(640, TOP, VISOR)), [[9.15, 9.4]]) + Array.from({ length: 10 }, () => S.shot(effect("nano", ...core), 9.15, 0.4, { dx: R(-100, 100), dy: R(-100, 60) })).join("")
        + ring(core[0], core[1], 9.15, { r: 200, color: "#8FE0FF", width: 5 }));
    main.push(dustRing(745, 9.2, 10, 140) + ring(745, GROUND, 9.2, { r: 260, flat: 0.12, width: 4 }));
    // Jets smoke and a trail of light behind it in the air; pink behind the twin.
    for (let t = 9.25; t < 11.7; t += 0.07) { const [, x, y] = pathAt(rPts, t); main.push(puff(x + 105, y + 200, t, { pal: SMOKE, to: R(3, 5), dx: R(-20, 20), dy: R(20, 50), life: R(0.6, 0.9), opacity: 0.6 })); }
    main.push(trail(rPts, 9.7, 10.6, ["#FFFFFF", "#8FE0FF", "#5CCFFF"]) + trail(tPts, 9.5, 10.75, ["#FFFFFF", "#FFD6F5", "#FF4FD8"]));
    main.push(dustRing(2125, 9.5, 8, 120));

    // ---- in the air (9.7-11.4)
    main.push(hit(1480, 375, 9.95, { size: 1.5 }) + hit(1540, 345, 10.45, { size: 1.5, pink: true })
        + streaks(1100, 300, 1900, 420, 9.95, 12, { len: [120, 300] }) + streaks(1900, 260, 1200, 360, 10.45, 12, { len: [120, 300], colors: ["#FFFFFF", "#FFD6F5", "#FF4FD8"] }));
    const hand = at(1300, 300, grip("charge")), shocked = [1750, 310];
    main.push(S.win(S.loop([0, 1, 2].map(() => boltOnce(hand, shocked, CYAN, { scale: 0.65, forks: 1 })), 16), [[10.62, 10.8]])
        + flare(...shocked, 200, 10.62, 0.9, 0.3) + crackle(...shocked, 12, 14, 56, 10.62, 0.2));
    main.push(dustRing(1975, 11.0, 12, 180) + scorch(1975, 11.0, 0.9) + ring(1975, GROUND, 11.0, { r: 260, flat: 0.12, width: 4 }));
    // Web strands from the air, pinning it down.
    const hand2 = at(1320, 330, grip("zap")), body = tAt(1900, TOP, MID);
    const targets = [[body[0], body[1], 1], [body[0] - 80 * K, GROUND - 2, 0], [body[0] + 84 * K, GROUND - 2, 0]].map(([x, y, m]) => [(x - hand2[0]) / fx, (y - hand2[1]) / fx, m]);
    main.push(S.seq([0.3, 0.55, 0.8].map((g) => shapes(Art.strands(targets, 0, g), fx, hand2[0], hand2[1], WEB)), 11.0, 0.05)
        + S.win(S.loop([0, 1.2, 2.4].map((ph) => shapes(Art.strands(targets, ph, 1), fx, hand2[0], hand2[1], WEB)), 10), [[11.15, 11.4]]));

    // ---- down, suit off, and the charge (11.7-13.0)
    main.push(dustRing(1305, 11.7, 10, 160) + ring(1305, GROUND, 11.7, { r: 260, flat: 0.12, width: 4 })
        + Array.from({ length: 14 }, () => { const c = at(1200, TOP, CORE), a = R(0, 6.28), r = R(30, 100) * K; return S.shot(effect("nano", c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r), 11.75 + R(0, 0.15), 0.2, { dx: -Math.cos(a) * r, dy: -Math.sin(a) * r, ease: "ease-in" }); }).join(""));
    const cx = 1305;
    const cols = [0, 1, 2, 3].map((i) => ({ dx: (i % 2 ? 1 : -1) * R(30, 110) * K, h: R(0.7, 1.25), lean: R(-30, 30) * K }));
    main.push([0.25, 0.6, 0.95].map((p, i) => S.win(S.loop([0, 1].map(() => cols.map((c) => {
        const h = (60 + 220 * p) * c.h * K;
        return boltOnce([cx + c.dx - c.lean, GROUND - h], [cx + c.dx, GROUND], CYAN, { scale: 0.45, forks: rnd() < 0.3 ? 1 : 0 });
    }).join("")), 14), [[11.95 + i * 0.35, 11.95 + (i + 1) * 0.35]])).join(""));
    main.push(embers(cx, GROUND, 11.95, 18, 60, 1.0) + crackle(cx, GROUND - 90, 12, 20, 90, 11.95, 1.0, GOLD_ARC));
    // Rocks lifting off all along the field, and hanging there through the
    // beams -- till the blast.
    for (let i = 0; i < 26; i++) main.push(floatRock(R(1000, 2050), 12.0 + R(0, 1.2), 15.4, R(50, 260), [R(-500, 500), R(-300, 80)]));
    // Cracks running out across the ground from under it.
    const crack = (dir, len, seed) => { let x = cx, y = GROUND + 2, pts = `${x},${y}`; for (let k = 0; k < len; k++) { x += dir * R(20, 44); y = GROUND + 2 + Math.round(R(0, 3)) * 3; pts += ` ${Math.round(x)},${y}`; } return pts; };
    const cracks = [crack(1, 18), crack(-1, 9), crack(1, 12)];
    main.push(cracks.map((pts, i) => S.fade(`<polyline points="${pts}" fill="none" stroke="#5CCFFF" stroke-width="7" opacity=".4"/><polyline points="${pts}" fill="none" stroke="#07090E" stroke-width="3"/>`,
        [[12.0 + i * 0.2, 0], [12.4 + i * 0.2, 1], [D, 1]])).join(""));
    // The twin tears free of the web.
    const tb = tAt(1900, TOP, MID);
    main.push(Array.from({ length: 22 }, () => { const a = R(0, 6.28); return S.shot(rect(tb[0], tb[1], fx * 2, fx, "#E8ECF4"), 12.4, 0.45, { dx: Math.cos(a) * R(100, 260), dy: Math.sin(a) * R(100, 260), r: R(-180, 180), origin: tb }); }).join("")
        + crackle(...tb, 12, 20, 80, 12.4, 0.6, PINK_ARC) + ring(...tb, 12.4, { r: 220, color: "#FF4FD8", width: 6 }) + dustRing(1975, 12.4, 8, 140));

    // ---- the beam struggle (13.0-15.4)
    const rp = at(1200, TOP, grip("charge")), tp = tAt(1900, TOP, grip("charge"));
    const clashAt = (xc) => {
        const c = [xc, rp[1]];
        return boltOnce(rp, c, CYAN, { scale: 0.8, forks: 0 }) + boltOnce(tp, c, PINK, { scale: 0.8, forks: 0 })
            + `<circle cx="${xc}" cy="${c[1]}" r="150" fill="url(#flare)"/>`
            + S.loop([Art.impact(12, 9), Art.impact(15, 8)].map((rows) => pix(rows, fx, xc - (rows.length * fx) / 2, c[1] - (rows.length * fx) / 2, { pal: { ...CYAN } })), 12);
    };
    const steps = [[13.0, 13.4, 1640], [13.4, 13.75, 1580], [13.75, 14.1, 1510], [14.1, 14.45, 1470], [14.45, 14.75, 1560], [14.75, 15.05, 1660], [15.05, 15.4, 1780]];
    main.push(steps.map(([a, b, xc]) => S.win(clashAt(xc) + crackle(xc, rp[1], 8, 20, 90, a, b - a) + embers(xc, rp[1], a, 6, 40, b - a, ["#FFFFFF", "#8FE0FF", "#FFD6F5"]), [[a, b]])).join(""));
    main.push(Array.from({ length: 40 }, () => { const t = R(13.0, 15.35), xc = steps.find((s) => t >= s[0] && t < s[1])[2], a = R(0, 6.28); return S.shot(rect(xc, rp[1], fx, fx, rnd() < 0.5 ? "#FFFFFF" : "#8FE0FF"), t, 0.3, { dx: Math.cos(a) * R(60, 180), dy: Math.sin(a) * R(60, 180) }); }).join(""));
    // The ground under the beams tearing up.
    main.push(Array.from({ length: 10 }, (_, i) => puff(R(1400, 1850), GROUND - 10, 13.1 + i * 0.22, { to: 6, dx: R(-40, 40), dy: -R(40, 90), life: 0.9 })).join(""));

    // ---- it all goes up (15.4), and out of the smoke...
    main.push(explosion(1780, rp[1], 15.4, 2.6));
    main.push(Array.from({ length: 16 }, (_, i) => puff(R(1150, 2050), GROUND - R(30, 200), 15.5 + R(0, 0.3), { pal: SMOKE, to: [12, 10, 9][i % 3], dx: R(-60, 60), dy: -R(20, 60), life: R(1.1, 1.4), opacity: 0.8, mode: "io" })).join(""));
    const glowEyes = `<g filter="url(#soft)">${pix(Art.eyesGlow(), PX, 1140, TOP + PX, { pal: { y: "#FFE45C" } })}</g>` + pix(Art.eyesGlow(), PX, 1140, TOP + PX, { pal: { y: "#FFF7C2" } });
    main.push(S.fade(`<ellipse cx="1245" cy="${TOP + 100}" rx="170" ry="130" fill="url(#dark)"/>`, [[15.6, 0], [15.8, 0.9], [16.3, 0.9], [16.5, 0]]) + S.fade(glowEyes, [[15.85, 0], [15.95, 1], [16.55, 1], [16.6, 0]]));
    main.push(crackle(1245, TOP + 100, 10, 20, 80, 16.3, 0.3, GOLD_ARC) + flare(1245, TOP + 100, 200, 16.3, 0.7, 0.3, "goldGlow"));

    // ---- ...the thunder slash, straight through it (16.6)
    const from = at(1140, TOP, MID), to = [at(2150, TOP, MID)[0], from[1]];
    main.push(bolt(from, to, 16.6, { grow: 0.08, hold: 0.3, fadeOut: 0.2, opts: { floor: (GROUND - from[1]) / bfx - 7 } })
        + streaks(from[0], from[1], to[0], to[1], 16.6, 20, { len: [140, 320] }) + dustRing(from[0], 16.6, 8, 140) + kicks([[16.6, 1140, TOP, 0, 1, "linear"], [16.75, 2150, TOP]], 16.6, 16.75, 1, 0.02)
        + hit(2000, 830, 16.75, { size: 2 }));

    shot(...ONE, {
        cam: [
            [4.2, 1550, 690, 0.4, 0, "ease-in"], [4.95, 1600, 770, 0.62, -4, "ease-out"], [5.0, 1600, 780, 0.64, -4, "ease-out"], [5.06, 1600, 790, 0.84, -2, "ease-out"],
            [5.3, 1610, 790, 0.9, 6, "ease-in-out"], [5.6, 1590, 790, 0.95, -6, "ease-in-out"], [5.75, 1580, 760, 0.9, -4, "ease-in-out"], [5.95, 1560, 660, 0.85, 6, "ease-in-out"],
            [6.15, 1560, 650, 0.9, -5, "ease-in-out"], [6.4, 1540, 760, 0.9, 2, "ease-in"], [6.6, 1520, 790, 0.95, -3, "cubic-bezier(.6,0,.4,1)"], [6.85, 1080, 780, 0.75, -10, "ease-out"],
            [7.35, 820, 790, 0.72, -6, "ease-in-out"], [7.6, 1220, 760, 0.5, 0, "ease-out"], [8.4, 1180, 780, 0.55, 2, "ease-in-out"], [8.9, 760, 800, 1.0, -4, "ease-in-out"],
            [9.2, 780, 790, 1.05, -4, "ease-in"], [9.7, 1200, 490, 0.68, 8, "ease-in-out"], [10.0, 1430, 410, 0.62, -6, "ease-in-out"], [10.45, 1460, 390, 0.6, 7, "ease-in-out"],
            [10.75, 1580, 430, 0.6, -2, "ease-in-out"], [11.0, 1650, 570, 0.58, -4, "ease-in-out"], [11.4, 1600, 650, 0.6, 2, "ease-in-out"], [11.75, 1340, 780, 0.8, 0, "ease-in-out"],
            [12.4, 1560, 760, 0.58, -5, "ease-in-out"], [13.0, 1640, 770, 0.6, -2, "ease-in-out"], [13.8, 1520, 800, 1.15, -6, "ease-in-out"], [14.4, 1560, 790, 0.95, 5, "ease-in-out"],
            [15.0, 1640, 770, 0.6, 0, "ease-in-out"], [15.4, 1680, 780, 0.62, 0, "ease-out"], [15.55, 1650, 760, 0.5, 3, "ease-in-out"], [16.3, 1300, 790, 0.85, -4, "ease-in-out"],
            [16.6, 1320, 790, 0.9, -6, "cubic-bezier(.7,0,.3,1)"], [16.8, 2000, 790, 0.85, -8, "ease-out"], [16.9, 2010, 790, 0.88, -8]
        ],
        main: rift() + main.slice(0, 2).join("") + actor(rBody, rPts) + actor(tBody, tPts) + main.slice(2).join("") + floating(20, 600, 2600, 500, GROUND),
        quake: [[5.0, 0.35, 14], [5.3, 0.15, 6], [5.6, 0.15, 6], [5.95, 0.15, 7], [6.15, 0.15, 7], [6.6, 0.25, 12], [6.8, 0.2, 10], [7.6, 0.4, 14],
            [7.32, 0.15, 6], [8.05, 0.2, 8], [9.95, 0.15, 7], [10.45, 0.15, 7], [11.0, 0.2, 8], [11.7, 0.2, 8], [12.0, 1.0, 3], [13.0, 2.4, 4], [15.4, 0.7, 20], [16.75, 0.15, 12]]
    });
}
// The twin, webbed: a web over its art at (x, y).
function webbed(x = 0, y = 0) {
    const c = [x + (Art.W - MID[0]) * PX, y + (MID[1] + 1) * PX], rr = 16, rows = [];
    for (let j = -rr; j <= rr; j++) {
        let row = "";
        for (let i = -rr; i <= rr; i++) {
            const d = Math.hypot(i, j), a = ((Math.atan2(j, i) / Math.PI) * 4 + 8) % 1;
            row += d > rr ? " " : (a < 0.09 || a > 0.91) || Math.abs(d - 7) < 0.5 || Math.abs(d - 13) < 0.5 ? "g" : " ";
        }
        rows.push(row);
    }
    return `<g opacity=".85">${pix(rows, fx, c[0] - rr * fx, c[1] - rr * fx, { pal: WEB })}</g>`;
}

// ---- 4. impact frames (16.9-17.25)
{
    const cam = [[16.9, 2080, 820, 1.5, -6]];
    const from = rAt(1140, TOP, MID), mid = tAt(1950, TOP, MID), to = rAt(2150, TOP, MID);
    const slashArt = Art.bolt((to[0] - from[0]) / bfx, 0, { pieces: 1, scale: 1.2 });
    const slash = (fill) => boltDraw(slashArt, from[0], mid[1], mono(fill, { N: `${fill}@.35` }));
    const figs = (ink, eyes) => sil(pose("run"), 2150, TOP, ink, { eyes }) + sil(pose("alert"), 1950, TOP, ink, { flip: true, eyes });
    // Easter egg: the artist's signature, in the corner of a white one.
    const sign = plainWord("ICYCLE"), sx = W - 44 - sign[0].length * 4, sy = H - 44 - 7 * 4;
    const signature = rect(sx - 8, sy - 8, sign[0].length * 4 + 16, 7 * 4 + 16, PAPER) + pix(sign, 4, sx, sy, { pal: { c: INK } });
    const frame = (t0, t1, { c = cam, ground, ink, figures, inner = 130, n = 40, extra = "" }) =>
        shot(t0, t1, { cam: c, far: "", mid: "", ground: "", fg: "", bg: flat(ground) + focus(W / 2, H / 2, n, inner, ink), main: figures, screen: extra });
    frame(16.9, 16.97, { ground: INK, ink: PAPER, figures: figs(PAPER, INK) + slash(PAPER) });
    frame(16.97, 17.04, { ground: PAPER, ink: INK, figures: figs(INK, PAPER) + slash(INK), inner: 110, extra: signature });
    frame(17.04, 17.11, { c: [[17.04, 2080, 820, 1.8, 4]], ground: "#E84855", ink: INK, figures: figs(INK, "#E84855") + slash(INK), inner: 160 });
    frame(17.11, 17.18, { c: [[17.11, 2080, 820, 2.0, -10]], ground: INK, ink: PAPER, figures: figs("#FFD84A", PAPER) + slash("#FFD84A"), inner: 100, n: 46 });
    frame(17.18, 17.25, { c: [[17.18, 2080, 820, 1.7, 0]], ground: PAPER, ink: INK, figures: figs(INK, PAPER), inner: 150 });
}

// ---- 5. after (17.25-20.6): the battlefield wrecked, smoking. Rascal with
// its back to the twin; the twin cracks, comes apart pixel by pixel, and the
// rift drinks it in, and shuts.
{
    const RF = 2150, TF = 1950;
    const wreck = pillar(LPX, 16, true) + toppled() + pillar(RPX) + rect(660, GROUND + 2, 330, 6, "#07090E", ' opacity=".9"')
        + [[1600, 1.2], [2125, 1], [1975, 0.9], [1780, 2.6]].map(([x, s]) => `<ellipse cx="${x}" cy="${GROUND + 6}" rx="${r1(70 * s * K)}" ry="${r1(9 * s)}" fill="#07090E" opacity=".75"/>`).join("")
        + Array.from({ length: 30 }, () => { const { html, bottom } = rockBody(rnd() < 0.4, rnd() < 0.3 ? 1 : 0); return place(html, R(600, 2400), GROUND - (bottom + 1) * fx + fx / 2); }).join("");
    let plumes = "";
    for (const [x, n] of [[1600, 5], [1780, 8], [2125, 4], [1975, 4], [LPX + 30, 3]])
        for (let i = 0; i < n; i++) {
            const dur = R(2.6, 4.2);
            plumes += `<g class="plume" style="animation-duration:${r3(dur)}s;animation-delay:-${r3(R(0, dur))}s;--dx:${r1(R(-80, 20))}px;--dy:-${r1(R(260, 460))}px;transform-origin:${x}px ${GROUND - 20}px">`
                + pix(disc(8, (d) => (d > 0.75 ? "c" : d > 0.4 ? "b" : "a")), fx, x - 48 + R(-30, 30), GROUND - 70, { pal: SMOKE }) + "</g>";
        }
    let dust = "";
    pose("alert").forEach((row, y) => [...row].forEach((ch, i) => {
        if (ch === " " || !TWIN[ch]) return;
        const col = Art.W - 1 - i, x0 = TF + col * PX, y0 = TOP + y * PX;
        const hold = (col / (Art.W - 1)) * 0.6 + R(0, 0.25);
        dust += S.shot(rect(x0, y0, PX, PX, TWIN[ch].split("@")[0]), 18.4, hold + 1.0,
            { dx: (RIFT_C[0] - x0) * R(0.6, 0.95) + R(-40, 40), dy: (RIFT_C[1] - y0) * R(0.5, 0.95) + R(-60, 10), s1: 0.35, hold, r: R(-90, 90), ease: "cubic-bezier(.5,0,.8,.6)", origin: [x0 + PX / 2, y0 + PX / 2] });
    }));
    let cracks = "";
    for (let i = 0; i < 4; i++) { let x = TF + R(40, 130), y = TOP + R(10, 50); for (let k = 0; k < 13; k++) { cracks += rect(x, y, PX / 2, PX / 2, "#FFFFFF"); x += R(-1, 1) * PX * 0.6; y += PX * 0.6; } }
    const main = S.win(rift(), [[17.25, 19.6]]) + S.seq([use("riftShut0"), use("riftShut1"), use("riftShut2")], 19.6, 0.07)
        + flare(...RIFT_C, 300, 19.81, 0.9, 0.35, "pinkFlare") + burst(...RIFT_C, 19.81, { radius: 80, sparks: 16, color: "#DCC6FF", trail: "#A46BFF" })
        + wreck + plumes
        + place(S.win(rA(pose("land")), [[17.25, 17.9]]) + S.win(rLoop("idle"), [[17.9, 20.6]]), RF, TOP)
        + S.win(place(tA(pose("alert")), TF, TOP) + S.win(cracks, [[18.0, 18.4]]), [[17.25, 18.4]]) + dust
        + crackle(...rAt(RF, TOP, MID), 12, 14, 70, 17.3, 1.0)
        + S.fade(boltOnce(rAt(1140, TOP, MID), [rAt(RF, TOP, MID)[0], rAt(1140, TOP, MID)[1]], CYAN, { scale: 0.35 }), [[17.25, 0.8], [17.7, 0]])
        + floating(24, 900, 2500, 600, GROUND);
    shot(17.25, 20.6, { cam: [[17.25, 1950, 780, 0.75, 4, "cubic-bezier(.2,.6,.3,1)"], [20.6, 1720, 690, 0.42, 0]], main });
    // Whiting out from the blow.
    shots.push(S.fade(flat("#FFFFFF"), [[17.249, 0], [17.25, 1, "ease-out"], [17.75, 0]]));

    // ---- 6. the stars come out (20.6-24).
    shot(20.6, D, {
        cam: [[20.6, 1720, 690, 0.42, 0, "cubic-bezier(.4,0,.2,1)"], [22.0, 1800, 330, 0.55, 0], [D, 1800, 320, 0.56, 0]],
        far: use("far") + constellationLit,
        main: wreck + plumes + place(rLoop("idle"), RF, TOP) + floating(16, 1400, 2600, 500, GROUND)
    });
}

// In from nothing, out to nothing (the loop's seam).
const body = S.fade(`<g clip-path="url(#frame)">\n${shots.join("\n")}\n</g>`, [[0, 0], [0.5, 1], [D - 0.6, 1], [D, 0]], { base: 1 });
const svg = S.svg(body, "An anime-style fight to the death across a ruined battlefield between Rascal, a pixel raccoon in a green dino hood, and its purple double from a workspace rift: the whole field from above, a dash and clash, a blow through a stone pillar, lightning across the field, the nano suit, an aerial battle, a beam struggle, an explosion, a thunder slash, impact frames, and the double coming apart into the rift", defs.join("\n") + spriteDefs.join(""));
fs.writeFileSync(OUT, svg);
console.log(`${path.basename(OUT)}  ${W}x${H}  ${(svg.length / 1024).toFixed(0)} KB (${(svg.length / 1024 / 8).toFixed(0)}-ish gzipped), ${S.n} animations`);
