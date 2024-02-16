import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import Stats from 'three/addons/libs/stats.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
//import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
//import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
//import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { LightProbeGenerator } from 'three/addons/lights/LightProbeGenerator.js';

let debug = true;

let posdebug = document.getElementById("posdebug");
let gendebug = document.getElementById("gendebug");

let canvas;

document.addEventListener("pointerlockchange", lockChangeAlert, false);

const blocker = document.getElementById("blocker");
const instructions = document.getElementById("instructions");
const pause = document.getElementById("pause");
pause.style.display = "none";
//Todo: Lock view when in pause mode
let lock = false;

function genUpdate(str = "Debug Mode") {
  gendebug.innerHTML = str;
}

function getSize(boundingBox) {
  let min = boundingBox["min"];
  let max = boundingBox["max"];

  let difference = max.clone().sub(min);
  return difference;
}

function getVertices(mesh) {
  let vertices = [];
  let bufferGeometry = mesh.geometry;
  bufferGeometry.computeBoundingBox();
  bufferGeometry.computeVertexNormals();
  const positionAttribute = bufferGeometry.getAttribute('position');
  const size = getSize(bufferGeometry.boundingBox);
  if (positionAttribute !== undefined) {
    for (let i = 0; i < positionAttribute.count; i++) {
      //const vertex = new THREE.Vector3();
      const vertex = new THREE.Vector3(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
      );
      //vertex.fromBufferAttribute( positionAttribute, i % positionAttribute.count );
      mesh.localToWorld(vertex);
      vertex.multiplyScalar(0.999);
      vertices.push(vertex);
    }
  }
  return vertices;
}

function getPlaneVertices(mesh) {
  let normVertices = getVertices(mesh);
  let planeVertices = [normVertices[0],normVertices[2],normVertices[3],normVertices[1],normVertices[0]];
  return planeVertices;
}

function lockChangeAlert() {
  if (document.pointerLockElement === canvas) {
    console.log("The pointer lock status is now locked");
	lock = true;
    pause.style.display = "none";
    blocker.style.display = "none";
  } else {
    console.log("The pointer lock status is now unlocked");
	lock = false;
    blocker.style.display = "block";
    pause.style.display = "";
  }
}

//Screw builtin FPS controls. We want even more customization
//======================================= Stolen lol ==================================================
const KEYS = {
  a: 65,
  s: 83,
  w: 87,
  d: 68,
};

const API = {
	directionalLightIntensity: 0.6,
	envMapIntensity: 1
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
    this.target_.addEventListener("click", (e) => this.onClick_(e), false);
    this.target_.addEventListener(
      "mousedown",
      (e) => this.onMouseDown_(e),
      false,
    );
    this.target_.addEventListener(
      "mousemove",
      (e) => this.onMouseMove_(e),
      false,
    );
    this.target_.addEventListener("mouseup", (e) => this.onMouseUp_(e), false);
    this.target_.addEventListener("keydown", (e) => this.onKeyDown_(e), false);
    this.target_.addEventListener("keyup", (e) => this.onKeyUp_(e), false);
  }

  onClick_(e) {
    const promise = canvas.requestPointerLock({
      unadjustedMovement: true,
    });
    instructions.style.display = "none";

    if (!promise) {
      console.log("disabling mouse acceleration is not supported");
      return;
    }

    return promise
      .then(() => console.log("pointer is locked"))
      .catch((error) => {
        if (error.name === "NotSupportedError") {
          // Some platforms may not support unadjusted movement.
          // You can request again a regular pointer lock.
          return canvas.requestPointerLock();
        }
      });
  }

  onMouseMove_(e) {
    // Pre-pointer locking
    //this.current_.mouseX = e.pageX - window.innerWidth / 2;
    //this.current_.mouseY = e.pageY - window.innerHeight / 2;
    this.current_.mouseX = e.screenX;
    this.current_.mouseY = e.screenY;

    if (this.previous_ === null) {
      this.previous_ = { ...this.current_ };
    }
    // Pre-pointer locking
    //this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
    //this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
    this.current_.mouseXDelta = e.movementX;
    this.current_.mouseYDelta = e.movementY;
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
    //Is this even called?
    //Doesn't work because we add pointer locking anyway
    if (this.previous_ !== null) {
      this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
      this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

      this.previous_ = { ...this.current_ };
    }
  }
}
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
    this.bobIntensity_ = 0.1;
  }

  update(timeElapsedS) {
	if (!(lock)) {
		return;
	}
    this.updateRotation_(timeElapsedS);
    this.updateCamera_(timeElapsedS);
    this.updateTranslation_(timeElapsedS);
    this.updateHeadBob_(timeElapsedS);
    this.input_.update(timeElapsedS);
  }

  updateCamera_(_) {
    this.camera_.quaternion.copy(this.rotation_);
    this.camera_.position.copy(this.translation_);
    this.camera_.position.y +=
      Math.sin(this.headBobTimer_ * 10) * this.bobIntensity_;

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
      const nextStep =
        1 + Math.floor(((this.headBobTimer_ + 0.000001) * 10) / wavelength);
      const nextStepTime = (nextStep * wavelength) / 10;
      this.headBobTimer_ = Math.min(
        this.headBobTimer_ + timeElapsedS,
        nextStepTime,
      );

      if (this.headBobTimer_ == nextStepTime) {
        this.headBobActive_ = false;
      }
    }
  }

  updateTranslation_(timeElapsedS) {
    const forwardVelocity =
      (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0);
    const strafeVelocity =
      (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0);

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
    this.theta_ = clamp(
      this.theta_ + -yh * this.thetaSpeed_,
      -Math.PI / 3,
      Math.PI / 3,
    );

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
    if (debug) {
      posdebug.innerHTML = "x:0 y:0 z:0";
      //gendebug.innerHTML = "Debug Mode";
    }

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.renderer.sortObjects = false;


    canvas = document.querySelector("canvas");

    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

    document.body.appendChild(this.stats.dom);

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 1000.0;

    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(0, 2, 0);

    this.scene = new THREE.Scene();

    this.uiCamera = new THREE.OrthographicCamera(
      -1,
      1,
      1 * aspect,
      -1 * aspect,
      1,
      1000,
    );
    this.uiScene = new THREE.Scene();
  }
  preload() {
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(this.geometry, material);
    this.cube.position.y = 1;
    this.cube.position.z = -3;

		this.planes = [];
		this.lines = [];
		this.pointsmap = [];
		//Area 1
		{
			
			let geometry = new THREE.PlaneGeometry( 10, 30 );
			let i = 0
			//let material = new THREE.MeshStandardMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
			let material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} ); //debug
			
			this.planes.push(new THREE.Mesh( geometry, material ));
			this.planes[i].rotation.x = Math.PI/2;
			this.planes[i].position.z = -10;
			i++;
			this.planes.push(new THREE.Mesh( geometry, material ));
			this.planes[i].rotation.x = Math.PI/2;
			this.planes[i].position.z = -10;
			this.planes[i].position.y = 10;
			i++;
			geometry = new THREE.PlaneGeometry( 30, 10 );
			this.planes.push(new THREE.Mesh( geometry, material ));
			this.planes[i].rotation.y = Math.PI/2;
			this.planes[i].position.y = 5;
			this.planes[i].position.z = -10;
			this.planes[i].position.x = -5;
			i++;
			this.planes.push(new THREE.Mesh( geometry, material ));
			this.planes[i].rotation.y = Math.PI/2;
			this.planes[i].position.y = 5;
			this.planes[i].position.z = -10;
			this.planes[i].position.x = 5;
			i++;
			geometry = new THREE.PlaneGeometry( 10, 10 );
			this.planes.push(new THREE.Mesh( geometry, material ));
			this.planes[i].position.z = -25
			this.planes[i].position.y = 5
			i++;
			this.planes.push(new THREE.Mesh( geometry, material ));
			this.planes[i].position.z = 5
			this.planes[i].position.y = 5
      
      this.pointsmap = [];
      for (let i = 0; i < this.planes.length; ++i) {
          this.pointsmap.push(getPlaneVertices(this.planes[i]));
      }
			for (let i = 0; i < this.pointsmap.length; ++i) {
				geometry = new THREE.BufferGeometry().setFromPoints( this.pointsmap[i] );
				this.lines.push(new THREE.Line( geometry, material ));
				
			}

			// light
			this.directionalLight = new THREE.DirectionalLight( 0xffffff, API.directionalLightIntensity );
			this.directionalLight.position.set( 0, 5, -10 );
			this.scene.add( this.directionalLight );

			this.helper = new THREE.DirectionalLightHelper( this.directionalLight, 5 );
			this.scene.add( this.helper );


			
		}

    const singlemeshes = [this.cube];
    const meshes = singlemeshes.concat(this.planes).concat(this.lines);

    this.objects = [];

    for (let i = 0; i < meshes.length; ++i) {
      const b = new THREE.Box3();
      b.setFromObject(meshes[i]);
      this.objects.push(b);
      this.scene.add(meshes[i]);
    }
    this.outlinePass.selectedObjects = meshes;
  }

  planePoints(plane) {
    // Todo: I can't do math. Hours wasted: 1
    let points = [];
    let xoff = 0.01;
    let yoff = 0.01;
    let zoff = 0.01;
    if (plane.position.x > 0) {
      xoff = -xoff;
    } else if (plane.position.x === 0) {
      xoff = 0.0;
    }
    if (plane.position.y > 0) {
      yoff = -yoff;
    } else if (plane.position.y == 0) {
      yoff = 0.01;
    }
    if (plane.position.z > 0) {
      zoff = -zoff;
    } else if (plane.position.z === 0) {
      zoff = 0.0;
    }
    //plane.geometry.parameters.height
    //plane.position.y
    // y = plane.position.y +/- (plane.geometry.parameters.height / 2)
    // x = plane.position.x +/- (plane.geometry.parameters.width / 2)

    points.push(new THREE.Vector3(-4.99, 9.99, -24.99));
    points.push(new THREE.Vector3(-4.99, 0.01, -24.99));
    points.push(new THREE.Vector3(4.99, 0.01, -24.99));
    points.push(new THREE.Vector3(4.99, 9.99, -24.99));
    points.push(new THREE.Vector3(-4.99, 9.99, -24.99));
    return points;
  }

  post() {
    this.composer = new EffectComposer(this.renderer);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    

    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera,
    );
    this.composer.addPass(this.outlinePass);

    this.outlinePass.visibleEdgeColor.set("#ffffff");
    this.outlinePass.hiddenEdgeColor.set("#ffffff");
    this.outlinePass.edgeThickness = Number(1);
    this.outlinePass.edgeGlow = Number(0.0);
    this.outlinePass.edgeStrength = Number(10.0);
    /*
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
  posupdate(x = 0, y = 0, z = 0) {
    posdebug.innerHTML =
      "x:" + x.toString() + " y:" + y.toString() + " z:" + z.toString();
  }
  posauto() {
    this.posupdate(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z,
    );
  }
  stepold() {
    const delta = this.clock.getDelta();
    this.controls.update(delta);
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
      if (debug) {
        this.posauto();
      }
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
if (WebGL.isWebGLAvailable()) {
  // Initiate function or other initializations here
  window.addEventListener("DOMContentLoaded", () => {
    _APP = new threejsdemo();
  });
} else {
  const warning = WebGL.getWebGLErrorMessage();
  document.getElementById("container").appendChild(warning);
}
