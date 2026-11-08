// Act I (0-5): the page tears. Rascal stands on a rule line on an empty
// page; a crack of light opens beside it, ICYCLE glitching in the light,
// then the rift -- and the world pours out of it, the twin stepping through.
// Act II (5-13.8): the standoff. Quiet: wind, two specks, worm's-eye shots of
// each, their eyes, a pebble falling off the pillar, and silence.

import { S, R, rnd, rect, pix, place, poly, r1, use, shot, shots, defs, W, H, D, GROUND, TOP, PX, fx, K, Art, PAL, TWIN, CYAN, mono } from "../core.mjs";
import * as F from "../fx.mjs";
import { pose, rA, tA, rLoop, tLoop, actor, rAt, tAt, FACE, glowEyes, C0 } from "../cast.mjs";
import { rift, riftOpening, riftGlow, RIFT_C, pillar, LPX, RPX, moonArt } from "../sets.mjs";
import { R0, T0 } from "./clash.mjs";

// Wind: streaks blowing through, on their own clocks.
export const wind = (n, x0, x1, y0, y1, { dx = [300, 520], op = 0.6 } = {}) => Array.from({ length: n }, (_, i) => {
    const dur = R(2.2, 3.6);
    return `<g class="drift" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(R(0, dur))}s;--dx:-${r1(R(...dx))}px;--dy:${r1(R(-40, 10))}px">`
        + rect(R(x0, x1), R(y0, y1), i % 3 ? 8 : 14, 3, i % 4 ? "#C8CCE0" : "#FFFFFF", ` opacity="${op}"`) + "</g>";
}).join("");
// Sparks drifting up.
export const floating = (n, x0, x1, y0, y1) => Array.from({ length: n }, (_, i) => {
    const dur = R(3, 5);
    return `<g class="drift" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(R(0, dur))}s;--dx:${r1(R(-60, 60))}px;--dy:-${r1(R(120, 260))}px">`
        + rect(R(x0, x1), R(y0, y1), fx, fx, i % 3 ? "#FF9F1A" : "#FFD84A") + "</g>";
}).join("");

// ---- the tear: a jagged hole, growing from the rift (or shrinking to it).
export function tearMask(id, cx, cy, t0, t1, grow = true) {
    const pts = Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2, r = (i % 2 ? 0.62 : 1) * R(0.85, 1.1) * 1100; return [Math.cos(a) * r, Math.sin(a) * r * 1.2]; });
    const [s0, s1, e] = grow ? [0.001, 1, "cubic-bezier(.6,0,.2,1)"] : [1, 0.001, "cubic-bezier(.7,0,.4,1)"];
    defs.push(`<mask id="${id}" maskUnits="userSpaceOnUse" x="-200" y="-200" width="${W + 400}" height="${H + 400}">${S.move(poly(pts, "#fff"), [[t0, cx, cy, 0, s0, e], [t1, cx, cy, grow ? 40 : -40, s1]])}</mask>`);
    return (view) => `<g mask="url(#${id})">${view}</g>`;
}

// The camera on the page: Rascal small at the left, the rift in the middle.
export const PAGE_CAM = [1450, 640, 0.36];
const pageAt = ([x, y]) => [W / 2 + (x - PAGE_CAM[0]) * PAGE_CAM[2], H / 2 + (y - PAGE_CAM[1]) * PAGE_CAM[2]];
export const RIFT_ON_PAGE = pageAt(RIFT_C);

{
    const cam = [[0, ...PAGE_CAM, 0, "cubic-bezier(.4,0,.6,1)"], [2.7, 1450, 640, 0.37, 0, "cubic-bezier(.3,0,.2,1)"], [3.7, 1500, 630, 0.34, -1.5], [5.0, 1560, 620, 0.335, -1]];
    // The world, through the tear.
    const tear = tearMask("tear0", ...RIFT_ON_PAGE, 2.7, 3.75);
    shot(0, 5.0, { cam, ground: use("ground"), main: pillar(LPX) + pillar(RPX) + F.spiderweb(RIFT_C[0], GROUND + 3, 600, 2.75, { glow: "#A46BFF", n: 12, dur: 0.6 }), wrap: tear });
    // The twin, out of the rift: a silhouette in the light, then a leap.
    const tPts = [[2.9, RIFT_C[0] - 90, TOP, 0, 1], [3.6, RIFT_C[0] - 40, TOP, 0, 1, "cubic-bezier(.3,.6,.4,1)"], [4.3, 2100, TOP - 300, 0, 1, "cubic-bezier(.5,0,.8,.5)"], [4.85, T0, TOP]];
    const twin = S.win(tA(pose("alert"), mono("#12081F", { e: "#FF4FD8" })), [[2.9, 3.4]]) + S.win(tLoop("walk"), [[3.4, 3.6]]) + S.win(tA(pose("land")), [[3.6, 3.75], [4.85, 5.0]])
        + S.win(tA(pose("jump")), [[3.75, 4.85]]);
    // The crack: a hairline, ICYCLE glitching in its light, then the rift.
    const [cx, cy] = RIFT_C, crack = [[cx, cy]];
    for (let k = 1; k <= 7; k++) crack.unshift([cx + R(-18, 18), cy - k * 40]), crack.push([cx + R(-18, 18), cy + k * 30]);
    const crackLine = `<polyline points="${crack.map(([x, y]) => `${r1(x)},${r1(y)}`).join(" ")}" pathLength="1" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="bevel" shape-rendering="geometricPrecision" filter="url(#glow)"/>`;
    const main = S.win(S.grow(crackLine, 1.25, 0.4), [[1.25, 2.35]])
        + F.crackle(cx, cy, 10, 20, 120, 1.3, 1.0, { h: "#F3E8FF", b: "#A46BFF" }) + F.flare(cx, cy, 260, 1.25, 0.6, 1.1, "pinkFlare")
        + S.fade(riftGlow, [[2.3, 0], [2.6, 1]]) + riftOpening(2.3) + F.flare(cx, cy, 500, 2.3, 1, 0.5, "pinkFlare")
        + S.fade(glowEyes(cx - 90, cy - 120, "#FF4FD8", "#FFE6F8", { flip: true }), [[2.5, 0], [2.55, 1], [2.85, 1], [2.9, 0]])
        + F.ring(cx, cy, 2.7, { r: 900, width: 8, color: "#DCC6FF", life: 0.7, heat: true })
        + actor(twin, tPts) + F.dustRing(T0 + 90, 4.85, 10, 140) + F.crater(T0 + 90, 4.85, 0.6, { glow: "#FF4FD8", cracks: false })
        + place(S.win(rLoop("idle"), [[0, 1.25]]) + S.win(rA(pose("alert")), [[1.25, 3.0]]) + S.win(rA(pose("land")), [[3.0, 5.0]]), R0, TOP)
        + S.win(wind(30, 200, 3200, 500, GROUND), [[3.0, 5.0]])
        + F.glint(...rAt(R0, TOP, [Art.X0 + 7.5, Art.TOP + 6.5]), 1.3, "#FFFFFF", 8);
    shot(0, 5.0, { cam, far: "", mid: "", ground: use("rule"), main, screen: F.glitchWord("ICYCLE", RIFT_ON_PAGE[0] - 58, RIFT_ON_PAGE[1] - 14, 4, 1.7, 2.3) + F.flash(2.7, 1, "#FFFFFF", 0.6) });
}

// ---- Act II: the standoff.
{
    // The whole field: two specks, the rift between them, wind. A shaft of
    // moonlight through the dust.
    const both = rift() + pillar(LPX) + pillar(RPX);
    shot(5.0, 7.4, {
        cam: [[5.0, 1560, 620, 0.335, -1, "ease-in-out"], [7.4, 1600, 630, 0.36, 0]],
        main: both + place(rA(pose("land")), R0, TOP) + place(tLoop("annoyed"), T0, TOP) + wind(40, 200, 3200, 600, GROUND) + F.rays(2050, 330, 115, 150, 5, 900),
        screen: ""
    });
    // Worm's-eye: Rascal huge against the sky, the moon behind its head.
    const moonBg = (x, y, k = 14) => `<circle cx="${x}" cy="${y}" r="${k * 18}" fill="url(#moonGlow)"/>${place(moonArt(k), x, y)}`;
    shot(7.4, 8.6, {
        cam: [[7.4, R0 + 90, 770, 2.05, -10, "ease-out"], [8.6, R0 + 90, 755, 2.3, -12]],
        bg: S.move(moonBg(560, 190), [[7.4, 0, 0, 0, 1], [8.6, -20, 10, 0, 1.04]], { origin: [560, 190] }),
        main: place(S.win(rA(pose("land")), [[7.4, 8.0]]) + S.win(rA(pose("alert")), [[8.0, 8.6]]), R0, TOP) + wind(16, R0 - 300, R0 + 500, TOP - 100, GROUND, { op: 0.8 })
            + F.glint(...rAt(R0, TOP, [Art.X0 + 7.5, Art.TOP + 6.5]), 8.05, "#FFE45C", 6) + F.spiderweb(R0 + 90, GROUND + 3, 140, 7.5, { glow: "#FFC43A", dur: 0.6 })
    });
    // ...and the twin, the rift glowing behind it.
    shot(8.6, 9.8, {
        cam: [[8.6, T0 + 90, 770, 2.05, 10, "ease-out"], [9.8, T0 + 90, 755, 2.3, 12]],
        bg: `<circle cx="300" cy="250" r="420" fill="url(#riftGlow)"/>`,
        main: place(tLoop("annoyed"), T0, TOP) + wind(16, T0 - 500, T0 + 300, TOP - 100, GROUND, { op: 0.8 })
            + F.glint(...tAt(T0, TOP, [Art.X0 + 7.5, Art.TOP + 6.5]).map((v, i) => v + (i ? -4 : -8)), 9.2, "#FFD6F5", 6) + F.heat(T0 + 20, T0 + 160, TOP + 40, 8, "#FFD6F5")
    });
    // Their eyes: two strips, one above the other, the page between them.
    const k = 24, bandH = 170, top = [140, 410];
    const clip = (id, y) => { defs.push(`<clipPath id="${id}"><rect x="70" y="${y}" width="${W - 140}" height="${bandH}"/></clipPath>`); return id; };
    const c1 = clip("band1", top[0]), c2 = clip("band2", top[1]);
    const face = FACE.map((v) => v * k);
    const rFace = pix(pose("annoyed"), k, W / 2 - face[0] - 60, top[0] + bandH / 2 - face[1]);
    const tFace = pix(pose("annoyed"), k, W / 2 - (Art.W * k - face[0]) + 60, top[1] + bandH / 2 - face[1], { flip: true, pal: TWIN });
    const band = (c, y, html, dir) => `<g clip-path="url(#${c})">${S.move(html, [[9.8, 0, 0, 0, 1], [11.4, dir * 40, 0, 0, 1.08]], { origin: [W / 2, y + bandH / 2] })}${wind(10, 70, W - 70, y, y + bandH, { op: 0.5 })}</g>`
        + rect(70, y - 3, W - 140, 3, ".g1") + rect(70, y + bandH, W - 140, 3, ".g1");
    const eyeAt = (x, y) => [x, y];
    shots.push(S.win(S.move(band(c1, top[0], rFace, 1), [[9.8, -W, 0, 0, 1, "cubic-bezier(.2,.9,.3,1)"], [10.0, 0, 0]], { on: 24 })
        + S.move(band(c2, top[1], tFace, -1), [[9.8, W, 0, 0, 1, "cubic-bezier(.2,.9,.3,1)"], [10.05, 0, 0]], { on: 24 })
        + F.glint(W / 2 - 60 + 10, top[0] + bandH / 2 - 10, 10.6, "#FFE45C", 10) + F.glint(W / 2 + 60 - 10, top[1] + bandH / 2 - 10, 10.8, "#FF86C8", 10), [[9.8, 11.4]]));
    // The pillar: ICYCLE carved down it. A chip comes off the top and falls.
    shot(11.4, 12.6, {
        cam: [[11.4, 1086, 560, 1.75, 3, "ease-in-out"], [11.8, 1086, 575, 1.7, 2, "cubic-bezier(.5,0,.6,1)"], [12.6, 1060, 820, 1.4, -2]],
        main: rift() + S.win(pillar(LPX), [[0, 11.75]]) + S.win(pillar(LPX, 44, true), [[11.75, D]])
            + F.rock(1080, 470, 11.75, { vx: -40, vy: -60, bit: true, stay: true }) + F.puff(1072, GROUND - 6, 12.5, { to: 3, dx: -20, dy: -10, life: 0.6 }) + F.puff(1080, GROUND - 6, 12.5, { to: 3, dx: 20, dy: -10, life: 0.6 })
            + wind(10, 900, 1300, 400, GROUND, { op: 0.5 })
    });
    // Silence.
    shot(12.6, 13.8, {
        cam: [[12.6, 1600, 650, 0.34, 0, "ease-in"], [13.8, 1600, 660, 0.38, 0]],
        main: both + place(rA(pose("land")), R0, TOP) + place(tA(pose("land")), T0, TOP)
    });
}
