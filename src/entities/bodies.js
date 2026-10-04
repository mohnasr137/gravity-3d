import * as THREE from "three";

const DEFAULT_COLORS = [0xff2a5f, 0x0077ff, 0xffd200]; // Vibrant Red-Pink, Electric Blue, Bright Yellow
const sceneCenter = new THREE.Vector3(0, 0, 0);

// Reusable scratch vectors to avoid garbage collection allocations during simulation updates
const tempPos = new THREE.Vector3();
const tempDir = new THREE.Vector3();

/**
 * Creates a single dynamic physical body with icosahedral mesh and wireframe overlay.
 * @param {Object} RAPIER - Rapier 3D library instance
 * @param {Object} world - Rapier physics world
 * @param {number} colorIndex - Index for material color selection
 * @param {Object} [options] - Configuration options
 * @returns {{ mesh: THREE.Mesh, rigid: Object, update: Function }}
 */
export function createBody(RAPIER, world, colorIndex, options = {}) {
  const colors = options.colors || DEFAULT_COLORS;
  const gravityStrength = options.gravityStrength ?? 0.5;
  const range = options.range ?? 6;

  const size = 0.1 + Math.random() * 0.25;
  const density = size * 1.0;

  const x = Math.random() * range - range * 0.5;
  const y = Math.random() * range - range * 0.5 + 3;
  const z = Math.random() * range - range * 0.5;

  // Rapier dynamic rigid body
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, y, z)
    .setLinearDamping(0.2)
    .setAngularDamping(0.2);
  const rigid = world.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.ball(size)
    .setDensity(density)
    .setRestitution(0.7);
  world.createCollider(colliderDesc, rigid);

  // Three.js visual mesh: Icosahedron with flat shading
  const geometry = new THREE.IcosahedronGeometry(size, 1);
  const material = new THREE.MeshStandardMaterial({
    color: colors[colorIndex % colors.length],
    flatShading: true,
    roughness: 0.3,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Wireframe contour overlay
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: true,
  });
  const wireMesh = new THREE.Mesh(geometry, wireMat);
  wireMesh.scale.setScalar(1.01);
  mesh.add(wireMesh);

  /**
   * Updates central gravitational force and syncs position + rotation with physics.
   */
  function update() {
    rigid.resetForces(true);
    const translation = rigid.translation();

    // Calculate inward gravitational pull towards scene center
    tempPos.set(translation.x, translation.y, translation.z);
    tempDir.copy(tempPos).sub(sceneCenter).normalize().multiplyScalar(-gravityStrength);

    rigid.addForce(tempDir, true);

    // Sync mesh transformation with physical rigid body
    mesh.position.set(translation.x, translation.y, translation.z);
    const rot = rigid.rotation();
    mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }

  return { mesh, rigid, update };
}

/**
 * Spawns a cluster of gravitational bodies into the scene and physics world.
 * @param {Object} RAPIER - Rapier 3D instance
 * @param {Object} world - Rapier physics world
 * @param {THREE.Scene} scene - Three.js scene to add meshes to
 * @param {number} count - Total number of bodies to spawn
 * @param {Object} [options] - Custom spawn options
 * @returns {{ bodies: Array, update: Function }}
 */
export function createBodyCluster(RAPIER, world, scene, count = 210, options = {}) {
  const bodies = [];
  for (let i = 0; i < count; i++) {
    const body = createBody(RAPIER, world, i, options);
    bodies.push(body);
    scene.add(body.mesh);
  }

  function update() {
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].update();
    }
  }

  return { bodies, update };
}
