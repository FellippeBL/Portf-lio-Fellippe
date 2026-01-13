import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

// Remove background color to let CSS background show if needed, 
// or set a base dark color.
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 500);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Cubes
const cubes = [];
const cubeCount = 200;
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.1,
    metalness: 0.8
});

for (let i = 0; i < cubeCount; i++) {
    const cube = new THREE.Mesh(geometry, material);

    // Random position spread
    cube.position.x = (Math.random() - 0.5) * 150;
    cube.position.y = (Math.random() - 0.5) * 100;
    cube.position.z = (Math.random() - 0.5) * 50;

    // Store original position for return effect
    cube.userData = {
        originalPos: cube.position.clone(),
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02
        }
    };

    scene.add(cube);
    cubes.push(cube);
}

// Mouse Interaction
const mouse = new THREE.Vector2();
const target = new THREE.Vector2();
const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX - windowHalf.x);
    mouse.y = (event.clientY - windowHalf.y);
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    target.x = mouse.x * 0.1;
    target.y = mouse.y * 0.1;

    cubes.forEach(cube => {
        // Rotation
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;

        // Mouse Repulsion
        // We project mouse position into 3D space roughly or use simple 2D proximity on x/y
        // For efficiency in this demo, we'll displace based on X/Y proximity to camera center

        const dx = cube.position.x - (mouse.x * 0.05); // Simple mapping
        const dy = cube.position.y - (-mouse.y * 0.05);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
            const angle = Math.atan2(dy, dx);
            const force = (20 - dist) * 2;

            cube.position.x += Math.cos(angle) * force * 0.05;
            cube.position.y += Math.sin(angle) * force * 0.05;
        } else {
            // Return to original
            cube.position.x += (cube.userData.originalPos.x - cube.position.x) * 0.05;
            cube.position.y += (cube.userData.originalPos.y - cube.position.y) * 0.05;
        }
    });

    // Slight camera movement based on mouse
    camera.position.x += (mouse.x * 0.01 - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y * 0.01 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

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
