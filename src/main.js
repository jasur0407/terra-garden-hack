import './style.css';

// creating a small canvas and scaling it up
const canvas = document.getElementById('farm');
canvas.width = 160;
canvas.height = 90;
const ctx = canvas.getContext('2d');

const rect = (x, y, w, h, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

// Grass - an arrangement of 8px tiles with dark and light green
for (let ty = 0; ty < 12; ty++) {
  for (let tx = 0; tx < 20; tx++) rect(tx * 8, ty * 8, 8, 8, (tx + ty) % 2 ? '#78b15f' : '#6fa957');
}

// A soil in a similar way with rows
rect(52, 22, 56, 40, '#4f3219');
rect(56, 26, 48, 32, '#6b4423');
for (let y = 28; y < 58; y += 4) rect(56, y, 48, 1, '#5a381d');
rect(50, 20, 60, 2, '#a6713a');
rect(50, 62, 60, 2, '#a6713a');
rect(50, 20, 2, 44, '#a6713a');
rect(108, 20, 2, 44, '#a6713a');

// A plant
rect(79, 38, 2, 14, '#3f8f3a');
rect(73, 36, 6, 3, '#5fbf4a');
rect(81, 32, 6, 3, '#5fbf4a');
rect(76, 52, 8, 3, '#5a381d');
