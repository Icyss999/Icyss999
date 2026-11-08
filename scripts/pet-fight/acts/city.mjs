// Act IV (28.05-33): it isn't over. The twin, cut down, gets up darker and
// cracked with light; a push-in on its eyes; it's behind Rascal before it
// can turn; Rascal is sent flying over the mountains.
// Act V (33-50): the city. Through a glass skybridge in slow motion; the
// twin on the next roof under an ICYCLE sign; a clash over the street; the
// street from below; a fisheye exchange on the roof; down into the road; a
// slash -- a hairline, a beat of nothing, then a tower and the sign slide
// apart; the city from above; the counter-strike; the whole city, smoking.

import { S, R, rnd, rect, pix, place, poly, r1, use, shot, shots, defs, sequence, W, H, D, GROUND, TOP, PX, fx, K, Art, PAL, TWIN, TWIN2, CYAN, PINK, GOLD, SMOKE, INK, PAPER, mono, word, wordW } from "../core.mjs";
import * as F from "../fx.mjs";
import { pose, rA, tA, rB, tB, rLoop, tLoop, actor, ghosts, rAt, tAt, paw, grip, FACE, MID, sil, glowEyes, cracked, lying, C0 } from "../cast.mjs";
import { rift, pillar, toppled, LPX, RPX, rubble, CITY, SIGN, BRIDGE, signFrame, signLetters, neonWord, tower, moonArt, wires } from "../sets.mjs";
import { wind, floating } from "./open.mjs";
import { signature, sq, foot } from "./clash.mjs";

const { hit, ring, dustRing, debris, scorch, embers, crackle, puff, flare, streaks, trail, kicks, bolt, boltOnce, explosion, effect, aura, glint, rock, GOLD_ARC, PINK_ARC, PINK_LINES } = F;
const RF = 2150, TF = 1950;

// The wrecked battlefield, after the first clash.
export const wreck = () => pillar(LPX, 16, true) + toppled() + pillar(RPX) + rect(660, GROUND + 2, 330, 6, "#07090E", ' opacity=".9"')
    + [[1600, 1.2], [2125, 1], [1975, 0.9], [1780, 2.6]].map(([x, s]) => `<ellipse cx="${x}" cy="${GROUND + 6}" rx="${r1(70 * s * K)}" ry="${r1(9 * s)}" fill="#07090E" opacity=".75"/>`).join("");
const WRECK_ROCKS = rubble(24, 600, 2400);
export const plumes = (spots) => {
    let s = "";
    for (const [x, n] of spots) for (let i = 0; i < n; i++) {
        const dur = R(2.6, 4.2);
        s += `<g class="plume" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(R(0, dur))}s;--dx:${r1(R(-80, 20))}px;--dy:-${r1(R(260, 460))}px;transform-origin:${x}px ${GROUND - 20}px">`
            + pix(F_DISC, fx, x - 48 + R(-30, 30), GROUND - 70, { pal: SMOKE }) + "</g>";
    }
    return s;
};
const F_DISC = (() => { const rows = []; for (let j = -8; j < 8; j++) { let r = ""; for (let i = -8; i < 8; i++) { const d = Math.hypot(i + 0.5, j + 0.5) / 8; r += d > 1 ? " " : d > 0.75 ? "c" : d > 0.4 ? "b" : "a"; } rows.push(r); } return rows; })();
export const FIELD_PLUMES = [[1600, 4], [1780, 6], [2125, 3], [1975, 3], [LPX + 30, 2]];

// ---------------------------------------------------------------- Act IV
{
    const field = rift() + wreck() + WRECK_ROCKS + plumes(FIELD_PLUMES);
    // The smoke. Rascal with its back to it; the twin goes down.
    shot(28.05, 29.5, {
        cam: [[28.05, 2050, 780, 0.74, 4, "cubic-bezier(.2,.6,.3,1)"], [29.5, 2010, 770, 0.63, 2]],
        main: field + place(S.win(rA(pose("land")), [[28.05, 28.7]]) + S.win(rLoop("idle"), [[28.7, 29.5]]), RF, TOP)
            + S.win(place(tA(pose("alert")), TF, TOP), [[28.05, 28.4]]) + S.win(lying(pose("fall"), TF), [[28.4, 29.5]]) + puff(TF + 90, GROUND - 6, 28.4, { to: 6, dx: 0, dy: -20 })
            + glint(TF + 60, GROUND - 60, 29.15, "#FF86C8", 6) + F.rays(2050, 330, 100, 135, 5, 900) + floating(14, 1500, 2400, 600, GROUND),
        screen: S.fade(F.flat("#FFFFFF"), [[28.049, 0], [28.05, 1, "ease-out"], [28.55, 0]])
    });
    // It gets up -- darker, cracked with light, the ground breaking under it.
    const twinUp = [[29.5, TF, TOP + 60, 90], [29.95, TF, TOP, 0, 1, "cubic-bezier(.3,0,.2,1)"], [30.7, TF, TOP, 0]];
    const darkAura = S.fade(aura(pose("land"), "#2A1640", { flip: true, k: 1.5 }), [[29.6, 0], [29.9, 0.95]]) + S.fade(aura(pose("land"), "#FF4FD8", { flip: true }), [[29.9, 0], [30.0, 1], [30.2, 0.5], [30.35, 1]]);
    const upBody = darkAura + S.win(tA(pose("fall"), TWIN2), [[29.5, 29.95]]) + S.win(tA(pose("land"), TWIN2) + cracked(5), [[29.95, 30.7]]) + S.win(F.rgb(pose("land"), { flip: true, d: 9 }), [[30.45, 30.55]]);
    shot(29.5, 30.7, {
        cam: [[29.5, 2030, 815, 1.25, -6, "ease-in"], [30.1, 2028, 808, 1.4, -7, "cubic-bezier(.75,0,.25,1)"], [30.45, 2025, 803, 3.6, -11], [30.7, 2025, 803, 3.8, -11]],
        main: field + actor(sq(upBody, [[29.95, 1.18, 0.84]]), twinUp) + F.spiderweb(TF + 90, GROUND + 3, 300, 29.9, { glow: "#FF4FD8", n: 11 }) + crackle(TF + 90, TOP + 90, 14, 20, 110, 29.9, 0.8, PINK_ARC)
            + F.heat(TF + 10, TF + 170, TOP + 40, 10, "#FFB0F0") + S.fade(glowEyes(TF, TOP, "#FF4FD8", "#FFE6F8", { flip: true }), [[30.2, 0], [30.25, 1]]) + ring(TF + 90, TOP + 90, 29.95, { r: 260, color: "#FF4FD8", width: 6, heat: true }),
        screen: F.focusFlicker(W / 2, H / 2, 30.45, 0.25, { fill: "#FFE6F8", op: 0.45, inner: 220 }),
        quake: [[29.95, 0.4, 6]]
    });
    // Behind Rascal before it can turn round.
    shot(30.7, 30.95, {
        cam: [[30.7, 2200, 812, 1.45, 4], [30.95, 2195, 808, 1.6, 5]],
        main: field + place(S.win(rLoop("idle"), [[30.7, 30.86]]) + S.win(rB(pose("alert")), [[30.86, 30.95]]), RF, TOP)
            + S.win(`<g opacity=".5">${place(tB(pose("cast"), mono("#FF4FD8")), 1990, TOP)}</g>`, [[30.8, 30.86]]) + S.win(place(tB(pose("cast"), TWIN2) + cracked(5), 1990, TOP), [[30.86, 30.95]])
            + S.win(place(F.rgb(pose("cast"), { d: 10 }), 1990, TOP), [[30.86, 30.9]])
    });
    // Impact frames.
    const figs = (ink, eyes) => sil(pose("fall"), RF + 40, TOP - 20, ink, { eyes, flip: true }) + sil(pose("cast"), 1990, TOP, ink, { eyes });
    const frame = (a, b, ground, ink, figsInk, eyes, inner, extra = "") => shot(a, b, { cam: [[a, 2150, 800, 1.6, -8]], far: "", mid: "", ground: "", bg: F.flat(ground) + F.focus(W / 2, H / 2, 40, inner, ink), main: figs(figsInk, eyes), screen: extra });
    frame(30.95, 31.0, PAPER, INK, INK, PAPER, 120);
    frame(31.0, 31.05, INK, PAPER, PAPER, INK, 150);
    frame(31.05, 31.1, "#FF4FD8", INK, INK, "#FF4FD8", 100);
    // Sent flying, over the mountains; the camera whips after it.
    const fly = [[31.1, RF + 40, TOP - 20, 0], [31.35, 2420, 560, 200, 1, "cubic-bezier(.2,.7,.4,1)"], [31.9, 2900, 330, 720, 0.75, "linear"], [32.6, 3500, 150, 1260, 0.35, "ease-out"], [33.0, 3700, 100, 1440, 0.25]];
    shot(31.1, 33.0, {
        cam: [[31.1, 2200, 790, 1.05, 0, "cubic-bezier(.3,0,.2,1)"], [31.5, 2560, 640, 0.75, -8, "ease-out"], [32.2, 2950, 520, 0.56, -4, "ease-in-out"], [33.0, 3050, 500, 0.5, 0]],
        main: field + actor(S.squash(rA(pose("fall")), 31.1, { sx: 0.7, sy: 1.3, dur: 0.4 }), fly) + ghosts(rA(pose("fall"), mono("#5CCFFF")), fly, [31.1, 31.9], 4, 0.03)
            + trail(fly, 31.1, 32.4, ["#FFFFFF", "#8FE0FF", "#5CCFFF"], { every: 0.035 })
            + place(S.win(tB(pose("cast"), TWIN2) + cracked(5), [[31.1, 31.6]]) + S.win(tB(pose("land"), TWIN2) + cracked(5), [[31.6, 33.0]]), 1990, TOP)
            + hit(RF + 40, TOP + 80, 31.1, { size: 2, pink: true }) + ring(RF + 60, GROUND, 31.1, { r: 400, flat: 0.12, width: 5 }) + dustRing(RF + 60, 31.12, 12, 260)
            + glint(3560, 200, 32.62, "#FFFFFF", 12),
        screen: F.whip(31.1, 0.5, { deg: -25 }),
        quake: [[31.1, 0.3, 16]]
    });
}

// ---------------------------------------------------------------- Act V
const L2line = (x) => 340 + (2080 - x) * 0.3;          // the slash: y at x
const CUT = [2400, L2line(2400), 500, L2line(500)];
const cityWorld = { far: use("cityFar"), mid: use("cityMid"), ground: use("street") };
// The city's shots, cut together over one city.
const segs = [];
const seg = (t0, t1, s) => segs.push({ t0, t1, ...s });
// What gets cut, cut: the glass tower's top slides off along the line; so
// does the top of the sign. (Made once, reused in every shot.)
const signDark = `<g opacity=".9">${neonWord("ICYCLE", SIGN.x, SIGN.y, SIGN.k, "#3A2340")}</g>`;
const signAll = signFrame() + S.win(signDark, [[-S.off, 35.6]]) + S.win(signLetters(), [[35.6, D + 5]]);
const L2cut = F.split(use("L2"), CUT, 42.2, { dx: -300, dy: 120, r: -9, dur: 2.2, origin: [1000, L2line(1000)] });
const SIGNcut = F.split(signAll, CUT, 42.2, { dx: -200, dy: 150, r: -14, dur: 1.6, origin: [1660, L2line(1660)] });
const BRIDGE_BROKEN = rect(BRIDGE.x, BRIDGE.y + BRIDGE.h - 6, BRIDGE.w, 6, ".b4") + rect(BRIDGE.x, BRIDGE.y, 60, 6, ".b4") + rect(BRIDGE.x + BRIDGE.w - 90, BRIDGE.y, 90, 6, ".b4")
    + rect(BRIDGE.x, BRIDGE.y, 4, BRIDGE.h, ".b4") + rect(BRIDGE.x + BRIDGE.w - 4, BRIDGE.y, 4, BRIDGE.h, ".b4");
const city = wires() + use("L1") + L2cut + S.win(use("bridge"), [[-S.off, 33.4]]) + S.win(BRIDGE_BROKEN, [[33.4, D + 5]]) + use("R1") + SIGNcut + use("R2") + use("R3");
// Smoke going up from the wreck, once there's wreck.
const cityPlumes = (t) => S.win(plumes([[1740, 4], [1000, 3]]), [[t, D + 5]]);

// Where they are, all act long (art top-left).
const ROOF1 = CITY.R1[2] - Art.H * PX, ROOF2 = CITY.R2[2] - Art.H * PX;
const rPts = [
    [33.0, 600, 120, 0], [33.4, 1170, 410, 540, 1, "linear"], [34.6, 1230, 450, 600, 1, "linear"], [34.72, 1560, ROOF1, 720, 1, "ease-out"], [35.0, 1640, ROOF1, 720],
    [36.8, 1640, ROOF1, 720, 1, "cubic-bezier(.2,.7,.4,1)"], [37.15, 1810, 220, 720], [37.35, 1810, 220, 720, 1, "ease-out"], [37.4, 1760, 240, 720],
    [39.4, 1800, 300, 720, 1, "ease-in"], [39.6, 1650, TOP, 720], [41.2, 1650, TOP, 720, 1, "cubic-bezier(.2,.8,.4,1)"], [41.4, 1560, 180, 720],
    [42.2, 1560, 180, 720, 1, "ease-in"], [42.45, 1600, ROOF1, 720], [50, 1600, ROOF1, 720]
];
const tPts = [
    [33.0, 2080, -400], [35.2, 2080, -400, 0, 1, "ease-in"], [35.45, 2080, ROOF2], [36.8, 2080, ROOF2, 0, 1, "cubic-bezier(.2,.7,.4,1)"], [37.15, 1960, 220],
    [37.35, 1960, 220, 0, 1, "ease-out"], [37.6, 2080, ROOF2], [47.35, 2080, ROOF2, 0, 1, "cubic-bezier(.2,.7,.4,1)"], [47.7, 2260, 160, 200], [48.4, 2420, 700, 520, 1, "ease-in"], [50, 2420, 700, 520]
];
{
    const rBody = S.win(rA(pose("fall")), [[33.0, 34.72], [39.4, 39.6]]) + S.win(F.rgb(pose("fall")), [[33.4, 33.5], [33.95, 34.1]]) + S.win(rA(pose("land")), [[34.72, 35.0], [39.6, 40.0], [42.45, 42.7]])
        + S.win(rLoop("annoyed"), [[35.0, 36.8], [42.7, 46.5]]) + S.win(rA(pose("jump")), [[36.8, 37.15], [41.2, 42.45]]) + S.win(rA(pose("cast")), [[37.15, 37.4], [46.5, 48.0]])
        + S.win(rA(pose("fall")), [[37.4, 39.4]]) + S.win(rLoop("climb"), [[40.0, 41.2]]) + S.win(rLoop("idle"), [[48.0, 50]]);
    const tBody = S.win(tA(pose("jump"), TWIN2), [[33.0, 35.45], [36.8, 37.15]]) + S.win(tA(pose("land"), TWIN2), [[35.45, 35.7], [37.6, 37.8]]) + S.win(tLoop("annoyed", {}, TWIN2), [[35.7, 36.8], [37.8, 40.5], [42.2, 46.5]])
        + S.win(tA(pose("cast"), TWIN2), [[37.15, 37.6], [41.3, 42.2]]) + S.win(tLoop("charge", {}, TWIN2), [[40.5, 41.3]]) + S.win(tA(pose("alert"), TWIN2), [[46.5, 47.35]]) + S.win(tA(pose("fall"), TWIN2), [[47.35, 50]])
        + S.win(cracked(5), [[33, 50]]);
    const rFlash = S.win(F.hitFlash(pose("jump")), [[37.15, 37.19]]) + S.win(F.hitFlash(pose("fall")), [[39.1, 39.14], [33.4, 33.44]]);
    const tFlash = S.win(F.hitFlash(pose("jump"), true), [[37.15, 37.19]]) + S.win(F.hitFlash(pose("fall"), true), [[47.35, 47.4]]);
    const both = actor(sq(tBody + tFlash, [[35.45, 1.3, 0.72], [36.8, 0.82, 1.2], [37.6], [47.35, 0.8, 1.2]]), tPts)
        + actor(sq(rBody + rFlash, [[34.72, 1.3, 0.72], [36.8, 0.82, 1.2], [39.6, 1.35, 0.68], [41.2, 0.8, 1.25], [42.45]]), rPts);

    // ---- through the glass (33-35.2): it hits the skybridge, and time all
    // but stops; shards hang round it (some with a letter on them); then it
    // all goes at once, and it lands on the roof.
    const glassAt = [1270, 520];
    seg(33.0, 35.2, {
        cam: [[33.0, 1000, 420, 0.75, -6, "linear"], [33.4, 1240, 500, 1.15, 4, "cubic-bezier(.1,.8,.3,1)"], [33.6, 1250, 505, 1.3, 7, "linear"], [34.6, 1265, 512, 1.42, 11, "cubic-bezier(.7,0,.3,1)"],
            [34.75, 1520, 500, 0.95, -4, "ease-out"], [35.2, 1620, 480, 0.85, -2]],
        main: ghosts(rA(pose("fall"), mono("#5CCFFF")), rPts, [33.0, 33.4], 4, 0.03) + ghosts(rA(pose("fall"), mono("#5CCFFF")), rPts, [34.6, 34.72], 3, 0.02)
            + F.shards(...glassAt, 34.0 - 0.6, 46, { spread: 520, dir: 0.6, letters: "ICYCLE", phases: [[0, 0], [0.12, 0.3], [1.2, 0.42], [1.35, 1]], size: [12, 30] })
            + flare(...glassAt, 260, 33.4, 1, 0.4) + F.ring(...glassAt, 33.4, { r: 300, width: 5, heat: true })
            + F.spiderweb(1720, CITY.R1[2] + 2, 260, 34.72) + dustRing(1720, 34.72, 10, 200, CITY.R1[2] - 10) + debris(1720, CITY.R1[2] - 8, 34.72, 6, { stay: true, floor: CITY.R1[2] })
            + streaks(1240, 500, 1640, 380, 34.6, 14, { len: [160, 360] }),
        screen: F.flash(33.4, 2) + S.win(F.flat("#8B949E", ' opacity=".18"'), [[33.95, 34.1]]) + F.focusFlicker(W / 2, H / 2, 33.95, 0.15, { op: 0.5 }),
        quake: [[33.4, 0.25, 12], [34.72, 0.3, 10]]
    });
    // ---- the twin lands on the next roof; the sign comes on, a letter at a
    // time.
    seg(35.2, 36.8, {
        cam: [[35.2, 1960, 430, 1.15, 6, "ease-out"], [36.8, 1950, 420, 1.25, 8]],
        main: dustRing(2170, 35.45, 10, 200, CITY.R2[2] - 10) + F.spiderweb(2170, CITY.R2[2] + 2, 220, 35.45, { glow: "#FF4FD8" }) + ring(2170, CITY.R2[2], 35.45, { r: 280, flat: 0.12, width: 4 })
            + streaks(2170, -200, 2170, 300, 35.25, 10, { colors: PINK_LINES, len: [160, 320] }) + [..."ICYCLE"].map((_, i) => flare(SIGN.x + i * 48 + 20, SIGN.y + 28, 70, 35.6 + i * 0.1, 0.9, 0.25, "pinkFlare")).join(""),
        quake: [[35.45, 0.25, 9]]
    });
    // ---- a clash over the street.
    seg(36.8, 37.4, {
        cam: [[36.8, 1880, 440, 0.82, 0, "ease-in"], [37.12, 1905, 330, 1.05, -5, "ease-out"], [37.15, 1905, 320, 1.25, -6, "linear"], [37.35, 1905, 318, 1.3, -7, "ease-in"], [37.4, 1905, 330, 1.1, -4]],
        main: ghosts(rA(pose("jump"), mono("#5CCFFF")), rPts, [36.85, 37.15], 3, 0.03) + ghosts(tA(pose("jump"), mono("#FF4FD8")), tPts, [36.85, 37.15], 3, 0.03)
            + hit(1985, 320, 37.15, { size: 2 }) + hit(1985, 320, 37.17, { size: 1.4, pink: true }),
        screen: F.flash(37.15, 2, "#FFFFFF", 0.85) + F.focusFlicker(W / 2, H / 2, 37.15, 0.2, { op: 0.6 }),
        quake: [[37.15, 0.25, 14]]
    });
    // ---- the street from below: the towers leaning in to a strip of sky,
    // the two of them up there, small, trading blows; bits coming down.
    {
        const VP = [480, -320], wall = (xs) => { const f = (760 - 40) / (760 - VP[1]); return [[xs[0], 760], [xs[1], 760], [xs[1] + (VP[0] - xs[1]) * f, 40], [xs[0] + (VP[0] - xs[0]) * f, 40]]; };
        const face = (xs, dir) => {
            let s = poly(wall(xs), ".b3") + poly(wall([dir > 0 ? xs[1] - 10 : xs[0], dir > 0 ? xs[1] : xs[0] + 10]), ".b4");
            for (let k = 0; k < 9; k++) {
                const y = 760 - 720 * (1 - (1 - k / 9) ** 1.5), f = (760 - y) / (760 - VP[1]);
                const xa = xs[0] + (VP[0] - xs[0]) * f, xb = xs[1] + (VP[0] - xs[1]) * f, h = 24 * (1 - f);
                for (let j = 0; j < 5; j++) { const u = (j + 0.25) / 5, x = xa + (xb - xa) * u; s += rect(x, y - h - 6, (xb - xa) / 9, h, rnd() < 0.18 ? "#F0C050" : ".w0", rnd() < 0.18 ? ' opacity=".7"' : ""); }
            }
            return s;
        };
        const sky = Array.from({ length: 30 }, () => rect(R(380, 580), R(-60, 300), 3, 3, ".st", ` opacity="${R(0.3, 0.7).toFixed(2)}"`)).join("");
        const small = (rows, flip, pal, x, y) => pix(rows, 4, x, y, { flip, pal });
        const fig = S.win(small(pose("jump"), false, PAL, 410, 60) + small(pose("cast"), true, TWIN2, 486, 40), [[37.4, 37.62]])
            + S.win(small(pose("cast"), false, PAL, 440, 50) + small(pose("fall"), true, TWIN2, 500, 20), [[37.62, 37.86]])
            + S.win(small(pose("fall"), false, PAL, 400, 80) + small(pose("cast"), true, TWIN2, 470, 50), [[37.86, 38.05]])
            + S.win(small(pose("jump"), false, PAL, 430, 30) + small(pose("jump"), true, TWIN2, 480, 30), [[38.05, 38.2]]);
        const falling = Array.from({ length: 14 }, () => { const x = R(380, 580), y = R(40, 140); return S.shot(place(F.rockBody(rnd() < 0.4).html, x, y), 37.4 + R(0, 0.6), R(0.4, 0.7), { dx: (x - 480) * R(2, 4), dy: R(500, 800), s0: 0.6, s1: 3.5, origin: [x, y], ease: "ease-in" }); }).join("");
        const sparks = [37.62, 37.86, 38.05].map((t, i) => F.impact(470 + i * 8, 90 - i * 10, t, { size: 0.5, pal: i % 2 ? PINK : CYAN })).join("");
        shots.push(S.win(S.move(`<g>${sky}${face([-80, 300], 1)}${face([660, 1040], -1)}${fig}${sparks}${falling}</g>`, [[37.4, 0, 0, -4, 1.05], [38.2, 0, 0, 7, 1.12]], { origin: [480, 360] }), [[37.4, 38.2]]));
    }
    // ---- on the roof, close, through a fisheye: the roof bending away, the
    // skyline bent round it, every blow snapping the picture round.
    {
        const O = [480, 1900], Rr = 1450;
        let back = "";
        for (let a = -48; a <= 48; a += 4.5) { const w = R(50, 110), h = R(120, 380); back += `<g transform="rotate(${r1(a + R(-1, 1))} ${O[0]} ${O[1]})">${rect(O[0] - w / 2, O[1] - Rr - h, w, h + 60, ".b2")}${rnd() < 0.5 ? rect(O[0] - 4, O[1] - Rr - h - 30, 3, 30, ".b2") : ""}</g>`; }
        for (let a = -40; a <= 40; a += 11) back += `<g transform="rotate(${r1(a + R(-3, 3))} ${O[0]} ${O[1]})">${rect(O[0] - 18, O[1] - Rr - 22, 36, 22, ".b4")}</g>`;
        const sky = Array.from({ length: 40 }, () => rect(R(0, W), R(-100, 450), 3, 3, ".st", ` opacity="${R(0.2, 0.6).toFixed(2)}"`)).join("") + `<circle cx="760" cy="140" r="100" fill="url(#moonGlow)"/>` + place(moonArt(5), 760, 140);
        const roof = `<circle cx="${O[0]}" cy="${O[1]}" r="${Rr}" class="b3"/><circle cx="${O[0]}" cy="${O[1]}" r="${Rr}" fill="none" style="stroke:var(--g1)" stroke-width="6" shape-rendering="geometricPrecision"/><circle cx="${O[0]}" cy="${O[1]}" r="${Rr - 40}" fill="none" style="stroke:var(--b4)" stroke-width="3" stroke-dasharray="30 40" shape-rendering="geometricPrecision"/>`;
        const k = 20, on = (a, rows, flip, pal, lift = 0) => `<g transform="rotate(${a} ${O[0]} ${O[1]})">${pix(rows, k, O[0] - (Art.W * k) / 2, O[1] - Rr - Art.H * k + 22 - lift, { flip, pal })}</g>`;
        const beats = [
            [38.2, 38.35, ["land", -13, 0], ["land", 13, 0]],
            [38.35, 38.6, ["cast", -9, 0], ["fall", 12, 30]],
            [38.6, 38.85, ["fall", -12, 30], ["cast", 9, 0]],
            [38.85, 39.1, ["jump", -8, 60], ["fall", 13, 40]],
            [39.1, 39.4, ["fall", -17, 80], ["cast", 8, 0]]
        ];
        let figs = "";
        for (const [a, b, rr, tt] of beats) figs += S.win(on(rr[1], pose(rr[0]), false, PAL, rr[2]) + on(tt[1], pose(tt[0]), true, TWIN2, tt[2]) + (tt[0] === "cast" ? "" : ""), [[a, b]]);
        const hits = [[38.35, false, 1.2], [38.6, true, 1.2], [38.85, false, 1.4], [39.1, true, 2.2]].map(([t, pink, s]) => hit(480, 300, t, { size: s, pink }) + F.flash(t, 1, "#FFFFFF", 0.5)).join("");
        const snap = "cubic-bezier(.15,.85,.3,1)";
        const roll = S.move(`<g>${sky}${back}${roof}${figs}${hits}</g>`, [[38.2, 0, 0, -3, 1, "ease-in"], [38.35, 0, 0, -4, 1.02, snap], [38.43, 0, 0, 6, 1.06, "ease-in"], [38.6, 0, 0, 5, 1.06, snap], [38.68, 0, 0, -8, 1.08, "ease-in"],
            [38.85, 0, 0, -7, 1.08, snap], [38.93, 0, 0, 10, 1.1, "ease-in"], [39.1, 0, 0, 9, 1.1, snap], [39.2, 0, 0, -14, 1.16, "ease-out"], [39.4, 0, 0, -16, 1.2]], { origin: [480, 360] });
        shots.push(S.win(S.quake(roll, [[38.35, 0.12, 8], [38.6, 0.12, 8], [38.85, 0.12, 10], [39.1, 0.3, 18]]) + F.focusFlicker(480, 300, 39.1, 0.18, { op: 0.6 }), [[38.2, 39.4]]));
    }
    // ---- down into the road.
    seg(39.4, 40.5, {
        cam: [[39.4, 1720, 600, 0.62, -5, "ease-out"], [40.5, 1720, 640, 0.58, -1]],
        main: F.crater(1740, 39.6, 1.1) + ghosts(rA(pose("fall"), mono("#5CCFFF")), rPts, [39.4, 39.6], 3, 0.03) + cityPlumes(39.7),
        screen: F.flash(39.6, 1, "#FFFFFF", 0.6),
        quake: [[39.6, 0.35, 14]]
    });
    // ---- the slash. The twin draws the light in; held.
    seg(40.5, 41.3, {
        cam: [[40.5, 2150, 345, 1.8, 6, "ease-in"], [41.3, 2150, 340, 2.15, 8]],
        main: S.fade(aura(pose("charge"), "#FF4FD8", { flip: true }), [[40.5, 0], [41.2, 1]]) + crackle(2170, 340, 16, 20, 110, 40.5, 0.8, PINK_ARC)
            + F.rays(2080, 340, 150, 210, 7, 500, { grad: "pinkRay" }) + F.heat(2090, 2250, 300, 10, "#FFB0F0") + F.castShadow(pose("charge"), 2080, { flip: true, ground: CITY.R2[2], lean: -0.8 })
    });
    // A hairline across the whole city. Rascal leaps it. Nothing happens --
    // then the tower and the sign slide apart along it.
    const slashFx = F.slashLine(...CUT, 41.3, { hold: 0.9, color: "#FF4FD8", width: 5 });
    const cutDust = Array.from({ length: 22 }, (_, i) => { const x = R(820, 1120), y = L2line(x); return puff(x, y, 42.2 + R(0, 0.6), { to: [6, 5, 4][i % 3], dx: R(-60, 20), dy: R(30, 160), life: R(1.0, 1.6), opacity: 0.7 }); }).join("")
        + Array.from({ length: 10 }, () => { const x = R(1520, 1800); return puff(x, L2line(x), 42.2 + R(0, 0.3), { to: 4, dx: R(-40, 20), dy: R(20, 80), life: 1.0, opacity: 0.7 }); }).join("")
        + F.shards(980, L2line(980), 42.25, 26, { spread: 380, dir: -1, phases: [[0, 0], [0.1, 0.25], [1.0, 0.4], [1.4, 1]] })
        + Array.from({ length: 14 }, () => { const x = R(830, 1110); return rock(x, L2line(x), 42.3 + R(0, 1.2), { vx: R(-120, 60), vy: R(-50, 50), stay: true, bit: rnd() < 0.5 }); }).join("")
        + S.win(dustRing(900, 44.3, 14, 360), [[44.3, D]]) + cityPlumes(43.5);
    seg(41.3, 44.5, {
        cam: [[41.3, 1500, 545, 0.55, 0, "linear"], [42.2, 1490, 550, 0.57, 0, "cubic-bezier(.4,0,.2,1)"], [44.5, 1420, 520, 0.41, -2]],
        main: slashFx + cutDust + ghosts(rA(pose("jump"), mono("#5CCFFF")), rPts, [41.2, 41.4], 3, 0.03),
        screen: F.flash(41.3, 1, "#FFE6F8", 0.7),
        quake: [[42.2, 1.2, 8], [44.3, 0.5, 12]]
    });
    // ---- the city from straight above, turning: the fallen top across the
    // road, the dust going up, two specks on the roofs.
    {
        const fallen = `<g transform="rotate(28 1250 640)">${rect(1100, 560, 320, 150, ".b3")}${rect(1100, 560, 320, 8, ".b4")}${Array.from({ length: 8 }, (_, i) => rect(1120 + i * 38, 590, 18, 90, ".w0")).join("")}</g>`;
        const dust = Array.from({ length: 16 }, (_, i) => { const x = 1250 + R(-220, 220), y = 640 + R(-160, 160); return puff(x, y, 44.5 + R(0, 1.5), { pal: SMOKE, to: [12, 10, 8][i % 3], dx: R(-40, 40), dy: R(-40, 40), life: R(1.5, 2.2), opacity: 0.7, mode: "io" }); }).join("");
        const specks = place(`<ellipse cx="18" cy="40" rx="20" ry="8" fill="#05060A" opacity=".5"/>` + pix(pose("land"), 3, 0, 0), 1680, 520) + place(`<ellipse cx="34" cy="40" rx="20" ry="8" fill="#05060A" opacity=".5"/>` + pix(pose("land"), 3, 0, 0, { flip: true, pal: TWIN2 }), 2060, 470);
        const hole = `<circle cx="1760" cy="740" r="70" fill="#07090E" opacity=".85"/>` + F.spiderweb(1760, 740, 220, 44.5, { flat: 1, n: 12, dur: 0.05 });
        shot(44.5, 46.5, { cam: [[44.5, 1600, 680, 0.62, 0, "linear"], [46.5, 1600, 680, 0.7, 22]], far: "", mid: "", ground: use("cityPlan"), main: hole + fallen + dust + specks });
    }
    // ---- Rascal's answer: held, then lightning across to the twin's roof.
    seg(46.5, 47.3, {
        cam: [[46.5, 1700, 470, 1.65, -6, "ease-in"], [47.3, 1700, 465, 1.9, -8]],
        main: S.fade(aura(pose("cast"), "#FFC43A"), [[46.5, 0], [47.2, 1]]) + crackle(1730, 470, 14, 20, 100, 46.5, 0.8, GOLD_ARC) + embers(1690, CITY.R1[2], 46.6, 12, 60, 0.7)
            + F.heat(1600, 1780, 400, 10) + F.rays(...rAt(1600, ROOF1, paw("cast")), -40, 40, 6, 420, { grad: "goldRay" })
    });
    const from = rAt(1600, ROOF1, paw("cast")), target = tAt(2080, ROOF2, MID);
    seg(47.3, 48.2, {
        cam: [[47.3, 1880, 420, 0.95, 0, "ease-out"], [48.2, 1920, 440, 0.82, 3]],
        main: S.win(effect("flash", ...from), [[47.3, 47.5]]) + bolt(from, target, 47.3, { hold: 0.45 }) + explosion(target[0], target[1], 47.35, 1.3, { ground: CITY.R2[2] })
            + F.castShadow(pose("cast"), 1600, { ground: CITY.R1[2], lean: 1.4 }) + trail(tPts, 47.35, 48.2, PINK_LINES),
        screen: F.flash(47.35, 2),
        quake: [[47.35, 0.5, 14]]
    });
    // ---- the whole city, smoking, the moon over it.
    seg(48.2, 50.0, {
        cam: [[48.2, 1600, 600, 0.52, 0, "cubic-bezier(.3,0,.2,1)"], [50.0, 1600, 560, 0.34, 0]],
        main: S.win(plumes([[2170, 4]]), [[47.4, D + 5]]) + F.rays(2050, 330, 110, 140, 4, 1200) + floating(16, 800, 2600, 300, GROUND),
        quake: [[48.4, 0.25, 6]]
    });
    sequence({ ...cityWorld, common: city + both }, segs);
}
