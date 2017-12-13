(function () {
const COLOR_MAP = {
  0: 'rgba(255,255,255,0)',
  1: '#0000ff',
  2: '#ffff00',
  3: '#ffffff',
  4: '#00ff00',
  5: '#ff00ff',
};

const PIXEL_SIZE = 6.25;

const sprite = (name, state, left, top) => {
  const { width, height, matrix } = SPRITES[name][state];

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      context.fillStyle = COLOR_MAP[matrix[x + (y * 9)]];
      context.fillRect((x + left) * PIXEL_SIZE-1, (y + top) * PIXEL_SIZE-1, PIXEL_SIZE+1, PIXEL_SIZE+1);
    }
  }
};

const RR2KPlayer = (context) => {
  let VELOCITY = 0.9;
  let LEFT = 0;
  let TOP = 0;
  let ACTION = 0;
  let STATE = 'NORMAL';

  const ACTION_UP = 1;
  const ACTION_DOWN = 4;
  const ACTION_LEFT = 8;
  const ACTION_RIGHT = 16;

  const update = () => {
    if (ACTION == 0) {
      STATE = 'NORMAL';
    } else {
      if ((ACTION & ACTION_UP) == ACTION_UP) {
        TOP -= 1 * VELOCITY;
      }
      if ((ACTION & ACTION_DOWN) == ACTION_DOWN) {
        TOP += 1 * VELOCITY;
      }
      if ((ACTION & ACTION_LEFT) == ACTION_LEFT) {
        STATE = 'TURNING_LEFT';
        LEFT -= 1 * VELOCITY;
      }
      if ((ACTION & ACTION_RIGHT) == ACTION_RIGHT) {
        STATE = 'TURNING_RIGHT';
        LEFT += 1 * VELOCITY;
      }
    }
  };

  const draw = () => {
    sprite('PLAYER', STATE, LEFT, TOP);
  };

  const fire = () => {
    
  };

  const addAction = (action) => {
    ACTION |= action;
  };

  const removeAction = (action) => {
    ACTION &= ~action;
  };

  const handleKey = () => function (e) {
    switch (e.keyCode) {
      case 37:
      case 65:
        e.type == 'keydown' ? addAction(ACTION_LEFT) : removeAction(ACTION_LEFT);
        break;
      case 39:
      case 68:
        e.type == 'keydown' ? addAction(ACTION_RIGHT) : removeAction(ACTION_RIGHT);
        break;
      case 38:
      case 87:
        e.type == 'keydown' ? addAction(ACTION_UP) : removeAction(ACTION_UP);
        break;
      case 40:
      case 83:
        e.type == 'keydown' ? addAction(ACTION_DOWN) : removeAction(ACTION_DOWN);
        break;
      case 32:
        fire();
        break;
    }
  };

  const handleKeyDown = handleKey();
  const handleKeyUp = handleKey();

  const init = () => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  };

  const destroy = () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };

  return { draw, init, destroy, update };
};

const RR2KMap = (context) => {
  const MAP_LOOP_INTERVAL = 100;
  const VELOCITY = 1;
  let mapSlice;
  let sliceIndice = 0;

  const nextMapSlice = () => {
    sliceIndice++;
    return gameMatrix.slice(((sliceIndice * 128) * VELOCITY) * - 1, -128);
  };

  const init = () => {
  };

  const destroy = () => {
  };

  const update = () => {
    mapSlice = nextMapSlice();
  };

  const draw = () => {
    context.save();
    for (var y = 0; y < 128; y++) {
      for (var x = 0; x < 128; x++) {
        context.fillStyle = COLOR_MAP[mapSlice[x + (y * 128)]];
        context.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
    context.restore();
  };

  return { draw, init, destroy, update };
};

const RR2KGame = (context) => {
  const map = RR2KMap(context);
  const player = RR2KPlayer(context);

  let STARTED = false;
  let SPRITES = [];

  const update = () => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.fillStyle = COLOR_MAP[1];
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    map.update();
    player.update();
  };

  const draw = () => {
    if (!STARTED) return;
    update();
    map.draw();
    player.draw();
    requestAnimationFrame(draw);
  };

  const start = () => {
    STARTED = true;
    init();
  };

  const stop = () => {
    STARTED = false;
    map.stop();
    player.stop();
  };

  const init = () => {
    map.init();
    player.init();
    requestAnimationFrame(draw);
  };

  const destroy = () => {
    player.destroy();
    map.destroy();
  };

  return { start, destroy };
};

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const rr2k = RR2KGame(context);
rr2k.start();
})();
