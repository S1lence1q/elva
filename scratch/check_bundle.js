import fs from 'fs';
import path from 'path';

const bundlePath = '/Users/applemacbook/AntiGravity Shit/Elva.nosync/Elva/dist/assets/index-CBvFx8_1.js';
const content = fs.readFileSync(bundlePath, 'utf8');

console.log('Bundle length:', content.length);

const targets = ['lyrics', 'obsidian', 'shouldShowArtistCard', 'handleKeyPress'];
for (const target of targets) {
  const index = content.indexOf(target);
  if (index !== -1) {
    console.log(`Found "${target}" at index ${index}. Surrounding text:`);
    console.log(content.substring(Math.max(0, index - 100), Math.min(content.length, index + 200)));
  } else {
    console.log(`"${target}" NOT found`);
  }
}
