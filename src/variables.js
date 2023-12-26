const elThreejs = document.getElementById("threejs");
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

export {elThreejs, camera, scene, renderer};