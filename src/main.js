import './style.css'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xffffff)

// Camera //
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const initialCameraPosition = { x: 0, y: 1, z: 3 };
camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Renderer //
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
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
// const helper = new THREE.DirectionalLightHelper(directionalLight);
// scene.add(helper);

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

// 3D Models
const loader = new GLTFLoader();

function loadModel(url, name, position, scale = 1, rotation = { x: 0, y: 0, z: 0 }) {
  loader.load(
    url, 
    (gltf) => {
      const model = gltf.scene;
      const modelContainer = new THREE.Group();

      modelContainer.position.set(position.x, position.y, position.z);
      modelContainer.scale.set(scale, scale, scale);
      modelContainer.rotation.set(rotation.x, rotation.y, rotation.z);
      modelContainer.name = name;
      modelContainer.isInteractuable = true;

      modelContainer.add(model);
      
      model.traverse((child) => {
        if (child.isMesh) {
          child.material.envMap = environmentMap;
          child.name = name;
          child.isInteractuable = true;
        }
      });

      scene.add(modelContainer);

      levitateObject(modelContainer);
    },
    undefined,
    (error) => { console.error('Error loading model:', error); }
  );
}

const models = [
  {
    name: 'Game Boy Advance',
    description: 'The Game Boy Advance (GBA), released in 2001, is a handheld gaming console by Nintendo. It features a 32-bit processor, offering improved graphics and gameplay over its predecessors. With a wide library of games and a portable design, the GBA became one of the most popular handheld systems, known for titles like Pokémon Ruby/Sapphire and The Legend of Zelda: A Link to the Past.',
    url: 'assets/models/gameboy_advance_-_zelda_concept/scene.gltf',
    position: { x: -1.7, y: 0.6, z: 0 },
    // scale: 0.5,
    rotation: { x: 0, y: 4.5, z: 0 }
  },
  {
    name: 'NES Zapper',
    description: 'The NES Zapper, released in 1985, is a light gun controller for the NES that allowed players to shoot at targets on the screen, notably in Duck Hunt. Its iconic orange and grey design made it a memorable accessory, contributing to the NES\'s success and becoming a classic in gaming history.',
    url: 'assets/models/nintendo_zapper_light_gun/scene.gltf',
    position: { x: 0, y: 0.6, z: 0 },
    scale: 0.1,
    rotation: { x: 0, y: 4, z: 0 }
  },
  {
    name: 'Power Glove',
    description: 'The Power Glove, created by Nintendo and Mattel, was released in 1989 as an innovative controller for the NES that allowed players to interact with games through hand movements. Although it promised a more immersive experience, its lack of precision and comfort limited its success. Despite this, it became an iconic piece of pop culture.',
    url: 'assets/models/hackermans_powerglove/scene.gltf',
    position: { x: 1.7, y: 0.8, z: 0 },
    scale: 0.05,
    rotation: { x: 0, y: 4, z: 0 }
  }
];

for (const model of models) {
  loadModel(model.url, model.name, model.position, model.scale, model.rotation);
}

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

// Raycaster & Mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;
let rotationTween = null;
const descriptionBox = document.getElementById("description");

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
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const object = intersects[0].object;

    if (object.isInteractuable) {
      const modelContainer = object.parent;

      if (hoveredObject !== modelContainer && descriptionBox.classList.contains("hidden")) {
        hoveredObject = modelContainer;

        rotateObject(modelContainer);
      }

      document.body.style.cursor = "pointer";
    }
  } else {
      // If no object is hovered, reset the rotation of the previous object
      if (hoveredObject !== null) {
        if (rotationTween && descriptionBox.classList.contains("hidden")) {
          rotationTween.kill();
        }

        // Reset the rotation
        gsap.to(hoveredObject.rotation, {
          duration: 1,
          z: 0,  // Reset to the original rotation (no rotation)
          ease: "power1.inOut",
        });

        hoveredObject = null;
      }
      document.body.style.cursor = "auto";
  }
	
	render();
}

window.addEventListener('click', onClick);

function onClick(event) {
  event.preventDefault();

  // Update mouse position
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check if the ray intersects with any object in the scene
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const object = intersects[0].object;

    if (object.isInteractuable) {
      const modelInfo = models.find(model => model.name === object.name);
      
      if (modelInfo) {
        descriptionBox.querySelector(".label").textContent = modelInfo.name;
        descriptionBox.querySelector(".text").textContent = modelInfo.description;
        descriptionBox.classList.remove("hidden");

        rotateObject(object.parent);
        focusCoordinates(modelInfo.position, 2);

        // Desactivate hover
        window.removeEventListener('mousemove', onHover);
      } else {
        focusCoordinates(initialCameraPosition);
      }
    }
  } else {
    descriptionBox.classList.add("hidden");
    focusCoordinates(initialCameraPosition);

    // Reactivate hover
    window.addEventListener('mousemove', onHover);
  }
}

function rotateObject(object, duration = 10) {
  if (rotationTween) {
    rotationTween.kill();
  }
  rotationTween = gsap.to(object.rotation, {
    z: object.rotation.z + Math.PI * 2,
    duration,
    repeat: -1,
    ease: "none",
  });
}

function focusCoordinates(target, offset = 0) {
  gsap.to(camera.position, {
    x: target.x,
    y: target.y,
    z: target.z + offset,
    duration: 2,
    ease: "power2.inOut",
  });
}

function render() {
  renderer.render(scene, camera);
}
