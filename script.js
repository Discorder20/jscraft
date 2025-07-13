import * as THREE from 'three';
import BLOCKS from './blocks.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { itemCollected, placeCurrentItem } from './toolbar.js';
import { WIDTH, HEIGHT, TREE_COUNT } from './constansts.js';
import addNewBlock from './addblock.js';

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function addBlock(block, x, y, z) {
  addNewBlock(block, x, y, z, scene, instancedMeshes, instancedMeshCounts, textureCache, manager)
}

const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const whitematerial = new THREE.MeshBasicMaterial({color: "white", transparent: true, opacity: 0.2})
const highlightblock = new THREE.Mesh(geometry, whitematerial);

let textureCache = {}
const instancedMeshes = {};

const manager = new THREE.LoadingManager();
const scene = new THREE.Scene();
scene.add(highlightblock)
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

const rayCaster = new THREE.Raycaster();
let mousePosition = new THREE.Vector2();

let clock = new THREE.Clock();

let controls = new FirstPersonControls(camera, document.body);
controls.lookSpeed = 0.08;
controls.movementSpeed = 0;
controls.noFly = true;
controls.lookVertical = true;
controls.lon = 0;
controls.lat = 0;

// Custom camera rotation on mouse move
let lastMouseX = null;
let lastMouseY = null;
document.body.addEventListener('mousemove', (e) => {
  if (lastMouseX !== null && lastMouseY !== null) {
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    // Adjust lon/lat for FirstPersonControls
    controls.lon -= deltaX * controls.lookSpeed * 2;
    controls.lat -= deltaY * controls.lookSpeed * 2;
    controls.lat = Math.max(-85, Math.min(85, controls.lat));
  }
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

// Remove cubes array, use instanced meshes
// let cubes = [];
// Store instanced meshes by block name
// Track instance count per mesh
const instancedMeshCounts = {};
let direction = new THREE.Vector3()

// For isStandingOn and canMoveTo, we need to track block positions
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
      if (Math.abs(x - pos.x) < 1 && Math.abs(z - pos.z) < 1) {
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
    if ((Math.abs(pos.x - x) < 0.9 && Math.abs(pos.z - z) < 0.9) && pos.y > y - 1 && pos.y < y + 1) {
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

// Raycasting with instanced meshes: highlight hovered block
let lastHighlight = { mesh: null, index: null, originalColor: null };
window.addEventListener('mousemove', (evt) => {
  evt.preventDefault();
  mousePosition.x = (evt.clientX / innerWidth) * 2 - 1;
  mousePosition.y = -(evt.clientY / innerHeight) * 2 + 1;
  rayCaster.setFromCamera(mousePosition, camera);
  // Gather all instanced meshes
  const allMeshes = Object.values(instancedMeshes);
  let intersects = rayCaster.intersectObjects(allMeshes, true);

  // Restore previous highlight
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
  // Gather all instanced meshes
  const allMeshes = Object.values(instancedMeshes);
  let intersects = rayCaster.intersectObjects(allMeshes, true);

  // Restore previous highlight
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

    // Remove the block from the scene
    // 1. Remove from blockPositions
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

    // 2. Remove the instance from the instanced mesh
    const lastIdx = mesh.count - 1;
    if (instanceId !== lastIdx) {
      // Move last instance to the removed spot
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
  // Only place if highlightblock is visible and within a reasonable range
  const pos = highlightblock.position;
  if (pos.x < -99 || pos.y < -99 || pos.z < -99) return;
  if (camera.position.distanceTo(pos) > 5) return;

  let meshName = placeCurrentItem();
  if (meshName) {
    // Raycast again to get the face normal
    mousePosition.x = (evt.clientX / innerWidth) * 2 - 1;
    mousePosition.y = -(evt.clientY / innerHeight) * 2 + 1;
    rayCaster.setFromCamera(mousePosition, camera);
    const allMeshes = Object.values(instancedMeshes);
    let intersects = rayCaster.intersectObjects(allMeshes, true);

    if (intersects.length > 0 && intersects[0].distance < 4.0) {
      const intersect = intersects[0];
      const normal = intersect.face.normal.clone();
      // Transform normal by instance matrix (for rotated blocks)
      normal.transformDirection(intersect.object.matrixWorld);
      // Place block adjacent to the face clicked
      const placePos = pos.clone().add(normal);

      // Check if block already exists at placePos
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