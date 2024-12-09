import './style.css'
import * as THREE from 'three'

const scene = new THREE.Scene()
// scene.background = new THREE.Color(0x000000)
scene.background = new THREE.Color(0xffffff)

// Camera //
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Renderer //
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.shadowMap.enabled = true
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setAnimationLoop(render);

document.querySelector('#app').appendChild(renderer.domElement);


// Ambient light //
const light = new THREE.AmbientLight( 0xffffff );
scene.add(light);

// Directional light //
const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set(-5, 6, 5);
// directionalLight.castShadow = true;
scene.add(directionalLight);

// Helper to view light direction //
const helper = new THREE.DirectionalLightHelper(directionalLight);
scene.add(helper);

// Environment map //
const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMap = cubeTextureLoader.load([
  "assets/hdri/px.png",
  "assets/hdri/nx.png",
  "assets/hdri/py.png",
  "assets/hdri/ny.png",
  "assets/hdri/pz.png",
  "assets/hdri/nz.png",
],
  (environmentMap) => {
    scene.background = environmentMap;
  },
  undefined,
  (error) => {
    console.error("Error loading environment map:", error);
  }
);

// Shelf
const shelfGeo = new THREE.BoxGeometry(5, 0.1, 1);
const shelfMat = new THREE.MeshStandardMaterial({
  color: 0xdcc4b0,
  metalness: 0.5,
  roughness: 0.1,
  envMap: environmentMap
}); 
const shelf = new THREE.Mesh(shelfGeo, shelfMat); 
scene.add(shelf);

// Cube
const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
const cubeMat = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  metalness: 0.5,
  roughness: 0.5,
  envMap: environmentMap
});
const cube = new THREE.Mesh(cubeGeo, cubeMat);
cube.position.set(0, 1, 0);
scene.add(cube);

camera.lookAt(shelf.position);

function render() {
  renderer.render(scene, camera);
}
