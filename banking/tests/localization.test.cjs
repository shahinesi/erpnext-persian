const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const css = fs.readFileSync(path.join(__dirname, "../src/index.css"), "utf8");

test("Persian banking UI uses the shared Vazirmatn font and ss01", () => {
	assert.match(css, /font-family:\s*Vazirmatn[;\s]/);
	assert.match(css, /\/assets\/frappe\/css\/fonts\/vazirmatn\/Vazirmatn-wght\.woff2/);
	assert.match(css, /html:lang\(fa\)\s*\{[^}]*--font-sans:\s*"Vazirmatn"/s);
	assert.match(css, /html:lang\(fa\)\s*\{[^}]*--font-numeric:\s*"Vazirmatn"/s);
	assert.match(css, /html:lang\(fa\)\s*\{[^}]*font-feature-settings:\s*"ss01"/s);
});

test("English banking UI keeps its existing Inter font stack", () => {
	assert.match(css, /--font-sans:\s*"InterVariable"/);
	assert.match(css, /--font-numeric:\s*"InterVariable"/);
});
