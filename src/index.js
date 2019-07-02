import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { Group } from "three";

let camera,
  scene,
  light,
  renderer,
  clock,
  cube,
  controls,
  canUpdate = false;
let time = 0;
const init = () => {
  const { innerWidth, innerHeight } = window;
  camera = new THREE.PerspectiveCamera(
    60,
    innerWidth / innerHeight,
    0.01,
    1000
  );
  camera.position.set(-5, 5, 5);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  document.getElementById("canvas").appendChild(renderer.domElement);
  scene = new THREE.Scene();
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  light = new THREE.DirectionalLight();
  light.position.set(1, 1.2, 1.3);
  light.lookAt(0, 0, 0);
  scene.add(light);
  light = new THREE.DirectionalLight();
  light.position.set(-1, -1.2, -1.3);
  light.lookAt(0, 0, 0);
  scene.add(light);
  scene.add(controls.object);
  const loader = new OBJLoader();
  loader.load(require("./Full_low.obj"), gp => {
    const bbox = new THREE.Box3().setFromObject(gp);
    gp.traverse(child => {
      if (child.isMesh) {
        let geo = child.geometry;
        const buffer = geo.attributes.position.array;
        const vertexAmmount = buffer.length;
        const centroids = new Float32Array(vertexAmmount);
        let first = new THREE.Vector3(),
          second = new THREE.Vector3(),
          third = new THREE.Vector3(),
          centroid = new THREE.Vector3();
        let i = -1,
          j = -1;
        while (i < vertexAmmount * 3) {
          first.set(buffer[++i], buffer[++i], buffer[++i]);
          second.set(buffer[++i], buffer[++i], buffer[++i]);
          third.set(buffer[++i], buffer[++i], buffer[++i]);
          centroid.add(first);
          centroid.add(second);
          centroid.add(third);
          centroid.divideScalar(3);
          // First vertex
          const index = ++j;
          centroids[index] = centroid.x;
          centroids[++j] = centroid.y;
          centroids[++j] = centroid.z;
          // Second vertex
          centroids[++j] = centroid.x;
          centroids[++j] = centroid.y;
          centroids[++j] = centroid.z;
          // Third vertex
          centroids[++j] = centroid.x;
          centroids[++j] = centroid.y;
          centroids[++j] = centroid.z;

          centroid.set(0, 0, 0);
        }
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.addAttribute("aCentroid", new THREE.BufferAttribute(centroids, 3));
        const boxSize = bbox.max.x + bbox.max.y + bbox.max.z;
        const mat = new BAS.StandardAnimationMaterial({
          flatShading: false,
          // define a time uniform that will control the state of the animation
          // the uniform will be the same for each vertex
          uniforms: {
            time: { value: 0 }
          },
          // add GLSL definitions for the uniform and the 4 attributes we defined on the geometry
          // the names and types must be the same as defined above
          // we use vec3 for attributes with an item size of 3
          // we use float for attributes with an item size of 1
          vertexParameters: [
            "uniform float time;",
            "attribute vec3 aCentroid;"
          ],
          // add definitions for functions to be used in the vertex shader
          vertexFunctions: [
            // the ease functions follow an underscore deliminated naming convention.
            BAS.ShaderChunk["ease_back_in_out"]
            // BAS.ShaderChunk["quaternion_rotation"]
          ],
          // add the GLSL animation update logic
          vertexPosition: [
            `
            vec3 centroidDir = aCentroid - position;
            float a = 1.0;
            float b = 0.0759;
            `,
            `float delay = (-1.0 * aCentroid.x - aCentroid.y - aCentroid.z + ${boxSize}) / ${boxSize};`,
            "delay = 1.4 * exp(delay* 1.2);",
            "float aDuration = 2.0;",
            // progress is calculated based on the time uniform, and the aDuration and startTime attributes
            "float progress = clamp(time - delay, 0.0, aDuration) / aDuration;",
            // Spiral parametrization in XZ plane
            `
            float rotation = 4.0 * PI * progress;
            float radius = exp(b * rotation) * a;
            vec3 spiralPosition = vec3(
              sin(rotation) * radius, 
              sin(rotation / 4.0), 
              cos(rotation) * radius);`,

            // 'transformed' is a variable defined by THREE.js.
            // it is used throughout the vertex shader to transform the vertex position
            "transformed = position + (progress * centroidDir) + spiralPosition;"
          ]
        });
        child.material = mat;
        child.geometry.needsUpdate = true;
        child.material.needsUpdate = true;
        time = 0;
      }
    });
    scene.add(gp);
    clock = new THREE.Clock();
    render();
  });
};

const render = () => {
  requestAnimationFrame(render);
  controls.update();
  time += clock.getDelta();
  scene.traverse(child => {
    if (child.isMesh) {
      child.material.uniforms.time.value = time;
    }
  });
  renderer.render(scene, camera);
};

init();
