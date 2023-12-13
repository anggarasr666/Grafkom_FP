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
let particleSystem;

let targetSpeed = 0.15;
let maxTargetSpeed = 0.5;
let timeElapsed = 0;

let targetMeshes = [];
let targetMesh;
let score = 0;
let fail = 0;
let initialInterval;
let originalInterval = 500;
let gameOver = false;
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

function animate(){

	movePlayer();
	updateProjectiles();
	updatetargets();

	checkCollisions();
    updateScoreDisplay(); 

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
	const projectileGLTF = await gltfLoader.loadAsync( 'anak_panah_warna.glb' );
	projectileMesh = projectileGLTF.scene;

    const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    projectileMesh.traverse(child => {
        if (child.isMesh) {
            child.material = projectileMaterial;
        }
    });

    addOutlineEffect(projectileMesh);
    scaleAndRotateProjectile(projectileMesh);
}

function addOutlineEffect(object) {
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
    const outlineMesh = new THREE.Mesh(object.geometry, outlineMaterial);
    outlineMesh.scale.multiplyScalar(1.05);
    object.add(outlineMesh);
}

function scaleAndRotateProjectile(object) {
    object.scale.set(1.5, 1.5, 1.5);
    object.rotation.set(0, Math.PI / 2, 0);
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

async function addBuffTarget(posX) {
    try {
        const gltfLoader = new GLTFLoader().setPath('src/assets/');
        const buffGLTF = await gltfLoader.loadAsync('buff.glb');
        let buffMesh = buffGLTF.scene.children[0];

        const buffMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.7, metalness: 0.5 });
        buffMesh.material = buffMaterial;

        buffMesh.scale.set(0.5, 0.5, 0.5);
        buffMesh.position.x = posX;
        buffMesh.position.y = 0;
        buffMesh.position.z = -30;

        scene.add(buffMesh);
        targetMeshes.push(buffMesh);
    } catch (error) {
        console.error('Error adding buff target:', error);
    }
}

function startProjectileInterval() {
    initialInterval = originalInterval;

    function launchProjectile() {
        let projectileMeshClone = projectileMesh.clone();
        projectileMeshClone.position.x = playerMesh.position.x;
        projectileMeshClone.position.y = playerMesh.position.y + 2;
        projectileMeshClone.position.z = playerMesh.position.z;
        scene.add(projectileMeshClone);
        projectileMeshes.push(projectileMeshClone);

        // initialInterval -= 10;

        // if (initialInterval < 100) {
        //     initialInterval = 100;
        // }

        setTimeout(launchProjectile, initialInterval);
    }
    launchProjectile();
}

function stopProjectileInterval() {
    
}


async function loadtarget() {
    const gltfLoader = new GLTFLoader().setPath('src/assets/');
    targetGLTF = await gltfLoader.loadAsync('mm_project.glb');
    await loadProject(); 
}

function spawntargets() {
    setInterval (() => {
        timeElapsed += 1;
        if (timeElapsed > 15) {
            timeElapsed = 0;
            targetSpeed += 0.05;
            if (targetSpeed > 0.5) {
                targetSpeed = maxTargetSpeed;
            }
        }
        let randomX = Math.floor(Math.random() * 20) - 10;
        addProject(randomX); 
    }, 1000);

    setInterval(() => {
        let randomX = Math.floor(Math.random() * 20) - 10;
        addBuffTarget(randomX);
    }, 5000);
}
  
function updatetargets(){
	targetMeshes.forEach((target, index) => {
		target.position.z += targetSpeed;
		if(target.position.z > 0){
            fail += 1;
            updateScoreDisplay();
		    scene.remove(target);
		    targetMeshes.splice(index, 1);
		}
	});
}

function createParticleSystem(position){
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < 100; i++) {
        const x = (Math.random() - 0.5) * 2;
        const y = (Math.random() - 0.5) * 2;
        const z = (Math.random() - 0.5) * 2;

        vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 });

    particleSystem = new THREE.Points(geometry, material);
    particleSystem.position.copy(position);
    scene.add(particleSystem);

    const particles = geometry.attributes.position.array;
    const particleSpeed = 0.01;

    const particleDirections = [];
    for (let i = 0; i < particles.length; i += 3) {
        const direction = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
        particleDirections.push(direction);
    }

    const animateParticles = () => {
        for (let i = 0; i < particles.length; i += 3) {
            particles[i] += particleDirections[i / 3].x * particleSpeed;
            particles[i + 1] += particleDirections[i / 3].y * particleSpeed;
            particles[i + 2] += particleDirections[i / 3].z * particleSpeed;
        }

        geometry.attributes.position.needsUpdate = true;

        requestAnimationFrame(animateParticles);
    };

    animateParticles();

    setTimeout(() => {
        scene.remove(particleSystem);
    }, 850);
}
  
function checkCollisionsForProject(target, projectile) {
    const collisionThreshold = 1;
    if (
        target.position.x >= projectile.position.x - collisionThreshold &&
        target.position.x <= projectile.position.x + collisionThreshold &&
        target.position.z >= projectile.position.z - collisionThreshold &&
        target.position.z <= projectile.position.z + collisionThreshold
    ) {
        createParticleSystem(target.position);
        scene.remove(target);
        const index = targetMeshes.indexOf(target);
        if (index !== -1) {
            targetMeshes.splice(index, 1);
        }
        scene.remove(projectile);
        const projectileIndex = projectileMeshes.indexOf(projectile);
        if (projectileIndex !== -1) {
            projectileMeshes.splice(projectileIndex, 1);
        }
        score += 1;
        updateScoreDisplay();
    }
}

function checkCollisionsForBuff(target, projectile) {
    const collisionThreshold = 2;
    if (
        target.position.x >= projectile.position.x - collisionThreshold &&
        target.position.x <= projectile.position.x + collisionThreshold &&
        target.position.z >= projectile.position.z - collisionThreshold &&
        target.position.z <= projectile.position.z + collisionThreshold
    ) {
        createParticleSystem(target.position);
        scene.remove(target);
        const index = targetMeshes.indexOf(target);
        if (index !== -1) {
            targetMeshes.splice(index, 1);
        }
        scene.remove(projectile);
        const projectileIndex = projectileMeshes.indexOf(projectile);
        if (projectileIndex !== -1) {
            projectileMeshes.splice(projectileIndex, 1);
        }
        score += 1;
        updateScoreDisplay();


        // initialInterval -= 500;

        // if (initialInterval < 100) {
        //     initialInterval = 100;
        // }
    }
}


function checkCollisions() {
    if (!gameOver) {
        targetMeshes.forEach((target) => {
            projectileMeshes.forEach((projectile) => {
                if (target.name === 'buffTarget') {
                    checkCollisionsForBuff(target, projectile);
                } else {
                    checkCollisionsForProject(target, projectile);
                }
            });
        });

        if (fail >= 10) {
            showGameOverScreen();
        }
    }
}


function updateScoreDisplay() {
    const scoreElement = document.getElementById("score");
    const failElement = document.getElementById("fail"); 
    if (scoreElement) {
        scoreElement.innerText = `Score: ${score}`;
    }
    if (failElement) {
        failElement.innerText = `Fail: ${fail}`; 
    }
}


function createRestartButton() {
    const restartButton = document.createElement("button");
    restartButton.innerText = "Restart";
    restartButton.style.position = "absolute";
    restartButton.style.top = "60%";
    restartButton.style.left = "50%";
    restartButton.style.transform = "translateX(-50%)";
    restartButton.style.padding = "10px";
    restartButton.style.fontSize = "20px";
    restartButton.style.cursor = "pointer";
    restartButton.style.backgroundColor = "green";
    restartButton.style.color = "white";

    restartButton.addEventListener("click", function () {
        restartGame();
    });

    return restartButton;
}

function showGameOverScreen() {
    gameOver = true;

    // game over screen
    const gameOverScreen = document.createElement("div");
    gameOverScreen.id = "gameOverScreen";
    gameOverScreen.style.position = "absolute";
    gameOverScreen.style.top = "50%";
    gameOverScreen.style.left = "50%";
    gameOverScreen.style.transform = "translate(-50%, -50%)";
    gameOverScreen.style.color = "white";
    gameOverScreen.style.fontSize = "30px";
    gameOverScreen.innerText = "Game Over!\nYour Score: " + score;

    document.body.appendChild(gameOverScreen);
    document.body.appendChild(createRestartButton());
}

function restartGame() {
    //Reset game state
    score = 0;
    fail = 0;
    gameOver = false;
    initialInterval = originalInterval;
    targetSpeed = 0.15;

    // Remove game over screen and restart button
    const gameOverScreen = document.getElementById("gameOverScreen");
    const restartButton = document.querySelector("button");

    if (gameOverScreen) {
        document.body.removeChild(gameOverScreen);
    }

    if (restartButton) {
        document.body.removeChild(restartButton);
    }

    // Reset the scene and start the game again
    resetScene();
    startProjectileInterval();
}

function resetScene() {
    // Remove remaining projectiles
    projectileMeshes.forEach(projectile => {
        scene.remove(projectile);
    });
    projectileMeshes = [];

    // Remove remaining targets
    targetMeshes.forEach(target => {
        scene.remove(target);
    });
    targetMeshes = [];

    // Reset player position
    playerMesh.position.set(0, 0, 0);

    // Reset score
    score = 0;
    updateScoreDisplay();

    // Restart target spawning
    startProjectileInterval();

    // Hide game over screen and restart button
    const gameOverScreen = document.getElementById("gameOverScreen");
    const restartButton = document.querySelector("button");

    if (gameOverScreen) {
        document.body.removeChild(gameOverScreen);
    }

    if (restartButton) {
        document.body.removeChild(restartButton);
    }
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
