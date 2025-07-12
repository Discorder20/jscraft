import * as THREE from 'three';
import BLOCKS from './blocks.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

const manager = new THREE.LoadingManager();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor("deepskyblue")
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );
camera.position.z = 0;
camera.position.x = 0;
camera.position.y = 0;

let clock = new THREE.Clock();

let controls = new FirstPersonControls(camera, document.body);
controls.lookSpeed = 0.2;
controls.movementSpeed = 0;
controls.noFly = true;
controls.lookVertical = true;
controls.verticalMin = 1.0;
controls.verticalMax = 2.0;
controls.lon = -50;
controls.lat = -50;

let cubes = [];

function addBlock(block, x, y, z) 
{
  const textureLoader = new THREE.TextureLoader(manager);
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

  const geometry = new THREE.BoxGeometry( 1, 1, 1 );
  const material = new THREE.MeshBasicMaterial({
      map: texture,
  });
    const materialtop= new THREE.MeshBasicMaterial({
      map: toptexture
  });

  const materialbottom = new THREE.MeshBasicMaterial({
      map: bottomtexture
  });

  const cube = new THREE.Mesh( geometry, [material, material, materialtop, materialbottom, material, material] );
  cubes.push(cube)
  cube.position.set(x, y, z);
  scene.add( cube );
}

for (let i = -10; i < 10; ++i) {
  for (let j = -10; j < 10; ++j) {
    addBlock(BLOCKS.grass, i, -5, j)
  }
}

function animate() {
  controls.update(clock.getDelta());
  renderer.render( scene, camera );

}