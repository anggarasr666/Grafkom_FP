import * as THREE from "../threejs/build/three.module.js";
import { GLTFLoader } from '../threejs/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../threejs/examples/jsm/utils/SkeletonUtils.js';

let elThreejs = document.getElementById("threejs");
let camera,scene,renderer;
let axesHelper;

let keyboard = {};
let playerMesh;

let projectileMeshes = [];
let projectileMesh;
let projectileInterval;

let targetMeshes = [];
let targetMesh;
let projectGLTF;

let targetGLTF;
let mixers = [];
let clock;
init();

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
	camera.position.y = 5;
  
  
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

function animate(){

	movePlayer();
	updateProjectiles();
	updatetargets();


	// collision detection between projectileMeshes and targetMeshes
	checkCollisions();

	renderer.render(scene, camera);
	requestAnimationFrame(animate);

	const dt = clock.getDelta();
	for ( const mixer of mixers ) mixer.update( dt );
}

async function addPlayer() {
    try {
        const gltfLoader = new GLTFLoader().setPath('src/assets/');
        const playerGLTF = await gltfLoader.loadAsync('mm_project.glb');
        playerMesh = playerGLTF.scene.children[0];

        const standardMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.5 });
        playerMesh.material = standardMaterial;

        playerMesh.castShadow = true;
        playerMesh.receiveShadow = true;

        playerMesh.position.set(0, 0, 0);
        playerMesh.scale.set(1, 1, 1);

        scene.add(playerMesh);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0);
        directionalLight.position.set(1, 10, 6);
        playerMesh.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        playerMesh.add(ambientLight);
    } catch (error) {
        console.error('Error adding player:', error);
    }
}


function addPlane() {
    const texture = new THREE.TextureLoader().load("src/assets/green-1.jpg");
    let geometry = new THREE.BoxGeometry(100, 0, 100);
    let material = new THREE.MeshBasicMaterial({ map: texture });
    let plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 0, -30); 
    scene.add(plane);
}


function addKeysListener(){
	window.addEventListener('keydown', function(event){
	  keyboard[event.keyCode] = true;
	} , false);
	window.addEventListener('keyup', function(event){
	  keyboard[event.keyCode] = false;
	} , false);

	window.addEventListener("keyup", (event) => {
		// // boiler plate code to prevent side effects
		// if (event.isComposing || event.keyCode === 229) {
		// 	return;
		// }
	
		// // space bar 
		// if (event.keyCode == 32) {
		// 	let projectileMeshClone = projectileMesh.clone();
		// 	projectileMeshClone.position.x = playerMesh.position.x;
		// 	projectileMeshClone.position.y = playerMesh.position.y + 2; // Sesuaikan nilai y di sini
		// 	projectileMeshClone.position.z = playerMesh.position.z;
		// 	scene.add(projectileMeshClone);
		// 	projectileMeshes.push(projectileMeshClone);
		// }
	});	
}



function movePlayer(){
	// left letter A
	if(keyboard[65] && playerMesh.position.x > -15) playerMesh.position.x -= 0.25;
	// right letter D
	if(keyboard[68] && playerMesh.position.x < 15) playerMesh.position.x += 0.25;
}


async function addProjectile(){
	const gltfLoader = new GLTFLoader().setPath( 'src/assets/' );
	const projectileGLTF = await gltfLoader.loadAsync( 'projectile.glb' );
	projectileMesh = projectileGLTF.scene;
	projectileMesh.scale.set(2, 2, 2);
}

function updateProjectiles(){
	projectileMeshes.forEach((projectile, index) => {
		projectile.position.z -= 0.5;
		if(projectile.position.z < -20){
			scene.remove(projectile);
			projectileMeshes.splice(index, 1);
		  }
	});
}

async function loadProject() {
    try {
        const gltfLoader = new GLTFLoader().setPath('src/assets/');
        projectGLTF = await gltfLoader.loadAsync('mm_project.glb');
        console.log('Custom asset loaded successfully:', projectGLTF);
    } catch (error) {
        console.error('Error loading custom asset:', error);
    }
}

function addProject(posX) {
    if (!projectGLTF) {
        console.error('Custom asset not loaded.');
        return;
    }

    let model = SkeletonUtils.clone(projectGLTF.scene);

    model.scale.set(0.5, 0.5, 0.5);

    model.position.x = posX;
    model.position.y = 0;
    model.position.z = -30;

    if (projectGLTF.animations && projectGLTF.animations.length > 0) {
        let animations = {};
        projectGLTF.animations.forEach(animation => {
            animations[animation.name] = animation;
        });

        const mixer = new THREE.AnimationMixer(model);
        const actualAnimation = "YourAnimationName"; 
        mixer.clipAction(animations[actualAnimation]).play();
        mixers.push(mixer);
    } else {
        console.warn('Custom asset has no animations.');
    }

    targetMeshes.push(model);
    scene.add(model);
}

function startProjectileInterval() {
    let initialInterval = 500;

    function launchProjectile() {
        let projectileMeshClone = projectileMesh.clone();
        projectileMeshClone.position.x = playerMesh.position.x;
        projectileMeshClone.position.y = playerMesh.position.y + 2;
        projectileMeshClone.position.z = playerMesh.position.z;
        scene.add(projectileMeshClone);
        projectileMeshes.push(projectileMeshClone);

        initialInterval -= 10;

        if (initialInterval < 100) {
            initialInterval = 100;
        }

        setTimeout(launchProjectile, initialInterval);
    }
    launchProjectile();
}

function stopProjectileInterval() {
    // No need to clear anything for setTimeout
}


async function loadtarget() {
    const gltfLoader = new GLTFLoader().setPath('src/assets/');
    targetGLTF = await gltfLoader.loadAsync('mm_project.glb');
    await loadProject(); 
}

function spawntargets() {
    let randomX = Math.floor(Math.random() * 20) - 10;
    addProject(randomX); 
    setInterval(() => {
        randomX = Math.floor(Math.random() * 20) - 10;
        addProject(randomX); 
    }, 2000);
}
  
function updatetargets(){
	targetMeshes.forEach((target, index) => {
		target.position.z += 0.15;
		if(target.position.z > 0){
		  scene.remove(target);
		  targetMeshes.splice(index, 1);
		}
	});
}
  
function checkCollisions(){
	targetMeshes.forEach((target, indexa) => {
		projectileMeshes.forEach((projectile, indexb) => {
			if( target.position.x >= projectile.position.x - 1 &&
				target.position.x <= projectile.position.x + 1 &&
				target.position.z >= projectile.position.z - 1 &&
				target.position.z <= projectile.position.z + 1){
					scene.remove(target);
					targetMeshes.splice(indexa, 1);
					scene.remove(projectile);
					projectileMeshes.splice(indexb, 1);
			}
		});
	});
}

async function addBackground(){
    const gltfLoader = new GLTFLoader().setPath( 'src/assets/' );

    const mountainLoaded = await gltfLoader.loadAsync( 'mountain.glb' );
    let mountainMesh = mountainLoaded.scene.children[0];
    if (!mountainMesh) {
        console.error("Mountain mesh not found in the loaded scene");
        return;
    }
    mountainMesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 180 *90);
    mountainMesh.position.set(0, 60, -90);
    mountainMesh.scale.set(0.008, 0.008, 0.008);
    scene.add(mountainMesh);

    const domeLoaded = await gltfLoader.loadAsync( 'skydome.glb' );
    let domeMesh = domeLoaded.scene.children[0];
    if (!domeMesh) {
        console.error("Dome mesh not found in the loaded scene");
        return;
    }
    domeMesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 180 *90);
    domeMesh.position.set(0, -40, 0);
    domeMesh.scale.set(0.1, 0.1, 0.1);
    scene.add(domeMesh);
}
