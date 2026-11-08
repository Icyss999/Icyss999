// The sets: the battlefield (sky, mountains, ruins, ground, the rift, the
// pillars), the city beyond it, the sky above the clouds, and both seen from
// straight above. Drawn once into <defs>, in GitHub's own colours.

import { S, R, rnd, rect, pix, place, poly, disc, stepped, r1, r3, defs, use, word, wordW, W, H, D, GROUND, fx, PX, GRAY, STONE, RIFT } from "./core.mjs";
import { rockBody, mist } from "./fx.mjs";

defs.push(`<filter id="feath" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="26"/></filter>
<mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="34" y="30" width="${W - 68}" height="${H - 60}" rx="40" fill="#fff" filter="url(#feath)"/></mask>
<radialGradient id="riftGlow"><stop offset="0" stop-color="#A46BFF" stop-opacity=".42"/><stop offset="1" stop-color="#A46BFF" stop-opacity="0"/></radialGradient>
<radialGradient id="flare"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".3" stop-color="#E6FBFF" stop-opacity=".6"/><stop offset="1" stop-color="#8FE0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="pinkFlare"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".3" stop-color="#FFD6F5" stop-opacity=".6"/><stop offset="1" stop-color="#FF4FD8" stop-opacity="0"/></radialGradient>
<radialGradient id="fireFlare"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".3" stop-color="#FFE45C" stop-opacity=".55"/><stop offset="1" stop-color="#FF7A1A" stop-opacity="0"/></radialGradient>
<radialGradient id="goldGlow"><stop offset="0" stop-color="#FFE98A" stop-opacity=".55"/><stop offset="1" stop-color="#FFC43A" stop-opacity="0"/></radialGradient>
<radialGradient id="starGlow"><stop offset="0" stop-color="#8FE0FF" stop-opacity=".7"/><stop offset="1" stop-color="#8FE0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="moonGlow"><stop offset="0" stop-color="#DDE6F5" stop-opacity=".25"/><stop offset="1" stop-color="#DDE6F5" stop-opacity="0"/></radialGradient>
<radialGradient id="neonGlow"><stop offset="0" stop-color="#FF4FD8" stop-opacity=".4"/><stop offset="1" stop-color="#FF4FD8" stop-opacity="0"/></radialGradient>
<radialGradient id="dark"><stop offset="0" stop-color="#05060A" stop-opacity=".85"/><stop offset=".6" stop-color="#05060A" stop-opacity=".5"/><stop offset="1" stop-color="#05060A" stop-opacity="0"/></radialGradient>
<radialGradient id="mistGrad"><stop offset="0" style="stop-color:var(--mist);stop-opacity:.14"/><stop offset=".6" style="stop-color:var(--mist);stop-opacity:.06"/><stop offset="1" style="stop-color:var(--mist);stop-opacity:0"/></radialGradient>
<linearGradient id="rayGrad"><stop offset="0" stop-color="#DDEBFF" stop-opacity=".22"/><stop offset="1" stop-color="#DDEBFF" stop-opacity="0"/></linearGradient>
<linearGradient id="goldRay"><stop offset="0" stop-color="#FFE98A" stop-opacity=".5"/><stop offset="1" stop-color="#FFC43A" stop-opacity="0"/></linearGradient>
<linearGradient id="pinkRay"><stop offset="0" stop-color="#FFB8EE" stop-opacity=".45"/><stop offset="1" stop-color="#FF4FD8" stop-opacity="0"/></linearGradient>
<filter id="aura" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10"/></filter>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="neon" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);

// ---- the sky: stars, the moon. Easter eggs: some of the stars are a
// constellation that spells ICYCLE, passing for ordinary ones among decoys
// till it's all over; and one bright star blinks ICYCLE in Morse, all along.
const STROKES = {
    I: [[[0, 0], [2, 0]], [[1, 0], [1, 4]], [[0, 4], [2, 4]]],
    C: [[[2.2, 0.5], [1.1, 0], [0, 0.9], [0, 3.1], [1.1, 4], [2.2, 3.5]]],
    Y: [[[0, 0], [1.1, 1.9]], [[2.2, 0], [1.1, 1.9]], [[1.1, 1.9], [1.1, 4]]],
    L: [[[0, 0], [0, 4], [2, 4]]],
    E: [[[2, 0], [0, 0], [0, 4], [2, 4]], [[0, 2], [1.6, 2]]]
};
export const SKY = { x: 1370, y: 325, u: 19, step: 66 };
const LETTERS = [..."ICYCLE"].map((ch, i) => {
    const ox = SKY.x + i * SKY.step, P = ([x, y]) => [r1(ox + x * SKY.u), r1(SKY.y + y * SKY.u)];
    const dots = new Map(), lines = [];
    for (const stroke of STROKES[ch]) stroke.forEach((p, k) => { const q = P(p); dots.set(q.join(), q); if (k) lines.push([P(stroke[k - 1]), q]); });
    return { dots: [...dots.values()], lines };
});
// The constellation lighting up, letter by letter, from t; out by t1.
export const constellation = (t, t1) => LETTERS.map(({ dots, lines }, i) => S.fade(
    lines.map(([a, b]) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#4AB4F0" stroke-width="2.4" opacity=".85" shape-rendering="geometricPrecision"/>`).join("")
    + dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="url(#starGlow)"/>` + rect(x - 4, y - 4, 8, 8, "#2F8FD8") + rect(x - 2, y - 2, 4, 4, "#FFFFFF")).join(""),
    [[t + i * 0.16, 0], [t + 0.45 + i * 0.16, 1], [t1 - 0.4, 1], [t1, 0]])).join("");
{
    let sky = "";
    const twinkle = (x, y, delay) => `<g transform="translate(${x} ${y})"><g class="twk" style="animation-delay:${delay}s">`
        + `${rect(3, 0, 3, 9, "#9DB4D3")}${rect(0, 3, 9, 3, "#9DB4D3")}${rect(3, 3, 3, 3, "#FFFFFF")}</g></g>`;
    for (let i = 0; i < 170; i++) {
        const x = Math.round(R(300, 2900)), y = Math.round(R(-200, 640));
        sky += i % 8 === 0 ? twinkle(x, y, -R(0, 3.4).toFixed(1)) : rect(x, y, 3, 3, ".st", ` opacity="${R(0.2, 0.6).toFixed(2)}"`);
    }
    const box = [SKY.x - 40, SKY.y - 40, SKY.x + 6 * SKY.step + 20, SKY.y + 4 * SKY.u + 40];
    for (let i = 0; i < 36; i++) sky += rect(Math.round(R(box[0], box[2])), Math.round(R(box[1], box[3])), i % 3 ? 2 : 3, i % 3 ? 2 : 3, ".st", ` opacity="${R(0.2, 0.55).toFixed(2)}"`);
    for (const { dots } of LETTERS) for (const [x, y] of dots) { const sz = rnd() < 0.5 ? 2 : 3; sky += rect(x - sz / 2, y - sz / 2, sz, sz, ".st", ` opacity="${R(0.25, 0.55).toFixed(2)}"`); }
    // Morse: I .. C -.-. Y -.-- C -.-. L .-.. E .
    const u = 0.2, code = ["..", "-.-.", "-.--", "-.-.", ".-..", "."];
    let t = 0;
    const on = [];
    code.forEach((l, li) => { [...l].forEach((c, ci) => { const d = c === "." ? u : 3 * u; on.push([t, t + d]); t += d + (ci < l.length - 1 ? u : 0); }); t += li < code.length - 1 ? 3 * u : 8 * u; });
    const P = (x) => `${r3((x / t) * 100)}%`;
    S.css.push(`@keyframes morse{0%{opacity:.18}${on.map(([a, b]) => `${P(a)}{opacity:1}${P(b)}{opacity:.18}`).join("")}100%{opacity:.18}}.morse{animation:morse ${r3(t)}s step-end infinite;opacity:.18}`);
    sky += `<g class="morse"><circle cx="2312" cy="214" r="16" fill="url(#starGlow)"/>${rect(2306, 208, 12, 12, "#CFEFFF")}${rect(2309, 202, 6, 24, "#CFEFFF")}${rect(2300, 211, 24, 6, "#CFEFFF")}${rect(2309, 211, 6, 6, "#FFFFFF")}</g>`;
    const moon = disc(8, (d, i, j) => (d > 0.85 ? "c" : (i * 3 + j * 5) % 11 === 0 || (i - 2) ** 2 + (j + 1) ** 2 < 5 ? "b" : "a"));
    sky += `<circle cx="2050" cy="330" r="120" fill="url(#moonGlow)"/>` + pix(moon, 6, 2050 - 48, 330 - 48, { pal: { a: "#E2E8F2", b: "#C3CBDA", c: "#AEB7C9" } });
    // Thin cloud drifting across, and now and then a shooting star.
    sky += `<g opacity=".45">${mist(300, 2900, 400, 6, { w: [320, 640], h: [40, 70] }) + mist(600, 2600, 140, 3, { w: [300, 520], h: [36, 60] })}</g>`;
    for (const [x, y, d] of [[2600, 60, 0], [1500, -60, -4.2], [900, 120, -7]])
        sky += `<g class="shoot" style="animation-delay:${d}s"><line x1="${x}" y1="${y}" x2="${x + 90}" y2="${y - 45}" stroke="#FFFFFF" stroke-width="3" stroke-opacity=".8" stroke-linecap="round"/></g>`;
    defs.push(`<g id="sky">${sky}</g>`);
}
export const MOON = [2050, 330];
export const moonArt = (k = 6) => pix(disc(8, (d, i, j) => (d > 0.85 ? "c" : (i * 3 + j * 5) % 11 === 0 || (i - 2) ** 2 + (j + 1) ** 2 < 5 ? "b" : "a")), k, -8 * k, -8 * k, { pal: { a: "#E2E8F2", b: "#C3CBDA", c: "#AEB7C9" } });

// ---- the mountains: two ranges, the nearer lit along its ridge.
export const backTop = (x) => 760 - 150 * Math.abs(Math.sin(x / 260 + 0.6)) - 70 * Math.abs(Math.sin(x / 113 + 2)) - 30 * Math.sin(x / 41);
export const frontTop = (x) => 830 - 110 * Math.abs(Math.sin(x / 210 + 2.1)) - 50 * Math.abs(Math.sin(x / 87)) - 20 * Math.sin(x / 33 + 1);
export const mountains = (x0 = 200, x1 = 3000) => `<path d="${stepped(x0, x1, 1700, backTop, 8)}" class="m1"/>`
    + `<path d="${stepped(x0, x1, 1700, frontTop, 8)}" class="m2"/>`
    + `<path d="${stepped(x0, x1, 1700, frontTop, 8)}" fill="none" style="stroke:var(--m3)" stroke-width="3" transform="translate(0 2)"/>`;
defs.push(`<g id="mtn">${mountains()}</g>`, `<g id="far">${use("sky")}${use("mtn")}</g>`);

// ---- mid: rolling hills, broken arches and columns, a dead tree or two.
{
    let mid = `<path d="${stepped(0, 3200, 1500, (x) => 870 - 40 * Math.sin(x / 170) - 25 * Math.sin(x / 61 + 1), 6)}" class="h1"/>`;
    const col = (x, w, h, base = 1000) => {
        let s = rect(x, base - h, w, h + 400, ".c1") + rect(x, base - h, 6, h + 400, ".c2");
        for (let i = 0; i < w; i += 6) s += rect(x + i, base - h - Math.round(R(0, 3)) * 6, 6, 18, ".c1");
        return s + rect(x - 6, base - h + 18, w + 12, 8, ".c3");
    };
    const arch = (x, w, h) => col(x, 30, h) + col(x + w - 30, 30, h - 30) + rect(x, 1000 - h - 24, w * 0.6, 24, ".c3") + rect(x, 1000 - h - 24, w * 0.6, 4, ".c2");
    const tree = (x, h) => {
        let s = rect(x, 1000 - h, 10, h + 300, ".tr");
        for (let k = 0; k < 4; k++) { const y = 1000 - h + 20 + k * 26, dir = k % 2 ? 1 : -1, l = R(30, 60); s += rect(dir > 0 ? x + 10 : x - l, y, l, 6, ".tr") + rect(dir > 0 ? x + 10 + l - 6 : x - l, y - 18, 6, 18, ".tr"); }
        return s;
    };
    for (const [x, kind, a, b] of [[420, "col", 40, 150], [560, "arch", 170, 210], [860, "tree", 170], [1080, "col", 36, 110], [1330, "col", 48, 230],
        [1880, "arch", 200, 240], [2200, "tree", 150], [2380, "col", 42, 180], [2560, "col", 34, 90], [2760, "arch", 150, 170]])
        mid += kind === "col" ? col(x, a, b) : kind === "arch" ? arch(x, a, b) : tree(x, a);
    // Tattered banners on poles, flapping.
    for (const [x, h] of [[700, 260], [1500, 300], [2300, 240], [2950, 280]]) {
        const top = 1000 - h, flag = [[0, 0], [70, 6], [62, 22], [78, 34], [58, 46], [70, 62], [0, 56]];
        mid += rect(x, top, 6, h + 300, ".c2") + rect(x - 4, top - 8, 14, 8, ".c3")
            + `<g class="wave" style="animation-delay:-${r1(R(0, 1.3))}s;transform-origin:${x + 6}px ${top}px">${poly(flag.map(([a, b]) => [x + 6 + a, top + 4 + b]), ".c3")}${poly([[x + 6, top + 22], [x + 72, top + 26], [x + 70, top + 34], [x + 6, top + 32]].map(([a, b]) => [a, b]), "#5a2a34", ' opacity=".8"')}</g>`;
    }
    defs.push(`<g id="mid">${mid}</g>`);
}

// ---- the ground: GitHub's canvas, near enough; its edge GitHub's rule
// line. Tufts, pebbles, boulders.
export const boulder = (x, w, h, ground = GROUND) => {
    const rows = [];
    for (let j = 0; j < h; j++) {
        let row = "";
        for (let i = 0; i < w; i++) {
            const edge = Math.abs(i - w / 2 + 0.5) / (w / 2) + (j === 0 ? 0.3 : 0) - (j / h) * 0.3;
            row += edge > 0.95 ? " " : j === 0 || edge > 0.8 ? "o" : j < 2 ? "a" : i < w / 3 ? "b" : "c";
        }
        rows.push(row);
    }
    return pix(rows, fx, x, ground - h * fx + fx, { pal: STONE });
};
{
    let g = rect(-2000, GROUND, 7200, 900, ".g0") + rect(-2000, GROUND + 3, 7200, 5, ".g2") + rect(-2000, GROUND, 7200, 3, ".g1");
    for (let i = 0; i < 160; i++) g += rect(Math.round(R(-200, 3400) / 6) * 6, Math.round(R(GROUND + 16, GROUND + 260) / 6) * 6, 6, 6, i % 3 ? ".p1" : ".p2");
    for (let i = 0; i < 70; i++) {
        const x = Math.round(R(-100, 3300) / 6) * 6;
        g += `<g class="sway" style="animation-delay:-${R(0, 1.6).toFixed(2)}s;transform-origin:${x}px ${GROUND}px">${rect(x, GROUND - 12, 6, 12, ".t1")}${rect(x + 6, GROUND - 18, 6, 18, ".t2")}${rect(x + 12, GROUND - 6, 6, 6, ".t1")}</g>`;
    }
    for (const [x, w, h] of [[240, 14, 8], [820, 9, 6], [2620, 16, 9], [2900, 10, 6], [3080, 12, 7]]) g += boulder(x, w, h);
    g += `<g opacity=".7">${mist(-200, 3400, GROUND - 24, 10, { w: [300, 560], h: [40, 70] })}</g>`;
    defs.push(`<g id="ground">${g}</g>`);
    // The foreground, nearest the camera (it moves fastest): dark stones and
    // grass, out past the ground's edge.
    let f = "";
    for (let i = 0; i < 22; i++) {
        const x = Math.round(R(-600, 3800) / 8) * 8, y = Math.round(R(GROUND + 130, GROUND + 280) / 8) * 8, w = R(120, 320), h = R(24, 56);
        f += `<path d="M${x} ${y + h}Q${x + w * 0.2} ${y + h * 0.2} ${x + w * 0.5} ${y}Q${x + w * 0.85} ${y + h * 0.1} ${x + w} ${y + h}Z" class="fgc" opacity=".4" shape-rendering="geometricPrecision"/>`;
    }
    defs.push(`<g id="fg">${f}</g>`);
    // Just the line: the page before the world shows through it.
    defs.push(`<g id="rule">${rect(-2000, GROUND, 7200, 3, ".g1")}</g>`);
}

// ---- the rift, swirling between them, drawn once.
export const RIFT_C = [1600, 690];
export function riftRows(open, phase, seed) {
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
{
    const at = (rows) => pix(rows, fx, RIFT_C[0] - (rows[0].length * fx) / 2, RIFT_C[1] - (rows.length * fx) / 2, { pal: RIFT });
    [0, 2.1, 4.2].forEach((ph, i) => defs.push(`<g id="rift${i}">${at(riftRows(1, ph, i * 1.7))}</g>`));
    [0.55, 0.2, 0.03].forEach((o, i) => defs.push(`<g id="riftShut${i}">${at(riftRows(o, i * 2, 9 + i))}</g>`));
}
export const riftGlow = `<ellipse cx="${RIFT_C[0]}" cy="${RIFT_C[1]}" rx="300" ry="280" fill="url(#riftGlow)"/><ellipse cx="${RIFT_C[0]}" cy="${GROUND + 2}" rx="150" ry="12" fill="#A46BFF" opacity=".22"/>`;
export const rift = () => riftGlow + S.loop([0, 1, 2].map((i) => use(`rift${i}`)), 10);
export const riftOpening = (t) => S.seq([use("riftShut2"), use("riftShut1"), use("riftShut0")], t, 0.08) + S.win(rift(), [[t + 0.24, D + 5]]);

// ---- the stone pillars. Easter egg: ICYCLE carved down the left one.
const MINI = { I: ["###", ".#.", ".#.", ".#.", "###"], C: [".##", "#..", "#..", "#..", ".##"], Y: ["#.#", "#.#", ".#.", ".#.", ".#."], L: ["#..", "#..", "#..", "#..", "###"], E: ["###", "#..", "##.", "#..", "###"] };
export const pillarRows = (h, broken, carved = false) => {
    const rows = [];
    for (let j = 0; j < h; j++) {
        const cap = j < 3 || j >= h - 2, w = cap ? 12 : 10, pad = cap ? 0 : 1;
        let row = " ".repeat(pad);
        for (let i = 0; i < w; i++) row += i === 0 || i === w - 1 || j === 0 || j === h - 1 ? "o" : i < 3 ? "a" : i > w - 4 ? "c" : (j * 7 + i * 3) % 23 === 0 ? "k" : "b";
        rows.push(row + " ".repeat(pad));
    }
    if (carved) [..."ICYCLE"].forEach((ch, li) => MINI[ch].forEach((line, y) => {
        const j = 5 + li * 6 + y;
        if (j >= h - 2) return;
        rows[j] = rows[j].split("").map((c, i) => (i >= 5 && i < 8 && line[i - 5] === "#" ? "k" : c)).join("");
    }));
    if (broken) for (let j = 0; j < 6; j++) rows[j] = rows[j].split("").map((c, i) => (j < (i * 5 + 3) % 6 ? " " : c)).join("");
    return rows;
};
export const PILLAR_H = 44, LPX = 1050, RPX = 2440;
export const pillar = (x, h = PILLAR_H, broken = false, carved = x === LPX) => pix(pillarRows(h, broken, carved), fx, x, GROUND - h * fx, { pal: STONE });
// The top of the one Rascal goes through, snapped off: where it stood, and
// its middle; it lands on its side 236 to the left.
export const TOPPLE = { rows: pillarRows(PILLAR_H, false, true).slice(0, 28), x: LPX, y: GROUND - PILLAR_H * fx };
TOPPLE.c = [TOPPLE.x + 6 * fx, TOPPLE.y + 14 * fx];
export const toppled = () => `<g transform="translate(-236 144) rotate(-90 ${TOPPLE.c[0]} ${TOPPLE.c[1]})">${pix(TOPPLE.rows, fx, TOPPLE.x, TOPPLE.y, { pal: STONE })}</g>`;

// ---------------------------------------------------------------- the city

// Towers with windows (a few lit), ledges, tanks, aerials with a light.
let patterns = 0;
export function tower(x, w, top, { tone = "b3", edge = "b4", lit = 0.16, pitch = [30, 40], win = [12, 18], glass = false, base = 1400, aerial = false } = {}) {
    let s = rect(x, top, w, base - top, `.${tone}`) + rect(x, top, 6, base - top, `.${edge}`) + rect(x - 6, top - 8, w + 12, 10, `.${edge}`);
    if (glass) {
        for (let yy = top + 16; yy < base; yy += 36) s += rect(x + 10, yy, w - 20, 30, "#5CCFFF", ' opacity=".13"') + rect(x + 10, yy, w - 20, 3, "#BFE9FF", ' opacity=".35"');
        for (let k = 0; k < 4; k++) s += poly([[x + 30 + k * 70, top + 20], [x + 60 + k * 70, top + 20], [x + 10 + k * 70, base], [x - 20 + k * 70, base]].map(([px, py]) => [Math.min(Math.max(px, x + 10), x + w - 10), py]), "#FFFFFF", ' opacity=".05"');
    } else {
        // The windows: a pattern, and a few of them lit.
        const id = `wp${(patterns++).toString(36)}`, cols = Math.floor((w - 24) / pitch[0]), x0 = x + Math.round((w - cols * pitch[0]) / 2) + Math.round((pitch[0] - win[0]) / 2);
        defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" x="${x0}" y="${top + 20}" width="${pitch[0]}" height="${pitch[1]}">${rect(0, 0, win[0], win[1], ".w0")}</pattern>`);
        s += rect(x0, top + 20, cols * pitch[0] - (pitch[0] - win[0]), base - top - 30, `url(#${id})`);
        for (let yy = top + 20; yy < Math.min(base - 10, 1000); yy += pitch[1])
            for (let i = 0; i < cols; i++) if (rnd() < lit) s += rect(x0 + i * pitch[0], yy, win[0], win[1], "#F0C050", rnd() < 0.08 ? ` opacity=".75" class="flk" style="animation-delay:-${r1(R(0, 2.2))}s"` : ' opacity=".75"');
    }
    s += rect(x - 4, top - 30, w + 8, 3, `.${edge}`) + Array.from({ length: Math.floor(w / 24) + 1 }, (_, i) => rect(x - 4 + i * 24, top - 30, 3, 22, `.${edge}`)).join("");
    if (aerial) s += rect(x + w * 0.7, top - 90, 4, 82, `.${edge}`) + `<g class="twk" style="animation-delay:-${r3(R(0, 3))}s">${rect(x + w * 0.7 - 3, top - 96, 10, 10, "#E84855")}</g>`;
    else if (rnd() < 0.6) s += rect(x + w * 0.2, top - 40, 40, 32, `.${edge}`) + rect(x + w * 0.2 + 6, top - 8, 6, 8, `.${edge}`) + rect(x + w * 0.2 + 28, top - 8, 6, 8, `.${edge}`);
    return s;
}
// Pixel letters for the sign, `k` a pixel.
export const neonWord = (w, x, y, k, color = "#FF4FD8") => pix(word(w, "c"), k, x, y, { pal: { c: color } });
{
    // Far: a skyline. Easter egg: one wide tower's lit windows spell ICYCLE.
    let far = "";
    for (let x = 100; x < 3200;) {
        const w = Math.round(R(80, 200) / 10) * 10, top = Math.round(R(420, 720) / 10) * 10;
        far += rect(x, top, w, 1500 - top, ".b1");
        for (let k = 0; k < 6; k++) if (rnd() < 0.5) far += rect(x + R(10, w - 16), top + R(20, 400), 6, 6, "#F0C050", ` opacity="${R(0.25, 0.6).toFixed(2)}"`);
        if (rnd() < 0.3) far += rect(x + w / 2, top - 60, 3, 60, ".b1") + `<g class="twk" style="animation-delay:-${r3(R(0, 3))}s">${rect(x + w / 2 - 3, top - 66, 9, 9, "#E84855")}</g>`;
        x += w + Math.round(R(0, 30));
    }
    const ex = 2160, ey = 440, rows = word("ICYCLE", "c"), cw = 9;
    far += rect(ex - 30, ey - 50, rows[0].length * cw + 60, 1500 - ey, ".b2");
    rows.forEach((line, j) => [...line].forEach((c, i) => { far += rect(ex + i * cw, ey + j * 12, 6, 8, c === "c" ? "#F0C050" : ".w0", c === "c" ? ' opacity=".9"' : ""); }));
    for (let j = 9; j < 40; j++) for (let i = 0; i < rows[0].length; i += 2) if (rnd() < 0.12) far += rect(ex + i * cw, ey + j * 12, 6, 8, "#F0C050", ' opacity=".5"');
    defs.push(`<g id="cityFar">${use("sky")}${far}</g>`);
    // Mid: nearer towers.
    let mid = "";
    for (let x = 0; x < 3300;) {
        const w = Math.round(R(140, 260) / 10) * 10, top = Math.round(R(560, 780) / 10) * 10;
        mid += tower(x, w, top, { tone: "b2", edge: "b3", lit: 0.12, pitch: [26, 34], win: [10, 14], base: 1500, aerial: rnd() < 0.25 });
        x += w + Math.round(R(30, 90));
    }
    defs.push(`<g id="cityMid">${mid}</g>`);
    // The street: tarmac, a kerb, lane marks.
    let st = rect(-2000, GROUND, 7200, 900, ".g0") + rect(-2000, GROUND, 7200, 3, ".g1") + rect(-2000, GROUND + 3, 7200, 10, ".g2");
    for (let x = -1000; x < 4400; x += 120) st += rect(x, GROUND + 60, 60, 6, ".t1");
    for (let x = -600; x < 4000; x += 520) st += rect(x, GROUND - 160, 6, 160, ".b4") + rect(x - 12, GROUND - 166, 30, 8, ".b4") + rect(x + 12, GROUND - 160, 14, 6, "#F0C050", ' opacity=".8"');
    defs.push(`<g id="street">${st}</g>`);
    let fc = "";
    for (let i = 0; i < 18; i++) { const x = Math.round(R(-600, 3800) / 8) * 8, y = Math.round(R(GROUND + 140, GROUND + 280) / 8) * 8, w = R(30, 110), h = R(14, 40); fc += rect(x, y, w, h, ".fgc", ' opacity=".5"') + rect(x + w * 0.3, y - h * 0.5, w * 0.4, h * 0.6, ".fgc", ' opacity=".45"'); }

    defs.push(`<g id="fgCity">${fc}</g>`);
}
// The near towers, where the fight is: [x, w, top].
export const CITY = { L1: [380, 300, 470], L2: [820, 300, 380], R1: [1480, 360, 560], R2: [2000, 340, 430], R3: [2470, 320, 520] };
export const SIGN = { x: 1520, y: 440, k: 8 };   // ICYCLE in neon on R1's roof
const NEAR = { base: GROUND + 4 };
defs.push(`<g id="L1">${tower(...CITY.L1, { ...NEAR, aerial: true })}</g>`, `<g id="L2">${tower(...CITY.L2, { ...NEAR, glass: true })}</g>`,
    `<g id="R1">${tower(...CITY.R1, NEAR)}</g>`, `<g id="R2">${tower(...CITY.R2, { ...NEAR, aerial: true })}</g>`, `<g id="R3">${tower(...CITY.R3, NEAR)}</g>`);
// The sign: a frame on legs, the letters glowing (flickering on).
// Cables slung between the near towers.
export const wires = () => [[680, 520, 820, 420], [1120, 430, 1480, 590], [1840, 600, 2000, 470], [2340, 480, 2470, 560], [380, 560, 680, 540]].map(([x0, y0, x1, y1]) =>
    `<path d="M${x0} ${y0}Q${(x0 + x1) / 2} ${Math.max(y0, y1) + 60} ${x1} ${y1}" fill="none" style="stroke:var(--b4)" stroke-width="2" shape-rendering="geometricPrecision"/>`).join("");
export const signFrame = () => rect(SIGN.x - 14, SIGN.y - 14, wordW(6) * SIGN.k + 28, 7 * SIGN.k + 28, ".b5") + rect(SIGN.x + 20, SIGN.y + 7 * SIGN.k + 14, 8, 560 - (SIGN.y + 7 * SIGN.k + 14), ".b4") + rect(SIGN.x + wordW(6) * SIGN.k - 28, SIGN.y + 7 * SIGN.k + 14, 8, 560 - (SIGN.y + 7 * SIGN.k + 14), ".b4");
export const signLetters = () => `<ellipse cx="${SIGN.x + (wordW(6) * SIGN.k) / 2}" cy="${SIGN.y + 28}" rx="260" ry="120" fill="url(#neonGlow)"/>`
    + `<g filter="url(#neon)">${[..."ICYCLE"].map((ch, i) => `<g class="flk" style="animation-delay:-${r3(i * 0.37)}s">${neonWord(ch, SIGN.x + i * 6 * SIGN.k, SIGN.y, SIGN.k, i % 2 ? "#FF6FE0" : "#FFB0F0")}</g>`).join("")}</g>`;
// A glass skybridge from L2 to R1.
export const BRIDGE = { x: 1120, y: 500, w: 360, h: 56 };
defs.push(`<g id="bridge">${rect(BRIDGE.x, BRIDGE.y, BRIDGE.w, BRIDGE.h, "#5CCFFF", ' opacity=".18"')}${rect(BRIDGE.x, BRIDGE.y, BRIDGE.w, 6, ".b4")}${rect(BRIDGE.x, BRIDGE.y + BRIDGE.h - 6, BRIDGE.w, 6, ".b4")}${Array.from({ length: 7 }, (_, i) => rect(BRIDGE.x + i * 60, BRIDGE.y, 4, BRIDGE.h, ".b4")).join("")}${rect(BRIDGE.x + 20, BRIDGE.y + 12, 60, 4, "#FFFFFF", ' opacity=".3"')}</g>`);

// ---- the sky above the clouds: banks of cloud far below.
{
    let cl = "";
    for (let k = 0; k < 3; k++) {
        const y0 = 690 + k * 60, tone = ["cl1", "cl2", "cl3"][k];
        cl += `<path d="${stepped(-800, 4200, 2000, (x) => y0 - 40 * Math.abs(Math.sin(x / (180 - k * 30) + k)) - 25 * Math.abs(Math.sin(x / 70 + k * 2)), 20)}" class="${tone}"/>`;
    }
    defs.push(`<g id="clouds">${cl}</g>`);
}

// ---------------------------------------------------------------- from above

// The battlefield seen from straight above, 3200 x 2000 round (1600, 700):
// the ground, scattered stones, the pillars and their shadows, the rift a
// glowing seam.
{
    let p = rect(-1200, -1100, 5600, 3600, ".g2");
    for (let i = 0; i < 300; i++) p += rect(Math.round(R(200, 3000) / 8) * 8, Math.round(R(-500, 1900) / 8) * 8, 8, 8, i % 3 ? ".p1" : ".p2");
    for (let i = 0; i < 60; i++) { const x = R(-400, 3600), y = R(-600, 2000), s = R(12, 30); p += rect(x, y, s, s, ".sc") + rect(x, y, s, 4, ".sa"); }
    for (const [x, y] of [[1050, 700], [2440, 700]]) p += `<g transform="rotate(30 ${x} ${y})">${rect(x - 10, y - 30, 120, 60, "#05060A", ' opacity=".5"')}</g>` + rect(x - 36, y - 36, 72, 72, ".sb") + rect(x - 36, y - 36, 72, 8, ".sa") + rect(x - 24, y - 24, 48, 48, ".sc");
    defs.push(`<g id="plan">${p}</g>`);
    // The city from above: blocks of rooftops, streets between.
    let c = rect(-1200, -1100, 5600, 3600, ".g0");
    for (let bx = 300; bx < 2900; bx += 460) for (let by = -500; by < 1900; by += 420) {
        for (let k = 0; k < 4; k++) {
            const x = bx + (k % 2) * 190 + R(0, 20), y = by + Math.floor(k / 2) * 170 + R(0, 20), w = R(140, 180), h = R(120, 160);
            c += rect(x + 18, y + 26, w, h, "#05060A", ' opacity=".45"') + rect(x, y, w, h, ".b3") + rect(x, y, w, 6, ".b4") + rect(x + w * 0.3, y + h * 0.3, 30, 30, ".b2");
            if (rnd() < 0.3) c += rect(x + w - 30, y + 14, 10, 10, "#E84855", ' class="twk"');
        }
        c += rect(bx - 40, by + 340, 380, 6, ".t1", ' opacity=".6"');
    }
    defs.push(`<g id="cityPlan">${c}</g>`);
}

// Stones scattered over the wreck.
export const rubble = (n, x0, x1) => Array.from({ length: n }, () => { const { html, bottom } = rockBody(rnd() < 0.4, rnd() < 0.3 ? 1 : 0); return place(html, R(x0, x1), GROUND - (bottom + 1) * fx + fx / 2); }).join("");
