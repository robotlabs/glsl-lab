import * as THREE from "three";
import gsap from "gsap";
import { LightManager } from "./light-manager";

import planePastelVertexShader from "@/shaders/plane-pastel.vertex.glsl";
import planePastelFragmentShader from "@/shaders/plane-pastel.fragment.glsl";

interface RibbonTransform {
  scale: number;
  rotation: number;
  translation: { x: number; y: number };
}

interface RibbonParams {
  time: number;
  size: number;
  spacing: number;
  setColor: number;
}

export class RibbonController {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private lights: LightManager;

  private shaderPlane: THREE.Mesh | null = null;
  private shaderMaterial: THREE.ShaderMaterial | null = null;

  private transform: RibbonTransform = {
    scale: 1.0,
    rotation: 0.0,
    translation: { x: 0.0, y: 0.0 },
  };

  private params: RibbonParams = {
    time: 0.0,
    size: 0.3,
    spacing: 0.3,
    setColor: 2.0,
  };

  private planeAspectRatio: number = 16 / 9;
  private isAnimating: boolean = false;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    lights: LightManager
  ) {
    this.scene = scene;
    this.camera = camera;
    this.lights = lights;

    this.initRibbonPlane();
    this.startInitialAnimation();
  }

  private initRibbonPlane(): void {
    const planeDistance = 5;
    const { width, height } = this.calculatePlaneSize(
      this.camera,
      planeDistance,
      this.planeAspectRatio
    );

    const geometry = new THREE.PlaneGeometry(width, height, 64, 64);

    this.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: planePastelVertexShader,
      fragmentShader: planePastelFragmentShader,
      uniforms: {
        uTime: { value: this.params.time },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },

        // Transform uniforms
        uScale: { value: this.transform.scale },
        uRotation: { value: this.transform.rotation },
        uTranslation: {
          value: [this.transform.translation.x, this.transform.translation.y],
        },

        // Ribbon parameters
        uSize: { value: this.params.size },
        uSpacing: { value: this.params.spacing },
        uSetColor: { value: this.params.setColor },

        // Light uniforms
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
    this.shaderPlane.position.set(0, 0, -planeDistance);
    this.scene.add(this.shaderPlane);
  }

  private calculatePlaneSize(
    camera: THREE.PerspectiveCamera,
    distance: number,
    targetAspect: number
  ): { width: number; height: number } {
    const fov = camera.fov * (Math.PI / 180);
    const visibleHeight = 2 * Math.tan(fov / 2) * distance;
    const visibleWidth = visibleHeight * camera.aspect;
    const currentAspect = camera.aspect;

    let width, height;

    if (currentAspect > targetAspect) {
      height = visibleHeight * 1.1;
      width = height * targetAspect;
    } else {
      width = visibleWidth * 1.1;
      height = width / targetAspect;
    }

    return { width, height };
  }

  private startInitialAnimation(): void {
    this.isAnimating = true;

    gsap.to(this.params, {
      time: 2,
      size: 1.1,
      spacing: 0.01,
      duration: 5,
      ease: "power4.inOut",
      onUpdate: () => this.updateUniforms(),
      onComplete: () => {
        gsap.to(this.params, {
          time: 2,
          size: 0.3,
          spacing: 0.1,
          duration: 5,
          ease: "power4.inOut",
          onUpdate: () => this.updateUniforms(),
          onComplete: () => {
            this.isAnimating = false;
          },
        });
      },
    });
  }

  private updateUniforms(): void {
    if (!this.shaderMaterial) return;

    this.shaderMaterial.uniforms.uTime.value = this.params.time;
    this.shaderMaterial.uniforms.uSize.value = this.params.size;
    this.shaderMaterial.uniforms.uSpacing.value = this.params.spacing;
    this.shaderMaterial.uniforms.uSetColor.value = this.params.setColor;

    this.shaderMaterial.uniforms.uScale.value = this.transform.scale;
    this.shaderMaterial.uniforms.uRotation.value = this.transform.rotation;
    this.shaderMaterial.uniforms.uTranslation.value = [
      this.transform.translation.x,
      this.transform.translation.y,
    ];
  }

  // Transform methods
  public setScale(scale: number): void {
    this.transform.scale = scale;
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uScale.value = scale;
    }
  }

  public setRotation(radians: number): void {
    this.transform.rotation = radians;
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uRotation.value = radians;
    }
  }

  public setRotationDegrees(degrees: number): void {
    this.setRotation((degrees * Math.PI) / 180);
  }

  public setTranslation(x: number, y: number): void {
    this.transform.translation.x = x;
    this.transform.translation.y = y;
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uTranslation.value = [x, y];
    }
  }

  // Parameter setters
  public setSize(size: number): void {
    this.params.size = size;
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uSize.value = size;
    }
  }

  public setSpacing(spacing: number): void {
    this.params.spacing = spacing;
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uSpacing.value = spacing;
    }
  }

  public setColorSet(colorSet: number): void {
    this.params.setColor = colorSet;
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uSetColor.value = colorSet;
    }
  }

  // Animation methods
  public animateRotation(speed: number = 1.0): void {
    const time = Date.now() * 0.001;
    this.setRotation(time * speed);
  }

  public animateScale(
    amplitude: number = 0.5,
    frequency: number = 1.0,
    offset: number = 1.0
  ): void {
    const time = Date.now() * 0.001;
    const scale = offset + Math.sin(time * frequency) * amplitude;
    this.setScale(scale);
  }

  public animateTranslation(
    radiusX: number = 0.2,
    radiusY: number = 0.2,
    frequency: number = 1.0
  ): void {
    const time = Date.now() * 0.001;
    const x = Math.cos(time * frequency) * radiusX;
    const y = Math.sin(time * frequency) * radiusY;
    this.setTranslation(x, y);
  }

  public reset(): void {
    this.setScale(1.0);
    this.setRotation(0.0);
    this.setTranslation(0.0, 0.0);
  }

  // Getters for GUI integration
  public get size(): number {
    return this.params.size;
  }
  public get spacing(): number {
    return this.params.spacing;
  }
  public get scale(): number {
    return this.transform.scale;
  }
  public get rotation(): number {
    return this.transform.rotation;
  }
  public get translationX(): number {
    return this.transform.translation.x;
  }
  public get translationY(): number {
    return this.transform.translation.y;
  }
  public get colorSet(): number {
    return this.params.setColor;
  }

  public update(deltaTime: number): void {
    if (!this.isAnimating && this.shaderMaterial) {
      // Continuous time update when not in initial animation
      this.params.time += deltaTime * 1.4;
      this.shaderMaterial.uniforms.uTime.value = this.params.time;
    }
  }

  public resize(vw: number, vh: number): void {
    if (!this.shaderPlane || !this.shaderMaterial) return;

    const planeDistance = Math.abs(this.shaderPlane.position.z);
    const { width, height } = this.calculatePlaneSize(
      this.camera,
      planeDistance,
      this.planeAspectRatio
    );

    // Create new geometry with updated size
    const newGeometry = new THREE.PlaneGeometry(width, height, 64, 64);
    this.shaderPlane.geometry.dispose();
    this.shaderPlane.geometry = newGeometry;

    // Update resolution uniform
    this.shaderMaterial.uniforms.uResolution.value.set(vw, vh);
  }

  public dispose(): void {
    if (this.shaderPlane) {
      this.scene.remove(this.shaderPlane);
      this.shaderPlane.geometry.dispose();
      if (this.shaderMaterial) {
        this.shaderMaterial.dispose();
      }
    }
  }
}
