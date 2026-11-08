// Eyecatch (50-52.8): the half-time card. ICYCLE, big.
// Act VI (52.8-63): the sky. The nano suit, the visor coming down; through
// the visor, flying through the debris at the twin; the fight above the
// clouds, and from high above the field; Rascal gets over it and brings it
// down; it falls; from straight above, the crater it makes; the dust dome.

import { S, R, rnd, rect, pix, place, poly, r1, use, shot, shots, defs, W, H, D, GROUND, TOP, PX, fx, K, Art, PAL, TWIN, TWIN2, CYAN, PINK, GOLD, SMOKE, INK, PAPER, mono, word, wordW } from "../core.mjs";
import * as F from "../fx.mjs";
import { pose, rA, tA, rB, tB, rLoop, tLoop, actor, ghosts, rAt, tAt, paw, grip, FACE, MID, CORE, VISOR, sil, glowEyes, cracked, nanoOn, visorOn, jets, ARMOR, C0 } from "../cast.mjs";
import { CITY, moonArt } from "../sets.mjs";
import { wind, floating } from "./open.mjs";
import { signature } from "./clash.mjs";

const { hit, ring, dustRing, debris, embers, crackle, puff, flare, streaks, trail, bolt, boltOnce, effect, aura, glint, rock, GOLD_ARC, PINK_ARC, PINK_LINES } = F;

// ---------------------------------------------------------------- eyecatch
{
    const t0 = 50.0, t1 = 52.8;
    const band = (pts, fill, op, from) => S.move(poly(pts, fill, ` opacity="${op}"`), [[t0, from, 0, 0, 1, "cubic-bezier(.2,.9,.3,1)"], [t0 + 0.25, 0, 0], [t1 - 0.2, 0, 0, 0, 1, "ease-in"], [t1, -from, 0]], { on: 24 });
    const burst = `<g transform="translate(300 430)"><g class="orb" style="animation-duration:12s">${F.focus(0, 0, 28, 60, "#FFE45C").replace(/fill="#FFE45C"/g, 'fill="#FFE45C" opacity=".35"')}</g></g>`;
    const title = word("ICYCLE"), k = 14, tx = W / 2 - (title[0].length * k) / 2 + 60, ty = 110;
    const letters = [..."ICYCLE"].map((ch, i) => {
        const rows = word(ch), x = tx + i * 6 * k;
        const art = pix(rows, k, x - k * 0.8, ty, { pal: { c: "#FF2A5A" } }) + pix(rows, k, x + k * 0.8, ty + k * 0.4, { pal: { c: "#29E6FF" } }) + pix(rows, k, x, ty, { pal: { c: ".ink" } });
        return S.win(S.move(art, [[t0 + 0.3 + i * 0.07, 0, -60, 0, 1.3, "cubic-bezier(.2,1.6,.4,1)"], [t0 + 0.45 + i * 0.07, 0, 0, 0, 1]], { origin: [x + 2.5 * k, ty + 3.5 * k], on: 24 }), [[t0 + 0.3 + i * 0.07, t1 - 0.2]]);
    }).join("");
    const sparkles = Array.from({ length: 10 }, (_, i) => S.win(`<g class="twk" style="animation-duration:.8s;animation-delay:-${r1(R(0, 0.8))}s">${effect("sparkle", R(120, 860), R(80, 640), { h: "#FFFFFF", y: "#FFE45C" }, 6)}</g>`, [[t0 + 0.3, t1 - 0.2]])).join("");
    const pet = S.win(S.move(pix(pose("jump"), 18, 160, 300), [[t0 + 0.15, -500, 0, -10, 1, "cubic-bezier(.2,.9,.3,1)"], [t0 + 0.4, 0, 0, -6], [t1 - 0.2, 0, -10, -4, 1, "ease-in"], [t1, -700, 0, -4]], { origin: [320, 460], on: 24 }), [[t0 + 0.15, t1]]);
    const twin = S.win(S.move(pix(pose("annoyed"), 12, 650, 330, { flip: true, pal: mono("#12081F", { e: "#FF4FD8" }) }), [[t0 + 0.2, 500, 0, 0, 1, "cubic-bezier(.2,.9,.3,1)"], [t0 + 0.45, 0, 0], [t1 - 0.2, 0, 0, 0, 1, "ease-in"], [t1, 700, 0]], { on: 24 }), [[t0 + 0.2, t1]]);
    const html = band([[-100, 720], [380, 720], [1060, 120], [580, 120]], "#5CCFFF", 0.16, -1200) + band([[260, 720], [460, 720], [1140, 120], [940, 120]], "#FF4FD8", 0.16, 1200)
        + S.win(burst, [[t0 + 0.2, t1 - 0.2]]) + twin + pet + letters + sparkles + rect(120, 640, 720, 3, ".g1");
    shots.push(S.win(html, [[t0, t1]]));
}

// ---------------------------------------------------------------- Act VI
const cityWorld = { far: use("cityFar"), mid: use("cityMid"), ground: use("street") };
const ROOF1 = CITY.R1[2] - Art.H * PX;
{
    // ---- the suit, close: it flows over it, the visor slams down.
    const suit = S.seq(nanoOn(), 52.8, 0.04) + S.seq(visorOn(), 53.2, 0.025, 53.6);
    shot(52.8, 53.6, {
        ...cityWorld,
        cam: [[52.8, 1690, 460, 2.1, -4, "ease-in"], [53.2, 1690, 455, 2.4, -5, "cubic-bezier(.8,0,.2,1)"], [53.4, 1690, 440, 3.6, -7], [53.6, 1690, 440, 3.8, -7]],
        main: use("R1") + place(suit, 1600, ROOF1) + Array.from({ length: 18 }, (_, i) => { const c = rAt(1600, ROOF1, CORE), a = R(0, 6.28), r = R(60, 150); return S.shot(effect("nano", c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r), 52.8 + i * 0.022, 0.25, { dx: -Math.cos(a) * r, dy: -Math.sin(a) * r, ease: "ease-in" }); }).join("")
            + S.win(effect("flash", ...rAt(1600, ROOF1, VISOR)), [[53.4, 53.6]]) + glint(...rAt(1600, ROOF1, VISOR), 53.4, "#6EE7FF", 10),
        screen: F.focusFlicker(W / 2, H / 2, 53.4, 0.2, { fill: "#D8FDFF", op: 0.4, inner: 240 })
    });
    // ---- off the roof, straight up.
    const up = [[53.6, 1600, ROOF1], [53.75, 1600, ROOF1 + 10, 0, 1, "cubic-bezier(.5,0,.9,.5)"], [54.3, 1640, -400]];
    shot(53.6, 54.3, {
        ...cityWorld,
        cam: [[53.6, 1700, 470, 1.1, 0, "ease-in"], [54.3, 1700, 300, 0.9, -6]],
        main: use("R1") + use("R2") + actor(S.win(rA(pose("land", 0, ARMOR)), [[53.6, 53.75]]) + S.win(rLoop("fly", ARMOR) + jets(), [[53.75, 54.3]]), up)
            + F.crater(1690, 53.75, 0.8, { y: CITY.R1[2], cracks: true }) + ghosts(rLoop("fly", ARMOR, mono("#5CCFFF")), up, [53.8, 54.3], 3, 0.03) + trail(up, 53.8, 54.3, ["#FFFFFF", "#8FE0FF", "#5CCFFF"]),
        screen: F.whip(53.8, 0.4, { deg: 90 }),
        quake: [[53.75, 0.3, 12]]
    });

    // ---- through the visor (54.3-57.6): rocks and glass rushing past out of
    // the middle; the twin ahead, firing; the view rolling to dodge; the HUD
    // booting up (ICYCLE OS).
    {
        const VP = [480, 330], t0 = 54.3, t1 = 57.6;
        let rush = "";
        for (let i = 0; i < 46; i++) {
            const a = R(0, Math.PI * 2), d = R(700, 1000), t = t0 + R(-0.2, t1 - t0 - 0.3), x = VP[0] + Math.cos(a) * R(4, 30), y = VP[1] + Math.sin(a) * R(4, 30);
            const piece = rnd() < 0.3 ? poly([[0, -10], [8, 6], [-7, 5]], "#BFE9FF", ' fill-opacity=".6" stroke="#fff" stroke-width="1.5"') : F.rockBody(rnd() < 0.3, rnd() < 0.4 ? 1 : 0).html;
            rush += S.shot(place(piece, x, y), t, R(0.5, 0.8), { dx: Math.cos(a) * d, dy: Math.sin(a) * d, s0: 0.15, s1: R(4, 7), r: R(-180, 180), origin: [x, y], ease: "cubic-bezier(.6,0,.9,.6)" });
        }
        const stars = Array.from({ length: 34 }, () => { const a = R(0, 6.28), x = VP[0] + Math.cos(a) * R(20, 200), y = VP[1] + Math.sin(a) * R(20, 160), t = t0 + R(-0.5, t1 - t0); return S.shot(rect(x, y, 3, 14, "#C8CCE0", ` transform="rotate(${r1((a * 180) / Math.PI + 90)} ${r1(x)} ${r1(y)})"`), t, 0.45, { dx: Math.cos(a) * 700, dy: Math.sin(a) * 700, ease: "ease-in" }); }).join("");
        // Clouds below, the horizon rolling with the view.
        const clouds = [0, 1, 2, 3, 4].map((k) => S.shot(rect(-400, 470, 1760, 40 + k * 6, ["cl1", "cl2", "cl3", "cl2", "cl1"].map((c) => `.${c}`)[k]), t0 + k * 0.6, 1.4, { dy: 340, s0: 1, s1: 2.2, origin: [480, 470], ease: "ease-in" })).join("")
            + Array.from({ length: 8 }, (_, k) => S.shot(rect(-400, 470, 1760, 30, ".cl2"), t0 + 3 + k * 0.4, 1.4, { dy: 340, s1: 2.2, origin: [480, 470], ease: "ease-in" })).join("");
        const horizon = rect(-400, 468, 1760, 300, ".cl1", ' opacity=".9"') + rect(-400, 466, 1760, 3, ".g1");
        // The twin ahead, growing; its blasts coming at us.
        const tw = [[t0, 0, 0, 0, 0.14], [55.3, -50, -20, 0, 0.2, "ease-in-out"], [56.2, 60, 10, 0, 0.28, "ease-in-out"], [57.0, 0, 0, 0, 0.55, "ease-in"], [57.35, 0, 20, 0, 2.6]];
        const twinArt = place(pix(pose("cast"), PX, -90, -90, { flip: true, pal: TWIN2 }), VP[0], VP[1]);
        const twin = S.move(twinArt, tw, { origin: VP, on: 12 });
        const blast = (t, dir) => S.shot(`<circle cx="${VP[0]}" cy="${VP[1]}" r="40" fill="url(#pinkFlare)"/>` + pix(Art.impact(5, 7), 4, VP[0] - 22, VP[1] - 22, { pal: PINK }), t, 0.45, { dx: dir * 520, dy: 160, s0: 0.3, s1: 7, origin: VP, ease: "cubic-bezier(.5,0,.9,.6)" });
        const world = `<g>${horizon}${clouds}${stars}${twin}${blast(55.35, -1)}${blast(56.25, 1)}${rush}</g>`;
        const rolled = S.move(world, [[t0, 0, 0, 0, 1], [55.3, 0, 0, 0, 1, "cubic-bezier(.3,0,.2,1)"], [55.6, 0, 0, -28, 1.05, "ease-in-out"], [56.2, 0, 0, 0, 1, "cubic-bezier(.3,0,.2,1)"], [56.5, 0, 0, 24, 1.05, "ease-in-out"], [57.1, 0, 0, 0, 1]], { origin: [480, 360] });
        // The visor: its rim, its HUD -- a reticle on the twin, a horizon
        // ladder, and in the corner the OS coming up: ICYCLE OS.
        const cyan = "#6EE7FF";
        const hud = `<rect x="-20" y="-20" width="${W + 40}" height="${H + 40}" rx="150" fill="none" stroke="#05060A" stroke-opacity=".55" stroke-width="110"/>`
            + `<path d="M160 200 Q110 360 160 520 M800 200 Q850 360 800 520" fill="none" stroke="${cyan}" stroke-width="3" stroke-opacity=".7" shape-rendering="geometricPrecision"/>`
            + Array.from({ length: 7 }, (_, i) => rect(150 + (i % 2) * 6, 230 + i * 44, 16, 2, cyan, ' opacity=".7"') + rect(794 - (i % 2) * 6, 230 + i * 44, 16, 2, cyan, ' opacity=".7"')).join("")
            + S.move(`<g fill="none" stroke="${cyan}" stroke-width="3" shape-rendering="geometricPrecision"><path d="M${VP[0] - 50} ${VP[1] - 30}v-20h20M${VP[0] + 50} ${VP[1] - 30}v-20h-20M${VP[0] - 50} ${VP[1] + 30}v20h20M${VP[0] + 50} ${VP[1] + 30}v20h-20"/></g>`,
                tw.map(([t, x, y, , s, e]) => [t, x, y, 0, Math.min(2.2, 0.6 + s * 1.6), e]), { origin: VP, on: 12 })
            + S.win(pix(word("ICYCLE OS", "c"), 3, 150, 120, { pal: { c: cyan } }), [[t0 + 0.1, t0 + 0.2], [t0 + 0.3, t1]]) + S.win(S.loop([rect(150 + wordW(9) * 3 + 8, 120, 9, 21, cyan), ""], 3), [[t0 + 0.3, t1]])
            + S.win(rect(150, 150, 120, 3, cyan, ' opacity=".6"'), [[t0 + 0.5, t1]]) + S.win(rect(150, 158, 80, 3, cyan, ' opacity=".6"'), [[t0 + 0.7, t1]]);
        const punch = F.flash(57.35, 2) + S.win(F.flat(INK) + F.focus(W / 2, H / 2, 44, 120, PAPER) + sil(pose("fall"), W / 2 - 270, H / 2 - 260, PAPER, { flip: true, eyes: INK, k: 30 }), [[57.43, 57.52]])
            + S.win(F.flat(PAPER) + F.focus(W / 2, H / 2, 44, 100, INK) + sil(pose("fall"), W / 2 - 300, H / 2 - 280, INK, { flip: true, eyes: PAPER, k: 33 }) + signature(INK, PAPER, "tl"), [[57.52, 57.6]]);
        shots.push(S.win(S.quake(rolled, [[55.35, 0.2, 6], [56.25, 0.2, 6], [57.35, 0.25, 16]]) + hud + punch, [[t0, t1]]));
    }

    // ---- above the clouds (57.6-63).
    const skyWorld = { far: use("sky"), mid: use("clouds"), ground: "" };
    const rP = [[57.6, 1150, 420], [57.8, 1430, 330, 0, 1, "ease-out"], [58.05, 1360, 380, 0, 1, "ease-in-out"], [58.25, 1450, 300, 0, 1, "ease-out"], [58.4, 1400, 320],
        [59.2, 1400, 320, 0, 1, "cubic-bezier(.3,0,.2,1)"], [59.8, 1560, 60, 0, 1, "ease-in-out"], [60.1, 1580, 120, 0, 1, "ease-in"], [60.15, 1590, 150], [61, 1590, 150]];
    const tP = [[57.6, 2000, 300], [57.8, 1570, 320, 0, 1, "ease-out"], [58.05, 1500, 360, 0, 1, "ease-in-out"], [58.25, 1680, 260, 0, 1, "ease-out"], [58.4, 1620, 300],
        [59.2, 1620, 330, 0, 1, "ease-in-out"], [60.1, 1600, 300, 0, 1, "ease-in"], [60.15, 1610, 310], [60.5, 1650, 900, 540]];
    const rBody = S.win(rLoop("fly", ARMOR) + jets(), [[57.6, 57.8], [58.4, 60.0]]) + S.win(rA(pose("cast", 0, ARMOR)) + jets(), [[57.8, 58.05], [58.25, 58.4], [60.0, 61]]) + S.win(rLoop("charge", ARMOR) + jets(), [[58.05, 58.25]]);
    const tBody = S.win(tA(pose("jump"), TWIN2), [[57.6, 57.8], [58.4, 60.1]]) + S.win(tA(pose("fall"), TWIN2), [[57.8, 58.05], [58.25, 58.4], [60.1, 61]]) + S.win(tA(pose("cast"), TWIN2), [[58.05, 58.25]]) + S.win(cracked(5), [[57.6, 61]]);
    const both = actor(rBody, rP) + actor(tBody, tP);
    shot(57.6, 58.4, {
        ...skyWorld,
        cam: [[57.6, 1550, 380, 0.8, 4, "ease-out"], [57.8, 1500, 340, 1.0, -6, "ease-in-out"], [58.05, 1460, 360, 1.05, 7, "ease-in-out"], [58.25, 1560, 300, 1.0, -8, "ease-out"], [58.4, 1520, 320, 0.95, -4]],
        main: both + hit(1520, 420, 57.8, { size: 1.5 }) + hit(1500, 450, 58.05, { size: 1.4, pink: true }) + hit(1620, 380, 58.25, { size: 1.8 })
            + streaks(1150, 500, 1600, 410, 57.6, 10, { len: [120, 300] }) + streaks(2000, 380, 1600, 400, 57.6, 10, { len: [120, 300], colors: PINK_LINES }),
        screen: F.flash(57.8, 1, "#FFFFFF", 0.6) + F.flash(58.25, 2, "#FFFFFF", 0.7),
        quake: [[57.8, 0.15, 8], [58.05, 0.15, 8], [58.25, 0.2, 12]]
    });
    // From high above: the battlefield far below, their shadows on it.
    shot(58.4, 59.2, {
        far: `<g transform="translate(1600 700) scale(.55) translate(-1600 -700)">${use("plan")}<circle cx="1600" cy="690" r="40" fill="#A46BFF" opacity=".5"/></g>`, mid: "", ground: "",
        cam: [[58.4, 1500, 380, 0.9, 0, "linear"], [59.2, 1520, 380, 0.95, 14]],
        main: both + bolt(rAt(1400, 320, grip("charge")), tAt(1620, 300, MID), 58.65, { hold: 0.3, opts: { scale: 0.7 } }) + hit(1700, 400, 58.7, { size: 1.3 }),
        quake: [[58.7, 0.2, 8]]
    });
    // Over it, and down on it.
    shot(59.2, 60.5, {
        ...skyWorld,
        cam: [[59.2, 1500, 330, 0.85, -5, "cubic-bezier(.3,0,.2,1)"], [59.8, 1580, 180, 0.95, 6, "ease-in-out"], [60.1, 1590, 220, 1.2, -4, "linear"], [60.15, 1600, 260, 1.35, -6, "ease-out"], [60.5, 1620, 500, 0.8, 4]],
        main: both + ghosts(rLoop("fly", ARMOR, mono("#5CCFFF")), rP, [59.2, 59.8], 3, 0.04) + S.fade(aura(pose("cast"), "#FFC43A"), [[59.8, 0], [60.1, 1], [60.4, 0]]) + crackle(1680, 200, 12, 20, 90, 59.8, 0.3, GOLD_ARC)
            + hit(1690, 330, 60.15, { size: 2.3, gold: true }) + trail(tP, 60.15, 60.5, PINK_LINES),
        screen: F.flash(60.15, 2) + F.whip(60.2, 0.3, { deg: 90 }),
        quake: [[60.15, 0.35, 18]]
    });
    // Impact frames.
    for (const [a, b, bg, ink, fg] of [[60.15, 60.2, PAPER, INK, INK], [60.2, 60.25, INK, PAPER, "#FFD84A"]])
        shot(a, b, { cam: [[a, 1650, 260, 1.5, 8]], far: "", mid: "", ground: "", bg: F.flat(bg) + F.focus(W / 2, H / 2, 40, 120, ink), main: sil(pose("cast", 0, ARMOR), 1580, 120, fg, { eyes: bg }) + sil(pose("fall"), 1610, 310, fg, { flip: true, eyes: bg }) });
    // Falling, at us.
    {
        const t0 = 60.5, t1 = 61.4;
        const sky = Array.from({ length: 60 }, () => rect(R(0, W), R(0, H), 3, 3, ".st", ` opacity="${R(0.2, 0.7).toFixed(2)}"`)).join("") + place(moonArt(6), 760, 160);
        const faller = S.move(place(pix(pose("fall"), PX, -90, -90, { flip: true, pal: TWIN2 }) + place(cracked(5), -90, -90), 480, 300), [[t0, 0, 0, 0, 0.25], [t1, 0, 120, 720, 3.2, "linear"]], { origin: [480, 300], on: 12 });
        const lines = Array.from({ length: 30 }, () => { const a = R(0, 6.28), x = 480 + Math.cos(a) * R(60, 120), y = 300 + Math.sin(a) * R(60, 120); return S.shot(rect(x, y, 3, 30, "#FFD6F5", ` transform="rotate(${r1((a * 180) / Math.PI + 90)} ${r1(x)} ${r1(y)})"`), t0 + R(0, 0.8), 0.25, { dx: Math.cos(a) * 600, dy: Math.sin(a) * 600, ease: "ease-in" }); }).join("");
        shots.push(S.win(S.move(sky, [[t0, 0, 0, 0, 1], [t1, 0, 0, 25, 1.2]], { origin: [480, 360] }) + lines + faller, [[t0, t1]]));
    }
    // From straight above: it hits, the ground breaks, the dust goes out in
    // a ring.
    {
        const C = [1700, 700], t = 61.5;
        const dustOut = Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * 6.28; return puff(C[0], C[1], t + R(0, 0.05), { to: [10, 8, 9][i % 3], dx: Math.cos(a) * 420, dy: Math.sin(a) * 420, life: R(0.9, 1.3), opacity: 0.85 }); }).join("");
        const main = `<circle cx="${C[0]}" cy="${C[1]}" r="10" fill="#07090E"/>` + S.shot(`<circle cx="${C[0]}" cy="${C[1]}" r="150" fill="#07090E" opacity=".9"/>`, t, 0.3, { s0: 0.1, s1: 1, origin: C, mode: "k" })
            + F.spiderweb(...C, 700, t, { flat: 1, n: 14, dur: 0.25, glow: "#FF4FD8", width: 6, rings: 3 }) + F.ring(...C, t, { r: 900, width: 10, heat: true, life: 0.6 }) + dustOut
            + S.win(place(pix(pose("fall"), 4, -36, -36, { flip: true, pal: TWIN2 }), ...C), [[t, 62.2]]) + flare(...C, 500, t, 1, 0.4, "pinkFlare");
        shot(61.4, 62.2, { cam: [[61.4, 1700, 700, 0.75, 0, "ease-out"], [62.2, 1700, 700, 0.62, -12]], far: "", mid: "", ground: use("plan"), main, screen: F.flash(61.5, 2), quake: [[61.5, 0.5, 20]] });
    }
}
