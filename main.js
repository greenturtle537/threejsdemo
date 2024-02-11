import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { FirstPersonCamera } from "fps.js";

let scene, controls, renderer, camera, clock, stats;
let geometry, cube, plane;
let posdebug = document.getElementById("posdebug")


//Screw builtin FPS controls. We want even more customization
// =================================== Stolen =========================================
const KEYS = {
	'a': 65,
	's': 83,
	'w': 87,
	'd': 68,
};

function clamp(x, a, b) {
	return Math.min(Math.max(x, a), b);
}

class InputController {
	constructor(target) {
		this.target_ = target || document;
		this.initialize_();    
	}

	initialize_() {
		this.current_ = {
		leftButton: false,
		rightButton: false,
		mouseXDelta: 0,
		mouseYDelta: 0,
		mouseX: 0,
		mouseY: 0,
		};
		this.previous_ = null;
		this.keys_ = {};
		this.previousKeys_ = {};
		this.target_.addEventListener('mousedown', (e) => this.onMouseDown_(e), false);
		this.target_.addEventListener('mousemove', (e) => this.onMouseMove_(e), false);
		this.target_.addEventListener('mouseup', (e) => this.onMouseUp_(e), false);
		this.target_.addEventListener('keydown', (e) => this.onKeyDown_(e), false);
		this.target_.addEventListener('keyup', (e) => this.onKeyUp_(e), false);
	}

	onMouseMove_(e) {
		this.current_.mouseX = e.pageX - window.innerWidth / 2;
		this.current_.mouseY = e.pageY - window.innerHeight / 2;

		if (this.previous_ === null) {
		this.previous_ = {...this.current_};
		}

		this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
		this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
	}

	onMouseDown_(e) {
		this.onMouseMove_(e);

		switch (e.button) {
		case 0: {
			this.current_.leftButton = true;
			break;
		}
		case 2: {
			this.current_.rightButton = true;
			break;
		}
		}
	}

	onMouseUp_(e) {
		this.onMouseMove_(e);

		switch (e.button) {
		case 0: {
			this.current_.leftButton = false;
			break;
		}
		case 2: {
			this.current_.rightButton = false;
			break;
		}
		}
	}

	onKeyDown_(e) {
		this.keys_[e.keyCode] = true;
	}

	onKeyUp_(e) {
		this.keys_[e.keyCode] = false;
	}

	key(keyCode) {
		return !!this.keys_[keyCode];
	}

	isReady() {
		return this.previous_ !== null;
	}

	update(_) {
		if (this.previous_ !== null) {
		this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
		this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

		this.previous_ = {...this.current_};
		}
	}
};


class FirstPersonCamera {
	constructor(camera, objects) {
		this.camera_ = camera;
		this.input_ = new InputController();
		this.rotation_ = new THREE.Quaternion();
		this.translation_ = new THREE.Vector3(0, 2, 0);
		this.phi_ = 0;
		this.phiSpeed_ = 8;
		this.theta_ = 0;
		this.thetaSpeed_ = 5;
		this.headBobActive_ = false;
		this.headBobTimer_ = 0;
		this.objects_ = objects;
	}

	update(timeElapsedS) {
		this.updateRotation_(timeElapsedS);
		this.updateCamera_(timeElapsedS);
		this.updateTranslation_(timeElapsedS);
		this.updateHeadBob_(timeElapsedS);
		this.input_.update(timeElapsedS);
	}

	updateCamera_(_) {
		this.camera_.quaternion.copy(this.rotation_);
		this.camera_.position.copy(this.translation_);
		this.camera_.position.y += Math.sin(this.headBobTimer_ * 10) * 1.5;

		const forward = new THREE.Vector3(0, 0, -1);
		forward.applyQuaternion(this.rotation_);

		const dir = forward.clone();

		forward.multiplyScalar(100);
		forward.add(this.translation_);

		let closest = forward;
		const result = new THREE.Vector3();
		const ray = new THREE.Ray(this.translation_, dir);
		for (let i = 0; i < this.objects_.length; ++i) {
		if (ray.intersectBox(this.objects_[i], result)) {
			if (result.distanceTo(ray.origin) < closest.distanceTo(ray.origin)) {
			closest = result.clone();
			}
		}
		}

		this.camera_.lookAt(closest);
	}

	updateHeadBob_(timeElapsedS) {
		if (this.headBobActive_) {
		const wavelength = Math.PI;
		const nextStep = 1 + Math.floor(((this.headBobTimer_ + 0.000001) * 10) / wavelength);
		const nextStepTime = nextStep * wavelength / 10;
		this.headBobTimer_ = Math.min(this.headBobTimer_ + timeElapsedS, nextStepTime);

		if (this.headBobTimer_ == nextStepTime) {
			this.headBobActive_ = false;
		}
		}
	}

	updateTranslation_(timeElapsedS) {
		const forwardVelocity = (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0)
		const strafeVelocity = (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0)

		const qx = new THREE.Quaternion();
		qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

		const forward = new THREE.Vector3(0, 0, -1);
		forward.applyQuaternion(qx);
		forward.multiplyScalar(forwardVelocity * timeElapsedS * 10);

		const left = new THREE.Vector3(-1, 0, 0);
		left.applyQuaternion(qx);
		left.multiplyScalar(strafeVelocity * timeElapsedS * 10);

		this.translation_.add(forward);
		this.translation_.add(left);

		if (forwardVelocity != 0 || strafeVelocity != 0) {
		this.headBobActive_ = true;
		}
	}

	updateRotation_(timeElapsedS) {
		const xh = this.input_.current_.mouseXDelta / window.innerWidth;
		const yh = this.input_.current_.mouseYDelta / window.innerHeight;

		this.phi_ += -xh * this.phiSpeed_;
		this.theta_ = clamp(this.theta_ + -yh * this.thetaSpeed_, -Math.PI / 3, Math.PI / 3);

		const qx = new THREE.Quaternion();
		qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
		const qz = new THREE.Quaternion();
		qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);

		const q = new THREE.Quaternion();
		q.multiply(qx);
		q.multiply(qz);

		this.rotation_.copy(q);
	}
}
// =================================== Stolen =========================================

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
	renderer.render( scene, camera );

	render();
	stats.update();
	posupdate(camera.position.x,camera.position.y,camera.position.z)
}

function render() {
	const delta = clock.getDelta();
	controls.update( delta );
}

class threejsdemo {
	constructor() {
		this.initialize_();
	  }
	
	  initialize_() {
		this.initializeRenderer_();
		this.initializeLights_();
		this.initializeScene_();
		this.initializePostFX_();
		this.initializeDemo_();
	
		this.previousRAF_ = null;
		this.raf_();
		this.onWindowResize_();
	  }
}

// Check for WebGL Compat
if ( WebGL.isWebGLAvailable() ) {

	// Initiate function or other initializations here
	init();
	animate();

} else {

	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById( 'container' ).appendChild( warning );

}