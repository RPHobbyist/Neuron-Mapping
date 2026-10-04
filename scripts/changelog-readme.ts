/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { readFileSync, writeFileSync } from "node:fs";

import { readmeChangelogSection, readmeChangelogTocLine } from "../src/data/changelog";

const README = new URL("../README.md", import.meta.url);
const START = /<!-- changelog:start[^>]*-->/;
const END = "<!-- changelog:end -->";
const TOC_LINE = /^- \[What's new in version [^\]]*\]\([^)]*\)$/im;

const text = readFileSync(README, "utf8");
const eol = text.includes("\r\n") ? "\r\n" : "\n";
const start = text.match(START);
const end = text.indexOf(END);
if (!start || start.index === undefined || end < start.index) {
  throw new Error(`README.md needs "<!-- changelog:start -->" and "${END}" around the What's New section.`);
}

const afterStart = start.index + start[0].length;
const section = readmeChangelogSection().replace(/\n/g, eol);
const next = `${text.slice(0, afterStart)}${eol}${section}${eol}${text.slice(end)}`
  .replace(TOC_LINE, readmeChangelogTocLine());

if (next === text) {
  console.log("README.md is up to date.");
} else {
  writeFileSync(README, next);
  console.log("README.md updated.");
}
