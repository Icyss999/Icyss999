#!/usr/bin/env node
// Builds assets/pet-fight.svg: Rascal, the desktop pet from my Quickshell
// config, in a fight to the death with its double from the other side of a
// workspace rift -- a minute and a half, shot like a high-budget anime fight.
//
//   I    0-5     the page tears: the world pours out of a crack in the page
//   II   5-13.8  the standoff: wind, worm's-eye shots, their eyes, silence
//   III  13.8-28 the first clash, mostly one continuous take across the field
//   IV   28-33   it isn't over: the twin gets up, darker; Rascal is sent flying
//   V    33-50   the city: through the glass, the rooftops, a slash that cuts
//                a tower in two a beat later, the city from above
//   --   50-52.8 eyecatch
//   VI   52.8-63 the sky: through the visor, the clouds, spiked into the ground
//   VII  63-79   the last attack: an orbit round the charge, silence, then the
//                cut that splits the mountains; from above, the scar it leaves
//   VIII 79-90   the twin comes apart into the rift, the stars, and the world
//                folds back into the page, where it started
//
// The pets, their poses, the nano suit, the lightning, the impact stars and
// the web strands are drawn by the pet's own sprite code (Pet/pet-art.js),
// in its own colours; the world is drawn in GitHub's (light or dark), its
// edges melting into the page. Plain SVG + CSS, no scripts, so GitHub plays
// it. ICYCLE is hidden all through it.
//
//   node scripts/build-pet-fight.mjs [path/to/pet-art.js]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S, shots, defs, spriteDefs, W, H, D } from "./pet-fight/core.mjs";
import "./pet-fight/sets.mjs";
import "./pet-fight/acts/clash.mjs";
import "./pet-fight/acts/open.mjs";
import "./pet-fight/acts/city.mjs";
import "./pet-fight/acts/sky.mjs";
import "./pet-fight/acts/final.mjs";

const OUT = (theme) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../assets/pet-fight-${theme}.svg`);

const body = `<g mask="url(#fade)">\n${shots.join("\n")}\n</g>`;
const label = "A ninety-second anime-style fight to the death between Rascal, ICYCLE's pixel raccoon desktop pet, and its purple twin from a workspace rift: the page tears open into a battlefield, a standoff, a clash in one continuous take, a fight through a city where a slash cuts a tower in two, an aerial battle seen through the nano suit's visor, a final thunder slash that splits the mountains, and the world folding back into the page";
// One for GitHub's dark theme, one for its light one: the same film, the
// world in each theme's colours (the README picks by theme).
for (const theme of ["dark", "light"]) {
    const svg = S.svg(body, label, defs.join("\n") + spriteDefs.join(""), theme);
    fs.writeFileSync(OUT(theme), svg);
    const anims = (body.match(/class="/g) || []).length;
    console.log(`${path.basename(OUT(theme))}  ${W}x${H}  ${D}s  ${(svg.length / 1024).toFixed(0)} KB, ${S.css.length} rules, ~${anims} classed groups`);
}
