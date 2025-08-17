import * as THREE from "three";
// @ts-ignore
import * as WEBGPU from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type App from "@/app/app";
import { LightManager } from "./light-manager";

import plane1VertexShader from "@/shaders/plane1.vertex.glsl";
import plane1FragmentShader from "@/shaders/plane1.fragment.glsl";

import planeSimpleVertexShader from "@/shaders/planeSimple.vertex.glsl";
import planeSimpleFragmentShader from "@/shaders/planeSimple.fragment.glsl";

import bgParallaxVertexShader from "@/shaders/bg-parallax.vert.glsl";
import bgParallaxFragmentShader from "@/shaders/bg-parallax.fragment.glsl";

import gsap from "gsap";
import { TSLPlane } from "./TSLPlane";
import { ParallaxBackground } from "./parallax-background";

export default class ThreeEngine {
  private forceRenderer: "webgpu" | "webgl2" | "webgl" | null = "webgl2";

  private app: App;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer | WEBGPU.WebGPURenderer;
  private controls: OrbitControls;
  private cube: THREE.Mesh | null = null;
  private lights: LightManager;

  private timeScale: number = 1.0;
  private accumulatedTime: number = 0.0; // NEW: accumulated time
  private lastFrameTime: number = 0.0; // NEW: track last frame time
  private shaderPlane: THREE.Mesh | null = null;
  private shaderMaterial: THREE.ShaderMaterial | null = null;
  private shaderMaterialSimple: THREE.ShaderMaterial | null = null;

  private tslPlane: TSLPlane | null = null;

  private bgLayers: THREE.Mesh[] = [];
  private bgMesh: THREE.Mesh | null = null;

  private bg!: ParallaxBackground;

  private mainSpeed = 1.0;
  private fluidSpeed = 1.0;

  constructor(app: App) {
    this.app = app;

    this.initThree();
    this.initLights();
    this.initControls();
    this.initBackground();

    // Initialize time tracking
    this.lastFrameTime = performance.now() * 0.001;
  }

  private initThree(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 10);

    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const forceRenderer = this.forceRenderer;

    if (forceRenderer === "webgpu") {
      if ((navigator as any).gpu) {
        try {
          this.renderer = new (WEBGPU as any).WebGPURenderer({
            canvas,
            antialias: true,
          });
          console.log("✅ Using WebGPURenderer");
        } catch (err) {
          console.warn("❌ WebGPU failed:", err);
        }
      } else {
        console.warn("❌ No WebGPU support in browser");
      }
      if (!this.renderer) {
        const gl2 = canvas.getContext("webgl2");
        if (gl2) {
          try {
            this.renderer = new THREE.WebGLRenderer({
              canvas,
              context: gl2,
              antialias: true,
              alpha: true,
            });
            console.log("✅ Using WebGL2 fallback");
          } catch (err) {
            console.warn("❌ WebGL2 fallback failed:", err);
          }
        }
      }
      if (!this.renderer) {
        this.renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
        });
        console.log("✅ Using WebGL final fallback");
      }
    } else if (forceRenderer === "webgl2") {
      const gl2 = canvas.getContext("webgl2");
      if (gl2) {
        try {
          this.renderer = new THREE.WebGLRenderer({
            canvas,
            context: gl2,
            antialias: true,
            alpha: true,
          });
          console.log("✅ Using WebGL2Renderer");
        } catch (err) {
          console.warn("❌ WebGL2 failed:", err);
        }
      }
      if (!this.renderer) {
        this.renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
        });
        console.log("✅ Using WebGL fallback");
      }
    } else {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      console.log("✅ Using WebGLRenderer");
    }

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x222222);
  }

  private initLights(): void {
    this.lights = new LightManager(this.scene);
  }

  private initControls(): void {
    this.controls = new OrbitControls(
      this.camera,
      (this.renderer as any).domElement
    );
    this.controls.enabled = true;
  }

  private initBackground(): void {
    this.bg = new ParallaxBackground(window.innerWidth, window.innerHeight);
    this.bg.setLayerCount(13);
    this.bg.setSkyLayer(0);

    // Set initial speeds
    this.bg.setMainSpeed(this.mainSpeed);
    this.bg.setFluidSpeed(this.fluidSpeed);

    // ✅ REGISTER CALLBACK FOR RESET DURING BLACK SCREEN
    this.bg.setExternalResetCallback(() => {
      this.performTimeReset();
    });

    this.bg.material.uniforms.uKeyLightPosition = {
      value: this.lights.keyLight.position.clone(),
    };
    this.bg.material.uniforms.uKeyLightColor = {
      value: this.lights.keyLight.color
        .clone()
        .multiplyScalar(this.lights.keyLight.intensity),
    };
    this.bg.material.uniforms.uFillLightPosition = {
      value: this.lights.fillLight.position.clone(),
    };
    this.bg.material.uniforms.uFillLightColor = {
      value: this.lights.fillLight.color
        .clone()
        .multiplyScalar(this.lights.fillLight.intensity),
    };
    this.bg.material.uniforms.uAmbientLight = {
      value: this.lights.ambient.color
        .clone()
        .multiplyScalar(this.lights.ambient.intensity),
    };

    this.bg.material.uniforms.uMainSpeed = {
      value: this.mainSpeed,
    };

    this.scene.add(this.bg.mesh);

    // Your GSAP animations remain the same
    // gsap.to(this, {
    //   timeScale: 0, // Very small value instead of 0
    //   duration: 4,
    //   ease: "power4.inOut",
    //   repeat: -1,
    //   yoyo: true,
    //   onUpdate: () => {
    //     console.log(this.timeScale);
    //   },
    //   onComplete: () => {
    //     // Ensure we end up at the desired value
    //     this.timeScale = 1;
    //     console.log("Animation complete, timeScale set to:", this.timeScale);
    //   },
    // });

    // gsap.to(this, {
    //   mainSpeed: 1, // Very small value instead of 0
    //   duration: 4,
    //   ease: "power4.inOut",
    //   repeat: -1,
    //   yoyo: true,
    //   onUpdate: () => {
    //     console.log(this.mainSpeed);
    //     this.updateSpeed(this.mainSpeed);
    //   },
    //   onComplete: () => {
    //     // Ensure we end up at the desired value
    //     // this.timeScale = 1;
    //     console.log("Animation complete, timeScale set to:", this.timeScale);
    //   },
    // });
  }

  update(): void {
    if (this.controls) this.controls.update();

    // NEW: Calculate delta time and accumulate
    const currentTime = performance.now() * 0.001;
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Accumulate time based on timeScale
    this.accumulatedTime += deltaTime * this.timeScale;

    if (this.cube) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }

    this.bg.material.uniforms.uKeyLightPosition.value.copy(
      this.lights.keyLight.position
    );
    this.bg.material.uniforms.uKeyLightColor.value
      .copy(this.lights.keyLight.color)
      .multiplyScalar(this.lights.keyLight.intensity);

    // CHANGED: Use accumulated time instead of raw time
    this.bg.updateTime(this.accumulatedTime);
  }

  public updateTimeScale(value: number) {
    this.timeScale = value;
  }
  public updateSpeed(value: number) {
    this.mainSpeed = value;

    this.bg.material.uniforms.uMainSpeed = {
      value: this.mainSpeed,
    };
  }
  // ✅ GETTERS
  public getMainSpeed(): number {
    return this.mainSpeed;
  }

  public getFluidSpeed(): number {
    return this.fluidSpeed;
  }

  // ✅ SEPARATE UPDATE METHODS
  public updateMainSpeed(value: number) {
    this.mainSpeed = value;
    this.bg.setMainSpeed(this.mainSpeed);
  }

  public updateFluidSpeed(value: number) {
    this.fluidSpeed = value;
    this.bg.setFluidSpeed(this.fluidSpeed);
  }

  // ✅ CONVENIENCE METHODS
  public pauseScrolling() {
    this.updateMainSpeed(0.0);
  }

  public resumeScrolling() {
    this.updateMainSpeed(1.0);
  }

  public pauseFluid() {
    this.updateFluidSpeed(0.0);
  }

  public resumeFluid() {
    this.updateFluidSpeed(1.0);
  }

  // NEW: Method to reset time if needed
  public resetTime() {
    this.accumulatedTime = 0.0;
    this.lastFrameTime = performance.now() * 0.001;
  }

  // NEW: Method to get current accumulated time
  public getAccumulatedTime(): number {
    return this.accumulatedTime;
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  resize(vw: number, vh: number): void {
    if (!this.renderer) return;

    this.camera.aspect = vw / vh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(vw, vh, true);

    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uResolution.value.set(vw, vh);
    }
    if (this.shaderMaterialSimple) {
      this.shaderMaterialSimple.uniforms.uResolution.value.set(vw, vh);
    }
    this.bg.resize(vw, vh);
  }
  // Add this method to your ThreeEngine class
  // Add this method to your ThreeEngine class
  public forceCompleteReset() {
    console.log("🎯 ThreeEngine: TRIGGERING RESET SEQUENCE");

    // ✅ TRIGGER FADE SEQUENCE - Reset happens during black screen
    if (this.bg) {
      this.bg.forceReset(); // This will handle the fade + reset timing
    }

    console.log(
      "✅ ThreeEngine: Reset sequence started - reset happens during black"
    );
  }

  // ✅ SEPARATE METHOD: Called during black screen by ParallaxBackground
  public performTimeReset() {
    console.log("🎯 ThreeEngine: PERFORMING TIME RESET DURING BLACK SCREEN");

    // ✅ 1. RESET ACCUMULATED TIME TO ZERO
    this.accumulatedTime = 0.0;
    this.lastFrameTime = performance.now() * 0.001;

    console.log("✅ ThreeEngine: TIME RESET TO ZERO DURING BLACK");
  }

  // ✅ Also update your existing forceReset method to call this
  public forceReset() {
    this.forceCompleteReset();
  }
}
