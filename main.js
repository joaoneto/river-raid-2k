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
    // console.log('collision', other);
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

    this.transform.position.x = Utils.interpolate(
      this.transform.position.x,
      this.transform.position.x + (directionX * this._acceleration),
      Time.deltaTime * 0.6
    );
  }
}

const grassSprite = new Sprite(1, 1, TILE_SIZE, [4]);
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
    const { width, height, matrix } = SPRITES.HELICOPTER.IDLE;
    this.sprites.set('default', new Sprite(width, height, 4, matrix));
  }

  getSprite() {
    return this.sprites.get('default');
  }
}

class Ship extends Component {
  start() {
    const { width, height, matrix } = SPRITES.SHIP.IDLE;
    this.sprites.set('default', new Sprite(width, height, 6, matrix));
  }

  getSprite() {
    return this.sprites.get('default');
  }
}

class MapChunk extends Component {
  _grassCount = 0;
  _enemyCount = 0;

  _mapSize = {
    width: 800 / TILE_SIZE,
    height: 800 / TILE_SIZE
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
    const enemyType = Random.range(0, 1);
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
    const frequency = 0.068;
    const seed = Random.range(-10, this._mapSize.width);
    const halfMapWidth = this._mapSize.width / 2;
    
    for (let y = 0; y < this._mapSize.height; y++) {
      const noiseFactor = Math.abs(Utils.perlin(seed * frequency, (y + seed) * frequency));
      const noiseWidth = 1 + Math.floor(noiseFactor * halfMapWidth);
      // left grass
      this._spawnTile(new Point(0, y * TILE_SIZE), noiseWidth);
      
      // enemies
      if (y %  4 == 0) {
        this._spawnEnemy(new Point((halfMapWidth + (halfMapWidth - noiseWidth - 6) * 2) * TILE_SIZE, y * TILE_SIZE));
      }
      
      //  middle grass
      if (noiseWidth + 7 < halfMapWidth && y < this._mapSize.height - 3) {
        this._spawnTile(new Point((noiseWidth + 7) * TILE_SIZE, y * TILE_SIZE), (halfMapWidth - noiseWidth - 7) * 2);
      }
      // right grass
      this._spawnTile(new Point((this._mapSize.width * TILE_SIZE) - (noiseWidth * TILE_SIZE), y * TILE_SIZE), noiseWidth);
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

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const engineLayers = { context, debugContext: null };

const mapManager = new MapManager();
Registry.register('Player', new Player());

const engine = new Engine(engineLayers);
engine.start();

document.querySelector('.pause-game').onclick = () => engine.pause();
document.querySelector('.resume-game').onclick = () => engine.resume();
document.querySelector('.toggle-debug').onclick = () => {
  DEBUG = !DEBUG;
  const debubCanvas = document.getElementById('debug');
  if (DEBUG) {
    debubCanvas.style.display = 'block';
    engine.debugContext =  debubCanvas.getContext('2d');
  } else {
    debubCanvas.style.display = 'none';
    engine.debugContext = null;
  }
}
})();
