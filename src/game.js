import * as THREE from "../threejs/build/three.module.js";
import { GLTFLoader } from '../threejs/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../threejs/examples/jsm/utils/SkeletonUtils.js';


async function init() {

    // Scene
      scene = new THREE.Scene();
  
    // Camera
      camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
      );
      camera.position.z = 20;
      camera.position.y = 6;
    
    
      // render
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
    
      const ambient = new THREE.HemisphereLight(0xffffbb, 0x080820);
      scene.add(ambient);
      
      clock = new THREE.Clock();
    
      const light = new THREE.DirectionalLight(0xFFFFFF, 1);
      light.position.set( 1, 10, 6);
      scene.add(light);
  
      elThreejs.appendChild(renderer.domElement);
  
      await loadtarget();
  
      addPlayer();
      addPlane();
      addProjectile();
  
      addBackground();
  
  
      addKeysListener();
      await addProjectile();
      startProjectileInterval();
      animate();
  
      spawntargets();
  
  }