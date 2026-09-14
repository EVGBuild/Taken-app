const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const home = fs.readFileSync('js/features/home.js', 'utf8');
const css = fs.readFileSync('css/phase3a-visual-qa.css', 'utf8');

function expect(source, pattern, message) {
  assert.match(source, pattern, message);
}

test('Home keeps the approved check-in wording and five-bar battery', () => {
  expect(home, /Hoeveel kun je op dit moment aan\?/, 'approved check-in question must remain visible');
  const barMarkup = home.match(/class="battery-bar"/g) || [];
  assert.ok(barMarkup.length >= 5, 'Home must render at least five visual battery bars');
});

test('Home does not reintroduce rejected greeting or Orb text label', () => {
  assert.doesNotMatch(home, /Goedemorgen Elise|Goedemiddag Elise|Goedenavond Elise/i);
  expect(css, /\.global-add:after\s*\{[^}]*content\s*:\s*none\s*!important/s, 'visual layer must suppress the legacy Orb pseudo-label');
});

test('Home visual layer contains the established spatial art-direction primitives', () => {
  expect(css, /radial-gradient/i, 'Home needs diffuse atmospheric/nebula light');
  expect(css, /backdrop-filter\s*:\s*blur/i, 'Home needs glass depth');
  expect(css, /box-shadow/i, 'Home needs luminous depth rather than flat surfaces');
  expect(css, /body\.home-screen:before|body\.home-screen::before/i, 'Home needs a dedicated atmospheric/star layer');
});

test('Home visual layer retains reduced-motion support', () => {
  expect(css, /prefers-reduced-motion\s*:\s*reduce/i, 'visual work must preserve reduced-motion handling');
});
