import * as THREE from 'three';
import BLOCKS from './blocks.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const WIDTH = 10;
const HEIGHT = 10;
const TREE_COUNT = 6;

let textureCache = {}

const manager = new THREE.LoadingManager();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 3000 );

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor("deepskyblue")
renderer.setSize( window.innerWidth, window.innerHeight );
// We will set animation loop after loading
// renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );
camera.position.z = 0;
camera.position.x = 0;
camera.position.y = 0;

let clock = new THREE.Clock();

let controls = new FirstPersonControls(camera, document.body);
controls.lookSpeed = 0.08;
controls.movementSpeed = 0;
controls.noFly = true;
controls.lookVertical = true;
controls.verticalMin = 1.0;
controls.verticalMax = 2.0;
controls.lon = 0;
controls.lat = 0;

let cubes = [];
let direction = new THREE.Vector3()

function addBlock(block, x, y, z)
{

  let material, materialtop, materialbottom;

  if (textureCache[block.name] == undefined) {
    const textureLoader = new THREE.TextureLoader(manager); // Use the manager here
    const texture = textureLoader.load(block.sidetexture);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace

    const toptexture = textureLoader.load(block.toptexture);
    toptexture.wrapS = THREE.RepeatWrapping;
    toptexture.wrapT = THREE.RepeatWrapping;
    toptexture.colorSpace = THREE.SRGBColorSpace

    const bottomtexture = textureLoader.load(block.bottomtexture);
    bottomtexture.wrapS = THREE.RepeatWrapping;
    bottomtexture.wrapT = THREE.RepeatWrapping;
    bottomtexture.colorSpace = THREE.SRGBColorSpace

    material = new THREE.MeshBasicMaterial({
        map: texture,
    });
    materialtop= new THREE.MeshBasicMaterial({
        map: toptexture
    });

    materialbottom = new THREE.MeshBasicMaterial({
        map: bottomtexture
    });
    textureCache[block.name] = {sidetexture : material, toptexture: materialtop, bottomtexture: materialbottom}
  } else {
    material = textureCache[block.name].sidetexture;
    materialtop = textureCache[block.name].toptexture;
    materialbottom = textureCache[block.name].bottomtexture;
  }

  const geometry = new THREE.BoxGeometry( 1, 1, 1 );
  const cube = new THREE.Mesh( geometry, [material, material, materialtop, materialbottom, material, material] );
  cubes.push(cube)
  cube.position.set(x, y, z);
  scene.add( cube );
}

function isStandingOn()
{
  let x = camera.position.x
  let y = camera.position.y
  let z = camera.position.z

  for (let cube of cubes) {
    if ( y > cube.position.y && Math.abs(y - cube.position.y) < 2) {
      if (Math.abs(x - cube.position.x) < 1  && Math.abs(z - cube.position.z) < 1){
        return true;
      }
    }
  }

  return false
}

function canMoveTo(targetPosition) {
    let x = targetPosition.x;
    let y = targetPosition.y;
    let z = targetPosition.z;

    for (let cube of cubes) {
      if ((Math.abs(cube.position.x - x) < 0.9 && Math.abs(cube.position.z - z) < 0.9) && cube.position.y > y - 1 && cube.position.y < y + 1) {
        return false;
      }
    }
    return true;
}

// 2. Initial setup of the loading screen
const loadingScreen = document.getElementById('loading-screen');
if (loadingScreen) {
    loadingScreen.style.display = 'flex'; // Show the loading screen initially
}

// 3. Use the LoadingManager's events
manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
	console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    // You can update a progress bar here if you have one
    if (loadingScreen) {
        loadingScreen.innerHTML = `Loading... ${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
    }
	console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

manager.onLoad = function ( ) {
    console.log( 'Loading Complete!');
    // 4. Hide the loading screen and start the animation loop when everything is loaded
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    renderer.setAnimationLoop( animate );
};

manager.onError = function ( url ) {
	console.log( 'There was an error loading ' + url );
};

// --- Your existing game logic after the loading manager setup ---
for (let i = -10; i < WIDTH; ++i) {
  for (let j = -10; j < HEIGHT; ++j) {
    addBlock(BLOCKS.grass, i, -5, j)
  }
}

for (let i = -10; i < WIDTH; ++i) {
  for (let j = -10; j < HEIGHT; ++j) {
    addBlock(BLOCKS.stone, i, -6, j)
  }
}

for (let i = 0; i < TREE_COUNT; ++i) {
  let x = getRandomInt(HEIGHT + 10) - 10
  let y = getRandomInt(WIDTH + 10) - 10
  let height = getRandomInt(3) + 3
  for (let j = 0; j < height; ++j) {
    addBlock(BLOCKS.wood, x, j - 4, y)
  }
  addBlock(BLOCKS.leaf, x, height - 4, y)
  addBlock(BLOCKS.leaf, x, height - 5, y - 1)
  addBlock(BLOCKS.leaf, x - 1, height - 5, y)
  addBlock(BLOCKS.leaf, x, height - 5, y + 1)
  addBlock(BLOCKS.leaf, x + 1, height - 5, y)
  
}

let isMovingFront = false;
let isMovingBack = false

let isMovingLeft = false;
let isMovingRight = false;

let canJump = false;
let jumpIteration = 0;


window.addEventListener('keydown', (e) => { 
  if (e.key == 'w') {
    isMovingFront = true;
  } else if (e.key == 's') {
    isMovingBack = true;
  } else if (e.key == 'a') {
    isMovingLeft = true;
  } else if (e.key == 'd') {
    isMovingRight = true;
  } else if (e.key == ' ' && canJump) {
    jumpIteration = 100;
  }
})

window.addEventListener('keyup', (e) => {
  if (e.key == 'w') {
    isMovingFront = false;
  } else if (e.key == 's') {
    isMovingBack = false;
  } else if (e.key == 'a') {
    isMovingLeft = false;
  } else if (e.key == 'd') {
    isMovingRight = false;
  }
})


function animate() {

  let delta = clock.getDelta();

  let speed = 5 * delta;

  if (isMovingFront) {
    let clonedCamerapos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z)
    camera.getWorldDirection(direction);
    direction.y = 0;
    clonedCamerapos.addScaledVector(direction, speed);
    if (canMoveTo(clonedCamerapos)) {
      camera.position.addScaledVector(direction, speed);
    }
  }

  if (isMovingBack) {
    let clonedCamerapos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z)
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.x = direction.x * -1
    direction.z = direction.z * -1
    clonedCamerapos.addScaledVector(direction, speed);
    if (canMoveTo(clonedCamerapos)) {
      camera.position.addScaledVector(direction, speed);
    }
  }

  if (isMovingLeft) {
    let clonedCamerapos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z)
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    clonedCamerapos.addScaledVector(direction, speed);
    if (canMoveTo(clonedCamerapos)) {
      camera.position.addScaledVector(direction, speed);
    }
  }

  if (isMovingRight) {
    let clonedCamerapos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z)
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    clonedCamerapos.addScaledVector(direction, speed);
    if (canMoveTo(clonedCamerapos)) {
      camera.position.addScaledVector(direction, speed);
    }
  }

  if (jumpIteration > 0) {
    camera.position.y += 0.3 * (jumpIteration / 100);
    jumpIteration = Math.max(0, jumpIteration - (200 * delta))
  }

  if (!isStandingOn()) {
    camera.position.y -= 0.1
    canJump = false;
  } else if (jumpIteration == 0) {
    canJump = true;
  }


  controls.update(delta);
  renderer.render( scene, camera );

}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
})