class Point {
  x = 0;
  y = 0;

  constructor(x, y, z) {
    this.x = x;
    this.y = y;
  }

  static zero() {
    return new Point(0, 0);
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
  scale = Point.zero();
  parent = null;

  constructor(position) {
    this.position = position || Point.zero();
    this.scale = new Point(1, 1);
    this.parent = null;
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

  static noise(x, y) {
    const n = x + y * 57;
    return (1 + Math.sin(n)) / 2;
  }
}

class Registry {
  static components = new Map();

  static register(name, component) {
    component.start();
    Registry.components.set(name, component);
  }

  static get(name) {
    return Registry.components.get(name);
  }

  static getComponents() {
    return Registry.components;
  }

  static remove(name) {
    const currentComponent = Registry.get(name);

    Registry.getComponents().forEach((childComponent, childName) => {
      if (childComponent.transform.parent?.name === currentComponent.name) {
        Registry.components.delete(childName);
      }
    });
    
    Registry.components.delete(name);
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
    const parentTransform = this.transform.parent?.transform || new Trasform();
    return {
      x: this.transform.position.x - parentTransform.position.x,
      y: this.transform.position.y - parentTransform.position.y,
      width: this.sprites.get('default')?.width * this.transform.scale.x || 0,
      height: this.sprites.get('default')?.height * this.transform.scale.y || 0
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
  fps = 0;
  paused = false;
  /**
   * @type {CanvasRenderingContext2D}
   */
  context = null;
  /**
   * @type {CanvasRenderingContext2D}
   */
  debugContext = null;

  constructor({ context, debugContext }) {
    this.context = context;
    this.debugContext = debugContext;
  }

  reset() {
    this.fps = 0;
    this.paused = false;
  }

  start() {
    if (!this.paused) {
      Input.listen();
      this._executeUpdateLoop();
    }
  }

  stop() {
    this.pause();
    this.reset();
  }

  pause() {
    if (!this.paused) {
      Input.unlisten();
      this.paused = true;
    }
  }

  resume() {
    if (this.paused) {
      Input.listen();
      this.paused = false;
      this.start();
    }
  }

  _executeLater(fn) {
    requestAnimationFrame(fn);
  }

  _executeUpdateLoop() {
    const loop = () => {
      if (this.paused) return;
      Time.update();
      this.fps = 1000 / Time.deltaTime;
      this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);

      // low priority
      this._executeLater(() => {
        if (DEBUG) {
          this.debugContext.clearRect(0, 0, this.debugContext.canvas.width, this.debugContext.canvas.height);
          this.debugContext.font = '12px Arial';
          this.debugContext.fillStyle = '#000';
          this.debugContext.fillText(`FPS: ${this.fps}`, 10, 20);
          this.debugContext.fillText(`Last time: ${Time.lastTime}`, 10, 40);
          this.debugContext.fillText(`Delta: ${Time.deltaTime}`, 10, 60);
        }

        Registry.getComponents().forEach((component) => {
          const filteredComponents = new Map(
            Array.from(Registry.getComponents()).filter(([key, value]) => {
              return value !== component && !value.skipColision;
            })
          );
          filteredComponents.forEach((otherComponent) => {
            if (component === otherComponent) return;
            const a = component.getBoxColider();
            const b = otherComponent.getBoxColider();

            if (
              a.x < b.x + b.width &&
              a.x + a.width > b.x &&
              a.y < b.y + b.height &&
              a.height + a.y > b.y
            ) {
              component.onCollision(otherComponent);
              otherComponent.onCollision(component);
              if (DEBUG) {
                this.debugContext.fillStyle = '#F00';
                this.debugContext.fillRect(a.x, a.y, a.width, a.height);
                this.debugContext.fillRect(b.x, b.y, b.width, b.height);
              }
            }
          });
        });
      });

      Registry.getComponents().forEach((component) => {
        component.update();
        const sprite = component.getSprite();
        if (sprite?.image) {
          const parentPosition = component.transform.parent?.transform.position || Point.zero();
          this.context.drawImage(
            sprite.image,
            component.transform.position.x - parentPosition.x,
            component.transform.position.y - parentPosition.y,
            sprite.width * component.transform.scale.x,
            sprite.height * component.transform.scale.y
          );

          this._executeLater(() => {
            if (DEBUG) {
              this.debugContext.strokeStyle = '#00F';
              this.debugContext.lineWidth = 1;
              this.debugContext.strokeRect(
                component.transform.position.x - parentPosition.x,
                component.transform.position.y - parentPosition.y,
                sprite.width * component.transform.scale.x,
                sprite.height * component.transform.scale.y,
              );
            }
          });
        }
      });

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

