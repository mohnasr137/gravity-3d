import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";
import { initPhysics } from "./physics/world.js";
import { createBodyCluster } from "./entities/bodies.js";
import { createMouseBall } from "./entities/mouseBall.js";
import { initPostprocessing } from "./effects/postprocessing.js";
import "./style.css";

async function initApp() {
  const loadingScreen = document.getElementById("loading-screen");
  const errorScreen = document.getElementById("error-screen");
  const container = document.getElementById("canvas-container") || document.body;

  // WebGL 2 compatibility check
  if (!WebGL.isWebGL2Available()) {
    if (loadingScreen) loadingScreen.classList.add("hidden");
    if (errorScreen) {
      errorScreen.classList.remove("hidden");
      const errorMsg = WebGL.getWebGL2ErrorMessage();
      errorScreen.appendChild(errorMsg);
    }
    return;
  }

  try {
    let width = window.innerWidth;
    let height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    // Three.js Scene & Camera setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030308);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // WebGL Renderer configuration
    const renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Initialize Post-processing pipeline (Unreal Bloom)
    const post = initPostprocessing(renderer, scene, camera, width, height, {
      strength: 2.0,
      radius: 1.0,
      threshold: 0.005,
    });
    post.resize(width, height, pixelRatio);

    // Initialize Rapier 3D WebAssembly physics engine
    const { RAPIER, world } = await initPhysics({ x: 0.0, y: 0.0, z: 0.0 });

    // Spawn dynamic cluster bodies
    const numBodies = 210;
    const cluster = createBodyCluster(RAPIER, world, scene, numBodies);

    // Interactive Kinematic mouse ball
    const mouseBall = createMouseBall(RAPIER, world, {
      size: 0.3,
      colliderMultiplier: 3.0,
      rangeMultiplier: 5.0,
      lightIntensity: 12,
    });
    scene.add(mouseBall.mesh);

    // Lighting setup
    const hemiLight = new THREE.HemisphereLight(0x00bbff, 0xaa00ff, 0.35);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.35);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffaa00, 0.35, 50);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.35);
    scene.add(pointLightHelper);

    // Mouse / Pointer tracking
    const mousePos = new THREE.Vector2(0, 0);

    function updatePointerCoordinates(clientX, clientY) {
      mousePos.x = (clientX / window.innerWidth) * 2.4 - 1.2;
      mousePos.y = -(clientY / window.innerHeight) * 2.4 + 1.2;
    }

    function handlePointerMove(evt) {
      updatePointerCoordinates(evt.clientX, evt.clientY);
    }

    function handleTouchMove(evt) {
      if (evt.touches.length > 0) {
        updatePointerCoordinates(evt.touches[0].clientX, evt.touches[0].clientY);
      }
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Handle Window Resize
    function handleWindowResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const currentPixelRatio = Math.min(window.devicePixelRatio, 2);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(currentPixelRatio);

      post.resize(width, height, currentPixelRatio);
    }
    window.addEventListener("resize", handleWindowResize, false);

    // Main Simulation & Render Loop
    function animate() {
      requestAnimationFrame(animate);

      // Advance physics simulation
      world.step();

      // Update kinematic mouse collider and cluster bodies
      mouseBall.update(mousePos);
      cluster.update();

      // Render scene with bloom pass
      post.render();
    }

    animate();

    // Dismiss loading overlay
    if (loadingScreen) {
      loadingScreen.classList.add("hidden");
    }
  } catch (error) {
    console.error("Simulation initialization failed:", error);
    if (loadingScreen) loadingScreen.classList.add("hidden");
    if (errorScreen) {
      errorScreen.classList.remove("hidden");
      const errCard = document.createElement("div");
      errCard.className = "error-card";
      errCard.textContent = `Failed to start simulation: ${error.message}`;
      errorScreen.appendChild(errCard);
    }
  }
}

initApp();
