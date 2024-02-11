import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import Stats from 'three/addons/libs/stats.module.js';
//todo cleanup of global vars
let renderer, clock, stats;
let geometry, cube, plane;
let posdebug = document.getElementById("posdebug")


//Screw builtin FPS controls. We want even more customization

class threejsdemo {
	constructor() {
		this.initialize_();
	}
	initialize_() {
		this.init();
		this.animate();
	}

	init() {
		posdebug.innerHTML = "x:0 y:0 z:0"

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );

		clock = new THREE.Clock();

		renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

		stats = new Stats();
		stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
		
		document.body.appendChild( stats.dom );

		this.controls = new FirstPersonControls( this.camera, renderer.domElement );
		this.controls.movementSpeed = 1;
		this.controls.domElement = renderer.domElement;
		this.controls.autoForward = false;
		this.controls.dragToLook = false;
		this.controls.activeLook = false;
		this.controls.lookAt(0, 0, 0);

		geometry = new THREE.BoxGeometry( 3, 3, 3 );
		const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		cube = new THREE.Mesh( geometry, material );
		this.scene.add( cube );

		geometry = new THREE.PlaneGeometry( 10, 10 );
		const material2 = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
		plane = new THREE.Mesh( geometry, material2 );
		plane.rotation.x = 90;
		plane.position.y = 0;
		this.scene.add( plane );

		this.camera.position.z = 5;
		this.camera.position.x = 0;
		this.camera.position.y = -1;
	}
	posupdate(x=0,y=0,z=0) {
		posdebug.innerHTML = "x:"+x.toString()+" y:"+y.toString()+" z:"+z.toString();
	}
	animate() {
		requestAnimationFrame( animate );
		
		cube.rotation.x += 0.01;
		cube.rotation.y += 0.01;
		renderer.render( this.scene, this.camera );
	
		this.render();
		stats.update();
		this.posupdate(this.camera.position.x,this.camera.position.y,this.camera.position.z)
	}
	render() {
		const delta = clock.getDelta();
		this.controls.update( delta );
	}
}

function init() {
	posdebug.innerHTML = "x:0 y:0 z:0"

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );

	clock = new THREE.Clock();

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	stats = new Stats();
	stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
	
	document.body.appendChild( stats.dom );

	controls = new FirstPersonControls( camera, renderer.domElement );
	controls.movementSpeed = 1;
	controls.domElement = renderer.domElement;
	controls.autoForward = false;
	controls.dragToLook = false;
	controls.activeLook = false;
	controls.lookAt(0, 0, 0);

	geometry = new THREE.BoxGeometry( 3, 3, 3 );
	const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	cube = new THREE.Mesh( geometry, material );
	scene.add( cube );

	geometry = new THREE.PlaneGeometry( 10, 10 );
	const material2 = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
	plane = new THREE.Mesh( geometry, material2 );
	plane.rotation.x = 90;
	plane.position.y = 0;
	scene.add( plane );

	camera.position.z = 5;
	camera.position.x = 0;
	camera.position.y = -1;
}

function posupdate(x=0,y=0,z=0) {
	posdebug.innerHTML = "x:"+x.toString()+" y:"+y.toString()+" z:"+z.toString();
}


function animate() {
	requestAnimationFrame( animate );
	
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
	renderer.render( _APP.scene, _APP.camera );

	render();
	stats.update();
	posupdate(_APP.camera.position.x,_APP.camera.position.y,_APP.camera.position.z)
}

function render() {
	const delta = clock.getDelta();
	_APP.controls.update( delta );
}

let _APP = null;
// Check for WebGL Compat
if ( WebGL.isWebGLAvailable() ) {
	// Initiate function or other initializations here
	window.addEventListener('DOMContentLoaded', () => {
  		_APP = new threejsdemo();
		//init();
		//animate();
	});
} else {
	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById( 'container' ).appendChild( warning );
}