(function () {
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
      x: this.transform.position.x ,
      y: this.transform.position.y,
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
    // this.transform.position.y -= 0.2 * Time.deltaTime;
    // context.translate(0, 0.2 * Time.deltaTime);
  }
}

const grassSprite = new Sprite(1, 1, 8, [4]);
class Grass extends Component {
  skipColision = true;

  start() {
    this.sprites.set('default', grassSprite);
  }

  getSprite() {
    return this.sprites.get('default');
  }
}

class Helicopter extends Component {
  start() {
    this.sprites.set('default', new Sprite(10, 10, 6, SRITES.HELICOPTER));
  }
}

class Ship extends Component {
  start() {
    this.sprites.set('default', new Sprite(10, 10, 6, SRITES.SHIP));
  }
}

class MapChunk extends Component {
  _grassCount = 0;
  _enemyCount = 0;

  _tileSize = 8;
  _mapSize = {
    width: 800 / 8,
    height: 800 / 8
  };
  
  constructor(position) {
    super(position);
    this.name = `MapChunk:${mapLevel}`;
    this._build();
  }

  _spawnTile(position, noiseWidth = 1) {
    const grassComponent = new Grass(position);
    grassComponent.transform.parent = this;
    grassComponent.transform.scale.x = noiseWidth;
    Registry.register(`Grass:${this.name}:${this._grassCount}`, grassComponent);
    this._grassCount++;
  }

  _spawnEnemy(position) {
    const enemyType = Random.range(0, 2);
    let enemyComponent;

    switch (enemyType) {
      case 0:
        enemyComponent = new Helicopter(position);
        break;
      case 1:
        enemyComponent = new Ship(position);
        break;
      }

      enemyComponent.transform.parent = this;
      Registry.register(`Enemy:${this.name}:${this._enemyCount}`, enemyComponent);
      this._enemyCount++;
  }

  _build() {
    const randomSeed = Random.range(0.001, 1.001);
    const frequency = 0.002;
    const seed = randomSeed * 0.0016;
    
    for (let y = 0; y < this._mapSize.height; y++) {
      const noiseWidth = Math.max(1, Math.round(Utils.noise(seed * frequency, (y + seed) * frequency) * (this._mapSize.width - 10) / 2));
      // left grass
      this._spawnTile(new Point(0, y * this._tileSize), noiseWidth);
      // right grass
      this._spawnTile(new Point((this._mapSize.width * this._tileSize) - ((noiseWidth+1) * this._tileSize), y * this._tileSize), noiseWidth);
    }
  }

  update() {
    this.transform.position.y -= 0.16 * Time.deltaTime;
    if (this.transform.position.y < -790) {
      mapManager.spawnMapChunk();
      Registry.remove(this.name);
    }
  }
}

let mapLevel = 0;

class MapManager {
  constructor() {
    Random.seed = 12345;
    for (let i = mapLevel; i < 2; i++) {
        this.spawnMapChunk();
    }
  }

  spawnMapChunk() {
    const previousMapChunkPositionY = Registry.get(`MapChunk:${mapLevel - 1}`)?.transform.position.y || -790;
    const newMapChunk = new MapChunk(new Point(0, previousMapChunkPositionY + 800));
    Registry.register(`MapChunk:${mapLevel}`, newMapChunk);
    mapLevel++;
  }
}

DEBUG = true;

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const engineLayers = { context };

if (DEBUG) {
  const debugCanvas = document.getElementById('debug');
  const debugContext = debugCanvas.getContext('2d');
  engineLayers.debugContext = debugContext;
}

const mapManager = new MapManager();
Registry.register('Player', new Player());

const engine = new Engine(engineLayers);
engine.start();

document.querySelector('.pause-game').onclick = () => engine.pause();
document.querySelector('.resume-game').onclick = () => engine.resume();
})();
