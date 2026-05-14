const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf-8');

const regex = /\/\/ ── ([^─]+) ──/g;
let match;
const parts = [];
let lastIndex = 0;

while ((match = regex.exec(content)) !== null) {
  if (lastIndex < match.index) {
    parts.push({ type: 'code', text: content.slice(lastIndex, match.index) });
  }
  parts.push({ type: 'header', text: match[1].trim() });
  lastIndex = match.index + match[0].length;
}
if (lastIndex < content.length) {
  parts.push({ type: 'code', text: content.slice(lastIndex) });
}

console.log(parts.filter(p => p.type === 'header').map(p => p.text));
