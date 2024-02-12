import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import Stats from 'three/addons/libs/stats.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';



let posdebug = document.getElementById("posdebug")

//Screw builtin FPS controls. We want even more customization
//======================================= Stolen lol ==================================================
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
	this.forwardSpeed_ = 2;
	this.strafeSpeed_ = 2;
	this.bobIntensity_ = 0.1
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
    this.camera_.position.y += Math.sin(this.headBobTimer_ * 10) * this.bobIntensity_;

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
    forward.multiplyScalar(forwardVelocity * timeElapsedS * this.forwardSpeed_);

    const left = new THREE.Vector3(-1, 0, 0);
    left.applyQuaternion(qx);
    left.multiplyScalar(strafeVelocity * timeElapsedS * this.strafeSpeed_);

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
//======================================= Stolen lol ==================================================

class threejsdemo {
	constructor() {
		this.initialize_();
	}
	initialize_() {
		this.init();
		this.post();
		this.preload();
		this.fpsCamera = new FirstPersonCamera(this.camera, this.objects);
		this.previousRAF = null;
    	this.raf();
		this.onWindowResize();
	}

	init() {
		posdebug.innerHTML = "x:0 y:0 z:0"

		this.clock = new THREE.Clock();

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( this.renderer.domElement );

		this.stats = new Stats();
		this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
		
		document.body.appendChild( this.stats.dom );
		
		
		const fov = 60;
		const aspect = window.innerWidth / window.innerHeight;
		const near = 1.0;
		const far = 1000.0;
		
		this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this.camera.position.set(0, 2, 0);
		
		this.scene = new THREE.Scene();
		
		this.uiCamera = new THREE.OrthographicCamera(-1, 1, 1 * aspect, -1 * aspect, 1, 1000);
		this.uiScene = new THREE.Scene();	
	}
	preload() {
		this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
		const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		this.cube = new THREE.Mesh( this.geometry, material );
		this.cube.position.y = 1
		this.cube.position.z = -3


		this.planes = [];
		//Area 1
		{
			
			const geometry = new THREE.PlaneGeometry( 10, 30 );
			const material = new THREE.MeshBasicMaterial( {color: 0xff00ff, side: THREE.DoubleSide} );
			
			this.planes.push(new THREE.Mesh( geometry, material ));
			this.planes[0].rotation.x = Math.PI/2;
			this.planes[0].position.z = -10;

		}


		const singlemeshes = [this.cube];
		const meshes = singlemeshes.concat(this.planes)
	
		this.objects = [];
		
		for (let i = 0; i < meshes.length; ++i) {
			const b = new THREE.Box3();
			b.setFromObject(meshes[i]);
			this.objects.push(b);
			this.scene.add(meshes[i]);
			
		}
		this.outlinePass.selectedObjects = [this.cube];
	}
	post() {
		this.composer = new EffectComposer( this.renderer );
		
		this.renderPass = new RenderPass( this.scene, this.camera );
		this.composer.addPass( this.renderPass );
		
		this.outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), this.scene, this.camera );
		this.composer.addPass( this.outlinePass );
		/*
		this.outlinePass.visibleEdgeColor = '#ffffff';
		this.outlinePass.hiddenEdgeColor = '#190a05';

		this.outputPass = new OutputPass();
		this.composer.addPass( this.outputPass );

		this.effectFXAA = new ShaderPass( FXAAShader );
		this.effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
		this.composer.addPass( this.effectFXAA );
		*/
	}
 	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	
		this.uiCamera.left = -this.camera.aspect;
		this.uiCamera.right = this.camera.aspect;
		this.uiCamera.updateProjectionMatrix();
	
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		//this.composer.setSize(window.innerWidth, window.innerHeight);

		//this.effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );

	}
	posupdate(x=0,y=0,z=0) {
		posdebug.innerHTML = "x:"+x.toString()+" y:"+y.toString()+" z:"+z.toString();
	}
	stepold() {
		const delta = this.clock.getDelta();
		this.controls.update( delta );
	}
	step(timeElapsed) {
		const timeElapsedS = timeElapsed * 0.001;
	
		this.fpsCamera.update(timeElapsedS);
	}

	raf() {
		requestAnimationFrame((t) => {
			if (this.previousRAF === null) {
			  this.previousRAF = t;
			}
	  
			this.step(t - this.previousRAF);
			//this.stepold(); //Deprecated for being too static in implementation
			this.stats.update();
			this.cube.rotation.x += 0.01;
			this.cube.rotation.y += 0.01;
			this.posupdate(this.camera.position.x,this.camera.position.y,this.camera.position.z)
			//this.renderer.autoClear = true;
			//this.renderer.render(this.scene, this.camera); //Superceded by post processing tool
			this.composer.render();
			//this.renderer.autoClear = false;
			//this.renderer.render(this.uiScene, this.uiCamera); //Ignore 2d camera tool for now
			this.previousRAF = t;
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