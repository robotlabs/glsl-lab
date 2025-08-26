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

import planePastelVertexShader from "@/shaders/plane-pastel.vertex.glsl";
import planePastelFragmentShader from "@/shaders/plane-pastel.fragment.glsl";

// opzionali se vuoi ancora usarli
// import terrainVertexShader from "@/shaders/terrain.vertex.glsl";
// import terrainFragmentShader from "@/shaders/terrain.fragment.glsl";

import bgParallaxVertexShader from "@/shaders/bg-parallax.vert.glsl";
import bgParallaxFragmentShader from "@/shaders/bg-parallax.fragment.glsl";

import gsap from "gsap";
import { TSLPlane } from "./TSLPlane";
import { ParallaxBackground } from "./parallax-background";

export default class ThreeEngine {
  private forceRenderer: "webgpu" | "webgl2" | "webgl" | null = "webgl2";
  private planeAspectRatio: number = 16 / 9;

  private app: App;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer | WEBGPU.WebGPURenderer;
  private controls: OrbitControls;
  private cube: THREE.Mesh | null = null;
  private lights: LightManager;

  private shaderPlane: THREE.Mesh | null = null;
  private shaderMaterial: THREE.ShaderMaterial | null = null;
  private shaderMaterialSimple: THREE.ShaderMaterial | null = null;

  private tslPlane: TSLPlane | null = null;

  private bgLayers: THREE.Mesh[] = [];
  private bgMesh: THREE.Mesh | null = null;

  private bg!: ParallaxBackground;

  constructor(app: App) {
    this.app = app;

    this.initThree();
    this.initLights();
    // this.initGrid();
    // this.initTestObject();
    // this.initTestPlaneTexture();
    this.initTestPlaneShader();
    // this.initSimpleShaderPlane();
    this.initControls();

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

    // SEMPRE una volta qui
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x222222);
    // opzionale:
    // this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    for (let i = 0; i < 1000; i++) {
      const cube = new THREE.Mesh(geometry, material);

      // Enable shadows
      cube.castShadow = true;
      cube.receiveShadow = true;

      this.scene.add(cube);

      // Set initial position
      cube.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8 - 5
      );

      // Set initial rotation
      cube.rotation.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );

      // Set initial scale
      cube.scale.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );

      // Animate position
      gsap.to(cube.position, {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 8 - 5 + 5,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "power4.inOut",
      });

      // Animate rotation
      gsap.to(cube.rotation, {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 8,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "power4.inOut",
      });

      // Animate scale
      gsap.to(cube.scale, {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 4,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "power4.inOut",
      });
    }

    // Keep reference to last cube for update method
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;
    this.scene.add(this.cube);
  }

  private initTestPlaneTexture(): void {
    const geometry = new THREE.PlaneGeometry(5, 5);
    const texture = new THREE.Texture(this.app.assets["test-image-local"]);
    texture.needsUpdate = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 0, 2);
    plane.castShadow = true;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  private initTestPlaneShader(): void {
    // Position the plane closer to camera for better fill
    const planeDistance = 5;

    // Define the target aspect ratio for your plane (e.g., 16:9, 4:3, 1:1, etc.)
    const targetAspectRatio = 16 / 9; // Change this to your desired aspect ratio

    const { width, height } = this.calculatePlaneSize(
      this.camera,
      planeDistance,
      targetAspectRatio
    );

    console.log(
      `Plane size: ${width} x ${height} (aspect: ${
        width / height
      }) at distance ${planeDistance}`
    );

    // Use more segments for smoother shaders
    const geometry = new THREE.PlaneGeometry(width, height, 64, 64);

    this.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: planePastelVertexShader,
      fragmentShader: planePastelFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },

        // Uniforms per le luci
        u_keyLightPosition: { value: this.lights.keyLight.position },
        u_keyLightColor: { value: this.lights.keyLight.color },
        u_keyLightIntensity: { value: this.lights.keyLight.intensity },

        u_fillLightPosition: { value: this.lights.fillLight.position },
        u_fillLightColor: { value: this.lights.fillLight.color },
        u_fillLightIntensity: { value: this.lights.fillLight.intensity },

        u_backLightPosition: { value: this.lights.backLight.position },
        u_backLightColor: { value: this.lights.backLight.color },
        u_backLightIntensity: { value: this.lights.backLight.intensity },

        u_ambientColor: { value: this.lights.ambient.color },
        u_ambientIntensity: { value: this.lights.ambient.intensity },
      },
      side: THREE.DoubleSide,
      transparent: true,
    });

    this.shaderPlane = new THREE.Mesh(geometry, this.shaderMaterial);
    // Position plane in front of camera (negative Z since camera looks down -Z axis)
    this.shaderPlane.position.set(0, 0, -planeDistance);
    this.scene.add(this.shaderPlane);
  }

  private calculatePlaneSize(
    camera: THREE.PerspectiveCamera,
    distance: number,
    targetAspect: number
  ): { width: number; height: number } {
    // Convert FOV from degrees to radians
    const fov = camera.fov * (Math.PI / 180);

    // Calculate visible height at the given distance
    const visibleHeight = 2 * Math.tan(fov / 2) * distance;
    const visibleWidth = visibleHeight * camera.aspect;

    const currentAspect = camera.aspect;

    let width, height;

    if (currentAspect > targetAspect) {
      // Screen is wider than plane - fit by height, width will be cut off
      height = visibleHeight * 1.1; // Add padding
      width = height * targetAspect;
    } else {
      // Screen is taller than plane - fit by width, height will be cut off
      width = visibleWidth * 1.1; // Add padding
      height = width / targetAspect;
    }

    return { width, height };
  }

  private initSimpleShaderPlane(): void {
    const geometry = new THREE.PlaneGeometry(4, 4, 64, 64);

    this.shaderMaterialSimple = new THREE.ShaderMaterial({
      vertexShader: planeSimpleVertexShader,
      fragmentShader: planeSimpleFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
      side: THREE.DoubleSide,
      wireframe: false,
      transparent: true,
    });

    const simpleShaderPlane = new THREE.Mesh(
      geometry,
      this.shaderMaterialSimple
    );
    simpleShaderPlane.position.set(-4, 0, 2);
    this.scene.add(simpleShaderPlane);
  }

  private initBackgroundShader(): void {
    this.bg = new ParallaxBackground(window.innerWidth, window.innerHeight);
    this.bg.setLayerCount(10);
    this.bg.setSkyLayer(0);

    this.bg.setLayer(0, {
      tint: 0x404e5c,
      speed: 0.6,
      opacity: 1.0,
      freq: 0.5,
      base: 1.5,
      amp: 1.5,
      heightOffset: 0.3,
      segmentCount: 6.0,
      segmentWidth: 0.3,
      segmentWidthNoise: 0.2,
      heightNoise: 0.8,
      smoothness: 0.1,
    });

    this.bg.setLayer(1, {
      tint: 0x4f6272,
      speed: 0.7,
      opacity: 1.0,
      freq: 1.0,
      base: 0.5,
      amp: 0.5,
      heightOffset: 0.3,
      segmentCount: 36.0,
      segmentWidth: 0.3,
      segmentWidthNoise: 0.2,
      heightNoise: 0.8,
      smoothness: 0.1,
    });

    this.bg.setLayer(2, {
      tint: 0xb7c3f3,
      speed: 0.75,
      opacity: 1.0,
      freq: 1.0,
      base: 0.5,
      amp: 0.5,
      heightOffset: 0.2,
      segmentCount: 20.0,
      segmentWidth: 0.3,
      segmentWidthNoise: 0.2,
      heightNoise: 0.8,
      smoothness: 0.1,
    });

    this.bg.setLayer(3, {
      tint: 0xdd7596,
      speed: 0.8,
      opacity: 1.0,
      freq: 1.2,
      base: 0.3,
      amp: 0.1,
      heightOffset: 0.35,
      segmentCount: 25.0,
      segmentWidth: 0.3,
      segmentWidthNoise: 0.2,
      heightNoise: 0.8,
      smoothness: 0.1,
    });

    this.bg.setLayer(4, {
      tint: 0xff0099,
      speed: 0.9,
      opacity: 1.0,
      freq: 1.8,
      base: 0.4,
      amp: 0.3,
      heightOffset: 0.1,
      segmentCount: 20.0,
      segmentWidth: 0.3,
      segmentWidthNoise: 0.2,
      heightNoise: 0.8,
      smoothness: 0.1,
    });

    this.bg.setLayer(5, {
      tint: 0xd6d6db,
      speed: 1.0,
      opacity: 1.0,
      freq: 1.8,
      base: 0.4,
      amp: 0.3,
      heightOffset: 0.15,
      segmentCount: 50.0,
      segmentWidth: 0.3,
      segmentWidthNoise: 0.2,
      heightNoise: 0.8,
      smoothness: 0.1,
    });
    // MID (1)
    this.bg.setLayer(6, {
      tint: 0xd0d0d7,
      speed: 1.5,
      opacity: 1.0,
      freq: 1.2,
      base: 0.26,
      amp: 0.24,
      heightOffset: 0.2,
      segmentCount: 30.0,
      segmentWidth: 0.3,
      segmentWidthNoise: 0.3,
      heightNoise: 0.8,
      smoothness: 0.1,
    });
    this.bg.setLayer(7, {
      tint: 0x8a8a8f,
      speed: 1.8,
      opacity: 1.0,
      freq: 1.8,
      base: 0.22,
      amp: 0.22,
      heightOffset: 0.15,
      segmentCount: 16.0,
      segmentWidth: 0.3,
      segmentWidthNoise: 0.4,
      heightNoise: 0.8,
      smoothness: 0.1,
    });
    this.bg.setLayer(8, {
      tint: 0x000000,
      speed: 1.8,
      opacity: 1.0,
      freq: 1.8,
      base: 0.4,
      amp: 0.3,
      heightOffset: 0.1,
      segmentCount: 6.0,
      segmentWidth: 0.3,
      segmentWidthNoise: 0.4,
      heightNoise: 0.8,
      smoothness: 0.1,
    });

    // this.bg.setLayer(4, {
    //   tint: 0xff0099,
    //   speed: 1.0,
    //   opacity: 1.0,
    //   freq: 1.8,
    //   base: 0.4,
    //   amp: 0.3,
    //   heightOffset: 0.25,
    //   segmentCount: 50.0,
    //   segmentWidth: 0.3,
    //   segmentWidthNoise: 0.2,
    //   heightNoise: 0.8,
    //   smoothness: 0.3,
    // });
    // // MID (1)
    // this.bg.setLayer(5, {
    //   tint: 0xd0d0d7,
    //   speed: 1.5,
    //   opacity: 1.0,
    //   freq: 1.2,
    //   base: 0.26,
    //   amp: 0.24,
    //   heightOffset: 0.2,
    //   segmentCount: 30.0,
    //   segmentWidth: 0.3,
    //   segmentWidthNoise: 0.3,
    //   heightNoise: 0.8,
    //   smoothness: 0.4,
    // });
    // this.bg.setLayer(6, {
    //   tint: 0x8a8a8f,
    //   speed: 1.8,
    //   opacity: 1.0,
    //   freq: 1.8,
    //   base: 0.22,
    //   amp: 0.22,
    //   heightOffset: 0.25,
    //   segmentCount: 16.0,
    //   segmentWidth: 0.3,
    //   segmentWidthNoise: 0.4,
    //   heightNoise: 0.8,
    //   smoothness: 0.5,
    // });
    // this.bg.setLayer(7, {
    //   tint: 0x000000,
    //   speed: 2.0,
    //   opacity: 1.0,
    //   freq: 1.8,
    //   base: 0.22,
    //   amp: 0.22,
    //   heightOffset: 0.35,
    //   segmentCount: 4.0,
    //   segmentWidth: 0.3,
    //   segmentWidthNoise: 0.6,
    //   heightNoise: 0.8,
    //   smoothness: 0.6,
    // });

    // opzionale: offset iniziali
    // this.bg.setLayer(1, { offset: 0.3 });

    this.scene.add(this.bg.mesh);
  }

  // ------------------------------------------------------

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

  update(): void {
    if (this.controls) this.controls.update();

    const t = performance.now() * 0.001;

    if (this.cube) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }

    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uTime.value = t;
    }
    if (this.shaderMaterialSimple) {
      this.shaderMaterialSimple.uniforms.uTime.value = t;
    }
    if (this.tslPlane) this.tslPlane.update(performance.now());

    if (this.bg) this.bg.updateTime(t);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  resize(vw: number, vh: number): void {
    if (!this.renderer) return;

    this.camera.aspect = vw / vh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(vw, vh, true);

    // Recalculate and update plane size while maintaining aspect ratio
    if (this.shaderPlane) {
      const planeDistance = Math.abs(this.shaderPlane.position.z);
      const { width, height } = this.calculatePlaneSize(
        this.camera,
        planeDistance,
        this.planeAspectRatio
      );

      console.log(
        `Resize - New plane size: ${width} x ${height} (aspect: ${
          width / height
        })`
      );

      // Create new geometry with updated size
      const newGeometry = new THREE.PlaneGeometry(width, height, 64, 64);

      // Dispose old geometry to prevent memory leaks
      this.shaderPlane.geometry.dispose();
      this.shaderPlane.geometry = newGeometry;
    }

    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uResolution.value.set(vw, vh);
    }
    if (this.shaderMaterialSimple) {
      this.shaderMaterialSimple.uniforms.uResolution.value.set(vw, vh);
    }
    if (this.bg) this.bg.resize(vw, vh);
  }
}
