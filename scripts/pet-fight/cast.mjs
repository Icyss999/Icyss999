// The two of them: Rascal, and its double from the other side of the rift,
// drawn by the pet's own pose code.

import { Art, S, pix, place, rect, mono, r1, pathAt, PAL, TWIN, PX, fx, FPS, TOP, GROUND } from "./core.mjs";
import { C0 } from "./fx.mjs";

const MODS = { rim: true, face: "raccoon" };
export const pose = (st, f = 0, m = {}) => Art.pose(st, f, { ...MODS, ...m });
export const frames = (st, m = {}) => Array.from({ length: Art.FRAMES[st] || 1 }, (_, f) => pose(st, f, m));
export const ARMOR = { wear: "armor" };

// Pets drawn at (0, 0): Rascal facing right, the twin facing left.
export const rA = (rows, pal = PAL) => pix(rows, PX, 0, 0, { pal });
export const tA = (rows, pal = TWIN) => pix(rows, PX, 0, 0, { flip: true, pal });
// Facing the other way.
export const rB = (rows, pal = PAL) => pix(rows, PX, 0, 0, { flip: true, pal });
export const tB = (rows, pal = TWIN) => pix(rows, PX, 0, 0, { pal });
export const rLoop = (st, m = {}, pal = PAL) => S.loop(frames(st, m).map((r) => rA(r, pal)), FPS[st] || 4);
export const tLoop = (st, m = {}, pal = TWIN) => S.loop(frames(st, m).map((r) => tA(r, pal)), FPS[st] || 4);
export const rLoopB = (st, m = {}, pal = PAL) => S.loop(frames(st, m).map((r) => rB(r, pal)), FPS[st] || 4);
export const tLoopB = (st, m = {}, pal = TWIN) => S.loop(frames(st, m).map((r) => tB(r, pal)), FPS[st] || 4);
export { C0 };
// Moved through the world: [t, x, y, rotate, scale, easing] of its art's
// top-left, turning round the middle of it.
export const actor = (html, pts, { stepped = false } = {}) => S.move(html, pts.map(([t, x, y, r = 0, s = 1, e]) => [t, x, y, r, s, e]), { origin: C0, on: stepped });
// Afterimages within [a, b]: the same moves a beat behind, fading, in one
// colour (only that stretch of the path, drawn on 2s).
export const ghosts = (html, pts, [a, b], n = 3, lag = 0.035, opacity = 0.45) => S.win(Array.from({ length: n }, (_, k) => {
    const d = lag * (k + 1), path = [];
    for (let t = a - d; t <= b + 1e-6; t += 1 / 12) { const [, x, y, r = 0, s = 1] = pathAt(pts, t); path.push([t + d, x, y, r, s]); }
    return `<g opacity="${Math.round(opacity * (1 - k / n) * 100) / 100}">${S.move(html, path, { origin: C0 })}</g>`;
}).join(""), [[a, b]]);

// Landmarks in a pet's art (art pixels, facing right).
export const FACE = [Art.X0 + 5.5, Art.TOP + 6.5], MID = [Art.X0 + 5.5, Art.TOP + 10], CORE = Art.NANO_CORE;
export const VISOR = [Art.X0 + 5.5, Art.TOP + 5.5];
export const rAt = (x, y, p) => [x + p[0] * PX, y + p[1] * PX];
export const tAt = (x, y, p) => [x + (Art.W - p[0]) * PX, y + p[1] * PX];
export const paw = (state) => [Art.holdAt(state)[0] + 0.5, Art.holdAt(state)[1] + 0.5];
export const grip = (state) => [Art.gripAt(state)[0] + 0.5, Art.gripAt(state)[1] + 0.5];
// A silhouette in one colour (eyes another).
export const sil = (rows, x, y, fill, { flip = false, eyes, k = PX } = {}) => pix(rows, k, x, y, { flip, pal: mono(fill, eyes ? { e: eyes } : {}) });
// Eyes glowing out of the dark, at a pet's art (x, y).
export const glowEyes = (x, y, color = "#FFE45C", core = "#FFF7C2", { flip = false, k = PX } = {}) =>
    `<g filter="url(#soft)">${pix(Art.eyesGlow(), k, x, y + k, { flip, pal: { y: color } })}</g>` + pix(Art.eyesGlow(), k, x, y + k, { flip, pal: { y: core } });

// The nano suit flowing over it, the visor coming down, and off again.
export const nanoOn = () => [0.08, 0.17, 0.27, 0.37, 0.47, 0.57, 0.67, 0.77, 0.87, 0.95].map((t) => rA(pose("idle", 0, { ...ARMOR, nano: t, visor: 0 })));
export const visorOn = () => [1, 2, 3, 4, 5, 6].map((k) => rA(pose("idle", 0, { ...ARMOR, visor: k / 7 })));
export const nanoOff = () => [0.75, 0.5, 0.25, 0.06].map((t) => rA(pose("idle", 0, { ...ARMOR, nano: t, visor: 0 })));
// Jet flames under its feet, flying.
export const jets = (() => {
    let cache;
    return () => cache ||= (() => {
        const feet = [Art.X0 + 5.5, Art.H], rows = Art.effect("flame");
        const flame = (dx, delay) => `<g class="rise" style="animation-delay:${delay}s;--dx:0px;--dy:40px">${pix(rows, fx, feet[0] * PX + dx - (rows[0].length * fx) / 2, feet[1] * PX + 12 - (rows.length * fx) / 2)}</g>`;
        return flame(-18, 0) + flame(18, -0.13) + flame(0, -0.07);
    })();
})();

// The twin, webbed: a web over its art at (x, y).
export function webbed(x = 0, y = 0) {
    const c = [x + (Art.W - MID[0]) * PX, y + (MID[1] + 1) * PX], rr = 16, rows = [];
    for (let j = -rr; j <= rr; j++) {
        let row = "";
        for (let i = -rr; i <= rr; i++) {
            const d = Math.hypot(i, j), a = ((Math.atan2(j, i) / Math.PI) * 4 + 8) % 1;
            row += d > rr ? " " : (a < 0.09 || a > 0.91) || Math.abs(d - 7) < 0.5 || Math.abs(d - 13) < 0.5 ? "g" : " ";
        }
        rows.push(row);
    }
    return `<g opacity=".85">${pix(rows, fx, c[0] - rr * fx, c[1] - rr * fx, { pal: { g: "#C8CCE0" } })}</g>`;
}
// Cracks of light across the twin (at its art's 0, 0), facing left.
const CRACKS = [[[70, 40], [82, 58], [74, 72], [90, 92], [84, 110]], [[118, 50], [108, 66], [120, 84]], [[96, 104], [112, 122], [104, 140], [116, 156]],
    [[60, 90], [72, 104], [64, 118]], [[130, 96], [122, 112], [134, 128]], [[86, 30], [96, 44]], [[52, 120], [62, 136]]];
export function cracked(n = 4) {
    const pts = CRACKS.slice(0, n).map((c) => c.map(([x, y]) => `${x},${y}`).join(" "));
    return pts.map((p) => `<polyline points="${p}" fill="none" stroke="#FF4FD8" stroke-opacity=".55" stroke-width="7" stroke-linejoin="bevel"/>`).join("")
        + pts.map((p) => `<polyline points="${p}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="bevel"/>`).join("");
}
// A pet lying on the ground, on its side.
export const lying = (rows, x, pal = TWIN, flip = true) => `<g transform="translate(${r1(x)} ${GROUND - 70}) rotate(${flip ? 90 : -90} 90 90)">${pix(rows, PX, 0, 0, { flip, pal })}</g>`;
export { TOP, GROUND };
