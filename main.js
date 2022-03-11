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

    this.transform.position.x += directionX * this._acceleration * Time.deltaTime;
    // this.transform.position.y -= 0.2 * Time.deltaTime;
    // context.translate(0, 0.2 * Time.deltaTime);
  }
}

class Grass extends Component {
  skipColision = true;

  start() {
    this.sprites.set('default', new Sprite(1, 1, 20, [4]));
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
  grassCount = 0;
  enemyCount = 0;

  _tileSize = 20;
  _mapSize = {
    width: 800 / 20,
    height: 800 / 20
  };
  
  start() {
    this._build();
  }

  _spawnTile(position) {
    const newGrass = new Grass();
    newGrass.transform.position = position;
    Registry.register(`Grass${this.grassCount++}`, newGrass);
  }

  _spawnEnemy(position) {
    const enemyType = Random.range(0, 2);

    switch (enemyType) {
      case 0:
        Registry.register(`Enemy${this.enemyCount++}`, new Helicopter(position));
        break;
      case 1:
        Registry.register(`Enemy${this.enemyCount++}`, new Ship(position));
        break;
    }
  }

  _build() {
    const randomSeed = Random.seed;
    const frequency = 0.001;
    const seed = MapManager.mapLevel +  1 * randomSeed * 0.001;
    
    for (let y = 0; y < this._mapSize.height; y++) {
      const noiseWidth = Math.round(Utils.perlinNoise(seed * frequency, (y + seed) * frequency) * (this._mapSize.width - 4) / 2);

      for (let x = 0; x < noiseWidth; x++) {
        this._spawnTile(new Point(x * this._tileSize, y * this._tileSize));
        this._spawnTile(new Point((this._mapSize.width * this._tileSize) - (x * this._tileSize), y * this._tileSize));
      }
    }
  }

  uppdate() {

  }
}

class MapManager extends Component {
  static mapLevel = 0;

  start() {
    Random.seed = 12345;
    for (let i = MapManager.mapLevel; i < 4; i++) {
        this.spawnMapChunk();
    }
  }

  spawnMapChunk() {
    console.log('spawnMapChunk');
    const newMapChunk = new MapChunk(new Point(0, MapManager.mapLevel * -800));
    console.log('newMapChunk', newMapChunk.transform.position);
    // newMapChunk.transform.position = new Point(0, MapManager.mapLevel * -800);
    Registry.register(`MapChunk${MapManager.mapLevel++}`, newMapChunk);
    MapManager.mapLevel++;
  }
}

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

Registry.register('Player', new Player());
Registry.register('MapManager', new MapManager());

// const newGrass = new Grass();
// newGrass.transform.position = new Point(400, 800);
// Registry.register(`Grass${MapManager.grassCount++}`, newGrass);

const engine = new Engine(context);
engine.start();

})();
