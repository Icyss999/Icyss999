// Act III: the first clash, mostly in one continuous take across the whole
// battlefield -- the dash, the exchange, through the pillar, lightning
// across the field, the nano suit, the air, the webs, the beam struggle, the
// explosion, the eyes in the smoke, the thunder slash, impact frames.
// Written in its own time (3.0-17.25), played from 13.8.

import { S, R, rnd, rect, pix, place, shapes, pathAt, r1, use, shot, shots, word, W, H, D, GROUND, TOP, PX, fx, bfx, K, Art, CYAN, PINK, STONE, SMOKE, PAPER, INK, mono } from "../core.mjs";
import * as F from "../fx.mjs";
import { pose, rA, tA, rLoop, tLoop, actor, ghosts, rAt, tAt, paw, grip, MID, CORE, VISOR, sil, glowEyes, nanoOn, visorOn, nanoOff, jets, webbed, ARMOR } from "../cast.mjs";
import { rift, pillar, LPX, RPX, TOPPLE } from "../sets.mjs";

export const CLASH_OFF = 10.8;
export const R0 = 500, T0 = 2520;
const { hit, ring, dustRing, debris, scorch, embers, crackle, puff, flare, streaks, trail, kicks, bolt, boltOnce, explosion, effect, aura, glint, rock, floatRock, GOLD_ARC, PINK_ARC, PINK_LINES } = F;

S.within(CLASH_OFF, () => {
    // ---- each of them, low and close: Rascal sinking into its stance,
    // static crawling over it...
    shot(3.0, 3.6, {
        cam: [[3.0, R0 + 110, 820, 1.15, -7], [3.6, R0 + 110, 812, 1.28, -8]],
        main: rift() + pillar(LPX) + place(S.fade(aura(pose("land"), "#FFC43A"), [[3.0, 0], [3.2, 0.7], [3.4, 0.4], [3.6, 0.8]]) + rA(pose("land")), R0, TOP)
            + crackle(R0 + 100, TOP + 110, 10, 20, 70, 3.0, 0.6, GOLD_ARC)
            + puff(R0 + 60, GROUND - 8, 3.05, { to: 6, dx: -50, dy: -10 }) + puff(R0 + 150, GROUND - 8, 3.05, { to: 6, dx: 50, dy: -10 }) + F.spiderweb(R0 + 95, GROUND + 3, 160, 3.05, { glow: "#FFC43A" })
    });
    // ...and the twin, eyes glinting.
    shot(3.6, 4.2, {
        cam: [[3.6, T0 + 70, 820, 1.15, 7], [4.2, T0 + 70, 812, 1.28, 8]],
        main: rift() + pillar(RPX) + place(S.fade(aura(pose("land"), "#FF4FD8", { flip: true }), [[3.6, 0], [3.8, 0.7], [4.0, 0.4], [4.2, 0.8]]) + tA(pose("land")), T0, TOP)
            + crackle(T0 + 80, TOP + 110, 10, 20, 70, 3.6, 0.6, PINK_ARC) + glint(...tAt(T0, TOP, [Art.X0 + 7.5, Art.TOP + 6.5]).map((v, i) => v + (i ? -4 : -8)), 3.8, "#FFD6F5")
            + F.spiderweb(T0 + 85, GROUND + 3, 160, 3.65, { glow: "#FF4FD8" })
    });

    // ---- the one take (4.2-16.9): no cuts.
    const main = [];
    const at = (x, y, p) => rAt(x, y, p);
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
    const rBody = [
        S.fade(aura(pose("land"), "#FFC43A"), [[7.3, 0], [7.42, 0.9], [7.55, 0.85], [8.2, 0, "ease-in"], [11.95, 0], [12.1, 1], [13.0, 1, "step-end"], [13.01, 0],
            [16.3, 0], [16.4, 1], [16.6, 1, "step-end"], [16.61, 0], [16.75, 0.85], [17.2, 0]]),
        S.fade(aura(pose("charge"), "#FFC43A"), [[13.0, 0, "step-end"], [13.01, 1], [15.4, 1, "step-end"], [15.41, 0]]),
        S.win(F.rgb(pose("fall")), [[6.6, 6.72]]),
        S.win(rA(pose("land")), [[4.2, 4.32], [5.0, 5.15], [6.4, 6.6], [7.0, 7.55], [11.95, 13.0], [15.4, 16.6], [16.75, 16.9]]),
        S.win(rLoop("run"), [[4.32, 5.0]]),
        S.win(rA(pose("cast")), [[5.15, 5.6], [7.55, 8.45]]),
        S.win(rA(pose("fall")), [[5.6, 5.75], [6.6, 7.0]]),
        S.win(rA(pose("jump")), [[5.75, 6.4]]),
        S.win(rA(pose("idle")), [[8.45, 8.5]]),
        S.seq(nanoOn(), 8.5, 0.05), S.seq(visorOn(), 9.0, 0.025),
        S.win(rLoop("idle", ARMOR), [[9.15, 9.2]]),
        S.win(rLoop("fly", ARMOR) + jets(), [[9.2, 10.6], [11.4, 11.7]]),
        S.win(rLoop("charge", ARMOR) + jets(), [[10.6, 11.0]]),
        S.win(rLoop("zap", ARMOR) + jets(), [[11.0, 11.4]]),
        S.win(rA(pose("land", 0, ARMOR)), [[11.7, 11.75]]),
        S.seq(nanoOff(), 11.75, 0.05),
        S.win(rLoop("charge"), [[13.0, 15.4]])
    ].join("");
    main.push(ghosts(rLoop("run", {}, mono("#5CCFFF")), rPts, [4.35, 5.0]) + ghosts(rA(pose("fall"), mono("#5CCFFF")), rPts, [6.6, 7.0], 4, 0.03)
        + ghosts(rLoop("fly", ARMOR, mono("#5CCFFF")), rPts, [9.2, 10.6], 3, 0.04));

    // ---- the twin
    const tBody = [
        S.fade(aura(pose("land"), "#FF4FD8", { flip: true }), [[6.4, 0], [6.5, 0.8], [6.9, 0, "ease-in"], [12.4, 0], [12.5, 1], [13.0, 1, "step-end"], [13.01, 0]]),
        S.fade(aura(pose("charge"), "#FF4FD8", { flip: true }), [[13.0, 0, "step-end"], [13.01, 1], [15.4, 1, "step-end"], [15.41, 0]]),
        S.win(F.rgb(pose("fall"), { flip: true }), [[7.6, 7.72]]),
        S.win(tA(pose("land")), [[4.2, 4.32], [5.0, 5.15], [6.4, 6.5], [8.05, 8.3], [12.4, 13.0], [15.4, 16.6]]),
        S.win(tLoop("run"), [[4.32, 5.0]]),
        S.win(tLoop("annoyed"), [[5.15, 5.3], [6.9, 7.6], [8.3, 9.5], [11.0, 12.4]]),
        S.win(tA(pose("fall")), [[5.3, 5.45], [7.6, 8.05], [10.75, 11.0]]),
        S.win(tA(pose("cast")), [[5.45, 5.75], [6.5, 6.9]]),
        S.win(tA(pose("jump")), [[5.75, 6.4], [9.5, 10.6]]),
        S.win(S.loop([tA(pose("alert")), tA(pose("alert"), mono("#FFF4FE", { "#": "#2A1640", e: "#2A1640" }))], 12), [[10.6, 10.75]]),
        S.win(tLoop("charge"), [[13.0, 15.4]]),
        S.win(tA(pose("alert")), [[16.6, 16.9]]),
        S.win(webbed(), [[11.15, 12.4]])
    ].join("");
    main.push(ghosts(tLoop("run", {}, mono("#FF4FD8")), tPts, [4.35, 5.0]) + ghosts(tA(pose("fall"), mono("#FF4FD8")), tPts, [7.6, 8.05], 4, 0.03)
        + ghosts(tA(pose("jump"), mono("#FF4FD8")), tPts, [9.5, 10.6], 3, 0.04));

    // ---- the dash and the clash (4.3-5.0)
    main.push(kicks(rPts, 4.36, 4.98, 1) + kicks(tPts, 4.36, 4.98, -1)
        + streaks(R0 + 100, TOP + 100, 1500, TOP + 100, 4.5, 10, { len: [100, 240] }) + streaks(T0, TOP + 100, 1700, TOP + 100, 4.5, 10, { len: [100, 240], colors: PINK_LINES }));
    const CL = [1600, 800];
    main.push(hit(...CL, 5.0, { size: 1.8 }) + ring(CL[0], GROUND, 5.0, { r: 520, flat: 0.1, width: 6, life: 0.55 }) + F.spiderweb(CL[0], GROUND + 3, 420, 5.0)
        + dustRing(CL[0], 5.02, 14, 300) + debris(CL[0], GROUND - 8, 5.02, 10, { stay: true }) + scorch(CL[0], 5.0, 1.2) + embers(CL[0], CL[1], 5.05, 8, 60, 0.3));

    // ---- the exchange (5.15-6.6)
    main.push(hit(...at(1440, TOP, paw("cast")), 5.3) + streaks(1300, 810, 1620, 810, 5.18, 6));
    main.push(hit(...tAt(1600, TOP, paw("cast")), 5.6, { pink: true }) + streaks(1900, 810, 1600, 810, 5.48, 6, { colors: PINK_LINES }));
    main.push(dustRing(1500, 5.75, 6, 90) + dustRing(1680, 5.75, 6, 90));
    main.push(hit(1590, 615, 5.95, { size: 1.2 }) + hit(1590, 600, 6.15, { size: 1.2, pink: true }) + streaks(1590, 300, 1590, 900, 6.15, 8));
    main.push(dustRing(1500, 6.4, 6, 80) + dustRing(1700, 6.4, 6, 80));
    // The twin's heavy blow, and Rascal through the pillar.
    main.push(hit(1555, 815, 6.6, { size: 1.6, pink: true }) + streaks(1600, 800, 700, 790, 6.6, 16, { len: [140, 320] }) + trail(rPts, 6.6, 7.0, ["#FFFFFF", "#8FE0FF"], { every: 0.025 }));
    main.push(S.win(pillar(LPX), [[0, 6.8]]) + S.win(pillar(LPX, 16, true), [[6.8, D]])
        + S.win(S.move(pix(TOPPLE.rows, fx, TOPPLE.x, TOPPLE.y, { pal: STONE }), [[6.8, 0, 0, 0, 1, "ease-in"], [7.1, -110, 10, -35, 1, "ease-in"], [7.32, -236, 144, -90]], { origin: TOPPLE.c, on: 12 }), [[6.8, D]])
        + dustRing(LPX - 200, 7.32, 12, 200) + debris(LPX - 200, GROUND - 10, 7.32, 7, { stay: true }) + ring(LPX - 200, GROUND, 7.32, { r: 260, flat: 0.12, width: 4 })
        + Array.from({ length: 14 }, (_, i) => rock(LPX + 30, GROUND - R(100, 260), 6.8 + R(0, 0.05), { big: i % 3, vx: -R(150, 520), vy: -R(100, 420), stay: i % 2 === 0, life: R(1.2, 1.8) })).join("")
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
    main.push(F.crater(2125, 8.05, 0.9, { glow: "#FF4FD8" }));
    main.push(pillar(RPX));

    // ---- suit up and take off (8.45-9.7)
    const core = at(640, TOP, CORE);
    main.push(S.win(effect("core", ...core), [[8.45, 8.75]])
        + Array.from({ length: 26 }, (_, i) => { const a = R(0, 6.28), r = R(80, 180) * K, ox = Math.cos(a) * r, oy = Math.sin(a) * r; return S.shot(effect("nano", core[0] + ox, core[1] + oy), 8.47 + i * 0.02, R(0.22, 0.34), { dx: -ox * 0.95, dy: -oy * 0.95, ease: "ease-in" }); }).join("")
        + S.win(effect("flash", ...at(640, TOP, VISOR)), [[9.15, 9.4]]) + Array.from({ length: 8 }, () => S.shot(effect("nano", ...core), 9.15, 0.4, { dx: R(-100, 100), dy: R(-100, 60) })).join("")
        + ring(core[0], core[1], 9.15, { r: 200, color: "#8FE0FF", width: 5 }));
    main.push(dustRing(745, 9.2, 10, 140) + ring(745, GROUND, 9.2, { r: 260, flat: 0.12, width: 4 }));
    for (let t = 9.25; t < 11.7; t += 0.08) { const [, x, y] = pathAt(rPts, t); main.push(puff(x + 105, y + 200, t, { pal: SMOKE, to: R(3, 5), dx: R(-20, 20), dy: R(20, 50), life: R(0.6, 0.9), opacity: 0.6 })); }
    main.push(trail(rPts, 9.7, 10.6, ["#FFFFFF", "#8FE0FF", "#5CCFFF"]) + trail(tPts, 9.5, 10.75, PINK_LINES));
    main.push(dustRing(2125, 9.5, 8, 120));

    // ---- in the air (9.7-11.4)
    main.push(hit(1480, 375, 9.95, { size: 1.5 }) + hit(1540, 345, 10.45, { size: 1.5, pink: true })
        + streaks(1100, 300, 1900, 420, 9.95, 10, { len: [120, 300] }) + streaks(1900, 260, 1200, 360, 10.45, 10, { len: [120, 300], colors: PINK_LINES }));
    const hand = at(1300, 300, grip("charge")), shocked = [1750, 310];
    main.push(S.win(S.loop([0, 1, 2].map(() => boltOnce(hand, shocked, CYAN, { scale: 0.65, forks: 1 })), 12), [[10.62, 10.8]])
        + flare(...shocked, 200, 10.62, 0.9, 0.3) + crackle(...shocked, 10, 14, 56, 10.62, 0.2));
    main.push(F.crater(1975, 11.0, 0.8, { glow: "#FF4FD8", cracks: false }));
    // Web strands from the air, pinning it down.
    const hand2 = at(1320, 330, grip("zap")), body = tAt(1900, TOP, MID);
    const targets = [[body[0], body[1], 1], [body[0] - 80 * K, GROUND - 2, 0], [body[0] + 84 * K, GROUND - 2, 0]].map(([x, y, m]) => [(x - hand2[0]) / fx, (y - hand2[1]) / fx, m]);
    const WEBP = { h: "#FFFFFF", n: "#91CEF5", g: "#C8CCE0", r: "#E84855" };
    main.push(S.seq([0.3, 0.55, 0.8].map((g) => shapes(Art.strands(targets, 0, g), fx, hand2[0], hand2[1], WEBP)), 11.0, 0.05)
        + S.win(S.loop([0, 1.2, 2.4].map((ph) => shapes(Art.strands(targets, ph, 1), fx, hand2[0], hand2[1], WEBP)), 10), [[11.15, 11.4]]));

    // ---- down, suit off, and the charge (11.7-13.0)
    main.push(dustRing(1305, 11.7, 10, 160) + ring(1305, GROUND, 11.7, { r: 260, flat: 0.12, width: 4 })
        + Array.from({ length: 12 }, () => { const c = at(1200, TOP, CORE), a = R(0, 6.28), r = R(30, 100) * K; return S.shot(effect("nano", c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r), 11.75 + R(0, 0.15), 0.2, { dx: -Math.cos(a) * r, dy: -Math.sin(a) * r, ease: "ease-in" }); }).join(""));
    const cx = 1305;
    const cols = [0, 1, 2, 3].map((i) => ({ dx: (i % 2 ? 1 : -1) * R(30, 110) * K, h: R(0.7, 1.25), lean: R(-30, 30) * K }));
    main.push([0.25, 0.6, 0.95].map((p, i) => S.win(S.loop([0, 1].map(() => cols.map((c) => {
        const h = (60 + 220 * p) * c.h * K;
        return boltOnce([cx + c.dx - c.lean, GROUND - h], [cx + c.dx, GROUND], CYAN, { scale: 0.45, forks: rnd() < 0.3 ? 1 : 0 });
    }).join("")), 12), [[11.95 + i * 0.35, 11.95 + (i + 1) * 0.35]])).join(""));
    main.push(embers(cx, GROUND, 11.95, 14, 60, 1.0) + crackle(cx, GROUND - 90, 10, 20, 90, 11.95, 1.0, GOLD_ARC) + F.spiderweb(cx, GROUND + 3, 500, 12.0, { n: 11, dur: 0.8 }));
    // Rocks lifting off all along the field, hanging there through the beams.
    for (let i = 0; i < 22; i++) main.push(floatRock(R(1000, 2050), 12.0 + R(0, 1.2), 15.4, R(50, 260), [R(-500, 500), R(-300, 80)]));
    // The twin tears free of the web.
    const tb = tAt(1900, TOP, MID);
    main.push(Array.from({ length: 18 }, () => { const a = R(0, 6.28); return S.shot(rect(tb[0], tb[1], fx * 2, fx, "#E8ECF4"), 12.4, 0.45, { dx: Math.cos(a) * R(100, 260), dy: Math.sin(a) * R(100, 260), r: R(-180, 180), origin: tb }); }).join("")
        + crackle(...tb, 10, 20, 80, 12.4, 0.6, PINK_ARC) + ring(...tb, 12.4, { r: 220, color: "#FF4FD8", width: 6 }) + dustRing(1975, 12.4, 8, 140));

    // ---- the beam struggle (13.0-15.4): the light off it throwing their
    // shadows back across the ground.
    const rp = at(1200, TOP, grip("charge")), tp = tAt(1900, TOP, grip("charge"));
    const clashAt = (xc) => {
        const c = [xc, rp[1]];
        return boltOnce(rp, c, CYAN, { scale: 0.8, forks: 0 }) + boltOnce(tp, c, PINK, { scale: 0.8, forks: 0 })
            + `<circle cx="${xc}" cy="${c[1]}" r="150" fill="url(#flare)"/>`
            + S.loop([Art.impact(12, 9), Art.impact(15, 8)].map((rows) => pix(rows, fx, xc - (rows.length * fx) / 2, c[1] - (rows.length * fx) / 2, { pal: { ...CYAN } })), 12);
    };
    const steps = [[13.0, 13.4, 1640], [13.4, 13.75, 1580], [13.75, 14.1, 1510], [14.1, 14.45, 1470], [14.45, 14.75, 1560], [14.75, 15.05, 1660], [15.05, 15.4, 1780]];
    main.push(steps.map(([a, b, xc]) => S.win(clashAt(xc) + crackle(xc, rp[1], 6, 20, 90, a, b - a) + embers(xc, rp[1], a, 5, 40, b - a, ["#FFFFFF", "#8FE0FF", "#FFD6F5"])
        + F.castShadow(pose("charge"), 1200, { lean: (1200 + 90 - xc) / 180 * 0.9 }) + F.castShadow(pose("charge"), 1900, { flip: true, lean: (1990 - xc) / 180 * 0.9 }), [[a, b]])).join(""));
    main.push(Array.from({ length: 32 }, () => { const t = R(13.0, 15.35), xc = steps.find((s) => t >= s[0] && t < s[1])[2], a = R(0, 6.28); return S.shot(rect(xc, rp[1], fx, fx, rnd() < 0.5 ? "#FFFFFF" : "#8FE0FF"), t, 0.3, { dx: Math.cos(a) * R(60, 180), dy: Math.sin(a) * R(60, 180) }); }).join(""));
    main.push(Array.from({ length: 8 }, (_, i) => puff(R(1400, 1850), GROUND - 10, 13.1 + i * 0.28, { to: 6, dx: R(-40, 40), dy: -R(40, 90), life: 0.9 })).join("") + F.heat(1150, 1950, GROUND - 20, 12));

    // ---- it all goes up (15.4), and out of the smoke...
    main.push(explosion(1780, rp[1], 15.4, 2.6, { smoke: 7 }));
    main.push(Array.from({ length: 14 }, (_, i) => puff(R(1150, 2050), GROUND - R(30, 200), 15.5 + R(0, 0.3), { pal: SMOKE, to: [12, 10, 9][i % 3], dx: R(-60, 60), dy: -R(20, 60), life: R(1.1, 1.4), opacity: 0.8, mode: "io" })).join(""));
    main.push(S.fade(`<ellipse cx="1245" cy="${TOP + 100}" rx="170" ry="130" fill="url(#dark)"/>`, [[15.6, 0], [15.8, 0.9], [16.3, 0.9], [16.5, 0]]) + S.fade(glowEyes(1140, TOP), [[15.85, 0], [15.95, 1], [16.55, 1], [16.6, 0]]));
    main.push(crackle(1245, TOP + 100, 8, 20, 80, 16.3, 0.3, GOLD_ARC) + flare(1245, TOP + 100, 200, 16.3, 0.7, 0.3, "goldGlow"));

    // ---- ...the thunder slash, straight through it (16.6)
    const from = at(1140, TOP, MID), to = [at(2150, TOP, MID)[0], from[1]];
    main.push(bolt(from, to, 16.6, { grow: 0.08, hold: 0.3, fadeOut: 0.2, opts: { floor: (GROUND - from[1]) / bfx - 7 } })
        + streaks(from[0], from[1], to[0], to[1], 16.6, 16, { len: [140, 320] }) + dustRing(from[0], 16.6, 8, 140) + kicks([[16.6, 1140, TOP, 0, 1, "linear"], [16.75, 2150, TOP]], 16.6, 16.75, 1, 0.025)
        + hit(2000, 830, 16.75, { size: 2 }));

    shot(4.2, 16.9, {
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
        main: rift() + main.slice(0, 2).join("") + actor(rBody, rPts) + actor(tBody, tPts) + main.slice(2).join(""),
        screen: F.flash(5.0, 2, "#FFFFFF", 0.85) + F.flash(6.6, 1, "#FFFFFF", 0.7) + F.flash(7.6, 2, "#FFFFFF", 0.8) + F.flash(15.4, 3) + F.flash(16.75, 2, "#FFFFFF", 0.8)
            + F.focusFlicker(W / 2, H / 2, 5.0, 0.2, { op: 0.5 }) + F.focusFlicker(W / 2, H / 2, 16.6, 0.2, { op: 0.5 }),
        quake: [[5.0, 0.35, 14], [5.3, 0.15, 6], [5.6, 0.15, 6], [5.95, 0.15, 7], [6.15, 0.15, 7], [6.6, 0.25, 12], [6.8, 0.2, 10], [7.6, 0.4, 14],
            [7.32, 0.15, 6], [8.05, 0.2, 8], [9.95, 0.15, 7], [10.45, 0.15, 7], [11.0, 0.2, 8], [11.7, 0.2, 8], [12.0, 1.0, 3], [13.0, 2.4, 4], [15.4, 0.7, 20], [16.75, 0.15, 12]]
    });

    // ---- impact frames (16.9-17.25)
    const cam = [[16.9, 2080, 820, 1.5, -6]];
    const f0 = rAt(1140, TOP, MID), mid = tAt(1950, TOP, MID), t1 = rAt(2150, TOP, MID);
    const slashArt = Art.bolt((t1[0] - f0[0]) / bfx, 0, { pieces: 1, scale: 1.2 });
    const slash = (fill) => F.boltDraw(slashArt, f0[0], mid[1], mono(fill, { N: `${fill}@.35` }));
    const figs = (ink, eyes) => sil(pose("run"), 2150, TOP, ink, { eyes }) + sil(pose("alert"), 1950, TOP, ink, { flip: true, eyes });
    const frame = (a, b, { c = cam, ground, ink, figures, inner = 130, n = 40, extra = "" }) =>
        shot(a, b, { cam: c, far: "", mid: "", ground: "", bg: F.flat(ground) + F.focus(W / 2, H / 2, n, inner, ink), main: figures, screen: extra });
    frame(16.9, 16.97, { ground: INK, ink: PAPER, figures: figs(PAPER, INK) + slash(PAPER) });
    frame(16.97, 17.04, { ground: PAPER, ink: INK, figures: figs(INK, PAPER) + slash(INK), inner: 110, extra: signature() });
    frame(17.04, 17.11, { c: [[17.04, 2080, 820, 1.8, 4]], ground: "#E84855", ink: INK, figures: figs(INK, "#E84855") + slash(INK), inner: 160 });
    frame(17.11, 17.18, { c: [[17.11, 2080, 820, 2.0, -10]], ground: INK, ink: PAPER, figures: figs("#FFD84A", PAPER) + slash("#FFD84A"), inner: 100, n: 46 });
    frame(17.18, 17.25, { c: [[17.18, 2080, 820, 1.7, 0]], ground: PAPER, ink: INK, figures: figs(INK, PAPER), inner: 150 });
});

// Easter egg: the artist's signature, in the corner of a white impact frame.
export function signature(ink = INK, paper = PAPER, corner = "br") {
    const sign = word("ICYCLE"), w = sign[0].length * 4, sx = corner === "br" ? W - 64 - w : 64, sy = corner === "br" ? H - 64 - 7 * 4 : 64;
    return rect(sx - 8, sy - 8, w + 16, 7 * 4 + 16, paper) + pix(sign, 4, sx, sy, { pal: { c: ink } });
}
