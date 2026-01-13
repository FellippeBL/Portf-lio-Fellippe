import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

// Deep black background
scene.background = new THREE.Color(0x000000);

// Fog for depth
scene.fog = new THREE.FogExp2(0x000000, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lights
const ambientLight = new THREE.AmbientLight(0x202020, 1); // Dim ambient
scene.add(ambientLight);

// Dynamic Point Light (Follows mouse)
const pointLight = new THREE.PointLight(0x3b82f6, 100, 100); // Blueish tint
pointLight.position.set(0, 0, 20);
scene.add(pointLight);

// Optional: Second contrasting light
const secondaryLight = new THREE.PointLight(0xbfdbfe, 50, 80);
secondaryLight.position.set(-20, 20, 10);
scene.add(secondaryLight);

// Cubes
const cubes = [];
const cubeCount = 300;
const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

// Premium Material
const material = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    metalness: 0.9,
    roughness: 0.2, // Smoother for better reflections
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    emissive: 0x000000
});

for (let i = 0; i < cubeCount; i++) {
    const cube = new THREE.Mesh(geometry, material);

    // Spread
    cube.position.x = (Math.random() - 0.5) * 180;
    cube.position.y = (Math.random() - 0.5) * 120;
    cube.position.z = (Math.random() - 0.5) * 80;

    // Random initial rotation
    cube.rotation.x = Math.random() * Math.PI;
    cube.rotation.y = Math.random() * Math.PI;

    cube.userData = {
        originalPos: cube.position.clone(),
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.01,
            y: (Math.random() - 0.5) * 0.01
        },
        randomPhase: Math.random() * Math.PI * 2
    };

    scene.add(cube);
    cubes.push(cube);
}

// Mouse Interaction
const mouse = new THREE.Vector2();
const target = new THREE.Vector2();
const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

// Use normalized coordinates (-1 to +1) for easier 3D mapping
const cursor3D = new THREE.Vector3();

document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX - windowHalf.x);
    mouse.y = (event.clientY - windowHalf.y);

    // Normalized
    cursor3D.x = (event.clientX / window.innerWidth) * 2 - 1;
    cursor3D.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Smooth light movement following mouse
    // We Map 2D mouse to approximate 3D plane at z=20
    const vector = new THREE.Vector3(cursor3D.x, cursor3D.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = (20 - camera.position.z) / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    // Lerp light position for smoothness
    pointLight.position.lerp(new THREE.Vector3(pos.x, pos.y, 20), 0.1);

    // Secondary light creates some ambient motion
    secondaryLight.position.x = Math.sin(time * 0.5) * 30;
    secondaryLight.position.y = Math.cos(time * 0.5) * 30;

    cubes.forEach(cube => {
        // Continuous Rotation
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;

        // Floating effect
        const floatY = Math.sin(time + cube.userData.randomPhase) * 0.05;

        // Mouse Repulsion / Interactive Wave
        // Calculate distance to the light (which follows mouse)
        const dx = cube.position.x - pointLight.position.x;
        const dy = cube.position.y - pointLight.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Use normalized mouse for interaction to keep it consistent
        // If closer to mouse, push away slightly and rotate faster
        if (dist < 25) {
            const force = (25 - dist) / 25; // 0 to 1

            // Push away
            const angle = Math.atan2(dy, dx);
            const pushX = Math.cos(angle) * force * 5;
            const pushY = Math.sin(angle) * force * 5;

            cube.position.x += (cube.userData.originalPos.x + pushX - cube.position.x) * 0.1;
            cube.position.y += (cube.userData.originalPos.y + pushY - cube.position.y) * 0.1;

            // Highlight color temporarily?
            // material is shared, so we can't change color per cube unless we clone materials (expensive)
            // or use instance mesh with shader (complex).
            // Instead, we rely on the point light to highlight them naturally.

            // Add extra rotation
            cube.rotation.x += 0.05 * force;
            cube.rotation.y += 0.05 * force;

        } else {
            // Return to original with float
            cube.position.x += (cube.userData.originalPos.x - cube.position.x) * 0.05;
            cube.position.y += (cube.userData.originalPos.y + floatY - cube.position.y) * 0.05;
        }
    });

    // Parallax Camera
    camera.position.x += (mouse.x * 0.005 - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y * 0.005 - camera.position.y) * 0.05;
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
