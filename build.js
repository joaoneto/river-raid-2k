(function (exports) {

const PIXEL_SIZE = 6.25;

const COLOR_MAP = {
  0: '#0000ff',
  1: '#ffffff',
  2: '#ff0000',
  3: '#00ff00',
  4: '#ff00ff',
};

let selectedColor = 1;
let gameMatrix = exports.gameMatrix = [];
let drawing = false;

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const resetGameMatrix = () => {
  gameMatrix.lenght = 0;
  for (let x = 0; x < 128 * 128; x++) {
    gameMatrix.push(0);
  }
};

const selectColorInput = document.getElementById('selectColorInput');
selectColorInput.addEventListener('change', function () {
  selectedColor = parseInt(this.value);
  context.fillStyle = COLOR_MAP[selectedColor];
});

const getMousePos = (canvas, e) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

const draw = () => {
  context.clearRect(0, 0, 800, 800);
  for (var y = 0; y < 128; y++) {
    for (var x = 0; x < 128; x++) {
      context.fillStyle = COLOR_MAP[gameMatrix[x + (y * 128)]];
      context.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    }
  }
};

const fillPixel = (mousePos) => {
  for (var y = 0; y < 128; y++) {
    for (var x = 0; x < 128; x++) {
      if (mousePos.x <= x * PIXEL_SIZE + PIXEL_SIZE && mousePos.x >= x * PIXEL_SIZE && mousePos.y <= y * PIXEL_SIZE + PIXEL_SIZE && mousePos.y >= y * PIXEL_SIZE) {
        context.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        gameMatrix[x + (y * 128)] = selectedColor;
      }
    }
  }
};

resetGameMatrix();
draw();

const copyGameMatrix = document.getElementById('copyGameMatrix');


canvas.addEventListener('mousedown', function (e) {
  drawing = true;
  const mousePos = getMousePos(canvas, e);
  fillPixel(mousePos);
});

canvas.addEventListener('mouseup', function (e) {
  drawing = false;
  copyGameMatrix.value = JSON.stringify(gameMatrix, 0, null, 2);
});

canvas.addEventListener('mousemove', function (e) {
  if (!drawing) return;
  const mousePos = getMousePos(canvas, e);
  fillPixel(mousePos);
});

})(window);
