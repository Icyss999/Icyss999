// Act VII (62.2-79): the last attack. The dust dome; the crater; quiet. The
// camera orbits Rascal charging; the twin charging; a push-in on Rascal's
// eyes; silence -- two shapes on a line, their eyes; then the cut: impact
// frames, a hairline through the mountains, a beat of nothing, and the
// mountains slide apart. From above, as the dust clears, the scar it left
// spells ICYCLE.
// Act VIII (79-90): the twin comes apart into the rift, and the rift shuts;
// the stars (another ICYCLE); the world folds back into the page, and Rascal
// runs home along the line -- to where it all started.

import { S, R, rnd, rect, pix, place, poly, r1, use, shot, shots, defs, sequence, W, H, D, GROUND, TOP, PX, fx, K, Art, PAL, TWIN, TWIN2, CYAN, PINK, GOLD, SMOKE, INK, PAPER, mono, word, wordW, flatShot } from "../core.mjs";
import * as F from "../fx.mjs";
import { pose, rA, tA, rB, rLoop, rLoopB, tLoop, actor, ghosts, rAt, tAt, paw, grip, FACE, MID, CORE, sil, glowEyes, cracked, nanoOff, jets, ARMOR, C0 } from "../cast.mjs";
import { rift, riftGlow, RIFT_C, pillar, toppled, LPX, RPX, rubble, constellation, SKY } from "../sets.mjs";
import { wind, floating, tearMask, PAGE_CAM, RIFT_ON_PAGE } from "./open.mjs";
import { signature, R0, sq, foot } from "./clash.mjs";
import { wreck, plumes, FIELD_PLUMES } from "./city.mjs";

const { hit, ring, dustRing, debris, embers, crackle, puff, flare, streaks, trail, bolt, boltOnce, explosion, effect, aura, glint, rock, floatRock, GOLD_ARC, PINK_ARC, PINK_LINES, GOLD_LINES } = F;
const RF = 2150, TF = 1950, RS = 1250, CX = 1700;

// The mountains, cut through: the top slides off, slowly.
const MTN_CUT = [600, 760, 2700, 690];
const mtnCut = F.split(use("mtn"), MTN_CUT, 71.5, { dx: 420, dy: 90, r: 4, dur: 3.2, origin: [1650, 725], ease: "cubic-bezier(.5,0,.8,.5)" })
    // (the face of the cut, glowing, then cooling)
    + S.fade(`<line x1="${MTN_CUT[0]}" y1="${MTN_CUT[1]}" x2="${MTN_CUT[2]}" y2="${MTN_CUT[3]}" stroke="#FFC43A" stroke-width="10" stroke-opacity=".45" shape-rendering="geometricPrecision"/><line x1="${MTN_CUT[0]}" y1="${MTN_CUT[1]}" x2="${MTN_CUT[2]}" y2="${MTN_CUT[3]}" stroke="#FFF3B0" stroke-width="3" shape-rendering="geometricPrecision"/>`, [[71.5, 0], [71.55, 1], [76, 0.75], [D, 0.5]]);
const farCut = use("sky") + mtnCut;
// The final crater, and the field round it.
const bigCrater = F.crater(CX, 61.5, 2.2, { glow: "#FF4FD8" });
const ROCKS = rubble(20, 700, 2500);
const field = (smoke = true) => rift() + wreck() + ROCKS + bigCrater + (smoke ? plumes([...FIELD_PLUMES, [CX, 5]]) : "");
// The battlefield's shots, cut together over one battlefield.
const fsegs = [];
const fseg = (t0, t1, s) => fsegs.push({ t0, t1, ...s });

// ---- the dust dome, from far off.
fseg(62.2, 63.0, {
    cam: [[62.2, 1650, 650, 0.36, 0, "ease-out"], [63.0, 1650, 660, 0.4, 0]],
    main: Array.from({ length: 20 }, (_, i) => puff(CX + R(-60, 60), GROUND - R(0, 60), 61.5 + R(0, 0.4), { pal: SMOKE, to: [14, 12, 10][i % 3], dx: R(-260, 260), dy: -R(150, 420), life: R(1.6, 2.4), opacity: 0.85, mode: "io" })).join("")
        + ring(CX, GROUND, 62.2, { r: 1200, flat: 0.08, width: 6, life: 0.8 }) + dustRing(CX, 62.2, 16, 700),
    quake: [[62.2, 0.6, 10]]
});

// ---- the crater. Rascal comes down, the suit going; the twin climbs out.
const rPts = [[63.0, RS, 300], [63.3, RS, TOP, 0, 1], [70.6, RS, TOP]];
const tPts = [[63.0, CX - 90, TOP + 80], [64.0, TF, TOP, 0, 1, "ease-out"], [79, TF, TOP]];
{
    const rBody = S.win(rLoop("fly", ARMOR) + jets(), [[63.0, 63.3]]) + S.win(rA(pose("land", 0, ARMOR)), [[63.3, 63.45]]) + S.seq(nanoOff(), 63.45, 0.05) + S.win(`<g class="breathe">${rA(pose("land"))}</g>`, [[63.65, 65.0]]);
    const tBody = S.win(tLoop("climb", {}, TWIN2), [[63.0, 64.0]]) + S.win(`<g class="breathe">${tA(pose("land"), TWIN2)}</g>`, [[64.0, 65.0]]) + S.win(cracked(5), [[63.0, 65.0]]);
    fseg(63.0, 65.0, {
        cam: [[63.0, 1640, 760, 0.6, 0, "ease-out"], [65.0, 1640, 770, 0.67, 1]],
        main: F.shadowOf(rPts) + F.shadowOf(tPts) + actor(sq(rBody, [[63.3, 1.35, 0.68]]), rPts) + actor(sq(tBody, [[64.0, 1.15, 0.86]]), tPts) + dustRing(RS + 90, 63.3, 8, 120) + F.motes(30, 900, 2500, 500, GROUND) + F.rays(2050, 330, 110, 150, 6, 1100)
            + F.heat(RS + 20, RS + 160, TOP + 40, 8) + F.heat(TF + 20, TF + 160, TOP + 40, 8, "#FFB0F0") + floating(18, 1000, 2400, 600, GROUND) + wind(14, 900, 2500, 600, GROUND, { dx: [80, 160], op: 0.4 })
    });
}

// ---- the orbit: Rascal charging, fixed in the middle of the picture; the
// world swinging round behind it; it turns as the camera passes its far
// side; rocks circling it, in front and behind.
{
    const t0 = 65.0, t1 = 67.9, z = 1.15, gy = 360 + (GROUND - 760) * z;      // where the ground is on screen
    const ox = W / 2 - (Art.W * PX * z) / 2, oy = gy - Art.H * PX * z, cxy = [W / 2, gy - 90 * z];
    defs.push(`<clipPath id="orbB"><rect x="-100" y="-100" width="${W + 200}" height="${cxy[1] + 100}"/></clipPath><clipPath id="orbF"><rect x="-100" y="${cxy[1]}" width="${W + 200}" height="${H}"/></clipPath>`);
    const ringOf = (n) => Array.from({ length: n }, (_, i) => `<g transform="rotate(${r1((360 * i) / n + R(-10, 10))})"><g transform="translate(${r1(R(200, 260))} 0) scale(1 3.4)">${F.rockBody(rnd() < 0.3, rnd() < 0.5 ? 1 : 0).html}</g></g>`).join("");
    const rocksHtml = ringOf(12);
    const orbit = (clip) => `<g clip-path="url(#${clip})"><g transform="translate(${cxy[0]} ${cxy[1] + 20}) scale(1 .3)"><g class="orb" style="animation-duration:1.7s">${rocksHtml}</g></g></g>`;
    const cols = [0, 1, 2, 3, 4].map(() => ({ dx: (rnd() < 0.5 ? -1 : 1) * R(100, 220), h: R(160, 320) }));
    const columns = S.loop([0, 1].map(() => cols.map((c) => boltOnce([cxy[0] + c.dx + R(-20, 20), gy - c.h], [cxy[0] + c.dx, gy], CYAN, { scale: 0.45, forks: rnd() < 0.3 ? 1 : 0 })).join("")), 12);
    const pet = `<g transform="translate(${r1(ox)} ${r1(oy)}) scale(${z})">${aura(pose("charge"), "#FFC43A")}${S.win(rLoop("charge"), [[t0, 66.45]])}${S.win(rLoopB("charge"), [[66.45, t1]])}</g>`;
    const screen = F.rays(cxy[0], cxy[1], 0, 360, 14, 620, { grad: "goldRay", width: [16, 40] }) + orbit("orbB") + F.spiderweb(cxy[0], gy + 3, 360, t0, { glow: "#FFC43A", n: 12, dur: 0.6 })
        + pet + columns + orbit("orbF") + crackle(cxy[0], cxy[1], 26, 30, 150, t0, t1 - t0, GOLD_ARC) + embers(cxy[0], gy, t0, 30, 160, t1 - t0) + F.heat(cxy[0] - 120, cxy[0] + 120, oy + 60, 14)
        + F.focusFlicker(cxy[0], cxy[1], 67.4, 0.5, { fill: "#FFF3B0", op: 0.3, inner: 300 });
    const twinFar = place(S.loop(Array.from({ length: 2 }, (_, f) => tA(pose("charge", f), TWIN2)), 9) + cracked(5) + aura(pose("charge"), "#FF4FD8", { flip: true }), TF, TOP);
    fseg(t0, t1, {
        cam: [[t0, 300, 760, z, -3, "cubic-bezier(.45,0,.55,1)"], [t1, 2700, 760, z, 3]],
        main: twinFar + Array.from({ length: 14 }, () => floatRock(R(200, 2900), t0 + R(0, 1.5), 71.5, R(60, 300), [R(-500, 500), R(-300, 80)])).join(""),
        screen, quake: [[t0, t1 - t0, 3]]
    });
}

// ---- the twin, charging too: a pillar of pink light.
fseg(67.9, 68.5, {
    cam: [[67.9, TF + 90, 770, 2.0, 10, "ease-out"], [68.5, TF + 90, 760, 2.25, 12]],
    bg: `<circle cx="480" cy="200" r="460" fill="url(#pinkFlare)" opacity=".35"/>`,
    main: place(aura(pose("charge"), "#FF4FD8", { flip: true, k: 1.5 }) + tLoop("charge", {}, TWIN2) + cracked(5), TF, TOP) + F.rays(TF + 90, TOP + 90, -120, -60, 9, 900, { grad: "pinkRay" })
        + crackle(TF + 90, TOP + 90, 18, 30, 140, 67.9, 0.6, PINK_ARC) + F.heat(TF, TF + 180, TOP + 30, 12, "#FFB0F0") + F.spiderweb(TF + 90, GROUND + 3, 300, 67.9, { glow: "#FF4FD8", dur: 0.4 }),
    quake: [[67.9, 0.6, 5]]
});
// ---- in on Rascal's eyes.
{
    const face = rAt(RS, TOP, FACE);
    fseg(68.5, 69.4, {
        cam: [[68.5, face[0] - 10, face[1] - 15, 1.3, -4, "cubic-bezier(.8,0,.2,1)"], [69.0, face[0], face[1], 4.6, -8, "linear"], [69.4, face[0], face[1], 4.9, -8]],
        main: place(aura(pose("charge"), "#FFC43A") + rA(pose("charge")) + S.fade(glowEyes(0, 0), [[68.9, 0], [68.95, 1]]), RS, TOP) + crackle(face[0], face[1], 14, 20, 90, 68.6, 0.8, GOLD_ARC),
        screen: F.focusFlicker(W / 2, H / 2, 69.0, 0.4, { fill: "#FFF3B0", op: 0.35, inner: 260 })
    });
}
// ---- silence: two shapes on a line on the page, their eyes.
shot(69.4, 70.6, {
    cam: [[69.4, 1650, 780, 0.6, 0, "linear"], [70.6, 1650, 780, 0.63, 0]], far: "", mid: "", ground: use("rule"),
    main: sil(pose("charge"), RS, TOP, "#05060A", { eyes: "#FFE45C" }) + sil(pose("charge"), TF, TOP, "#05060A", { flip: true, eyes: "#FF4FD8" })
        + glowEyes(RS, TOP, "#FFE45C", "#FFF7C2") + glowEyes(TF, TOP, "#FF4FD8", "#FFE6F8", { flip: true })
        + S.shot(rect(1600, 700, fx, fx, "#C8CCE0"), 69.4, 1.2, { dx: 60, dy: 40, ease: "linear", mode: "io" })
});

// ---- the cut.
{
    shots.push(F.flash(70.6, 1));
    // Impact frames: Rascal through the twin.
    const from = rAt(RS, TOP, MID), to = [rAt(RF, TOP, MID)[0], from[1]];
    const slashArt = Art.bolt((to[0] - from[0]) / 6, 0, { pieces: 1, scale: 0.55 });
    const slash = (fill) => F.boltDraw(slashArt, from[0], from[1] - 30, mono(fill, { N: `${fill}@.35` }));
    const figs = (ink, eyes) => sil(pose("run"), RF + 40, TOP, ink, { eyes }) + sil(pose("alert"), TF - 60, TOP, ink, { flip: true, eyes });
    const frames = [[70.64, PAPER, INK, INK, PAPER, 0.8, -6, ""], [70.69, INK, PAPER, "#FFD84A", INK, 0.95, 6, ""], [70.74, "#E84855", INK, INK, "#E84855", 1.1, -10, ""],
        [70.79, PAPER, INK, INK, PAPER, 1.25, 4, signature(INK, PAPER, "tl")], [70.84, INK, "#FFD84A", PAPER, INK, 0.9, 0, ""]];
    for (const [a, bg, ink, fg, eyes, z, roll, extra] of frames)
        shot(a, a + 0.05, { cam: [[a, 2010, 800, z, roll]], far: "", mid: "", ground: "", bg: F.flat(bg) + F.focus(W / 2, H / 2, 44, 110, ink), main: figs(fg, eyes) + slash(fg), screen: extra });
    // The hairline, through the mountains, on the far layer's picture
    // position for this framing; held -- then it all comes apart.
    const cam0 = [1700, 640, 0.42], fz = cam0[2] ** 0.3, lx = 1600 + 0.3 * (cam0[0] - 1600), ly = 700 + 0.3 * (cam0[1] - 700);
    const sp = ([x, y]) => [W / 2 + (x - lx) * fz, H / 2 + (y - ly) * fz];
    const [a0, a1] = [sp(MTN_CUT.slice(0, 2)), sp(MTN_CUT.slice(2))];
    const hair = F.slashLine(...a0, ...a1, 70.9, { hold: 0.6, color: "#FFE45C", width: 4, fade: 0.25 });
    const twinC = tAt(TF, TOP, MID);
    const pillarOfLight = S.fade(`<rect x="${twinC[0] - 70}" y="-2400" width="140" height="${2400 + GROUND}" fill="url(#pinkBeam)"/><rect x="${twinC[0] - 22}" y="-2400" width="44" height="${2400 + GROUND}" fill="#FFFFFF" opacity=".85"/>`, [[71.5, 0], [71.55, 1], [73.2, 0.8], [74.6, 0]]);
    defs.push(`<linearGradient id="pinkBeam" x1="0" x2="1"><stop offset="0" stop-color="#FF4FD8" stop-opacity="0"/><stop offset=".5" stop-color="#FF86C8" stop-opacity=".8"/><stop offset="1" stop-color="#FF4FD8" stop-opacity="0"/></linearGradient>`);
    const wall = Array.from({ length: 26 }, (_, i) => { const dir = i % 2 ? 1 : -1; return puff(twinC[0] + dir * R(0, 60), GROUND - R(10, 90), 71.5 + R(0, 0.3), { to: [12, 10, 8][i % 3], dx: dir * R(500, 1100), dy: -R(20, 160), life: R(1.6, 2.6), opacity: 0.85 }); }).join("");
    const fissure = S.fade(rect(700, GROUND + 2, 2000, 5, "#FFE45C") + rect(700, GROUND - 1, 2000, 11, "#FFC43A", ' opacity=".35"'), [[71.5, 0], [71.6, 1], [74, 0.6]]) + S.win(rect(700, GROUND + 3, 2000, 4, "#07090E"), [[74, D + 5]]);
    const rBody = S.win(rA(pose("run")), [[70.9, 71.5]]) + S.win(rA(pose("land")) + F.rgb(pose("land")), [[71.5, 71.62]]) + S.win(rA(pose("land")), [[71.62, 75]]);
    const tBody = tA(pose("alert"), TWIN2) + cracked(7) + S.fade(F.rays(90, 90, 0, 360, 16, 420, { grad: "pinkRay", width: [10, 30] }), [[71.5, 0], [71.6, 1], [74.5, 0.4]]);
    fseg(70.9, 75.0, {
        cam: [[70.9, ...cam0, 0, "linear"], [71.5, 1700, 640, 0.43, 0, "cubic-bezier(.3,0,.2,1)"], [75.0, 1700, 590, 0.26, 0]],
        main: place(rBody, RF, TOP) + place(tBody, TF, TOP) + pillarOfLight + fissure + wall
            + ring(twinC[0], twinC[1], 71.5, { r: 1600, width: 14, heat: true, life: 0.9 }) + ring(twinC[0], GROUND, 71.55, { r: 2200, flat: 0.08, width: 8, life: 1.1 })
            + flare(twinC[0], twinC[1], 900, 71.5, 1, 0.8, "pinkFlare") + debris(twinC[0], GROUND - 8, 71.5, 16, { stay: true, vx: [-700, 700], vy: [300, 1000] })
            + Array.from({ length: 10 }, () => rock(R(800, 2600), GROUND - 10, 71.5 + R(0, 0.3), { vx: R(-200, 200), vy: -R(500, 1100), big: 1, stay: true })).join("") + S.win(plumes([[CX, 5], [twinC[0], 4]]), [[72.5, D + 5]]),
        screen: hair + F.flash(71.5, 3) + F.bloom(W / 2, H / 2, 71.58, 0.9, "pinkFlare", 1000),
        quake: [[71.5, 1.4, 22], [72.9, 1.0, 8]]
    });
}

sequence({ far: farCut, common: field() }, fsegs);

// ---- from straight above, the dust clearing: the scar the cut left in the
// ground spells ICYCLE.
{
    const k = 56, rows = word("ICYCLE"), x0 = CX - (rows[0].length * k) / 2, y0 = 700 - 3.5 * k;
    let scar = "", glow = "";
    rows.forEach((line, j) => [...line].forEach((c, i) => { if (c === "c") { glow += rect(x0 + i * k - 6, y0 + j * k - 6, k + 12, k + 12, "#5CCFFF", ' opacity=".35"'); scar += rect(x0 + i * k, y0 + j * k, k, k, "#07090E"); } }));
    const dust = Array.from({ length: 30 }, (_, i) => puff(R(x0, x0 + rows[0].length * k), R(y0 - 80, y0 + 7 * k + 80), 74.9 + R(0, 0.3), { pal: SMOKE, to: [16, 14, 12][i % 3], dx: R(-200, 200), dy: R(-120, 120), life: R(1.8, 3.0), opacity: 0.9 })).join("");
    const embersUp = Array.from({ length: 24 }, () => { const x = R(x0, x0 + rows[0].length * k), y = R(y0, y0 + 7 * k); return S.fade(rect(x, y, 8, 8, "#FFC43A"), [[75, 0], [75.6 + R(0, 1), 1], [79, 0]]); }).join("");
    const specks = place(`<ellipse cx="18" cy="44" rx="22" ry="8" fill="#05060A" opacity=".5"/>` + pix(pose("land"), 3, 0, 0), x0 + rows[0].length * k + 60, 680)
        + place(`<ellipse cx="34" cy="44" rx="22" ry="8" fill="#05060A" opacity=".5"/>` + pix(pose("alert"), 3, 0, 0, { flip: true, pal: TWIN2 }), x0 + rows[0].length * k - 160, 690);
    shot(75.0, 79.0, {
        cam: [[75.0, CX, 700, 0.44, -8, "linear"], [79.0, CX, 700, 0.37, 4]], far: "", mid: "", ground: use("plan"),
        main: `<circle cx="${CX}" cy="700" r="320" fill="#07090E" opacity=".35"/>` + glow + scar + embersUp + specks + dust
    });
}

// ---------------------------------------------------------------- Act VIII
// The twin, cracking, coming apart pixel by pixel into the rift; the rift
// shuts. (Written in its own time, 17.25-24, played from 79.)
const AFTER_OFF = 61.75;
const LIFT = { cam: [[85.8, 1800, 320, 0.56, 0, "cubic-bezier(.5,0,.3,1)"], [87.4, ...PAGE_CAM, 0]] };
S.within(AFTER_OFF, () => {
    let dust = "";
    pose("alert").forEach((row, y) => [...row].forEach((ch, i) => {
        if (ch === " " || !TWIN2[ch]) return;
        const col = Art.W - 1 - i, x0 = TF + col * PX, y0 = TOP + y * PX, hold = (col / (Art.W - 1)) * 0.6 + R(0, 0.25);
        dust += S.shot(rect(x0, y0, PX, PX, TWIN2[ch].split("@")[0]), 18.4, hold + 1.0,
            { dx: (RIFT_C[0] - x0) * R(0.6, 0.95) + R(-40, 40), dy: (RIFT_C[1] - y0) * R(0.5, 0.95) + R(-60, 10), s1: 0.35, hold, r: R(-90, 90), ease: "cubic-bezier(.5,0,.8,.6)", origin: [x0 + PX / 2, y0 + PX / 2] });
    }));
    let cr = "";
    for (let i = 0; i < 4; i++) { let x = TF + R(40, 130), y = TOP + R(10, 50); for (let k = 0; k < 13; k++) { cr += rect(x, y, PX / 2, PX / 2, "#FFFFFF"); x += R(-1, 1) * PX * 0.6; y += PX * 0.6; } }
    const riftEnd = S.win(rift(), [[0, 19.6]]) + S.seq([use("riftShut0"), use("riftShut1"), use("riftShut2")], 19.6, 0.07)
        + flare(...RIFT_C, 300, 19.81, 0.9, 0.35, "pinkFlare") + F.burst(...RIFT_C, 19.81, { radius: 80, sparks: 16, color: "#DCC6FF", trail: "#A46BFF" });
    const ground = wreck() + ROCKS + bigCrater + rect(700, GROUND + 3, 2000, 4, "#07090E") + plumes([...FIELD_PLUMES, [CX, 4], [2040, 3]]);
    const main = riftEnd + ground
        + place(foot() + S.win(rA(pose("land")), [[17.25, 17.9]]) + S.win(`<g class="breathe">${rLoop("idle")}</g>`, [[17.9, 20.6]]), RF, TOP) + F.motes(26, 1000, 2600, 500, GROUND)
        + S.win(place(tA(pose("alert"), TWIN2) + cracked(7), TF, TOP) + S.win(cr, [[18.0, 18.4]]), [[17.25, 18.4]]) + dust
        + crackle(...rAt(RF, TOP, MID), 10, 14, 70, 17.3, 1.0) + floating(20, 900, 2500, 600, GROUND);
    shot(17.25, 20.6, { far: farCut, cam: [[17.25, 1950, 780, 0.75, 4, "cubic-bezier(.2,.6,.3,1)"], [20.6, 1720, 690, 0.42, 0]], main });
    shots.push(S.fade(F.flat("#FFFFFF"), [[17.249, 0], [17.25, 1, "ease-out"], [17.75, 0]]));
    // ---- the stars come out: the constellation lights up, ICYCLE. Then the
    // camera comes down to where it started.
    const lift = LIFT.cam.map(([t, ...rest]) => [t - AFTER_OFF, ...rest]);
    shot(20.6, 87.5 - AFTER_OFF, {
        far: farCut + constellation(21.4, 25.6),
        cam: [[20.6, 1720, 690, 0.42, 0, "cubic-bezier(.4,0,.2,1)"], [22.0, 1800, 330, 0.55, 0], ...lift],
        main: ground + place(foot() + `<g class="breathe">${rLoop("idle")}</g>`, RF, TOP) + floating(14, 1400, 2600, 500, GROUND) + F.motes(26, 1000, 2600, 400, GROUND)
    });
});

// ---- the world folds back into the page: into the crack where the rift
// was; the line stays, and Rascal runs back along it to where it started.
{
    const t0 = 87.5, cam = [[t0, ...PAGE_CAM, 0]];
    const fold = tearMask("tear1", ...RIFT_ON_PAGE, 87.6, 88.5, false);
    shot(t0, D, { far: farCut, cam, ground: use("ground"), main: wreck() + ROCKS + bigCrater, wrap: fold });
    const home = [[t0, RF, TOP], [88.5, RF, TOP, 0, 1, "ease-in-out"], [89.6, R0, TOP], [D, R0, TOP]];
    const [cx, cy] = RIFT_C;
    const crack = `<line x1="${cx}" y1="${cy - 200}" x2="${cx}" y2="${cy + 200}" stroke="#FFFFFF" stroke-width="6" filter="url(#glow)"/>`;
    shot(t0, D, {
        cam, far: "", mid: "", ground: use("rule"),
        main: S.win(S.move(crack, [[88.3, 0, 0, 0, 1, "ease-in"], [88.75, 0, 0, 0, 0.02]], { origin: [cx, cy] }), [[88.3, 88.75]]) + F.flare(cx, cy, 220, 88.3, 0.7, 0.5, "pinkFlare")
            + actor(S.win(rLoop("idle"), [[t0, 88.5]]) + S.win(rLoopB("run"), [[88.5, 89.6]]) + S.win(rLoop("idle"), [[89.6, D + 1]]), home)
            + F.kicks(home, 88.55, 89.55, -1, 0.08)
    });
}
