import * as THREE from 'three';
import { BLOCK_REGISTER_SIZE } from './constansts.js';

function addBlock(block, x, y, z, scene, instancedMeshes, instancedMeshCounts, textureCache, manager) {
  let material, materialtop, materialbottom;

  if (textureCache[block.name] == undefined) {
    const textureLoader = new THREE.TextureLoader(manager);
    const texture = textureLoader.load(block.sidetexture);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    const toptexture = textureLoader.load(block.toptexture);
    toptexture.wrapS = THREE.RepeatWrapping;
    toptexture.wrapT = THREE.RepeatWrapping;
    toptexture.colorSpace = THREE.SRGBColorSpace;

    const bottomtexture = textureLoader.load(block.bottomtexture);
    bottomtexture.wrapS = THREE.RepeatWrapping;
    bottomtexture.wrapT = THREE.RepeatWrapping;
    bottomtexture.colorSpace = THREE.SRGBColorSpace;

    material = new THREE.MeshBasicMaterial({ map: texture });
    materialtop = new THREE.MeshBasicMaterial({ map: toptexture });
    materialbottom = new THREE.MeshBasicMaterial({ map: bottomtexture });
    textureCache[block.name] = { sidetexture: material, toptexture: materialtop, bottomtexture: materialbottom };
  } else {
    material = textureCache[block.name].sidetexture;
    materialtop = textureCache[block.name].toptexture;
    materialbottom = textureCache[block.name].bottomtexture;
  }

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const materials = [material, material, materialtop, materialbottom, material, material];

  if (!instancedMeshes[block.name]) {
    const maxCount = BLOCK_REGISTER_SIZE;
    const instancedMesh = new THREE.InstancedMesh(geometry, materials, maxCount);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    instancedMesh.name = block.name;
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMeshes[block.name] = instancedMesh;
    instancedMeshCounts[block.name] = 0;
    scene.add(instancedMesh);
  }
  const mesh = instancedMeshes[block.name];
  const idx = instancedMeshCounts[block.name];
  const matrix = new THREE.Matrix4();
  matrix.makeTranslation(x, y, z);
  mesh.setMatrixAt(idx, matrix);
  mesh.setColorAt && mesh.setColorAt(idx, new THREE.Color(1, 1, 1));
  instancedMeshCounts[block.name]++;
  mesh.count = instancedMeshCounts[block.name];
}

export default addBlock;