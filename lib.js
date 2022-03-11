class Point {
  x = 0;
  y = 0;
  z = 0;

  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static zero() {
    return new Point(0, 0, 0);
  }
}

class Random {
  static seed = 0;

  static range(min, max) {
    const x = Math.sin(Random.seed++) * 10000;
    return Math.floor(min + x % (max - min));
  }
}

class Trasform {
  position = Point.zero();

  constructor(position) {
    this.position = position || Point.zero();
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

  static perlinNoise(x, y) {
    const n = x + y * 57;
    return (1 + Math.sin(n)) / 2;
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
        tmpContext.fillStyle = PALETTE[matrix[x + (y * height)]];
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
  skipColision = false;

  constructor(position) {
    this.transform = new Trasform(position);
  }

  getSprite() {
  }

  getBoxColider() {
    return {
      width: this.sprites.get('default')?.width || 0,
      height: this.sprites.get('default')?.height || 0
    };
  }

  onCollision() {
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
        const filteredComponents = new Map(
          Array.from(Registry.getComponents()).filter(([key, value]) => {
            return value !== component && !value.skipColision;
          })
        );
        filteredComponents.forEach((otherComponent) => {
          if (component === otherComponent) return;
          const coliderA = component.getBoxColider();
          const coliderB = otherComponent.getBoxColider();
          const a = component.transform.position;
          const b = otherComponent.transform.position;
          const x = Math.abs(a.x - b.x);
          const y = Math.abs(a.y - b.y);
          if (x < coliderA.width / 2 + coliderB.width / 2 && y < coliderA.height / 2 + coliderB.height / 2) {
            component.onCollision(otherComponent);
            otherComponent.onCollision(component);
          }
        });
      });

      Registry.getComponents().forEach((component) => {
        component.update();
        const sprite = component.getSprite();
        if (sprite?.image) {
          this.ctx.drawImage(sprite.image, component.transform.position.x, component.transform.position.y);
        }
      });

      this.frameId = requestAnimationFrame(loop);
    };
    loop();
  }
}

