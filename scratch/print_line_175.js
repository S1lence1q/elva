import fs from 'fs';

const bundlePath = '/Users/applemacbook/AntiGravity Shit/Elva.nosync/Elva/dist/assets/index-CBvFx8_1.js';
const content = fs.readFileSync(bundlePath, 'utf8');
const lines = content.split('\n');

const lineIndex = 175 - 1; // 0-indexed
const targetLine = lines[lineIndex];

console.log('Line 175 length:', targetLine.length);

const startCol = 40000;
const endCol = 46000;
console.log(`Printing from ${startCol} to ${endCol}:`);
console.log(targetLine.substring(startCol, endCol));
