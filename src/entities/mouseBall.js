import * as THREE from "three";

/**
 * Creates the interactive kinematic mouse ball that interacts with physics bodies.
 * Includes a glowing mesh and a dynamic point light source.
 * @param {Object} RAPIER - Rapier 3D library instance
 * @param {Object} world - Rapier physics world
 * @param {Object} [options] - Configuration options
 * @returns {{ mesh: THREE.Mesh, rigid: Object, update: Function }}
 */
export function createMouseBall(RAPIER, world, options = {}) {
  const mouseSize = options.size ?? 0.3;
  const colliderMultiplier = options.colliderMultiplier ?? 3.0;
  const rangeMultiplier = options.rangeMultiplier ?? 5.0;
  const depthZ = options.depthZ ?? 0.2;

  // Visual representation: Glowing white sphere with high emissive property
  const geometry = new THREE.IcosahedronGeometry(mouseSize, 8);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.2,
    roughness: 0.1,
  });
  const mouseMesh = new THREE.Mesh(geometry, material);

  // Dynamic point light following cursor
  const mouseLight = new THREE.PointLight(0xffffff, options.lightIntensity ?? 10, 15);
  mouseMesh.add(mouseLight);

  // Rapier Kinematic Rigid Body
  const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
    0,
    0,
    depthZ
  );
  const mouseRigid = world.createRigidBody(bodyDesc);

  // Larger collider radius for responsive deflection
  const dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * colliderMultiplier)
    .setRestitution(0.9);
  world.createCollider(dynamicCollider, mouseRigid);

  /**
   * Updates kinematic position based on normalized mouse coordinates.
   * @param {{ x: number, y: number }} mousePos - Normalized screen position
   */
  function update(mousePos) {
    const targetX = mousePos.x * rangeMultiplier;
    const targetY = mousePos.y * rangeMultiplier;

    mouseRigid.setTranslation({ x: targetX, y: targetY, z: depthZ }, true);

    const translation = mouseRigid.translation();
    mouseMesh.position.set(translation.x, translation.y, translation.z);
  }

  return { mesh: mouseMesh, rigid: mouseRigid, update };
}
