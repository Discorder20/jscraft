import * as THREE from 'three';
import BLOCKS from './blocks.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { itemCollected, placeCurrentItem } from './toolbar.js';
import { WIDTH, HEIGHT, TREE_COUNT } from './constansts.js';
import addNewBlock from './addblock.js';
import mobileCheck from './mobilecheck.js';

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function addBlock(block, x, y, z) {
  addNewBlock(block, x, y, z, scene, instancedMeshes, instancedMeshCounts, textureCache, manager)
}

let loaded = false;

if (mobileCheck()) {
  const errorMsg = `This game is designed for desktop usage, you can't open it on this mobile device`;
  document.body.innerHTML = `
   <div class="menu" style="background-image: url(./images/menu.webp); width: 100vw; height: 100vh; z-index: 50; background-repeat: repeat; position: absolute; display: flex; flex-direction: column; align-items: center; background-color:#1e100b;">
        <p style="text-align: center; color: white">${errorMsg}</p>
    </div>`
  throw new Error(errorMsg)
}

const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const whitematerial = new THREE.MeshBasicMaterial({color: "white", transparent: true, opacity: 0.2})
const highlightblock = new THREE.Mesh(geometry, whitematerial);

let textureCache = {}
const instancedMeshes = {};

const manager = new THREE.LoadingManager();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 3000 );
const renderer = new THREE.WebGLRenderer();
const rayCaster = new THREE.Raycaster();
let mousePosition = new THREE.Vector2();
let clock = new THREE.Clock();

scene.add(highlightblock)

renderer.setClearColor("deepskyblue")
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
camera.position.z = 0;
camera.position.x = 0;
camera.position.y = 0;

let controls = new FirstPersonControls(camera, document.body);
controls.lookSpeed = 0.08;
controls.movementSpeed = 0;
controls.noFly = true;
controls.lookVertical = true;
controls.lon = 0;
controls.lat = 0;

let lastMouseX = null;
let lastMouseY = null;
document.body.addEventListener('mousemove', (e) => {
  if (lastMouseX !== null && lastMouseY !== null) {
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    controls.lon -= deltaX * controls.lookSpeed * 2;
    controls.lat -= deltaY * controls.lookSpeed * 2;
    controls.lat = Math.max(-85, Math.min(85, controls.lat));
  }
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

const instancedMeshCounts = {};
let direction = new THREE.Vector3()

const blockPositions = [];
function addBlockPosition(x, y, z) {
  blockPositions.push({ x, y, z });
}

function isStandingOn() {
  let x = camera.position.x;
  let y = camera.position.y;
  let z = camera.position.z;
  for (let pos of blockPositions) {
    if (y > pos.y && Math.abs(y - pos.y) < 2) {
      if (Math.abs(x - pos.x) < 0.6 && Math.abs(z - pos.z) < 0.6) {
        return true;
      }
    }
  }
  return false;
}

function canMoveTo(targetPosition) {
  let x = targetPosition.x;
  let y = targetPosition.y;
  let z = targetPosition.z;
  for (let pos of blockPositions) {
    if ((Math.abs(pos.x - x) < 0.8 && Math.abs(pos.z - z) < 0.8) && pos.y > y - 1 && pos.y < y + 1) {
      return false;
    }
  }
  return true;
}

const loadingScreen = document.getElementById('loading-screen');
if (loadingScreen) {
    loadingScreen.style.display = 'flex';
}

manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
  console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    if (loadingScreen) {
        loadingScreen.innerHTML = `Loading... ${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
    }
  console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

manager.onLoad = function ( ) {
    console.log( 'Loading Complete!');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    loaded = true;
};

manager.onError = function ( url ) {
  console.log( 'There was an error loading ' + url );
};

for (let i = -10; i < WIDTH; ++i) {
  for (let j = -10; j < HEIGHT; ++j) {
    addBlock(BLOCKS.grass, i, -5, j);
    addBlockPosition(i, -5, j);
    addBlock(BLOCKS.dirt, i, -6, j);
    addBlockPosition(i, -6, j);
    addBlock(BLOCKS.stone, i, -7, j);
    addBlockPosition(i, -7, j);
    addBlock(BLOCKS.stone, i, -8, j);
    addBlockPosition(i, -8, j);
    addBlock(BLOCKS.stone, i, -9, j);
    addBlockPosition(i, -9, j);
  }
}

for (let i = 0; i < TREE_COUNT; ++i) {
  let x = getRandomInt(HEIGHT + 10) - 10;
  let y = getRandomInt(WIDTH + 10) - 10;
  let height = getRandomInt(3) + 3;
  for (let j = 0; j < height; ++j) {
    addBlock(BLOCKS.wood, x, j - 4, y);
    addBlockPosition(x, j - 4, y);
  }
  addBlock(BLOCKS.leaf, x, height - 4, y);
  addBlockPosition(x, height - 4, y);
  addBlock(BLOCKS.leaf, x, height - 5, y - 1);
  addBlockPosition(x, height - 5, y - 1);
  addBlock(BLOCKS.leaf, x - 1, height - 5, y);
  addBlockPosition(x - 1, height - 5, y);
  addBlock(BLOCKS.leaf, x, height - 5, y + 1);
  addBlockPosition(x, height - 5, y + 1);
  addBlock(BLOCKS.leaf, x + 1, height - 5, y);
  addBlockPosition(x + 1, height - 5, y);
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

let lastHighlight = { mesh: null, index: null, originalColor: null };
window.addEventListener('mousemove', (evt) => {
  evt.preventDefault();
  mousePosition.x = (evt.clientX / innerWidth) * 2 - 1;
  mousePosition.y = -(evt.clientY / innerHeight) * 2 + 1;
  rayCaster.setFromCamera(mousePosition, camera);
  const allMeshes = Object.values(instancedMeshes);
  let intersects = rayCaster.intersectObjects(allMeshes, true);

  if (lastHighlight.mesh && lastHighlight.index !== null && lastHighlight.originalColor) {
    lastHighlight.mesh.setColorAt(lastHighlight.index, lastHighlight.originalColor);
    lastHighlight.mesh.instanceColor.needsUpdate = true;
    lastHighlight.mesh = null;
    lastHighlight.index = null;
    lastHighlight.originalColor = null;
  }

  if (intersects.length > 0 && intersects[0].distance < 4.0) {
    const intersect = intersects[0];
    const instanceId = intersect.instanceId;
    const mesh = intersect.object;
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(instanceId, matrix);
    const position = new THREE.Vector3();
    position.setFromMatrixPosition(matrix);
    highlightblock.position.copy(position);
  } else {
    highlightblock.position.set(-100, -100, -100)
  }
});

window.addEventListener('click', (evt) => {
  evt.preventDefault();
  mousePosition.x = (evt.clientX / innerWidth) * 2 - 1;
  mousePosition.y = -(evt.clientY / innerHeight) * 2 + 1;
  rayCaster.setFromCamera(mousePosition, camera);
  const allMeshes = Object.values(instancedMeshes);
  let intersects = rayCaster.intersectObjects(allMeshes, true);

  if (lastHighlight.mesh && lastHighlight.index !== null && lastHighlight.originalColor) {
    lastHighlight.mesh.setColorAt(lastHighlight.index, lastHighlight.originalColor);
    lastHighlight.mesh.instanceColor.needsUpdate = true;
    lastHighlight.mesh = null;
    lastHighlight.index = null;
    lastHighlight.originalColor = null;
  }

  if (intersects.length > 0 && intersects[0].distance < 4.0) {
    const intersect = intersects[0];
    const instanceId = intersect.instanceId;
    const mesh = intersect.object;
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(instanceId, matrix);
    const position = new THREE.Vector3();
    position.setFromMatrixPosition(matrix);
    itemCollected(mesh.name)

    for (let i = 0; i < blockPositions.length; ++i) {
      if (
        Math.abs(blockPositions[i].x - position.x) < 0.1 &&
        Math.abs(blockPositions[i].y - position.y) < 0.1 &&
        Math.abs(blockPositions[i].z - position.z) < 0.1
      ) {
        blockPositions.splice(i, 1);
        break;
      }
    }

    const lastIdx = mesh.count - 1;
    if (instanceId !== lastIdx) {
      const tempMatrix = new THREE.Matrix4();
      mesh.getMatrixAt(lastIdx, tempMatrix);
      mesh.setMatrixAt(instanceId, tempMatrix);
      if (mesh.instanceColor) {
        const tempColor = new THREE.Color();
        mesh.getColorAt(lastIdx, tempColor);
        mesh.setColorAt(instanceId, tempColor);
      }
    }
    mesh.count--;
    if (instancedMeshCounts[mesh.name] > 0) instancedMeshCounts[mesh.name]--;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) { mesh.instanceColor.needsUpdate = true};
  }
});

window.addEventListener('contextmenu', (evt) => {
  const pos = highlightblock.position;
  if (pos.x < -99 || pos.y < -99 || pos.z < -99) return;
  if (camera.position.distanceTo(pos) > 5) return;

  let meshName = placeCurrentItem();
  if (meshName) {
    mousePosition.x = (evt.clientX / innerWidth) * 2 - 1;
    mousePosition.y = -(evt.clientY / innerHeight) * 2 + 1;
    rayCaster.setFromCamera(mousePosition, camera);
    const allMeshes = Object.values(instancedMeshes);
    let intersects = rayCaster.intersectObjects(allMeshes, true);

    if (intersects.length > 0 && intersects[0].distance < 4.0) {
      const intersect = intersects[0];
      const normal = intersect.face.normal.clone();
      normal.transformDirection(intersect.object.matrixWorld);
      const placePos = pos.clone().add(normal);

      const exists = blockPositions.some(bp =>
        Math.abs(bp.x - placePos.x) < 0.1 &&
        Math.abs(bp.y - placePos.y) < 0.1 &&
        Math.abs(bp.z - placePos.z) < 0.1
      );
      if (exists) return;

      const block = BLOCKS[meshName];
      addBlock(block, placePos.x, placePos.y, placePos.z);
      addBlockPosition(placePos.x, placePos.y, placePos.z);
      const mesh = instancedMeshes[meshName];
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }
  }
});

function play() {
  if (loaded) {
    document.getElementById('audio').play();
    renderer.setAnimationLoop( animate );
    document.getElementsByClassName('menu')[0].style.display = "none";
    document.getElementsByClassName('toolbar-container')[0].style.display = "unset";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('play-btn').addEventListener('click', () => {
    play()
  })
})