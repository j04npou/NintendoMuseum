import './style.css'
import gsap from 'gsap'
import * as THREE from 'three'

const scene = new THREE.Scene()
// scene.background = new THREE.Color(0x000000)
scene.background = new THREE.Color(0xffffff)

// Camera //
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const initialCameraPosition = { x: 0, y: 1, z: 5 };
camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);

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

// Cube 1
const cube1Geo = new THREE.BoxGeometry(1, 1, 1);
const cube1Mat = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  metalness: 0.5,
  roughness: 0.5,
  envMap: environmentMap
});
const cube1 = new THREE.Mesh(cube1Geo, cube1Mat);
cube1.position.set(-1.5, 0.8, 0);
cube1.isInteractuable = true;
scene.add(cube1);

// Cube 2
const cube2Geo = new THREE.BoxGeometry(1, 1, 1);
const cube2Mat = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  metalness: 0.5,
  roughness: 0.5,
  envMap: environmentMap
});
const cube2 = new THREE.Mesh(cube2Geo, cube2Mat);
cube2.position.set(0, 0.8, 0);
cube2.isInteractuable = true;
scene.add(cube2);

// Cube 3
const cube3Geo = new THREE.BoxGeometry(1, 1, 1);
const cube3Mat = new THREE.MeshStandardMaterial({
  color: 0x0000ff,
  metalness: 0.5,
  roughness: 0.5,
  envMap: environmentMap
});
const cube3 = new THREE.Mesh(cube3Geo, cube3Mat);
cube3.position.set(1.5, 0.8, 0);
cube3.isInteractuable = true;
scene.add(cube3);

// Levitation animation
const levitateObject = (object) => {
  const randomDuration = Math.random() * 2 + 1; // Random duration between 1 and 3 seconds
  const incrementY = 0.2;
  const randomDelay = Math.random() * 2; // Random delay before starting the animation
  
  gsap.to(object.position, {
    y: object.position.y + incrementY,
    duration: randomDuration,
    yoyo: true,
    repeat: -1, // Repeat infinitely
    ease: "power1.inOut",
    delay: randomDelay,
  });
};

// Apply animation to objects
levitateObject(cube1);
levitateObject(cube2);
levitateObject(cube3);

// Raycaster & Mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;
let rotationTween = null;

// Crate a new EventListener for the mousemove event
window.addEventListener('mousemove', onHover);

function onHover(event) {
  event.preventDefault();

  // Update mouse position
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check if the ray intersects with any object in the scene
  var intersects = raycaster.intersectObject(scene, true);

  if (intersects.length > 0) {

    var object = intersects[0].object;

    if (object.isInteractuable) {
      if (hoveredObject !== object) {
        hoveredObject = object;

        if (rotationTween) {
          rotationTween.kill();
        }

        // Rotate object
        rotationTween = gsap.to(object.rotation, {
          duration: 10, // Duration for a full rotation (slower if higher)
          y: object.rotation.y + Math.PI * 2,
          repeat: -1, // Repeat forever
          ease: "none",
        });

      }
    }
  } else {
      // If no object is hovered, reset the rotation of the previous object
      if (hoveredObject !== null) {
        if (rotationTween) {
          rotationTween.kill();
        }

        // Optionally reset the rotation, or leave it as is
        gsap.to(hoveredObject.rotation, {
          duration: 1,
          y: 0,  // Reset to the original rotation (no rotation)
          ease: "power1.inOut",
        });

        hoveredObject = null;
      }
  }
	
	render();
}

// camera.lookAt(shelf.position);

function render() {
  renderer.render(scene, camera);
}
