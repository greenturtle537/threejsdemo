import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import Stats from 'three/addons/libs/stats.module.js';

let posdebug = document.getElementById("posdebug")

//Screw builtin FPS controls. We want even more customization

class threejsdemo {
	constructor() {
		this.initialize_();
	}
	initialize_() {
		this.init();
		//this.animate();
		this.previousRAF = null;
    	this.raf();
	}

	init() {
		posdebug.innerHTML = "x:0 y:0 z:0"

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );

		this.clock = new THREE.Clock();

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( this.renderer.domElement );

		this.stats = new Stats();
		this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
		
		document.body.appendChild( this.stats.dom );

		this.controls = new FirstPersonControls( this.camera, this.renderer.domElement );
		this.controls.movementSpeed = 1;
		this.controls.domElement = this.renderer.domElement;
		this.controls.autoForward = false;
		this.controls.dragToLook = false;
		this.controls.activeLook = false;
		this.controls.lookAt(0, 0, 0);

		this.geometry = new THREE.BoxGeometry( 3, 3, 3 );
		const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		this.cube = new THREE.Mesh( this.geometry, material );
		this.scene.add( this.cube );

		this.geometry = new THREE.PlaneGeometry( 10, 10 );
		const material2 = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
		this.plane = new THREE.Mesh( this.geometry, material2 );
		this.plane.rotation.x = 90;
		this.plane.position.y = 0;
		this.scene.add( this.plane );

		this.camera.position.z = 5;
		this.camera.position.x = 0;
		this.camera.position.y = -1;
	}
	posupdate(x=0,y=0,z=0) {
		posdebug.innerHTML = "x:"+x.toString()+" y:"+y.toString()+" z:"+z.toString();
	}
	step() {
		const delta = this.clock.getDelta();
		this.controls.update( delta );
	}
	
	raf() {
		requestAnimationFrame((t) => {
			if (this.previousRAF === null) {
			  this.previousRAF = t;
			}
	  
			//this.step(t - this.previousRAF);
			this.step();
			this.stats.update();
			this.cube.rotation.x += 0.01;
			this.cube.rotation.y += 0.01;
			this.renderer.render( this.scene, this.camera );
			this.posupdate(this.camera.position.x,this.camera.position.y,this.camera.position.z)
			//this.threejs_.autoClear = true;
			//this.threejs_.render(this.scene_, this.camera_);
			//this.threejs_.autoClear = false;
			//this.threejs_.render(this.uiScene_, this.uiCamera_);
			//this.previousRAF = t;
			this.raf();
		  });
	}
}

let _APP = null;
// Check for WebGL Compat
if ( WebGL.isWebGLAvailable() ) {
	// Initiate function or other initializations here
	window.addEventListener('DOMContentLoaded', () => {
  		_APP = new threejsdemo();
	});
} else {
	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById( 'container' ).appendChild( warning );
}