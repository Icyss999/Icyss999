#!/usr/bin/env node
// Builds the README's animated SVGs of Rascal, the desktop pet from my
// Quickshell config, straight from its own sprite code (Pet/pet-art.js) and
// frame rates (Pet/PetConfig.qml), so the README shows the same frames the
// desktop does. Plain SVG + CSS, no scripts, so GitHub animates it.
//
//   node scripts/build-pet-svgs.mjs [path/to/pet-art.js]
//
// Writes assets/pet-hello.svg, assets/pet-moves.svg, assets/pet-goodnight.svg.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ART_JS = process.argv[2] || process.env.PET_ART
    || path.join(os.homedir(), ".config/quickshell-cc/Pet/pet-art.js");
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets");

// pet-art.js is a QML JavaScript library: drop the pragma and it runs as is.
const Art = vm.createContext({});
vm.runInContext(fs.readFileSync(ART_JS, "utf8").replace(/^\s*\.pragma\s+library.*$/m, ""), Art, { filename: ART_JS });

// Frame rates, from PetConfig.qml next to it when it's there.
const FPS = (() => {
    const fallback = { idle: 3, walk: 8, run: 12, sleep: 1.2, happy: 6, dance: 5, type: 6, eat: 5,
                       think: 1, flex: 3, shiver: 10, stretch: 2, wave: 5, dynamo: 14, alert: 1 };
    try {
        const qml = fs.readFileSync(path.join(path.dirname(ART_JS), "PetConfig.qml"), "utf8");
        const block = qml.match(/property var fps:\s*\(\{([\s\S]*?)\}\)/)[1];
        const out = {};
        for (const [, k, v] of block.matchAll(/(\w+):\s*([\d.]+)/g)) out[k] = +v;
        return { ...fallback, ...out };
    } catch { return fallback; }
})();

// The pet's palette (PetConfig.colors with my wallpaper accents baked in, as
// in assets/pet-rift-kick.svg).
const PAL = {
    "#": "#211E30", c: "#70BE60", C: "#50924C", u: "#D8E2E4", s: "#91CEF5",
    w: "#F6F6FA", g: "#C8CCE0", m: "#928E9E", e: "#211E30", p: "#D6CBF5",
    b: "#6EB4F0", h: "#FFFFFF", r: "#E84855", y: "#FAD250", n: "#91CEF5",
    t: "#F2F2F8", R: "#A2B8C9", B: "#78C8FF", D: "#285A8C", L: "#C4C8D6",
    G: "#6E7080", H: "#F0703C", k: "#7B4A2B"
};
const GRAY = "#8B949E";
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const SANS = "Inter, 'Segoe UI', Roboto, Arial, sans-serif";

const r3 = (n) => Math.round(n * 1000) / 1000;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const MODS = { rim: true, face: "raccoon" };
const pose = (state, f = 0, mods = {}) => Art.pose(state, f, { ...MODS, ...mods });
const frames = (state, mods = {}) => Array.from({ length: Art.FRAMES[state] || 1 }, (_, f) => pose(state, f, mods));

// A character grid as pixel art: one path per colour, `px` user units a pixel.
function pix(rows, px, x = 0, y = 0, flip = false) {
    const p = Art.paths(rows, flip);
    let body = "";
    for (const ch of Object.keys(p)) if (PAL[ch]) body += `<path fill="${PAL[ch]}" d="${p[ch]}"/>`;
    return `<g transform="translate(${r3(x)} ${r3(y)}) scale(${px})">${body}</g>`;
}

// Columns a set of grids actually draws in: [first, last].
function span(...grids) {
    let a = Infinity, b = -Infinity;
    for (const rows of grids) for (const row of rows)
        for (let x = 0; x < row.length; x++) if (row[x] !== " ") { a = Math.min(a, x); b = Math.max(b, x); }
    return [a, b];
}

// ---------------------------------------------------------------- scenes

class Scene {
    constructor(w, h, D) {
        Object.assign(this, { w, h, D, css: [], n: 0, loops: new Set() });
    }
    uid(p) { return p + (this.n++).toString(36); }
    pct(t, D) { return `${r3((t / D) * 100)}%`; }

    // Frames cycling at `fps`, on their own clock.
    loop(list, fps) {
        const N = list.length;
        if (N === 1) return list[0];
        const T = N / fps;
        this.loops.add(N);
        return list.map((f, i) => `<g class="f${N}${i ? "" : " k0"}" style="animation-duration:${r3(T)}s`
            + `${i ? `;animation-delay:${r3(((i - N) * T) / N)}s` : ""}">${f}</g>`).join("");
    }

    // Shown only within these windows of the clock ([from, to] seconds).
    // `still` = what's left showing for people who turn animation off.
    during(content, windows, { D = this.D, still = false } = {}) {
        const id = this.uid("w");
        const ks = new Map([[0, 0]]);
        for (const [a, b] of windows) { ks.set(r3(a), 1); if (b < D) ks.set(r3(b), 0); }
        const steps = [...ks].sort((p, q) => p[0] - q[0]);
        if (steps.at(-1)[0] < D) steps.push([D, steps.at(-1)[1]]);
        this.css.push(`@keyframes ${id}{${steps.map(([t, v]) => `${this.pct(t, D)}{opacity:${v}}`).join("")}}`
            + `.${id}{animation:${id} ${D}s step-end infinite;opacity:${still ? 1 : 0}}`);
        return `<g class="${id}">${content}</g>`;
    }

    // Moved along [t, x, y, easing?] points on the clock (the easing runs
    // from that point to the next).
    path(content, pts, { D = this.D, still } = {}) {
        const id = this.uid("p");
        const list = pts.map((p) => [...p]);
        if (list[0][0] > 0) list.unshift([0, list[0][1], list[0][2]]);
        if (list.at(-1)[0] < D) list.push([D, list.at(-1)[1], list.at(-1)[2]]);
        const kf = list.map(([t, x, y, e]) => `${this.pct(t, D)}{transform:translate(${r3(x)}px,${r3(y)}px)`
            + `${e ? `;animation-timing-function:${e}` : ""}}`).join("");
        this.css.push(`@keyframes ${id}{${kf}}.${id}{animation:${id} ${D}s linear infinite}`);
        const [sx, sy] = still || list[0].slice(1, 3);
        return `<g class="${id}" transform="translate(${r3(sx)} ${r3(sy)})">${content}</g>`;
    }

    // Pops in at `a` and out at `b`, growing from (ox, oy).
    pop(content, a, b, ox, oy, { D = this.D } = {}) {
        const id = this.uid("b");
        const P = (t) => this.pct(t, D);
        const off = "opacity:0;transform:scale(.4)", on = "opacity:1;transform:scale(1)";
        this.css.push(`@keyframes ${id}{0%,${P(a)}{${off};animation-timing-function:cubic-bezier(.2,.8,.3,1.3)}`
            + `${P(a + 0.22)},${P(b - 0.14)}{${on}}${P(b)},100%{opacity:0;transform:scale(.85)}}`
            + `.${id}{animation:${id} ${D}s infinite;opacity:0;transform-origin:${r3(ox)}px ${r3(oy)}px}`);
        return `<g class="${id}">${content}</g>`;
    }

    // Floats off by (dx, dy), fading, every `dur` seconds from `at`.
    rise(content, { dur, at = 0, dx = 0, dy = -30, ease = "ease-out" }) {
        return `<g class="rise" style="animation-duration:${r3(dur)}s;animation-delay:${r3(at - dur * Math.ceil(at / dur + 1e-9))}s;`
            + `animation-timing-function:${ease};--dx:${dx}px;--dy:${dy}px">${content}</g>`;
    }

    svg(body, label) {
        const sizes = [...this.loops].sort();
        const loops = sizes.map((N) => `@keyframes f${N}{0%{opacity:1}${r3(100 / N)}%{opacity:0}100%{opacity:0}}.f${N}{animation-name:f${N}}`).join("\n");
        const common = sizes.length ? `${sizes.map((N) => `.f${N}`).join(",")}{opacity:0;animation-timing-function:step-end;animation-iteration-count:infinite}\n.k0{opacity:1}` : "";
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}">
<style>
.rise{animation:rise 2s ease-out infinite;opacity:0}
@keyframes rise{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}70%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
.blink{animation:blink 1.06s step-end infinite}
@keyframes blink{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
.bob{animation:bob 1.4s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translate(0,0)}50%{transform:translate(0,-5px)}}
.spark{animation:spark .5s step-end infinite;opacity:0}
@keyframes spark{0%{opacity:1}40%{opacity:0}100%{opacity:0}}
.twk{animation:twk 3.4s ease-in-out infinite;opacity:.2}
@keyframes twk{0%,100%{opacity:.15}50%{opacity:.9}}
${loops}
${common}
${this.css.join("\n")}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
${body}
</svg>
`;
    }
}

// A little plus-shaped twinkle, like the stars in pet-rift-kick.svg.
function twinkle(x, y, delay) {
    return `<g transform="translate(${x} ${y})"><g class="twk" style="animation-delay:${delay}s">`
        + `<rect x="2" y="0" width="2" height="6" fill="#9DB4D3"/><rect x="0" y="2" width="6" height="2" fill="#9DB4D3"/>`
        + `<rect x="2" y="2" width="2" height="2" fill="#FFFFFF"/></g></g>`;
}

// A speech bubble like the one in pet-rift-kick.svg, its tail's tip at
// (tx, ty) with the box above and to the right of it.
function bubble(text, tx, ty, size = 19) {
    const w = Math.round(30 + text.length * size * 0.58), h = 40;
    const x = tx - 20, y = ty - h - 10;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#17191C"/>`
        + `<rect x="${tx}" y="${ty - 12}" width="10" height="6" fill="#17191C"/><rect x="${tx}" y="${ty - 6}" width="6" height="6" fill="#17191C"/>`
        + `<text x="${x + w / 2}" y="${y + 27}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="${size}" fill="#FFFFFF" stroke="#91CEF5" stroke-width=".6" paint-order="stroke">${esc(text)}</text>`;
}

// A word in chunky outlined pixel letters, drawn like the pet: costume
// green, a dark outline, the light rim outside it.
const FONT = {
    I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
    C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
    Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
    L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"]
};
// Each font pixel is 2 x 2 cells, so the strokes are chunky enough to read
// inside their outline.
function pixelWord(word) {
    const gap = 3, W = word.length * (10 + gap) - gap + 4, H = 14 + 4;
    const g = Array.from({ length: H }, () => Array(W).fill(" "));
    [...word].forEach((ch, i) => FONT[ch].forEach((row, y) => [...row].forEach((v, x) => {
        if (v !== "#") return;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++)
            g[2 + y * 2 + dy][2 + i * (10 + gap) + x * 2 + dx] = y === 6 ? "C" : "c";
    })));
    const around = (x, y, test, diag) => [[1, 0], [-1, 0], [0, 1], [0, -1], ...(diag ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [])]
        .some(([dx, dy]) => test((g[y + dy] || [])[x + dx]));
    const mark = (ch, test, diag) => {
        const hits = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === " " && around(x, y, test, diag)) hits.push([x, y]);
        hits.forEach(([x, y]) => (g[y][x] = ch));
    };
    mark("#", (c) => c === "c" || c === "C", true);
    mark("R", (c) => c === "#", false);
    return g.map((r) => r.join(""));
}

// ---------------------------------------------------------------- 1. hello

function hello() {
    const S = new Scene(800, 220, 13);
    const px = 6, ground = 198, top = ground - Art.H * px;
    const stop = 110;                       // where it stands, art's left edge
    const headX = stop + Art.HEAD_X * px;   // middle of the hood
    const headY = top + Art.HEAD_Y * px;

    // Its moves, on a 13 s clock:
    //   0-3     walks in          3-4.6   stands there (you type a command)
    //   4.6-7.4 waves, "hi there!"         7.4-10.2 dances
    //   10.2-10.8 looks round     10.8-12 dashes off   12-13 gone
    const walkR = S.during(S.loop(frames("walk").map((r) => pix(r, px)), FPS.walk), [[0, 3]]);
    const runL = S.during(S.loop(frames("run").map((r) => pix(r, px, 0, 0, true)), FPS.run), [[10.8, 12]]);
    const mover = S.path(walkR + runL, [[0, -130, top], [3, stop, top], [10.8, stop, top, "cubic-bezier(.5,0,.9,.6)"], [12, -140, top]]);

    const idle = frames("idle").map((r) => pix(r, px, stop, top));
    idle.splice(2, 0, pix(pose("idle", 1, { blink: true }), px, stop, top));
    const standing = S.during(S.loop(idle, FPS.idle), [[3, 4.6], [10.2, 10.8]]);
    const wave = S.during(S.loop(frames("wave").map((r) => pix(r, px, stop, top)), FPS.wave), [[4.6, 7.4]], { still: true });
    const dance = S.during(S.loop(frames("dance").map((r) => pix(r, px, stop, top)), FPS.dance), [[7.4, 10.2]]);

    const notes = S.during([0, 0.55, 1.1].map((at, i) => S.rise(pix(Art.effect("note"), 3, headX + 30 + i * 6, headY + 8),
        { dur: 1.65, at, dx: 18 + i * 8, dy: -46 })).join(""), [[7.5, 10.4]]);
    const hi = S.pop(bubble("hi there!", headX + 6, headY - 6), 4.7, 7.4, headX + 6, headY - 6);

    // The title, and the command that makes it say hello.
    const title = pixelWord("ICYCLE");
    const unit = 4, tx = 446, ty = 28, tBottom = ty + title.length * unit, textX = tx + 2 * unit;
    const sub = `<text x="${textX}" y="${tBottom + 30}" font-family="${MONO}" font-size="16" fill="${GRAY}">chill dev · Rascal's human</text>`;

    const cmd = '$ qs-pet say "hi there!"', cw = 9.6, cx = textX, cy = tBottom + 62;
    const t0 = 3.2, dt = 0.055, shown = [0, 1];     // "$ " is always there
    const clear = 12.2;
    const color = (i) => (i === 0 ? "#4CA4FA" : i >= 14 ? "#70BE60" : GRAY);
    let typed = "";
    [...cmd].forEach((ch, i) => {
        if (ch === " ") return;
        const glyph = `<text x="${r3(cx + i * cw)}" y="${cy}" fill="${color(i)}">${esc(ch)}</text>`;
        typed += shown.includes(i) ? glyph : S.during(glyph, [[t0 + (i - 2) * dt, clear]], { still: true });
    });
    const tEnd = t0 + (cmd.length - 2) * dt;
    const cursorPts = [[0, 2 * cw, 0, "step-end"]];
    for (let i = 3; i <= cmd.length; i++) cursorPts.push([t0 + (i - 2) * dt - dt, i * cw, 0, "step-end"]);
    cursorPts.push([clear, 2 * cw, 0, "step-end"]);
    const cursor = S.path(`<g class="blink"><rect x="${cx}" y="${cy - 14}" width="9" height="17" fill="${GRAY}" opacity=".8"/></g>`,
        cursorPts, { still: [cmd.length * cw, 0] });
    void tEnd;

    const body = [
        [twinkle(40, 34, 0), twinkle(330, 22, -1.2), twinkle(398, 120, -2.3), twinkle(770, 26, -0.6), twinkle(760, 168, -2.9), twinkle(250, 30, -1.8)].join(""),
        `<rect x="30" y="${ground}" width="740" height="3" fill="${GRAY}" opacity=".35"/>`,
        pix(title, unit, tx, ty),
        sub,
        `<g font-family="${MONO}" font-size="16">${typed}</g>`,
        cursor,
        mover, standing, wave, dance, notes, hi
    ].join("\n");
    return S.svg(body, "ICYCLE's desktop pet Rascal, a pixel raccoon in a green dino hood, walks in, waves hi when the command qs-pet say \"hi there!\" is typed, dances and dashes off");
}

// ---------------------------------------------------------------- 2. moves

function moves() {
    const S = new Scene(800, 300, 1);
    const px = 5, fx = 3, cw = 160, ch = 150, ground = 118, top = ground - Art.H * px;
    const cells = [];

    // Centres what's drawn between art columns [a, b] (+ `extra` px of travel).
    const left = ([a, b], extra = 0) => Math.round((cw - ((b - a + 1) * px + extra)) / 2 - a * px);
    const at = (s, x, y) => `<g transform="translate(${x} ${y})">${s}</g>`;

    // walk: up and back.
    {
        const R = frames("walk"), L = R.map((r) => r);
        const D = 3.2, travel = 50;
        const body = S.during(S.loop(R.map((r) => pix(r, px)), FPS.walk), [[0, D / 2]], { D, still: true })
            + S.during(S.loop(L.map((r) => pix(r, px, 0, 0, true)), FPS.walk), [[D / 2, D]], { D });
        const x = left(span(...R), travel);
        cells.push(["walk", S.path(body, [[0, x, top], [D / 2, x + travel, top], [D, x, top]], { D })]);
    }
    // type: a paw a key, keys flying off the keyboard.
    {
        const keys = Array.from({ length: 12 }, (_, k) => k + 1);
        const lapX = Art.LAPTOP_X - 7;
        const x = left(span(pose("type"), Art.laptop(1).map((r) => " ".repeat(lapX) + r)));
        const list = keys.map((k) => pix(pose("type", 0, { keys: k }), px) + pix(Art.laptop(k, false, ""), px, lapX * px, (Art.H - 11) * px));
        const kx = (Art.LAPTOP_X - 2) * px, ky = (Art.H - 4) * px;
        const flying = [[0, -8], [0.33, 6], [0.66, -2]].map(([a, dx]) => S.rise(pix(Art.effect("key"), fx, kx + dx, ky), { dur: 1, at: a, dx: dx * 2, dy: -34 })).join("");
        cells.push(["type", at(S.loop(list, FPS.type) + flying, x, top)]);
    }
    // snack: a fish, then the last bite, then a happy wiggle.
    {
        const D = 4.4;
        const x = left(span(...frames("eat")));
        const fish = Art.effect("fish"), bit = Art.effect("fishBit");
        const hold = (rows) => pix(rows, fx, Art.FOOD_X * px - (rows[0].length * fx) / 2, Art.FOOD_Y * px - (rows.length * fx) / 2);
        const body = S.during(S.loop(frames("eat").map((r) => pix(r, px)), FPS.eat), [[0, 2.6]], { D, still: true })
            + S.during(hold(fish), [[0, 1.3]], { D, still: true })
            + S.during(hold(bit), [[1.3, 2.6]], { D })
            + S.during(S.loop(frames("happy").map((r) => pix(r, px)), FPS.happy), [[2.6, 3.7]], { D })
            + S.during(S.loop(frames("idle").map((r) => pix(r, px)), FPS.idle), [[3.7, D]], { D })
            + S.during(S.rise(pix(Art.effect("heart"), fx, Art.HEAD_X * px + 8, Art.HEAD_Y * px + 4), { dur: D / 3, at: 2.6, dx: 6, dy: -30 }), [[2.6, 4.0]], { D });
        cells.push(["snack", at(body, x, top)]);
    }
    // dance: notes.
    {
        const x = left(span(...frames("dance")));
        const notes = [0, 0.8].map((a, i) => S.rise(pix(Art.effect("note"), fx, Art.HEAD_X * px + 22 + i * 4, Art.HEAD_Y * px + 8), { dur: 1.6, at: a, dx: 12 + i * 6, dy: -30 })).join("");
        cells.push(["dance", at(S.loop(frames("dance").map((r) => pix(r, px)), FPS.dance) + notes, x, top)]);
    }
    // think: a question mark... then a bright idea.
    {
        const D = 3.4;
        const x = left(span(pose("think"), pose("alert")));
        const qx = Art.HEAD_X * px + 22, qy = Art.HEAD_Y * px - 6;
        const body = S.during(pix(pose("think"), px), [[0, 2.3]], { D, still: true })
            + S.during(`<g class="bob">${pix(Art.effect("question"), fx, qx, qy)}</g>`, [[0, 2.3]], { D, still: true })
            + S.during(pix(pose("alert"), px), [[2.3, D]], { D })
            + S.during(pix(Art.effect("bulb"), fx, qx, qy - 6), [[2.3, D]], { D });
        cells.push(["think", at(body, x, top)]);
    }
    // flex: sparkles.
    {
        const x = left(span(...frames("flex")));
        const spots = [[2, 6, 0], [16, 5, -0.2], [3, 13, -0.35], [17, 12, -0.1]];
        const sparks = spots.map(([sx, sy, d], i) => `<g class="spark" style="animation-duration:${0.7 + i * 0.13}s;animation-delay:${d}s">${pix(Art.effect("sparkle"), fx, sx * px - 4, sy * px)}</g>`).join("");
        cells.push(["flex", at(S.loop(frames("flex").map((r) => pix(r, px)), FPS.flex) + sparks, x, top)]);
    }
    // dynamo: running flat out on the spot, sparks off its feet.
    {
        const x = left(span(...frames("dynamo")));
        const spots = [[3, 15], [10, 16], [1, 13], [12, 14], [6, 16]];
        const sparks = spots.map(([sx, sy], i) => `<g class="spark" style="animation-duration:${0.36 + i * 0.07}s;animation-delay:${-i * 0.11}s">${pix(Art.effect(i % 2 ? "sparkle" : "bolt"), fx, sx * px, sy * px)}</g>`).join("");
        cells.push(["dynamo", at(S.loop(frames("dynamo").map((r) => pix(r, px)), FPS.dynamo) + sparks, x, top)]);
    }
    // stretch: a big yawn.
    {
        const x = left(span(...frames("stretch")));
        cells.push(["stretch", at(S.loop(frames("stretch").map((r) => pix(r, px)), FPS.stretch), x, top)]);
    }
    // shiver: snow.
    {
        const x = left(span(...frames("shiver")));
        const flakes = [[-8, 0, 2.6], [30, -0.9, 3.1], [70, -1.7, 2.3], [100, -0.4, 2.9], [50, -2.2, 3.4]];
        const snow = flakes.map(([sx, d, dur]) => S.rise(pix(Art.effect("snow"), fx, sx, -18), { dur, at: -d, dx: 6, dy: 118, ease: "linear" })).join("");
        cells.push(["shiver", at(S.loop(frames("shiver").map((r) => pix(r, px)), FPS.shiver) + snow, x, top)]);
    }
    // nap: Zzz.
    {
        const x = left(span(...frames("sleep")));
        const zx = Art.HEAD_X * px + 14, zy = (Art.HEAD_Y + 4) * px;
        const zs = [0, 0.9, 1.8].map((a, i) => S.rise(pix(Art.effect("z"), fx, zx, zy), { dur: 2.7, at: a, dx: 18 + i * 3, dy: -40 })).join("");
        cells.push(["nap", at(S.loop(frames("sleep").map((r) => pix(r, px)), FPS.sleep) + zs, x, top)]);
    }

    const body = cells.map(([label, content], i) => {
        const cx = (i % 5) * cw, cy = Math.floor(i / 5) * ch;
        return `<g transform="translate(${cx} ${cy})">`
            + `<rect x="22" y="${ground}" width="${cw - 44}" height="3" fill="${GRAY}" opacity=".35"/>`
            + content
            + `<text x="${cw / 2}" y="${ground + 24}" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${GRAY}">${label}</text></g>`;
    }).join("\n");
    return S.svg(body, `Rascal the desktop pet's animations, each looping at its real frame rate: ${cells.map((c) => c[0]).join(", ")}`);
}

// ---------------------------------------------------------------- 3. goodnight

function goodnight() {
    const S = new Scene(800, 150, 14);
    const px = 5, ground = 138, top = ground - Art.H * px, stop = 330;
    const headX = stop + Art.HEAD_X * px, headY = top + Art.HEAD_Y * px;

    //   0-1.8 dashes in   1.8-2.4 stands   2.4-4.6 happy, "thanks for visiting!"
    //   4.6-6.2 yawns     6.2-11.4 naps    11.4-12 wakes with a start
    //   12-13.3 dashes off   13.3-14 gone
    const runIn = S.during(S.loop(frames("run").map((r) => pix(r, px)), FPS.run), [[0, 1.8], [12, 14]]);
    const mover = S.path(runIn, [[0, -110, top, "cubic-bezier(.2,.6,.4,1)"], [1.8, stop, top], [12, stop, top, "cubic-bezier(.6,0,.9,.5)"], [13.3, 880, top]]);
    const idle = frames("idle").map((r) => pix(r, px, stop, top));
    const standing = S.during(S.loop(idle, FPS.idle), [[1.8, 2.4]]);
    const happy = S.during(S.loop(frames("happy").map((r) => pix(r, px, stop, top)), FPS.happy), [[2.4, 4.6]]);
    const hearts = S.during([0, 0.7].map((a, i) => S.rise(pix(Art.effect("heart"), 3, headX - 52 - i * 10, headY + 14), { dur: 1.4, at: a, dx: -12, dy: -34 })).join(""), [[2.5, 4.6]]);
    const yawn = S.during(S.loop(frames("stretch").map((r) => pix(r, px, stop, top)), FPS.stretch), [[4.6, 6.2]]);
    const sleep = S.during(S.loop(frames("sleep").map((r) => pix(r, px, stop, top)), FPS.sleep), [[6.2, 11.4]], { still: true });
    const zx = headX + 14, zy = top + (Art.HEAD_Y + 4) * px;
    const zs = S.during([0, 0.9, 1.8].map((a, i) => S.rise(pix(Art.effect("z"), 3, zx, zy), { dur: 2.7, at: a, dx: 22 + i * 4, dy: -50 })).join(""), [[6.4, 11.4]], { still: true });
    const alert = S.during(pix(pose("alert"), px, stop, top), [[11.4, 12]]);
    const bang = S.during(pix(Art.effect("bang"), 4, headX + 4, headY - 34), [[11.4, 12]]);
    const thanks = S.pop(bubble("thanks for visiting!", headX + 4, headY - 4, 17), 2.0, 5.6, headX + 4, headY - 4);

    const body = [
        [twinkle(60, 30, -0.4), twinkle(210, 70, -2.1), twinkle(620, 24, -1.3), twinkle(730, 84, -2.7), twinkle(140, 18, -3)].join(""),
        `<rect x="30" y="${ground}" width="740" height="3" fill="${GRAY}" opacity=".35"/>`,
        mover, standing, happy, hearts, yawn, sleep, zs, alert, bang, thanks
    ].join("\n");
    return S.svg(body, "Rascal dashes in, says thanks for visiting, yawns, naps with floating Zzz, wakes with a start and dashes off");
}

fs.mkdirSync(OUT, { recursive: true });
for (const [name, build] of [["pet-hello", hello], ["pet-moves", moves], ["pet-goodnight", goodnight]]) {
    const svg = build();
    fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
    console.log(`${name}.svg  ${(svg.length / 1024).toFixed(1)} KB`);
}
