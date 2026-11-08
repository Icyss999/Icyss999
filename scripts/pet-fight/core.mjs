// The engine: the pet's sprite code, colours, drawing, easing, and the
// Scene -- one global clock that every animation in the picture keys off.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";

export const ART_JS = process.argv[2] || process.env.PET_ART
    || path.join(os.homedir(), ".config/quickshell-cc/Pet/pet-art.js");

// A seeded random, so every build draws the same lightning.
function mulberry32(a) {
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export const rnd = mulberry32(20261108);
export const R = (a, b) => a + rnd() * (b - a);
export const pick = (list) => list[Math.floor(rnd() * list.length)];

// pet-art.js is a QML JavaScript library: drop the pragma and it runs as is.
export const Art = vm.createContext({ __rnd: rnd });
vm.runInContext(fs.readFileSync(ART_JS, "utf8").replace(/^\s*\.pragma\s+library.*$/m, ""), Art, { filename: ART_JS });
vm.runInContext("Math.random = __rnd;", Art);

// Frame rates, from PetConfig.qml next to it.
export const FPS = (() => {
    const out = { idle: 3, annoyed: 4, run: 12, fly: 6, charge: 9, zap: 5, jump: 1, climb: 4, walk: 6, dizzy: 6 };
    try {
        const qml = fs.readFileSync(path.join(path.dirname(ART_JS), "PetConfig.qml"), "utf8");
        const block = qml.match(/property var fps:\s*\(\{([\s\S]*?)\}\)/)[1];
        for (const [, k, v] of block.matchAll(/(\w+):\s*([\d.]+)/g)) out[k] = +v;
    } catch { /* the defaults above */ }
    return out;
})();

// ---------------------------------------------------------------- colours

// PetConfig.colors, wallpaper accents baked in.
export const PAL = {
    "#": "#211E30", c: "#70BE60", C: "#50924C", u: "#D8E2E4", s: "#91CEF5",
    w: "#F6F6FA", g: "#C8CCE0", m: "#928E9E", e: "#211E30", p: "#D6CBF5",
    b: "#6EB4F0", h: "#FFFFFF", r: "#E84855", y: "#FAD250", n: "#91CEF5",
    t: "#F2F2F8", R: "#A2B8C9", B: "#78C8FF", D: "#285A8C", L: "#C4C8D6",
    G: "#6E7080", H: "#F0703C", k: "#7B4A2B",
    P: "#A9B1C2", Q: "#727A8C", V: "#DDE1EA", X: "#F0C050", Z: "#6EE7FF", N: "#5CDCFF", F: "#D8FDFF"
};
// PetConfig.riftTwinColors: its double from the other side.
export const TWIN = { ...PAL, c: "#5B4A8C", C: "#3E3166", u: "#A99AE0", s: "#FF4FD8", e: "#FF4FD8",
                      w: "#D9D4EC", g: "#AAA2C8", m: "#6D6390", p: "#FF86C8", R: "#E3A6DC" };
// The twin with its other side showing through: darker, cracked with light.
export const TWIN2 = { ...TWIN, c: "#3B2D63", C: "#281D47", u: "#7E6BC4", w: "#B9B0DA", g: "#8F84B8", R: "#FF4FD8", "#": "#12081F" };
// Pet.qml's boltColors; the twin's lightning in its own colours.
export const CYAN = { h: "#FFFFFF", y: "#D4F8FF", B: "#5CCFFF", N: "#3399FF@.45" };
export const PINK = { h: "#FFFFFF", y: "#FFD6F5", B: "#FF4FD8", N: "#FF4FD8@.4" };
export const GOLD = { h: "#FFFFFF", y: "#FFF3B0", B: "#FFC43A", N: "#FF9F1A@.4" };
export const WEB = { h: "#FFFFFF", n: "#91CEF5", g: "#C8CCE0", r: "#E84855" };
export const RIFT = { h: "#FFFFFF", a: "#DCC6FF", b: "#A46BFF", d: "#4B2A8C", k: "#12081F", n: "#A46BFF@.5" };
export const FIRE = { h: "#FFFFFF", y: "#FFE45C", o: "#FF9F1A", r: "#E84855", d: "#8A2A3A" };
// The world's colours are GitHub's own, light or dark (a build for each):
// tokens, resolved in CSS (see TOKENS), written ".name" in a palette.
export const DUST = { a: ".da", b: ".db", c: ".dc" };
export const SMOKE = { a: ".ka", b: ".kb", c: ".kc" };
export const STONE = { o: ".so", a: ".sa", b: ".sb", c: ".sc", k: ".sk" };
export const mono = (fill, keep = {}) => new Proxy({}, { get: (_, ch) => ch === "__key" ? `mono:${fill}:${JSON.stringify(keep)}` : keep[ch] || fill });
export const INK = "#0B0B12", PAPER = "#F6F6FA", GRAY = "#8B949E";

// name: [dark, light]. Dark is GitHub's dark canvas family, light its light one.
export const TOKENS = {
    m1: ["#141a24", "#e8edf2"], m2: ["#1a2130", "#dde4eb"], m3: ["#2a3446", "#c9d2dc"],
    h1: ["#161c27", "#e3e9ef"], c1: ["#202837", "#d4dbe3"], c2: ["#2c374a", "#c4cdd7"], c3: ["#273041", "#ccd4dd"], tr: ["#1b2230", "#d3dae1"],
    g0: ["#0f141c", "#eef2f6"], g1: ["#30363d", "#d0d7de"], g2: ["#192029", "#e2e7ec"], p1: ["#161c26", "#e5eaef"], p2: ["#1c2330", "#dbe1e7"],
    t1: ["#253142", "#c7d0d9"], t2: ["#2f3f58", "#b5c1cd"],
    so: ["#0b0f15", "#6e7781"], sa: ["#556077", "#e0e5eb"], sb: ["#3c465c", "#c6ced7"], sc: ["#2a3243", "#acb6c1"], sk: ["#0b0f15", "#8c959f"],
    da: ["#f2ede4", "#cfc8bc"], db: ["#d8d1c6", "#bab2a6"], dc: ["#aaa49c", "#a39b8f"],
    ka: ["#9a9da8", "#9097a1"], kb: ["#7c808c", "#a7adb6"], kc: ["#5e626e", "#bcc1c8"],
    b1: ["#121821", "#e6ebf0"], b2: ["#18202d", "#d8dfe6"], b3: ["#1e2636", "#cbd3dc"], b4: ["#2a3448", "#b8c2cd"], b5: ["#0c1118", "#9da8b4"],
    w0: ["#0e131b", "#aeb8c3"], w1: ["#1f2a3b", "#c2cbd5"],
    cl1: ["#1a212e", "#e7ecf1"], cl2: ["#242d3d", "#d9e0e7"], cl3: ["#36435a", "#f7f9fb"],
    st: ["#8b949e", "#8c959f"], hz: ["#30363d", "#d0d7de"], ink: ["#ffffff", "#1f2328"], mist: ["#c8d3e6", "#6e7781"], fgc: ["#000000", "#aab3bc"]
};

export const r1 = (n) => Math.round(n * 10) / 10;
export const r3 = (n) => Math.round(n * 1000) / 1000;
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// A fill: a colour, or ".token" -- then it's a class.
export const fillAttr = (f) => f[0] === "." ? `class="${f.slice(1)}"` : `fill="${f}"`;

// ---------------------------------------------------------------- drawing

export function paint(paths, pal) {
    let s = "";
    for (const ch of Object.keys(paths)) {
        const v = pal[ch];
        if (!v || !paths[ch]) continue;
        const [fill, alpha] = v.split("@");
        s += `<path ${fillAttr(fill)}${alpha ? ` fill-opacity="${alpha}"` : ""} d="${paths[ch]}"/>`;
    }
    return s;
}
// A character grid as pixel art, `px` user units a pixel. Each drawing goes
// into <defs> once and is reused from there, however many shots show it.
const sprites = new Map();
export const spriteDefs = [];
const palKey = (pal) => pal.__key || JSON.stringify(pal);
export function pix(rows, px, x = 0, y = 0, { flip = false, pal = PAL } = {}) {
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
export function shapes(sh, px, x, y, pal) {
    return `<g transform="translate(${r1(x + sh.origin[0] * px)} ${r1(y + sh.origin[1] * px)}) scale(${px})">${paint(sh.paths, pal)}</g>`;
}
export const rect = (x, y, w, h, fill, extra = "") => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" ${fillAttr(fill)}${extra}/>`;
export const place = (html, x, y) => `<g transform="translate(${r1(x)} ${r1(y)})">${html}</g>`;
export const poly = (pts, fill, extra = "") => `<polygon points="${pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(" ")}" ${fillAttr(fill)}${extra}/>`;
// A disc of pixels, `r` across (half), coloured by how far out each is.
export function disc(r, colour) {
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
// A stepped skyline: x0..x1, from `base` up to top(x), in steps.
export const stepped = (x0, x1, base, top, step) => {
    let d = `M${x0} ${base}`;
    for (let x = x0; x < x1; x += step) { const y = Math.round(top(x) / step) * step; d += `L${x} ${y}L${x + step} ${y}`; }
    return `${d}L${x1} ${base}Z`;
};

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
export function easing(e) {
    if (!e) return EASE.linear;
    if (EASE[e]) return EASE[e];
    const m = e.match(/cubic-bezier\(([^)]+)\)/);
    return m ? cubicBezier(...m[1].split(",").map(Number)) : EASE.linear;
}
// Where something moving along [t, x, y, rotate, scale, easing] points is at t.
export function pathAt(pts, t) {
    if (t <= pts[0][0]) return pts[0];
    for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1];
        if (t <= b[0]) {
            const f = easing(a[5])((t - a[0]) / (b[0] - a[0] || 1));
            return [t, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, (a[3] || 0) + ((b[3] || 0) - (a[3] || 0)) * f, (a[4] ?? 1) + ((b[4] ?? 1) - (a[4] ?? 1)) * f];
        }
    }
    return pts.at(-1);
}

// A smooth curve through (ts, ys) that never overshoots them (monotone
// cubic Hermite, Fritsch-Carlson).
export function monotone(ts, ys) {
    const n = ts.length, d = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (ts[i + 1] - ts[i] || 1e-6);
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
        if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
        const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
        if (h > 9) { const tau = 3 / Math.sqrt(h); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]; }
    }
    return (t) => {
        if (t <= ts[0]) return ys[0];
        if (t >= ts[n - 1]) return ys[n - 1];
        let i = 0;
        while (t > ts[i + 1]) i++;
        const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, u2 = u * u, u3 = u2 * u;
        return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
    };
}

// ---------------------------------------------------------------- the clock

export const W = 960, H = 720, D = 90;
// The camera's parallax anchor: layers further back move less round it.
export const ANCHOR = [1600, 700];

class Scene {
    constructor(W, H, D) { Object.assign(this, { W, H, D, css: [], n: 0, off: 0, loops: new Set(), shared: new Set(), rules: new Map() }); }
    uid(p) { return p + (this.n++).toString(36); }
    P(t) { return `${r3(Math.max(0, Math.min(100, (t / this.D) * 100)))}%`; }
    // Everything made inside fn() happens `off` seconds later: a scene can be
    // written in its own time and dropped in anywhere.
    within(off, fn) { const was = this.off; this.off += off; try { return fn(); } finally { this.off = was; } }

    // @keyframes from [t, declarations, easing?], the ends filled in.
    keyframes(name, steps) {
        const s = steps.map(([t, d, e]) => [t + this.off, d, e]).sort((a, b) => a[0] - b[0]);
        if (s[0][0] > 0) s.unshift([0, s[0][1]]);
        if (s.at(-1)[0] < this.D) s.push([this.D, s.at(-1)[1]]);
        const byPct = new Map();
        for (const [t, decl, ease] of s) byPct.set(this.P(t), `${decl}${ease ? `;animation-timing-function:${ease}` : ""}`);
        return `{${[...byPct].map(([p, d]) => `${p}{${d}}`).join("")}}`;
    }
    // A rule for these keyframes and declarations (with NAME for its name):
    // the same twice is the same class.
    rule(prefix, steps, decl) {
        const body = this.keyframes("", steps), key = body + decl;
        let id = this.rules.get(key);
        if (!id) {
            id = this.uid(prefix);
            this.rules.set(key, id);
            this.css.push(`@keyframes ${id}${body}.${id}{${decl.replace(/NAME/g, id)}}`);
        }
        return id;
    }
    anim(prefix, steps, rest = "", timing = "linear") { return this.rule(prefix, steps, `animation:NAME ${this.D}s ${timing} infinite;${rest}`); }

    // Shown only within these windows ([from, to] s).
    win(content, windows, { still = false } = {}) {
        const steps = [[-this.off, "opacity:0"]];
        for (const [a, b] of windows) { steps.push([a, "opacity:1"]); if (b + this.off < this.D) steps.push([b, "opacity:0"]); }
        return `<g class="${this.anim("w", steps, `opacity:${still ? 1 : 0}`, "step-end")}">${content}</g>`;
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
    // point to the next), turning and scaling round `origin`. With `on`, it
    // moves the way drawn animation does: a new drawing every 2 frames (of
    // 24), every frame for the quick moves, every 3 for the long heavy ones.
    move(content, pts, { origin = [0, 0], still, on = false } = {}) {
        // (Drawn on 1s/2s/3s nothing is in between, so a turn or a scale
        // needn't be spelt out when there isn't one.)
        const tf = on ? (x, y, r, s) => `transform:translate(${r1(x)}px,${r1(y)}px)${r1(r) ? ` rotate(${r1(r)}deg)` : ""}${r3(s) !== 1 ? ` scale(${r3(s)})` : ""}`
            : (x, y, r, s) => `transform:translate(${r1(x)}px,${r1(y)}px) rotate(${r1(r)}deg) scale(${r3(s)})`;
        const steps = [];
        pts.forEach(([t, x, y, r = 0, s = 1, e], i) => {
            const b = pts[i + 1];
            if (!on || !b) { steps.push([t, tf(x, y, r, s), on ? "step-end" : e]); return; }
            steps.push([t, tf(x, y, r, s), "step-end"]);
            const [bt, bx, by, br = 0, bs = 1] = b, seg = bt - t;
            if (bx === x && by === y && br === r && bs === s) return;
            const fps = typeof on === "number" ? on : seg <= 0.3 ? 24 : seg > 1.2 ? 8 : 12, n = Math.max(1, Math.round(seg * fps)), ease = easing(e);
            for (let k = 1; k < n; k++) {
                const f = ease(k / n);
                steps.push([t + (seg * k) / n, tf(x + (bx - x) * f, y + (by - y) * f, r + (br - r) * f, s + (bs - s) * f), "step-end"]);
            }
        });
        const id = this.anim("m", steps, `transform-origin:${r1(origin[0])}px ${r1(origin[1])}px`);
        return `<g class="${id}"${still ? ` transform="translate(${still[0]} ${still[1]})"` : ""}>${content}</g>`;
    }
    // The camera: [t, cx, cy, zoom, roll, easing] -- the world point (cx, cy)
    // in the middle of the picture, zoomed and rolled round it. A layer at
    // depth f (1 the action, less further back) moves and zooms less.
    // With three keys or more it glides through them on a smooth curve
    // (never stopping dead at one, never overshooting), like a camera on a
    // crane, sampled finely.
    camera(content, pts, f = 1) {
        const at = (t, cx, cy, z, r = 0) => {
            const lx = ANCHOR[0] + f * (cx - ANCHOR[0]), ly = ANCHOR[1] + f * (cy - ANCHOR[1]), lz = z ** f;
            return `transform:translate(${this.W / 2}px,${this.H / 2}px) rotate(${r1(r)}deg) scale(${r3(lz)}) translate(${r1(-lx)}px,${r1(-ly)}px)`;
        };
        // ("cut" between keys: the camera jumps there, a cut to a new shot.)
        const groups = [[]];
        for (const p of pts) p === "cut" ? groups.push([]) : groups.at(-1).push(p);
        const steps = [];
        for (const g of groups) {
            let s;
            if (g.length < 3) s = g.map(([t, cx, cy, z, r = 0, e]) => [t, at(t, cx, cy, z, r), e]);
            else {
                const ts = g.map((p) => p[0]), curves = [1, 2, 3, 4].map((k) => monotone(ts, g.map((p) => p[k] ?? 0)));
                const times = new Set(ts);
                for (let t = ts[0]; t < ts.at(-1); t += 1 / 8) times.add(Math.round(t * 1000) / 1000);
                s = [...times].sort((a, b) => a - b).map((t) => [t, at(t, ...curves.map((c) => c(t)))]);
            }
            s.at(-1)[2] = "step-end";
            steps.push(...s);
        }
        // (A shot that ends where the next begins ends a hair before it.)
        for (let i = 1; i < steps.length; i++) if (steps[i - 1][2] === "step-end" && steps[i][0] - steps[i - 1][0] < 0.002) steps[i - 1][0] = steps[i][0] - 0.002;
        return `<g class="${this.anim("c", steps, "transform-origin:0 0")}">${content}</g>`;
    }
    // Shaking: [t0, duration, amplitude] jolts, swinging side to side and
    // dying away.
    quake(content, jolts) {
        const pts = [[-this.off, "transform:translate(0px,0px)"]];
        for (const [t0, dur, amp] of jolts) {
            for (let k = 0; k * 0.045 < dur; k++) {
                const a = amp * (1 - (k * 0.045) / dur) ** 1.3, side = k % 2 ? 1 : -1;
                pts.push([t0 + k * 0.045, `transform:translate(${r1(side * R(a * 0.5, a))}px,${r1(R(-a, a) * 0.7)}px)`]);
            }
            pts.push([t0 + dur, "transform:translate(0px,0px)"]);
        }
        return `<g class="${this.anim("q", pts, "", "ease-in-out")}">${content}</g>`;
    }
    // Squash and stretch: at t it's squashed (sx, sy) round `origin`, springs
    // past, and settles over dur. (Nest them for more than one.)
    squash(content, t, { origin = [90, 172], sx = 1.22, sy = 0.78, dur = 0.3 } = {}) {
        dur = Math.round(dur * 20) / 20;
        const k = `sq${Math.round(dur * 100)}`;
        if (!this.shared.has(k)) {
            this.shared.add(k);
            const p = (dur / this.D) * 100;
            this.css.push(`@keyframes ${k}{0%{transform:scale(var(--sx),var(--sy))}${r3(p * 0.35)}%{transform:scale(calc(2 - var(--sx)*.97),calc(2 - var(--sy)*.97))}${r3(p * 0.7)}%{transform:scale(calc(.5 + var(--sx)*.5),calc(.5 + var(--sy)*.5))}${r3(p)}%,100%{transform:scale(1,1)}}.${k}{animation:${k} ${this.D}s ease-out infinite}`);
        }
        return `<g class="${k}" style="animation-delay:${r3(t + this.off)}s;--sx:${sx};--sy:${sy};transform-origin:${origin[0]}px ${origin[1]}px">${content}</g>`;
    }
    // Opacity along [t, value, easing].
    fade(content, pts, { base = 0 } = {}) {
        return `<g class="${this.anim("o", pts.map(([t, v, e]) => [t, `opacity:${v}`, e]), `opacity:${base}`)}">${content}</g>`;
    }
    // A one-off: at t0, it waits `hold`, then flies off by (dx, dy), turning
    // `r` and scaling s0 -> s1 round `origin`, by t0 + dur; fading out ("o"),
    // in and out ("io"), or not at all ("k": it stays where it ends up).
    shot(content, t0, dur, { dx = 0, dy = 0, r = 0, s0 = 1, s1 = 1, ease = "ease-out", origin, mode = "o", hold = 0 } = {}) {
        dur = Math.max(0.05, Math.round(dur * 20) / 20); hold = Math.round(hold * 20) / 20;
        const k = `${mode}${Math.round(dur * 100)}h${Math.round(hold * 100)}`;
        if (!this.shared.has(k)) {
            this.shared.add(k);
            const p = (dur / this.D) * 100, h = (hold / this.D) * 100, endOp = mode === "k" ? 1 : 0;
            const start = "transform:translate(0px,0px) rotate(0deg) scale(var(--s0))", end = "transform:translate(var(--dx),var(--dy)) rotate(var(--r)) scale(var(--s1))";
            const mid = mode === "io" ? `${r3(p * 0.15)}%{opacity:1}${r3(p * 0.7)}%{opacity:1}` : hold ? `${r3(h)}%{opacity:1;${start}}` : "";
            this.css.push(`@keyframes s${k}{0%{opacity:${mode === "io" ? 0 : 1};${start}}${mid}`
                + `${r3(p)}%{opacity:${endOp};${end}}100%{opacity:${endOp};${end}}}.s${k}{animation:s${k} ${this.D}s ease-out infinite;opacity:0;--dx:0px;--dy:0px;--r:0deg;--s0:1;--s1:1}`);
        }
        return `<g class="s${k}" style="${this.vars(t0, { ease, dx, dy, r, s0, s1, origin })}">${content}</g>`;
    }
    vars(t0, { ease = "ease-out", dx, dy, r, s0, s1, origin }) {
        const st = [`animation-delay:${r3(t0 + this.off)}s`];
        if (ease !== "ease-out") st.push(`animation-timing-function:${ease}`);
        if (dx) st.push(`--dx:${r1(dx)}px`);
        if (dy) st.push(`--dy:${r1(dy)}px`);
        if (r) st.push(`--r:${Math.round(r)}deg`);
        if (s0 !== 1) st.push(`--s0:${r3(s0)}`);
        if (s1 !== 1) st.push(`--s1:${r3(s1)}`);
        if (origin) st.push(`transform-origin:${r1(origin[0])}px ${r1(origin[1])}px`);
        return st.join(";");
    }
    // A speed ramp: like shot(), but along `phases` -- [seconds in, share of
    // the way, easing] -- so it can burst out, all but stop (slow motion),
    // and snap back to full speed. Gone after the last phase.
    ramp(content, t0, phases, { dx = 0, dy = 0, r = 0, s0 = 1, s1 = 1, origin, keep = false } = {}) {
        const k = `r${phases.map(([t, f]) => `${Math.round(t * 100)}_${Math.round(f * 100)}`).join("_")}${keep ? "k" : ""}`;
        if (!this.shared.has(k)) {
            this.shared.add(k);
            const at = (f) => `transform:translate(calc(var(--dx)*${f}),calc(var(--dy)*${f})) rotate(calc(var(--r)*${f})) scale(calc(var(--s0) + (var(--s1) - var(--s0))*${f}))`;
            let frames = "";
            phases.forEach(([t, f, e]) => { frames += `${r3((t / this.D) * 100)}%{opacity:1;${at(f)}${e ? `;animation-timing-function:${e}` : ""}}`; });
            const [tl, fl] = phases.at(-1), pe = r3((tl / this.D) * 100 + 0.001);
            frames += `${pe}%,100%{opacity:${keep ? 1 : 0};${at(fl)}}`;
            this.css.push(`@keyframes ${k}{${frames}}.${k}{animation:${k} ${this.D}s linear infinite;opacity:0;--dx:0px;--dy:0px;--r:0deg;--s0:1;--s1:1}`);
        }
        return `<g class="${k}" style="${this.vars(t0, { ease: "linear", dx, dy, r, s0, s1, origin })}">${content}</g>`;
    }
    // A line drawing itself (its paths need pathLength="1"), from t0 over dur;
    // it stays drawn.
    grow(content, t0, dur) {
        dur = Math.max(0.05, Math.round(dur * 20) / 20);
        const k = `g${Math.round(dur * 100)}`;
        if (!this.shared.has(k)) {
            this.shared.add(k);
            this.css.push(`@keyframes ${k}{0%{stroke-dashoffset:1;opacity:1}${r3((dur / this.D) * 100)}%,100%{stroke-dashoffset:0;opacity:1}}.${k}{animation:${k} ${this.D}s ease-out infinite;stroke-dasharray:1 1;stroke-dashoffset:1;opacity:0}`);
        }
        return `<g class="${k}" style="animation-delay:${r3(t0 + this.off)}s">${content}</g>`;
    }

    svg(body, label, defs, theme = "dark", extraCss = "") {
        const sizes = [...this.loops].sort();
        const loops = sizes.map((N) => `@keyframes f${N}{0%{opacity:1}${r3(100 / N)}%{opacity:0}100%{opacity:0}}.f${N}{animation-name:f${N}}`).join("\n");
        const vars = Object.entries(TOKENS).map(([k, [d, l]]) => `--${k}:${theme === "light" ? l : d}`).join(";");
        const classes = Object.keys(TOKENS).map((k) => `.${k}{fill:var(--${k})}`).join("");
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.W} ${this.H}" width="${this.W}" height="${this.H}" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}">
<defs>${defs}</defs>
<style>
svg{${vars}}
${classes}
.twk{animation:twk 3.4s ease-in-out infinite;opacity:.2}
@keyframes twk{0%,100%{opacity:.15}50%{opacity:.9}}
.rise{animation:rise .26s linear infinite;opacity:0}
@keyframes rise{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
.drift{animation:drift 3s linear infinite;opacity:0}
@keyframes drift{0%{opacity:0;transform:translate(0,0)}15%{opacity:.85}85%{opacity:.85}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
.plume{animation:plume 3s ease-out infinite;opacity:0}
@keyframes plume{0%{opacity:0;transform:translate(0,0) scale(.4)}20%{opacity:.7}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.6)}}
.sway{animation:sway 1.6s ease-in-out infinite}
@keyframes sway{0%,100%{transform:skewX(0deg)}50%{transform:skewX(-14deg)}}
.heat{animation:heat .9s linear infinite;opacity:0}
@keyframes heat{0%{opacity:0;transform:translate(0,0) skewX(0deg)}30%{opacity:.5;transform:translate(3px,-20px) skewX(12deg)}60%{opacity:.4;transform:translate(-3px,-40px) skewX(-12deg)}100%{opacity:0;transform:translate(0,-60px) skewX(0deg)}}
.ray{animation:ray 4s ease-in-out infinite}
@keyframes ray{0%,100%{opacity:.5}50%{opacity:1}}
.orb{animation:orb 2.4s linear infinite}
@keyframes orb{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.flk{animation:flk 2.2s step-end infinite}
.breathe{animation:breathe 2.4s ease-in-out infinite;transform-origin:90px 172px}
@keyframes breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.025,.97)}}
.mist{animation:mist 16s ease-in-out infinite alternate}
@keyframes mist{0%{transform:translate(-120px,0)}100%{transform:translate(160px,-6px)}}
.wave{animation:wave 1.3s ease-in-out infinite}
@keyframes wave{0%,100%{transform:skewY(0deg) scaleX(1)}50%{transform:skewY(7deg) scaleX(.92)}}
.shoot{animation:shoot 9s linear infinite;opacity:0}
@keyframes shoot{0%,88%{opacity:0;transform:translate(0,0)}89%{opacity:1}95%{opacity:0;transform:translate(-520px,260px)}100%{opacity:0;transform:translate(-520px,260px)}}
.mote{animation:mote 7s ease-in-out infinite;opacity:0}
@keyframes mote{0%{opacity:0;transform:translate(0,0)}20%{opacity:.7}80%{opacity:.6}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
@keyframes flk{0%{opacity:1}8%{opacity:.2}10%{opacity:1}52%{opacity:.35}54%{opacity:1}57%{opacity:.25}60%{opacity:1}}
${loops}
${sizes.map((N) => `.f${N}`).join(",")}{opacity:0;animation-timing-function:step-end;animation-iteration-count:infinite}
.k0{opacity:1}
${extraCss}
${this.css.join("\n")}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
${body}
</svg>
`;
    }
}
export const S = new Scene(W, H, D);

// ---------------------------------------------------------------- the world

// The picture is 960 x 720, its background transparent. The battlefield is
// 3200 across; GROUND is where feet go.
export const GROUND = 900, PX = 10, fx = 6, bfx = 6, K = PX / 7;
export const TOP = GROUND - Art.H * PX;                // a pet's art top, standing

export const defs = [];
export const shots = [];
export const use = (id, extra = "") => `<use href="#${id}"${extra}/>`;

// A shot: from t0 to t1, the world through the camera -- far, mid, the
// action, the foreground, each at its own depth -- a backdrop behind and
// anything in front in picture units; shaken by `quake`.
// The foreground that goes with each kind of ground, nearest the camera.
const FG = { [use("ground")]: use("fg"), [use("street")]: use("fgCity") };
export function shot(t0, t1, opts) { shotIn([[t0, t1]], opts); }
function shotIn(windows, { cam, main = "", far = use("far"), mid = use("mid"), ground = use("ground"), fg = FG[ground] || "", bg = "", screen = "", quake, wrap }) {
    let view = (far ? S.camera(far, cam, 0.3) : "") + (mid ? S.camera(mid, cam, 0.6) : "") + S.camera((ground || "") + main, cam, 1) + (fg ? S.camera(fg, cam, 1.3) : "");
    if (wrap) view = wrap(view);
    if (quake?.length) view = S.quake(view, quake);
    shots.push(S.win(bg + view + screen, windows));
}
// Several shots of the same place, cut together: one world (`common`, and
// the layers), the camera cutting from framing to framing; each shot's own
// things shown only in it.
export function sequence(world, segs) {
    const cam = [], windows = [];
    segs.forEach((s, i) => { if (i) cam.push("cut"); cam.push(...s.cam); });
    for (const { t0, t1 } of segs) windows.at(-1)?.[1] === t0 ? (windows.at(-1)[1] = t1) : windows.push([t0, t1]);
    const only = (k) => segs.map((s) => (s[k] ? S.win(s[k], [[s.t0, s.t1]]) : "")).join("");
    shotIn(windows, { ...world, cam, main: (world.common || "") + only("main"), bg: only("bg"), screen: only("screen"), quake: segs.flatMap((s) => s.quake || []) });
}
// A shot in picture units, no camera.
export const flatShot = (t0, t1, html) => shots.push(S.win(html, [[t0, t1]]));

// Pixel letters, 5 x 7.
export const FONT = {
    I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
    Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
    L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
    " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."]
};
// A word as rows of `ch` (5 x 7 letters, a column apart).
export const word = (w, ch = "c") => FONT.I.map((_, y) => [...w].map((l) => FONT[l][y].replace(/#/g, ch).replace(/\./g, " ")).join(" "));
// A word's width in pixels.
export const wordW = (w) => w.length * 6 - 1;
