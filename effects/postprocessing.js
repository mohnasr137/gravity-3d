import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

/**
 * Initializes the post-processing pipeline with Unreal Bloom effect.
 * @param {THREE.WebGLRenderer} renderer - The Three.js WebGL renderer
 * @param {THREE.Scene} scene - The active scene
 * @param {THREE.Camera} camera - The active camera
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 * @param {Object} [options] - Post-processing parameters
 * @returns {{ composer: EffectComposer, bloomPass: UnrealBloomPass, resize: Function, render: Function }}
 */
export function initPostprocessing(renderer, scene, camera, width, height, options = {}) {
  const bloomStrength = options.strength ?? 2.0;
  const bloomRadius = options.radius ?? 1.0;
  const bloomThreshold = options.threshold ?? 0.005;

  const composer = new EffectComposer(renderer);

  // Base scene render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Unreal Bloom pass
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    bloomStrength,
    bloomRadius,
    bloomThreshold
  );
  composer.addPass(bloomPass);

  /**
   * Resizes composer and pass resolution upon window resize.
   * @param {number} newWidth - New width in pixels
   * @param {number} newHeight - New height in pixels
   * @param {number} [pixelRatio=1] - Device pixel ratio
   */
  function resize(newWidth, newHeight, pixelRatio = 1) {
    composer.setSize(newWidth, newHeight);
    composer.setPixelRatio(pixelRatio);
    bloomPass.resolution.set(newWidth, newHeight);
  }

  function render() {
    composer.render();
  }

  return {
    composer,
    bloomPass,
    renderPass,
    resize,
    render,
  };
}
