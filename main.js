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

const RR2KBullets = (context) => {
  let VELOCITY = 1.5;
  let MAX = 2;

  const bullets = [];

  const spawn = (top, left) => {
    if (bullets.length > MAX) return;
    bullets.push({top, left});
  };

  const kill = (i) => {
    const bullet = bullets.splice(i, 1);
  };

  const draw = () => {
    bullets.forEach((bullet, i) => {
      bullet.top -= 1 * VELOCITY;
      context.fillStyle = COLOR_MAP[2];
      context.fillRect(bullet.left * PIXEL_SIZE-1, bullet.top * PIXEL_SIZE-1, PIXEL_SIZE+1, (PIXEL_SIZE * 2)+1);
      if (bullet.top < 0) kill(i);
    });
  };

  return { spawn, kill, draw };
};

const RR2KPlayer = (context) => {
  let VELOCITY = 2;
  let LEFT = 54;
  // let TOP = 119;
  let TOP = 0;
  let ACTION = 0;
  let STATE = 'NORMAL';
  let bullet = RR2KBullets(context);

  const ACTION_UP = 1;
  const ACTION_DOWN = 4;
  const ACTION_LEFT = 8;
  const ACTION_RIGHT = 16;

  const update = () => {
    if (ACTION == 0) {
      STATE = 'NORMAL';
    } else {
      if ((ACTION & ACTION_UP) == ACTION_UP && TOP > 0) {
        TOP -= 1 * VELOCITY;
      }
      if ((ACTION & ACTION_DOWN) == ACTION_DOWN && TOP < 119) {
        TOP += 1 * VELOCITY;
      }
      if ((ACTION & ACTION_LEFT) == ACTION_LEFT && LEFT > 0) {
        STATE = 'TURNING_LEFT';
        LEFT -= 1 * VELOCITY;
      }
      if ((ACTION & ACTION_RIGHT) == ACTION_RIGHT && LEFT < 119) {
        STATE = 'TURNING_RIGHT';
        LEFT += 1 * VELOCITY;
      }
    }
  };

  const draw = () => {
    context.save();
    bullet.draw();
    context.restore();
    context.save();
    sprite('PLAYER', STATE, LEFT, TOP);
    context.restore();
  };

  const fire = () => {
    bullet.spawn(TOP, LEFT + 4);
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
        e.type == 'keydown' && fire();
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
  const VELOCITY = 0.09;
  let mapSlice;
  let sliceIndice = 0;
  let TOP = -8;

  const nextMapSlice = () => {
    sliceIndice++;
    return gameMatrix.slice(sliceIndice * 256, sliceIndice * 512);
  };

  const init = () => {
    mapSlice = nextMapSlice();
  };

  const destroy = () => {
  };

  const update = () => {
    TOP += VELOCITY;
    if (TOP > 8) {
      mapSlice = nextMapSlice();
      console.log(mapSlice)
      TOP = 0;
    }
  };

  const draw = () => {
    context.restore();
    context.save();
    // for (var y = 0; y < 128; y++) {
    //   for (var x = 0; x < 128; x++) {
    //     context.fillStyle = COLOR_MAP[mapSlice[x + (y * 128)]];
    //     context.fillRect(x * PIXEL_SIZE-1, y * PIXEL_SIZE-1, PIXEL_SIZE+1, PIXEL_SIZE+1);
    //   }
    // }

    for (var y = 0; y < 16; y++) {
      for (var x = 0; x < 16; x++) {
        if (mapSlice[x + (y * 16)]) sprite('MAP', mapSlice[x + (y * 16)], x * 8, (y + TOP) * 8);
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

class Player extends Component {
  _acceleration = 0.4;
  _scale = 6;
  _state = 'IDLE';

  start() {
    Object.keys(SPRITES.PLAYER).forEach((key) => {
      const { width, height, matrix } = SPRITES.PLAYER[key];
      this.sprites.set(key, new Sprite(width, height, this._scale, matrix));
    });

    this.transform.position.x = 400 - (this.sprites.get(this._state).width / 2);
    this.transform.position.y = 800 - this.sprites.get(this._state).height;
  }

  getSprite() {
    return this.sprites.get(this._state);
  }

  getBoxColider() {
    return {
      width: this.sprites.get('IDLE')?.width || 0,
      height: this.sprites.get('IDLE')?.height || 0
    };
  }

  onCollision(other) {
    console.log('collision', other);
  }

  update() {
    const directionX = Input.keyState[Input.keyCode.LEFT] ? -1 : Input.keyState[Input.keyCode.RIGHT] ? 1 : 0;

    switch (directionX) {
      case -1:
        this._state = 'TURNING_LEFT';
        break;
      case 1:
        this._state = 'TURNING_RIGHT';
        break;
      default:
        this._state = 'IDLE';
    }

    this.transform.position.x += directionX * this._acceleration * Time.deltaTime;
  }
}

class Player2 extends Component {
  _state = 'IDLE';

  start() {
    Object.keys(SPRITES.PLAYER).forEach((key) => {
      const { width, height, matrix } = SPRITES.PLAYER[key];
      this.sprites.set(key, new Sprite(width, height, 7, matrix));
    });

    this.transform.position.x = 400 - (this.sprites.get(this._state).width / 2) + 55;
    this.transform.position.y = 800 - this.sprites.get(this._state).height;
  }

  getBoxColider() {
    return {
      width: this.sprites.get('IDLE')?.width || 0,
      height: this.sprites.get('IDLE')?.height || 0
    };
  }

  getSprite() {
    return this.sprites.get(this._state);
  }
}


const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
// const rr2k = RR2KGame(context);
// rr2k.start();

Registry.register('Player', new Player());
Registry.register('Player2', new Player2());

const engine = new Engine(context);
engine.start();

})();
