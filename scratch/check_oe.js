import fs from 'fs';

const bundlePath = '/Users/applemacbook/AntiGravity Shit/Elva.nosync/Elva/dist/assets/index-CBvFx8_1.js';
const content = fs.readFileSync(bundlePath, 'utf8');

// We want to find references to the variable "oe" in the bundle.
// Note that in minified JS, variables can be "oe", "oe(...)", "oe.something", or "=oe".
// Let's search for occurrences of the word "oe" and print their locations and surroundings.
const regex = /\boe\b/g;
let match;
let count = 0;
console.log('Searching for whole-word "oe" in the bundle...');
while ((match = regex.exec(content)) !== null) {
  count++;
  if (count <= 30) {
    console.log(`Match ${count} at index ${match.index}:`);
    console.log(content.substring(Math.max(0, match.index - 50), Math.min(content.length, match.index + 100)));
  }
}
console.log(`Total occurrences found: ${count}`);
