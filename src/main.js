import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Three.js Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Array to store all cubes, velocities, and parallax objects
const cubes = [];
const velocities = [];

// Raycaster for detecting mouse interaction with cubes
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let selectedCube = null;
let dragOffset = new THREE.Vector3();
let lastMousePosition = new THREE.Vector2();

// Create a TextureLoader instance
const textureLoader = new THREE.TextureLoader();

// Function to create a cube with specified size, position, and an optional texture
function createCube(size = 0.5 + Math.random() * 1.5, position = { x: 0, y: 0, z: 0 }, texture = null) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        color: texture ? 0xffffff : new THREE.Color(Math.random(), Math.random(), Math.random()),
        shininess: 100
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(position.x, position.y, position.z);
    scene.add(cube);
    cubes.push(cube);
    velocities.push(new THREE.Vector3(0, 0, 0));
    return cube;
}

// Create initial cubes
createCube(1.0);
createCube(1.5, { x: -3, y: 0, z: 0 });
createCube(2.0, { x: 1, y: -2, z: 0 });

// Function to create parallax 3D objects for background effect
function createParallaxObject(geometry, color, position) {
    const material = new THREE.MeshPhongMaterial({ color, opacity: 0.6, transparent: true });
    const shape = new THREE.Mesh(geometry, material);
    shape.position.set(position.x, position.y, position.z);
    scene.add(shape);
    parallaxObjects.push(shape);
}


// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Button functionality to add a random-sized cube at a random position
document.getElementById('add-cube-button').addEventListener('click', () => {
    const randomSize = Math.random() * 1.5 + 0.5;
    const randomPosition = {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 10
    };
    createCube(randomSize, randomPosition);
});

// Track mouse movement
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster with the mouse position
    raycaster.setFromCamera(mouse, camera);

    // Parallax effect for background objects based on mouse movement
    parallaxObjects.forEach((object) => {
        object.rotation.x += mouse.y * 0.01;
        object.rotation.y += mouse.x * 0.01;
    });

    // If dragging a cube, update its position
    if (isDragging && selectedCube) {
        const intersects = raycaster.intersectObject(selectedCube);
        if (intersects.length > 0) {
            const intersectPoint = intersects[0].point;
            selectedCube.position.copy(intersectPoint.sub(dragOffset));

            // Calculate velocity based on mouse movement during drag
            velocities[cubes.indexOf(selectedCube)].set(
                mouse.x - lastMousePosition.x,
                mouse.y - lastMousePosition.y,
                0
            ).multiplyScalar(5);
        }
    }

    lastMousePosition.set(mouse.x, mouse.y);
});

// Mouse down: Select a cube if it's clicked
window.addEventListener('mousedown', () => {
    const intersects = raycaster.intersectObjects(cubes);
    if (intersects.length > 0) {
        isDragging = true;
        selectedCube = intersects[0].object;
        selectedCube.material.color.setRGB(Math.random(), Math.random(), Math.random());
        dragOffset.copy(intersects[0].point).sub(selectedCube.position);
        const index = cubes.indexOf(selectedCube);
        velocities[index].set(0, 0, 0);
    }
});

// Mouse up: Release the cube and apply momentum
window.addEventListener('mouseup', () => {
    isDragging = false;
    selectedCube = null;
});

// Apply momentum to cubes and update positions based on velocity
function applyMomentum() {
    cubes.forEach((cube, index) => {
        const velocity = velocities[index];
        cube.position.add(velocity);
        velocity.multiplyScalar(0.95); // Friction to slow down over time
    });
}

// Scroll-based cube transformations
function updateCubesTransform() {
    const scrollY = window.scrollY;
    const documentHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = scrollY / documentHeight;

    // Apply transformations to each cube
    cubes.forEach((cube, index) => {
        const offset = index * 0.2;
        const targetRotationX = (scrollPercent + offset) * Math.PI * 2;
        const targetRotationY = (scrollPercent + offset) * Math.PI * 2;
        const targetPositionZ = 2 - scrollPercent * 4;

        cube.rotation.x += (targetRotationX - cube.rotation.x) * 0.05;
        cube.rotation.y += (targetRotationY - cube.rotation.y) * 0.05;
        cube.position.z += (targetPositionZ - cube.position.z) * 0.05;
    });

    // Parallax effect for background objects based on scroll
    parallaxObjects.forEach((object, index) => {
        const speed = 0.1 + index * 0.05;
        object.position.y = -scrollY * speed * 0.005;
        object.rotation.x += 0.01;
        object.rotation.y += 0.01;
    });
}

// Smooth scroll event for cube updates
window.addEventListener('scroll', () => {
    requestAnimationFrame(updateCubesTransform);
});

// Render loop with momentum application
function animate() {
    applyMomentum();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// Adjust camera and renderer on window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Show message when the user scrolls to the second section for the first time
let messageShown = false;
ScrollTrigger.create({
    trigger: '#about-me',
    start: 'top center',
    onEnter: () => {
        if (!messageShown) {
            const message = document.getElementById('scroll-message');
            message.style.opacity = 1;
            setTimeout(() => {
                message.style.opacity = 0;
            }, 3000);
            messageShown = true;
        }
    }
});
