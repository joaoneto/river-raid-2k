const COLOR_MAP = {
  0: 'rgba(255,255,255,0)',
  1: '#0000ff',
  2: '#ffff00',
  3: '#ffffff',
  4: '#00ff00',
  5: '#ff00ff',
};

class Point {
  x = 0;
  y = 0;
  z = 0;

  static zero = new Point(0, 0, 0);

  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Trasform {
  position = Point.zero;

  constructor(position = Point.zero) {
    this.position = position;
  }
}

class Time {
  static deltaTime = 0;
  static lastTime = 0;

  static now() {
    return performance.now();
  }

  static update() {
    const now = Time.now();
    Time.deltaTime = now - Time.lastTime;
    Time.lastTime = now;
  }
}

class Utils {
  static lerp(a, b, t) {
    return a + (b - a) * t;
  }
}

class Registry {
  static components = new Map();

  static register(name, component) {
    Registry.components.set(name, component);
  }

  static getComponents() {
    return Registry.components;
  }
}

class Input {
  static keyCode = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN',
    32: 'SPACE',
  };

  static keyState = {
    [Input.keyCode.LEFT]: false,
    [Input.keyCode.UP]: false,
    [Input.keyCode.RIGHT]: false,
    [Input.keyCode.DOWN]: false,
    [Input.keyCode.SPACE]: false,
  };

  static handler = (e) => {
    if (Input.keyCode[e.keyCode]) {
      Input.keyState[e.keyCode] = e.type == 'keydown';
    }
  }

  static listen() {
    document.addEventListener('keydown', Input.handler);
    document.addEventListener('keyup', Input.handler);
  }

  static unlisten() {
    document.removeEventListener('keydown', Input.handler);
    document.removeEventListener('keyup', Input.handler);
  }
}

class Sprite {
  image = null;
  width = 0;
  height = 0;
  
  constructor(width, height, scale, matrix) {
    const tmpCanvas = document.createElement('canvas');
    const tmpContext = tmpCanvas.getContext('2d');

    this.width = width * scale;
    this.height = height * scale;
    tmpCanvas.width = width * scale;
    tmpCanvas.height = height * scale;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        tmpContext.fillStyle = COLOR_MAP[matrix[x + (y * height)]];
        tmpContext.fillRect(x * scale - 1, y * scale - 1, scale + 1, scale + 1);
      }
    }

    this.image = new Image();
    this.image.src = tmpCanvas.toDataURL();
  }
}

class Component {
  transform = new Trasform();
  sprites = new Map();

  getSprite() {
    throw new Error('Component.getSprite() must be implemented');
  }

  start() {
  }

  update() {
  }
}

class Engine {
  frameId = 0;
  fps = 0;
  paused = false;
  ctx = null;

  constructor(ctx) {
    this.ctx = ctx;
  }

  reset() {
    this.frameId = 0;
    this.fps = 0;
    this.paused = false;
  }

  start() {
    Registry.getComponents().forEach((component) => {
      component.start();
    });
    this.resume();
  }

  stop() {
    this.pause();
    this.reset();
  }

  pause() {
    cancelAnimationFrame(this.frameId);
    Input.unlisten();
  }

  resume() {
    Input.listen();
    this.update();
  }

  update() {
    const loop = () => {
      if (this.paused) return;
      Time.update();
      this.fps = 1000 / Time.deltaTime;
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      Registry.getComponents().forEach((component) => {
        component.update();
        this.ctx.drawImage(component.getSprite().image, component.transform.position.x, component.transform.position.y);
      });
      this.frameId = requestAnimationFrame(loop);
    };
    loop();
  }
}

