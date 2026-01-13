import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

// Deep slightly blueish background (Midnight Blue/Slate) 
// The image has a dark but visible blue-grey tone
scene.background = new THREE.Color(0x0b1026);
scene.fog = new THREE.FogExp2(0x0b1026, 0.02);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lights
// Ambient light needs to be stronger to show the non-highlighted parts
const ambientLight = new THREE.AmbientLight(0x111111, 2);
scene.add(ambientLight);

// Primary "Moonlight" - Cool Blue/White
const pointLight = new THREE.PointLight(0xa5c5ff, 200, 100);
pointLight.position.set(5, 15, 10);
scene.add(pointLight);

// Secondary highlight (warm or teal) to give dimension
const backLight = new THREE.PointLight(0x3b82f6, 100, 80);
backLight.position.set(-10, 5, -5);
scene.add(backLight);

// Wave Parameters
const ROWS = 60; // Increased density
const COLS = 60;
const COUNT = ROWS * COLS;
const SPACING = 0.6; // Closer spacing for "solid" look

// Geometry: Thinner, smoother bars
const geometry = new THREE.BoxGeometry(0.1, 5, 0.1);
geometry.translate(0, 2.5, 0);

// Material: Glassy/Metallic
const material = new THREE.MeshPhysicalMaterial({
    color: 0x223355, // Base color isn't black, it's dark blue
    metalness: 0.8,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    emissive: 0x000011, // Slight glow
});

const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
scene.add(mesh);

const dummy = new THREE.Object3D();
const position = new THREE.Vector3();

// Initialize positions
for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
        const index = i * COLS + j;

        // Center the grid
        position.x = (j - COLS / 2) * SPACING;
        position.z = (i - ROWS / 2) * SPACING;
        position.y = 0;

        dummy.position.copy(position);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
    }
}

// Variables for animation
let scrollY = 0;
let targetScrollY = 0;

// Mouse for subtle parallax
const mouse = new THREE.Vector2();
const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX - windowHalf.x) * 0.001;
    mouse.y = (event.clientY - windowHalf.y) * 0.001;
});

// Capture Scroll
window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY * 0.005; // Sensitivity
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime() * 0.5;

    // Smooth scroll interpolation
    scrollY += (targetScrollY - scrollY) * 0.05;

    // Update Wave
    let index = 0;
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {

            // Grid coordinates centered
            const x = (j - COLS / 2);
            const z = (i - ROWS / 2);

            // Wave Logic
            // Combine scrolling offset with time
            // Complex wave function for "organic" look
            const dist = Math.sqrt(x * x + z * z);

            // Primary wave moving forward with scroll
            const y1 = Math.sin(x * 0.3 + time + scrollY);
            // Secondary wave for detail
            const y2 = Math.cos(z * 0.2 + time * 0.5);
            // Ripple from center
            const y3 = Math.sin(dist * 0.2 - time * 2);

            const heightScale = Math.max(0.1, (y1 + y2 + y3 * 0.5) + 1.5);

            // Update Instance
            dummy.position.set(x * SPACING, -2, z * SPACING); // -2 to hide bottom
            dummy.scale.set(1, heightScale, 1);

            dummy.updateMatrix();
            mesh.setMatrixAt(index++, dummy.matrix);
        }
    }

    mesh.instanceMatrix.needsUpdate = true;

    // Camera Movement
    // Rotate camera slightly based on mouse
    camera.position.x += (mouse.x * 5 - camera.position.x) * 0.05;
    camera.position.y += (5 + mouse.y * 2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {
    windowHalf.set(window.innerWidth / 2, window.innerHeight / 2);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
