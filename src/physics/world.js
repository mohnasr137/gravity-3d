import RAPIER from "@dimforge/rapier3d-compat";

/**
 * Initializes the Rapier 3D WebAssembly physics engine and creates the physics world.
 * @param {Object} gravity - Initial gravity vector { x, y, z }
 * @returns {Promise<{ RAPIER: typeof RAPIER, world: RAPIER.World }>}
 */
export async function initPhysics(gravity = { x: 0.0, y: 0.0, z: 0.0 }) {
  await RAPIER.init();
  const world = new RAPIER.World(gravity);
  return { RAPIER, world };
}
