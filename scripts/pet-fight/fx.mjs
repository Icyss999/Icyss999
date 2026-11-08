// Effects: sparks, dust, rocks, lightning, explosions, impact frames, cracks,
// glass, light -- most of them drawn the way the pet's own Effects.qml does.

import {
    Art, S, R, rnd, rect, pix, place, poly, disc, shapes, paint, pathAt, r1, r3, mono, defs,
    W, H, D, GROUND, PX, fx, bfx, K, CYAN, PINK, GOLD, FIRE, DUST, SMOKE, PAL, word, wordW
} from "./core.mjs";

export const C0 = [(Art.W * PX) / 2, (Art.H * PX) / 2];

// A crackle of static: a little zigzag, gone in a flicker.
const STEPS8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
export function arc(x, y, t, { life = R(0.15, 0.27), colors = { h: "#E8FBFF", b: "#5CCFFF" } } = {}) {
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
export const PINK_ARC = { h: "#FFE6F8", b: "#FF4FD8" }, GOLD_ARC = { h: "#FFF7C2", b: "#FFC43A" };
export const crackle = (x, y, n, r0, r1_, t, dt, colors) => Array.from({ length: n }, () => {
    const a = R(0, 2 * Math.PI), r = R(r0, r1_) * K;
    return arc(x + Math.cos(a) * r, y + Math.sin(a) * r, t + R(0, dt), colors ? { colors } : {});
}).join("");
// A streak of light rising off something.
export const ember = (x, y, t, { vy = -R(160, 320), len = 2 + Math.floor(rnd() * 3), life = R(0.26, 0.42), color = "#FFD84A", dx = 0 } = {}) =>
    S.shot(rect(x, y, fx, len * fx, color), t, life, { dy: vy * K * life, dx });
export const embers = (x, y, t, n, spread, dt, colors = ["#FFD84A", "#FFE98A", "#FFFFFF"]) => Array.from({ length: n }, (_, i) =>
    ember(x + R(-spread, spread), y - R(0, spread * 0.6), t + R(0, dt), { color: colors[i % colors.length] })).join("");
// A cloud billowing out as it drifts, thinning away: dust, or smoke.
export function puff(x, y, t, { from = 2, to = 5, dx = 0, dy = -20, life = 0.7, opacity = 0.8, mode = "o", pal = DUST } = {}) {
    const r = Math.round(to), rows = disc(r, (d) => d > 0.75 ? "c" : d > 0.4 ? "b" : "a");
    return S.shot(`<g opacity="${opacity}">${pix(rows, fx, x - r * fx, y - r * fx, { pal })}</g>`, t, life,
        { dx: dx * K, dy: dy * K, s0: from / to, s1: 1, origin: [x, y], ease: "cubic-bezier(.2,.7,.4,1)", mode });
}
export const dustRing = (x, t, n = 10, spread = 120, y = GROUND - 10) => Array.from({ length: n }, (_, i) => {
    const dir = i % 2 ? 1 : -1;
    return puff(x + dir * R(0, 20), y, t + i * 0.012, { to: [8, 6, 5][i % 3], dx: dir * R(spread * 0.4, spread), dy: -R(8, 40), life: R(0.6, 1.1) });
}).join("");
// Rock: cells of a chunk of ground, lit by the lightning.
export function rockBody(bit, big = 0) {
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
// A chunk flung off at (vx, vy) px/s: a true parabola (up easing out to the
// top, down easing in -- both exact quadratics), spinning, a bounce where it
// lands (on `floor`), then it stays or goes.
const UP = "cubic-bezier(.333,.667,.667,1)", DOWN = "cubic-bezier(.333,0,.667,.333)";
export function rock(x, y, t, { vx = 0, vy = -400, bit = false, life = 1.6, g = 1500, big = 0, stay = false, floor: fl = GROUND } = {}) {
    vx *= K; vy *= K; g *= K;
    const { html, bottom } = rockBody(bit, big);
    const floor = fl - (bottom + 1) * fx + fx / 2;
    const lands = (-vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, floor - y))) / g, x1 = x + vx * lands;
    const ta = vy < 0 ? Math.min(-vy / g, lands) : 0, ya = y + vy * ta + 0.5 * g * ta * ta;
    const hop = Math.min(26, Math.abs(vy) * 0.03 + 6), th = 0.1 + hop / 300, end = t + lands + 2 * th;
    const X = [[t - 0.001, `transform:translate(${r1(x)}px,0px);opacity:0`], [t, `transform:translate(${r1(x)}px,0px);opacity:1`],
        [t + lands, `transform:translate(${r1(x1)}px,0px);opacity:1`, "ease-out"], [end, `transform:translate(${r1(x1 + vx * th * 0.4)}px,0px);opacity:1`]];
    if (!stay) X.push([t + life - 0.25, `transform:translate(${r1(x1 + vx * th * 0.4)}px,0px);opacity:1`], [t + life, `transform:translate(${r1(x1 + vx * th * 0.4)}px,0px);opacity:0`]);
    const ty = (v) => `transform:translate(0px,${r1(v)}px)`;
    const Y = [[t - 0.001, ty(y)]];
    if (ta > 0.01) Y.push([t, ty(y), UP], [t + ta, ty(ya), DOWN]); else Y.push([t, ty(y), DOWN]);
    Y.push([t + lands, ty(floor), UP], [t + lands + th, ty(floor - hop), DOWN], [end, ty(floor)]);
    const spin = (rnd() < 0.5 ? -1 : 1) * Math.round(R(1, 4)) * 90;
    const id = S.anim("k", X, "opacity:0"), idy = S.anim("k", Y), rot = S.anim("q", [[t - 0.001, "transform:rotate(0deg)"], [t, "transform:rotate(0deg)", "cubic-bezier(.2,.6,.4,1)"], [end, `transform:rotate(${spin}deg)`]]);
    return `<g class="${id}"><g class="${idy}"><g class="${rot}">${html}</g></g></g>`;
}
export const debris = (x, y, t, n, { vx = [-260, 260], vy = [300, 760], life = [1.1, 1.6], stay = false, floor } = {}) =>
    Array.from({ length: n }, (_, i) => rock(x + R(-30, 30), y, t + R(0, 0.04), { bit: i % 3 === 2, vx: R(...vx), vy: -R(...vy), life: R(...life), stay, floor })).join("");
// A chunk lifting off the ground in slow motion with the power coming off
// it, turning slowly, hanging there -- till `blast`, when it's blown away.
export function floatRock(x, t0, blast, hover, away, ground = GROUND) {
    const { html } = rockBody(rnd() < 0.3, rnd() < 0.3 ? 1 : 0);
    const y0 = ground - fx, up = t0 + R(0.5, 0.8), y1 = y0 - hover;
    const steps = [[t0 - 0.001, `transform:translate(${r1(x)}px,${y0}px);opacity:0`],
        [t0, `transform:translate(${r1(x)}px,${y0}px);opacity:1`, "cubic-bezier(.2,.7,.3,1)"]];
    let t = up, k = 0;
    while (t < blast) { steps.push([t, `transform:translate(${r1(x)}px,${r1(y1 - (k % 2 ? 8 : 0))}px);opacity:1`, "ease-in-out"]); t += 0.4; k++; }
    steps.push([blast, `transform:translate(${r1(x)}px,${r1(y1)}px);opacity:1`, "cubic-bezier(.2,.8,.3,1)"],
        [blast + 0.45, `transform:translate(${r1(x + away[0])}px,${r1(y1 + away[1])}px);opacity:0`]);
    const turn = R(-90, 90);
    const id = S.anim("k", steps, "opacity:0"), spin = S.anim("q", [[t0, "transform:rotate(0deg)"], [blast, `transform:rotate(${r1(turn)}deg)`]]);
    return `<g class="${id}"><g class="${spin}">${html}</g></g>`;
}
// A pixel shockwave: a ring of sparks flying out with trails behind them, a
// cross of light flaring and shrinking away.
export function burst(x, y, t, { radius = 56, sparks = 16, glint = 90, life = 0.38, color = "#FFD84A", trail = "#5CCFFF" } = {}) {
    radius *= K; glint *= K;
    let s = "";
    // Sparks as streaks along the way they fly, thinning out as they go.
    for (let i = 0; i < sparks; i++) {
        const a = (i / sparks) * 2 * Math.PI + R(-0.2, 0.2), r = radius * R(0.75, 1.25), deg = r1((a * 180) / Math.PI), l = R(3, 6) * fx;
        const streak = (c, w) => `<g transform="rotate(${deg} ${r1(x)} ${r1(y)})">${rect(x - l / 2, y - w / 2, l, w, c)}</g>`;
        s += S.shot(streak(i % 2 ? "#FFFFFF" : color, fx * 0.7), t, life, { dx: Math.cos(a) * r, dy: Math.sin(a) * r, s1: 0.4, origin: [x, y], ease: "cubic-bezier(.2,.8,.3,1)" });
        if (i % 2) s += S.shot(streak(trail, fx * 0.45), t + 0.03, life * 1.2, { dx: Math.cos(a) * r * 0.7, dy: Math.sin(a) * r * 0.7 + 10, s1: 0.3, origin: [x, y], ease: "cubic-bezier(.2,.8,.3,1)" });
    }
    s += S.shot(rect(x - glint / 2, y - 4, glint, 8, "#FFFFFF") + rect(x - 4, y - glint / 2, 8, glint, "#FFFFFF"), t, life * 0.8, { s0: 1, s1: 0.1, origin: [x, y] });
    return s;
}
// A ring of air blown out from a blow: round, or flattened along the ground.
// `heat` adds a dark inner ring trailing it: the air bending.
export const ring = (x, y, t, { r = 120, flat = 1, color = "#FFFFFF", width = 6, life = 0.42, heat = false } = {}) =>
    S.shot(`<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r)}" ry="${r1(r * flat)}" fill="none" stroke="${color}" stroke-width="${width}" shape-rendering="geometricPrecision"/>`
        + (heat ? `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r * 0.93)}" ry="${r1(r * flat * 0.93)}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="${width * 2.2}" shape-rendering="geometricPrecision"/>`
            + `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r * 0.86)}" ry="${r1(r * flat * 0.86)}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="${width}" shape-rendering="geometricPrecision"/>` : ""),
        t, life, { s0: 0.15, s1: 1, origin: [x, y], ease: "cubic-bezier(.1,.7,.3,1)" });
// Light bursting off a hit.
export const flare = (x, y, r, t, peak = 1, dur = 0.35, grad = "flare") =>
    S.fade(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="url(#${grad})"/>`, [[t - 0.001, 0], [t, peak, "ease-out"], [t + dur, 0]]);
// Pet.qml's impactAt: a comic star, small, big, then middling.
export function impact(x, y, t, { big = true, size = 1, pal = CYAN } = {}) {
    const set = [Art.impact(6 * size, 7), Art.impact(13 * size, 8), Art.impact(9 * size, 8)];
    const steps = big ? [[0, 0, 0.06], [1, 0.06, 0.11], [2, 0.17, 0.11]] : [[0, 0, 0.05], [2, 0.05, 0.09]];
    return steps.map(([k, a, d]) => {
        const rows = set[k], n = rows.length;
        return S.win(pix(rows, fx, x - (n * fx) / 2, y - (n * fx) / 2, { pal: { ...pal } }), [[t + a, t + a + d]]);
    }).join("");
}
// The works for a blow landing at (x, y): star, light, two rings, sparks, static.
export const hit = (x, y, t, { size = 1, pink = false, gold = false } = {}) => {
    const pal = pink ? PINK : gold ? GOLD : CYAN, trail = pink ? "#FF4FD8" : gold ? "#FFC43A" : "#5CCFFF", color = pink ? "#FFD6F5" : "#FFFFFF";
    return impact(x, y, t, { size, pal }) + flare(x, y, 130 * K * size, t, 1, 0.3, pink ? "pinkFlare" : gold ? "fireFlare" : "flare")
        + ring(x, y, t, { r: 110 * K * size, color: "#FFFFFF", width: 4, heat: size >= 1.5 }) + ring(x, y, t + 0.04, { r: 80 * K * size, color: trail, width: 8, life: 0.36 })
        + burst(x, y, t, { radius: 60 * size, sparks: 14, glint: 100 * size, color, trail })
        + crackle(x, y, 4, 16, 50 * size, t, 0.3, pink ? PINK_ARC : gold ? GOLD_ARC : undefined);
};
// A scorch mark on the ground where something hit hard; it stays.
export const scorch = (x, t, size = 1, y = GROUND) => S.win(`<ellipse cx="${r1(x)}" cy="${y + 6}" rx="${r1(70 * size * K)}" ry="${r1(9 * size)}" fill="#07090E" opacity=".75"/>`
    + `<ellipse cx="${r1(x)}" cy="${y + 4}" rx="${r1(40 * size * K)}" ry="${r1(4 * size)}" fill="#3A2028" opacity=".6"/>`, [[t, D + 5]])
    + Array.from({ length: Math.round(5 * size) }, () => S.fade(rect(x + R(-50, 50) * size * K, y + R(-2, 8), fx, fx / 2, "#FF9F1A"), [[t, 0], [t + 0.05, 1], [t + R(1, 2.2), 0, "ease-in"]])).join("");
// Cracks running out from (cx, cy) like a broken windscreen: jagged spokes
// and rings joining them, drawing themselves; flattened by `flat` when it's
// ground seen from the side. They stay.
export function spiderweb(cx, cy, r, t, { flat = 0.18, n = 9, dur = 0.3, glow = "#5CCFFF", width = 3, rings = 2 } = {}) {
    const spokes = Array.from({ length: n }, (_, i) => {
        const a0 = (i / n) * 2 * Math.PI + R(-0.25, 0.25), pts = [[0, 0]];
        let rr = 0;
        while (rr < r) { rr += R(r * 0.12, r * 0.26); const a = a0 + R(-0.18, 0.18); pts.push([Math.cos(a) * Math.min(rr, r * R(0.8, 1.1)), Math.sin(a) * Math.min(rr, r * R(0.8, 1.1))]); }
        return pts;
    });
    // (On the ground seen from the side, the far half is squeezed up against
    // the edge, never above it.)
    const P = ([x, y]) => `${r1(cx + x)},${r1(cy + (flat < 1 ? Math.abs(y) * flat * (y > 0 ? 1 : 0.25) : y))}`;
    let lines = spokes.map((pts) => pts.map(P).join(" "));
    for (let k = 1; k <= rings; k++) {
        const f = k / (rings + 1);
        for (let i = 0; i < n; i++) {
            if (rnd() < 0.3) continue;
            const a = spokes[i], b = spokes[(i + 1) % n], pa = a[Math.min(a.length - 1, Math.round(f * (a.length - 1)))], pb = b[Math.min(b.length - 1, Math.round(f * (b.length - 1)))];
            const mid = [(pa[0] + pb[0]) / 2 * R(0.85, 1.0), (pa[1] + pb[1]) / 2 * R(0.85, 1.0)];
            lines.push([pa, mid, pb].map(P).join(" "));
        }
    }
    const pl = (pts, extra) => `<polyline points="${pts}" pathLength="1" fill="none" ${extra} shape-rendering="geometricPrecision"/>`;
    return S.grow(lines.map((p) => pl(p, `stroke="${glow}" stroke-width="${width * 2.2}" stroke-opacity=".35"`)).join("")
        + lines.map((p) => pl(p, `stroke="#07090E" stroke-width="${width}"`)).join(""), t, dur);
}
// A crater punched into the ground: a dark bowl, a lip of thrown-up earth,
// cracks running out, dust and rocks. It stays.
export function crater(x, t, size = 1, { y = GROUND, glow = "#5CCFFF", cracks = true } = {}) {
    const w = 120 * size, d = 26 * size;
    const bowl = `<path d="M${r1(x - w)} ${y} Q${r1(x)} ${r1(y + d * 2)} ${r1(x + w)} ${y}Z" fill="#07090E" opacity=".9"/>`
        + `<path d="M${r1(x - w * 0.7)} ${y} Q${r1(x)} ${r1(y + d * 1.3)} ${r1(x + w * 0.7)} ${y}Z" fill="${glow}" opacity=".18"/>`;
    let lip = "";
    for (let i = 0; i < 2; i++) {
        const sx = i ? 1 : -1;
        for (let k = 0; k < 4; k++) lip += rect(x + sx * (w - k * fx * 2) - fx, y - fx * (3 - k * 0.7) * size, fx * 2, fx * (3 - k * 0.7) * size + 2, k % 2 ? ".sb" : ".sc");
    }
    return S.win(bowl + lip, [[t, D + 5]]) + (cracks ? spiderweb(x, y + 4, w * 2.4, t, { glow, flat: 0.14 }) : "")
        + dustRing(x, t, Math.round(10 * size), 180 * size, y - 10) + debris(x, y - 8, t, Math.round(7 * size), { stay: true, floor: y })
        + ring(x, y, t, { r: 300 * size, flat: 0.12, width: 5 });
}
// An explosion: a flash, a fireball swelling through white, yellow and
// orange to smoke, smoke rolling up, sparks, rings, debris, embers, a scorch.
const ballsCache = new Map();
function fireballs(r) {
    if (!ballsCache.has(r)) ballsCache.set(r, [0.35, 0.6, 0.85, 1, 1.1].map((k, i) => {
        const rr = Math.max(2, Math.round(r * k));
        return disc(rr, (d, a, b) => {
            const n = d + ((a * 7 + b * 13) % 5) * 0.03;
            if (i === 4) return n > 0.7 ? "r" : n > 0.4 ? "d" : "o";
            return n < 0.3 - i * 0.05 ? "h" : n < 0.55 ? "y" : n < 0.8 ? "o" : (a + b) % 2 ? "r" : "o";
        });
    }));
    return ballsCache.get(r);
}
export function explosion(x, y, t, size = 1, { ground = GROUND, smoke = 9 } = {}) {
    const r = Math.round(13 * size), balls = fireballs(r);
    let s = flare(x, y, 260 * size * K, t, 1, 0.5, "fireFlare")
        + S.seq(balls.map((rows) => pix(rows, fx, x - (rows.length * fx) / 2, y - (rows.length * fx) / 2, { pal: FIRE })), t, 0.075)
        + [[-1, -0.6], [1.1, -0.3]].map(([ox, oy], k) => S.seq(balls.slice(0, 4).map((rows) => pix(rows, fx * 0.55, x + ox * r * fx * 0.7 - (rows.length * fx * 0.55) / 2, y + oy * r * fx * 0.7 - (rows.length * fx * 0.55) / 2, { pal: FIRE })), t + 0.1 + k * 0.06, 0.06)).join("")
        + ring(x, y, t, { r: 150 * size * K, width: 5, heat: true }) + ring(x, y, t + 0.05, { r: 110 * size * K, color: "#FF9F1A", width: 10, life: 0.4 })
        + burst(x, y, t, { radius: 90 * size, sparks: 16, glint: 140 * size, color: "#FFE45C", trail: "#FF9F1A" })
        + embers(x, y, t + 0.05, Math.round(8 * size), 50 * size, 0.4, ["#FFD84A", "#FF9F1A", "#FFFFFF"]);
    for (let i = 0; i < Math.round(smoke * size); i++)
        s += puff(x + R(-40, 40) * size, y + R(-30, 20) * size, t + 0.2 + R(0, 0.25), { pal: SMOKE, to: [10, 8, 7][i % 3] * Math.min(1.4, size), dx: R(-60, 60), dy: -R(90, 200), life: R(1.4, 2.3), opacity: 0.75, mode: "io" });
    if (ground - y < 160) s += dustRing(x, t + 0.02, Math.round(8 * size), 160 * size, ground - 10) + scorch(x, t, size, ground) + debris(x, ground - 8, t, Math.round(7 * size), { stay: true, life: [1.4, 1.8], floor: ground });
    return s;
}
// Lightning (Art.bolt) from `a` to `b`, one drawing, glowing.
export function boltDraw(b, x, y, pal, pieces = [0]) {
    let s = "";
    for (const k of pieces) s += paint(b.pieces[k].paths, pal);
    return `<g transform="translate(${r1(x + b.origin[0] * bfx)} ${r1(y + b.origin[1] * bfx)}) scale(${bfx})" filter="url(#glow)">${s}</g>`;
}
export const boltOnce = (a, b, pal, opts = {}) => boltDraw(Art.bolt((b[0] - a[0]) / bfx, (b[1] - a[1]) / bfx, { pieces: 1, ...opts }), a[0], a[1], pal);
// A bolt that shoots across piece by piece, hangs there redrawn every few
// frames (on 4s, like hand-drawn lightning), then strobes, thins and goes.
export function bolt(a, b, t0, { grow = 0.09, hold = 0.45, fadeOut = 0.32, pal = CYAN, opts = {}, redraws = 2 } = {}) {
    const dx = (b[0] - a[0]) / bfx, dy = (b[1] - a[1]) / bfx, N = 8;
    const first = Art.bolt(dx, dy, { pieces: N, ...opts });
    let s = "";
    for (let k = 0; k < N; k++) s += S.win(boltDraw(first, a[0], a[1], pal, [k]), [[t0 + (grow * k) / N, t0 + grow + 0.066]]);
    s += S.win(S.loop(Array.from({ length: redraws }, () => boltOnce(a, b, pal, opts)), 12), [[t0 + grow + 0.066, t0 + grow + hold]]);
    const thin = boltOnce(a, b, pal, { ...opts, scale: 0.5 }), t1 = t0 + grow + hold, q = fadeOut / 5;
    s += S.win(thin, [[t1 + q, t1 + 2 * q], [t1 + 3 * q, t1 + 3.6 * q], [t1 + 4.2 * q, t1 + 5 * q]]);
    return s + crackle(...b, 5, 10, 40, t0 + grow, hold, pal === PINK ? PINK_ARC : pal === GOLD ? GOLD_ARC : undefined);
}
// An aura (Pet.qml's: the pet's shape, glowing, round it), drawn at (0, 0).
export const aura = (rows, color, { flip = false, k = 1.35 } = {}) =>
    `<g filter="url(#aura)">${pix(rows, PX * k, -(Art.W * PX * (k - 1)) / 2, -Art.H * PX * (k - 1), { flip, pal: mono(color) })}</g>`;
export const effect = (name, x, y, pal = PAL, k = fx) => { const rows = Art.effect(name); return pix(rows, k, x - (rows[0].length * k) / 2, y - (rows.length * k) / 2, { pal }); };
// A glint off an eye: a little cross of light popping.
export const glint = (x, y, t, color = "#FFFFFF", size = 4) => S.shot(
    rect(x - size / 2, y - size * 3, size, size * 6, color) + rect(x - size * 3, y - size / 2, size * 6, size, color), t, 0.3,
    { s0: 0.2, s1: 1.2, origin: [x, y], mode: "io", ease: "ease-out" });
// Speed lines streaking past along a line.
export const streaks = (x0, y0, x1, y1, t, n, { spread = 60, colors = ["#FFFFFF", "#8FE0FF", "#5CCFFF"], len = [60, 160], life = [0.14, 0.26] } = {}) => {
    const ang = Math.atan2(y1 - y0, x1 - x0), deg = (ang * 180) / Math.PI;
    return Array.from({ length: n }, (_, i) => {
        const u = R(-0.1, 1), off = (i % 2 ? 1 : -1) * R(8, spread) * K, l = R(...len) * K;
        const x = x0 + (x1 - x0) * u - Math.sin(ang) * off, y = y0 + (y1 - y0) * u + Math.cos(ang) * off;
        const line = `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(deg)})">${rect(0, 0, l, i % 3 ? 3 : 6, colors[i % colors.length])}</g>`;
        return S.shot(line, t + u * 0.06, R(...life), { dx: Math.cos(ang) * R(40, 140) * K, dy: Math.sin(ang) * R(40, 140) * K });
    }).join("");
};
export const PINK_LINES = ["#FFFFFF", "#FFD6F5", "#FF4FD8"], GOLD_LINES = ["#FFFFFF", "#FFF3B0", "#FFC43A"];
// A trail left behind something moving along `pts` (art top-left), from t0
// to t1: specks of light where it was, fading.
export const trail = (pts, t0, t1, colors, { every = 0.03, size = fx, life = 0.4, at = C0 } = {}) => {
    let s = "";
    for (let t = t0; t <= t1; t += every) {
        const [, x, y] = pathAt(pts, t), c = colors[Math.floor(rnd() * colors.length)];
        s += S.shot(rect(x + at[0] + R(-14, 14), y + at[1] + R(-14, 14), size, size, c), t, life, { dx: R(-10, 10), dy: R(-6, 14), s1: 0.3, origin: [x + at[0], y + at[1]] });
    }
    return s;
};
// Dust kicked up behind something running along the ground.
export const kicks = (pts, t0, t1, dir, every = 0.06, ground = GROUND) => {
    let s = "";
    for (let t = t0; t <= t1; t += every) {
        const [, x] = pathAt(pts, t);
        s += puff(x + C0[0], ground - 8, t, { to: R(3, 5), dx: -dir * R(20, 60), dy: -R(10, 30), life: R(0.4, 0.7) });
    }
    return s;
};

// Manga focus lines: thin wedges closing in on (cx, cy), in picture units.
export function focus(cx, cy, n, inner, fill) {
    let s = "";
    for (let i = 0; i < n; i++) {
        const a = (i / n) * 2 * Math.PI + R(-0.08, 0.08), w = R(0.012, 0.035), ri = inner * R(0.75, 1.35), ro = 1800;
        const p = (ang, r) => `${Math.round(cx + Math.cos(ang) * r)},${Math.round(cy + Math.sin(ang) * r)}`;
        s += `<polygon points="${p(a - w, ro)} ${p(a + w, ro)} ${p(a, ri)}" fill="${fill}" shape-rendering="geometricPrecision"/>`;
    }
    return s;
}
// Focus lines that flicker, redrawn on 2s: n drawings, `life` s.
export const focusFlicker = (cx, cy, t, life, { n = 34, inner = 180, fill = "#FFFFFF", op = 0.7, draws = 3 } = {}) =>
    S.win(`<g opacity="${op}">${S.loop(Array.from({ length: draws }, () => focus(cx, cy, n, inner, fill)), 12)}</g>`, [[t, t + life]]);
export const flat = (fill, extra = "") => rect(-60, -60, W + 120, H + 120, fill, extra);
// A flash over everything: n frames (of 24), white or a colour.
export const flash = (t, n = 2, fill = "#FFFFFF", op = 1) => S.win(flat(fill, op < 1 ? ` opacity="${op}"` : ""), [[t, t + n / 24]]);
// A softer one: a burst of light from (x, y) filling the picture and going.
export const bloom = (x, y, t, dur = 0.4, grad = "flare", r = 900) => S.fade(`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${grad})"/>`, [[t - 0.001, 0], [t, 1, "ease-out"], [t + dur, 0]]);
// Speed lines across the whole picture: a whip pan, along `deg`.
export function whip(t, dur, { deg = 0, n = 26, colors = ["#FFFFFF", "#C8CCE0", "#8B949E"], op = 0.75 } = {}) {
    let s = "";
    for (let i = 0; i < n; i++) {
        const y = R(-100, H + 100), l = R(200, 600), x = R(-300, W);
        s += S.shot(rect(x, y, l, i % 3 ? 2 : 5, colors[i % colors.length], ` opacity="${op}"`), t + R(0, dur * 0.5), dur * R(0.5, 0.9), { dx: -R(500, 900), ease: "linear" });
    }
    return `<g transform="rotate(${deg} ${W / 2} ${H / 2})">${s}</g>`;
}
// Light shafts from (x, y), between angles a0..a1 (degrees), breathing.
export function rays(x, y, a0, a1, n, len, { grad = "rayGrad", width = [20, 60] } = {}) {
    let s = "";
    for (let i = 0; i < n; i++) {
        const a = a0 + ((a1 - a0) * (i + R(0.2, 0.8))) / n, w = R(...width);
        s += `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(a)})"><g class="ray" style="animation-delay:-${r3(R(0, 4))}s">${poly([[0, -w * 0.15], [len, -w], [len, w], [0, w * 0.15]], `url(#${grad})`, ' shape-rendering="geometricPrecision"')}</g></g>`;
    }
    return s;
}
// The air shimmering over something hot: wavy lines rising off (x0..x1, y).
export const heat = (x0, x1, y, n = 10, color = "#FFFFFF") => Array.from({ length: n }, () =>
    `<g class="heat" style="animation-delay:-${r3(R(0, 0.9))}s;animation-duration:${r3(R(0.7, 1.1))}s"><path d="M${r1(R(x0, x1))} ${r1(y - R(0, 40))}q5 -8 0 -16t0 -16" fill="none" stroke="${color}" stroke-width="3" stroke-opacity=".55" shape-rendering="geometricPrecision"/></g>`).join("");
// A shadow thrown on the ground by a light: the pet's shape, flat, leaning
// away from it.
export const castShadow = (rows, x, { flip = false, lean = 1.2, squash = 0.22, ground = GROUND, op = 0.45 } = {}) =>
    `<g transform="translate(0 ${ground}) matrix(1 0 ${r3(-lean)} ${-squash} 0 0) translate(0 ${-ground})" opacity="${op}">${pix(rows, PX, x, ground - Art.H * PX, { flip, pal: mono("#05060A") })}</g>`;
// Chromatic aberration: red and cyan copies a few pixels either side,
// behind the pet (drawn at 0, 0).
export const rgb = (rows, { flip = false, d = 7 } = {}) =>
    `<g opacity=".85">${pix(rows, PX, -d, 0, { flip, pal: mono("#FF2A5A") })}${pix(rows, PX, d, 0, { flip, pal: mono("#29E6FF") })}</g>`;
// A slash: a hairline of light drawn across in a frame or two, a glow round
// it; it hangs, thins, and goes.
export function slashLine(x0, y0, x1, y1, t, { hold = 0.5, color = "#FF4FD8", width = 5, fade = 0.3 } = {}) {
    const ln = (w, c, o = 1) => `<line x1="${r1(x0)}" y1="${r1(y0)}" x2="${r1(x1)}" y2="${r1(y1)}" pathLength="1" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round" shape-rendering="geometricPrecision"/>`;
    const full = ln(width * 5, color, 0.35) + ln(width * 2, color, 0.8) + ln(width, "#FFFFFF");
    return S.win(S.grow(full, t, 0.08), [[t, t + hold]])
        + S.fade(ln(width * 2, color, 0.6) + ln(width * 0.6, "#FFFFFF"), [[t + hold - 0.001, 0], [t + hold, 1], [t + hold + fade, 0]]);
}
// Split along the line (x0, y0)-(x1, y1): the part above it slides off
// (dx, dy), turning r round `origin`, from t over dur; the rest stays put.
// `html` is drawn twice, once clipped each side.
export function split(html, [x0, y0, x1, y1], t, { dx = 0, dy = 0, r = 0, dur = 2, origin = [x0, y0], ease = "cubic-bezier(.55,0,.85,.4)", before = "" } = {}) {
    const id = S.uid("cut"), far = 5000, a = Math.atan2(y1 - y0, x1 - x0), nx = Math.sin(a), ny = -Math.cos(a);
    const ext = (x, y, s) => [x - Math.cos(a) * far * s, y - Math.sin(a) * far * s];
    const A = ext(x0, y0, 1), B = ext(x1, y1, -1);
    const up = [A, B, [B[0] + nx * far, B[1] + ny * far], [A[0] + nx * far, A[1] + ny * far]];
    const dn = [A, B, [B[0] - nx * far, B[1] - ny * far], [A[0] - nx * far, A[1] - ny * far]];
    defs.push(`<clipPath id="${id}u" clipPathUnits="userSpaceOnUse">${poly(up, "#fff")}</clipPath><clipPath id="${id}d" clipPathUnits="userSpaceOnUse">${poly(dn, "#fff")}</clipPath>`);
    const whole = S.win(html, [[-S.off, t]]);
    const lower = S.win(`<g clip-path="url(#${id}d)">${html}</g>`, [[t, D + 5]]);
    const upper = S.win(S.move(`<g clip-path="url(#${id}u)">${html}</g>`, [[t, 0, 0, 0, 1, ease], [t + dur, dx, dy, r]], { origin }), [[t, D + 5]]);
    return before + whole + lower + upper;
}
// Glass bursting from (x, y) out over (w, h): shards that fly, all but stop
// in the air (slow motion), then go at full speed. A few carry a letter.
export function shards(x, y, t, n, { spread = 300, dir = 1, phases = [[0, 0], [0.12, 0.3], [1.1, 0.42], [1.4, 1]], letters = "", size = [10, 26] } = {}) {
    let s = "";
    for (let i = 0; i < n; i++) {
        const sz = R(...size), a = R(-1.2, 1.2), sx = x + R(-20, 20), sy = y + R(-sz * 4, sz * 4);
        const pts = [[0, -sz], [sz * R(0.4, 0.9), sz * R(0.2, 0.8)], [-sz * R(0.4, 0.9), sz * R(0.1, 0.7)]];
        let shard = poly(pts, "#BFE9FF", ' fill-opacity=".55" stroke="#FFFFFF" stroke-width="2" shape-rendering="geometricPrecision"');
        if (i < letters.length) {
            const L = word(letters[i], "h"), k = sz / 9;
            shard = poly(pts.map(([px, py]) => [px * 1.6, py * 1.6]), "#BFE9FF", ' fill-opacity=".6" stroke="#FFFFFF" stroke-width="2" shape-rendering="geometricPrecision"')
                + pix(L, k, -2.5 * k, -3.5 * k, { pal: { h: "#FFFFFF" } });
        }
        const d = R(0.4, 1) * spread;
        s += S.ramp(place(shard, sx, sy), t + R(0, 0.03), phases, { dx: dir * Math.cos(a) * d, dy: Math.sin(a) * d * 0.8 + R(-40, 120), r: R(-200, 200), origin: [sx, sy] });
    }
    return s;
}
// A word in pixel letters, glitching: flickering on, a red and a cyan copy
// slipping either side of it.
export function glitchWord(w, x, y, k, t0, t1, { color = ".ink" } = {}) {
    const rows = word(w, "c"), base = pix(rows, k, x, y, { pal: { c: color } });
    const red = pix(rows, k, x - k * 1.5, y, { pal: { c: "#FF2A5A" } }), cyan = pix(rows, k, x + k * 1.5, y + k * 0.5, { pal: { c: "#29E6FF" } });
    const dt = t1 - t0, wins = [[t0, t0 + dt * 0.12], [t0 + dt * 0.2, t0 + dt * 0.3], [t0 + dt * 0.36, t0 + dt * 0.9], [t0 + dt * 0.95, t1]];
    return S.win(`<g opacity=".8">${red}${cyan}</g>`, [wins[0], [t0 + dt * 0.5, t0 + dt * 0.56], wins[3]]) + S.win(base, wins)
        + S.win(place(base, k * 3, 0), [[t0 + dt * 0.3, t0 + dt * 0.36]]);
}
export { word, wordW };

// A shadow on the ground under something moving along `pts` (art top-left):
// it follows along the ground, shrinking and fading as it goes up.
export function shadowOf(pts, { ground = GROUND, w = 64 } = {}) {
    const k = (y) => Math.max(0.25, Math.min(1, 1 - (ground - (y + Art.H * PX)) / 420));
    const steps = pts.map(([t, x, y, , , e]) => [t, `transform:translate(${r1(x + C0[0])}px,${ground + 3}px) scale(${r3(k(y))});opacity:${r3(0.2 + 0.4 * k(y))}`, e]);
    return `<g class="${S.anim("m", steps, "opacity:0")}"><ellipse cx="0" cy="0" rx="${w}" ry="8" fill="#000"/></g>`;
}
// Dust in the air, catching the light: specks drifting, on their own clocks.
export const motes = (n, x0, x1, y0, y1, { color = "#C8CCE0", size = 3 } = {}) => Array.from({ length: n }, () => {
    const dur = R(5, 9);
    return `<g class="mote" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(R(0, dur))}s;--dx:${r1(R(-80, 80))}px;--dy:${r1(R(-120, -30))}px">${rect(R(x0, x1), R(y0, y1), size, size, color)}</g>`;
}).join("");
// Bands of mist drifting low over the ground.
export const mist = (x0, x1, y, n = 6, { w = [260, 520], h = [26, 50] } = {}) => Array.from({ length: n }, () =>
    `<g class="mist" style="animation-delay:-${r1(R(0, 16))}s;animation-duration:${r1(R(12, 20))}s"><ellipse cx="${r1(R(x0, x1))}" cy="${r1(y + R(-20, 20))}" rx="${r1(R(...w))}" ry="${r1(R(...h))}" fill="url(#mistGrad)"/></g>`).join("");
// A white flash over a pet, the frame a blow lands (drawn at 0, 0).
export const hitFlash = (rows, flip = false) => pix(rows, PX, 0, 0, { flip, pal: mono("#FFFFFF") });
