import * as THREE from "three";
// @ts-ignore
import * as WEBGPU from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type App from "@/app/app";
import { LightManager } from "./light-manager";
import { RibbonController } from "./ribbon-controller";
import { TSLPlane } from "./TSLPlane";
import { ParallaxBackground } from "./parallax-background";

export default class ThreeEngine {
  private forceRenderer: "webgpu" | "webgl2" | "webgl" | null = "webgl2";

  private app: App;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer | WEBGPU.WebGPURenderer;
  private controls: OrbitControls;
  private lights: LightManager;

  // Specialized controllers
  private ribbonController: RibbonController | null = null;
  private tslPlane: TSLPlane | null = null;
  private bg: ParallaxBackground | null = null;

  // Demo objects (optional)
  private cube: THREE.Mesh | null = null;

  constructor(app: App) {
    this.app = app;

    this.initThree();
    this.initLights();
    this.initRibbons();
    this.initControls();

    // Optional demo features - uncomment as needed
    // this.initGrid();
    // this.initTestObject();
    // this.initTSLPlane();
    // this.initBackgroundShader();
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
    this.camera.position.set(0, 0, 1);

    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    this.renderer = this.createRenderer(canvas);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x222222);
  }

  private createRenderer(
    canvas: HTMLCanvasElement
  ): THREE.WebGLRenderer | WEBGPU.WebGPURenderer {
    const forceRenderer = this.forceRenderer;

    if (forceRenderer === "webgpu") {
      return (
        this.tryWebGPURenderer(canvas) ||
        this.tryWebGL2Renderer(canvas) ||
        this.createWebGLRenderer(canvas)
      );
    } else if (forceRenderer === "webgl2") {
      return this.tryWebGL2Renderer(canvas) || this.createWebGLRenderer(canvas);
    } else {
      return this.createWebGLRenderer(canvas);
    }
  }

  private tryWebGPURenderer(
    canvas: HTMLCanvasElement
  ): WEBGPU.WebGPURenderer | null {
    if ((navigator as any).gpu) {
      try {
        const renderer = new (WEBGPU as any).WebGPURenderer({
          canvas,
          antialias: true,
        });
        console.log("✅ Using WebGPURenderer");
        return renderer;
      } catch (err) {
        console.warn("❌ WebGPU failed:", err);
      }
    } else {
      console.warn("❌ No WebGPU support in browser");
    }
    return null;
  }

  private tryWebGL2Renderer(
    canvas: HTMLCanvasElement
  ): THREE.WebGLRenderer | null {
    const gl2 = canvas.getContext("webgl2");
    if (gl2) {
      try {
        const renderer = new THREE.WebGLRenderer({
          canvas,
          context: gl2,
          antialias: true,
          alpha: true,
        });
        console.log("✅ Using WebGL2Renderer");
        return renderer;
      } catch (err) {
        console.warn("❌ WebGL2 failed:", err);
      }
    }
    return null;
  }

  private createWebGLRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    console.log("✅ Using WebGLRenderer");
    return renderer;
  }

  private initLights(): void {
    this.lights = new LightManager(this.scene);
  }

  private initRibbons(): void {
    this.ribbonController = new RibbonController(
      this.scene,
      this.camera,
      this.lights
    );
  }

  private initControls(): void {
    this.controls = new OrbitControls(
      this.camera,
      (this.renderer as any).domElement
    );
    this.controls.enabled = true;
  }

  // Optional demo features
  private initGrid(): void {
    const helper = new THREE.GridHelper(5000, 20);
    helper.position.y = -100;
    (helper.material as THREE.Material).opacity = 0.8;
    (helper.material as THREE.Material).transparent = true;
    this.scene.add(helper);
  }

  private initTestObject(): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xe6b400,
      roughness: 0.5,
      metalness: 0.1,
    });

    this.cube = new THREE.Mesh(geometry, material);
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;
    this.scene.add(this.cube);
  }

  private initTSLPlane(): void {
    this.tslPlane = new TSLPlane({
      width: 6,
      height: 6,
      widthSegments: 128,
      heightSegments: 128,
      position: new THREE.Vector3(8, 0, 0),
    });
    this.scene.add(this.tslPlane.mesh);
  }

  private initBackgroundShader(): void {
    this.bg = new ParallaxBackground(window.innerWidth, window.innerHeight);
    this.bg.setLayerCount(10);
    this.bg.setSkyLayer(0);

    // Configure background layers
    this.configureBackgroundLayers();

    this.scene.add(this.bg.mesh);
  }

  private configureBackgroundLayers(): void {
    if (!this.bg) return;

    const layerConfigs = [
      {
        tint: 0x404e5c,
        speed: 0.6,
        opacity: 1.0,
        freq: 0.5,
        base: 1.5,
        amp: 1.5,
        heightOffset: 0.3,
        segmentCount: 6.0,
      },
      {
        tint: 0x4f6272,
        speed: 0.7,
        opacity: 1.0,
        freq: 1.0,
        base: 0.5,
        amp: 0.5,
        heightOffset: 0.3,
        segmentCount: 36.0,
      },
      {
        tint: 0xb7c3f3,
        speed: 0.75,
        opacity: 1.0,
        freq: 1.0,
        base: 0.5,
        amp: 0.5,
        heightOffset: 0.2,
        segmentCount: 20.0,
      },
      {
        tint: 0xdd7596,
        speed: 0.8,
        opacity: 1.0,
        freq: 1.2,
        base: 0.3,
        amp: 0.1,
        heightOffset: 0.35,
        segmentCount: 25.0,
      },
      {
        tint: 0xff0099,
        speed: 0.9,
        opacity: 1.0,
        freq: 1.8,
        base: 0.4,
        amp: 0.3,
        heightOffset: 0.1,
        segmentCount: 20.0,
      },
      {
        tint: 0xd6d6db,
        speed: 1.0,
        opacity: 1.0,
        freq: 1.8,
        base: 0.4,
        amp: 0.3,
        heightOffset: 0.15,
        segmentCount: 50.0,
      },
      {
        tint: 0xd0d0d7,
        speed: 1.5,
        opacity: 1.0,
        freq: 1.2,
        base: 0.26,
        amp: 0.24,
        heightOffset: 0.2,
        segmentCount: 30.0,
      },
      {
        tint: 0x8a8a8f,
        speed: 1.8,
        opacity: 1.0,
        freq: 1.8,
        base: 0.22,
        amp: 0.22,
        heightOffset: 0.15,
        segmentCount: 16.0,
      },
      {
        tint: 0x000000,
        speed: 1.8,
        opacity: 1.0,
        freq: 1.8,
        base: 0.4,
        amp: 0.3,
        heightOffset: 0.1,
        segmentCount: 6.0,
      },
    ];

    layerConfigs.forEach((config, index) => {
      this.bg!.setLayer(index, {
        ...config,
        segmentWidth: 0.3,
        segmentWidthNoise: 0.2,
        heightNoise: 0.8,
        smoothness: 0.1,
      });
    });
  }

  // Public getters for GUI integration
  public get ribbons(): RibbonController | null {
    return this.ribbonController;
  }

  update(): void {
    if (this.controls) this.controls.update();

    const t = performance.now() * 0.001;
    const deltaTime = t - (this.lastTime || 0);
    this.lastTime = t;

    // Update demo cube
    if (this.cube) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }

    // Update specialized controllers
    if (this.ribbonController) {
      this.ribbonController.update(deltaTime);
    }

    if (this.tslPlane) {
      this.tslPlane.update(performance.now());
    }

    if (this.bg) {
      this.bg.updateTime(t);
    }
  }

  private lastTime: number = 0;

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  resize(vw: number, vh: number): void {
    if (!this.renderer) return;

    this.camera.aspect = vw / vh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(vw, vh, true);

    // Update specialized controllers
    if (this.ribbonController) {
      this.ribbonController.resize(vw, vh);
    }

    if (this.bg) {
      this.bg.resize(vw, vh);
    }
  }

  dispose(): void {
    if (this.ribbonController) {
      this.ribbonController.dispose();
    }

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
