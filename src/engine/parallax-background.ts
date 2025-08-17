import * as THREE from "three";
import bgScreenVert from "@/shaders/bg-parallax.vert.glsl";
import bgCompositeFrag from "@/shaders/bg-parallax.fragment.glsl";

type LayerParams = {
  speed?: number;
  offset?: number;
  tint?: THREE.Color | number | string;
  opacity?: number;
  freq?: number;
  base?: number;
  amp?: number;
  heightOffset?: number;
  segmentCount?: number;
  segmentWidth?: number;
  segmentWidthNoise?: number;
  heightNoise?: number;
  smoothness?: number;
  liquidSpeed?: number;
  liquidOffset?: number;
};

export class ParallaxBackground {
  public mesh: THREE.Mesh;
  public material: THREE.ShaderMaterial;

  private maxLayers = 15;
  private speeds: Float32Array;
  private offsets: Float32Array;
  private opacities: Float32Array;
  private tints: THREE.Color[];

  private freqs: Float32Array;
  private bases: Float32Array;
  private amps: Float32Array;
  private heightOffsets: Float32Array;
  private segmentCounts: Float32Array;
  private segmentWidths: Float32Array;
  private segmentWidthNoises: Float32Array;
  private heightNoises: Float32Array;
  private smoothnesss: Float32Array;

  private liquidSpeeds: Float32Array;
  private liquidOffsets: Float32Array;

  private skyTextures: THREE.Texture[] = [];
  private skyAnimationTimes: number[] = [0, 0, 0, 0];

  // ✅ MANUAL RESET SYSTEM - No automatic timing
  private fadeInDuration: number = 2000;
  private blackDuration: number = 800;
  private fadeOutDuration: number = 2000;
  private isResetting: boolean = false;
  private fadeAmount: number = 0;

  // ✅ REFERENCE TO EXTERNAL RESET CALLBACK
  private externalResetCallback: (() => void) | null = null;

  constructor(vw: number, vh: number) {
    const geo = new THREE.PlaneGeometry(2, 2);

    this.speeds = new Float32Array(this.maxLayers);
    this.offsets = new Float32Array(this.maxLayers);
    this.opacities = new Float32Array(this.maxLayers);
    this.freqs = new Float32Array(this.maxLayers);
    this.bases = new Float32Array(this.maxLayers);
    this.amps = new Float32Array(this.maxLayers);
    this.heightOffsets = new Float32Array(this.maxLayers);
    this.segmentCounts = new Float32Array(this.maxLayers);
    this.segmentWidths = new Float32Array(this.maxLayers);
    this.segmentWidthNoises = new Float32Array(this.maxLayers);
    this.heightNoises = new Float32Array(this.maxLayers);
    this.smoothnesss = new Float32Array(this.maxLayers);

    this.liquidSpeeds = new Float32Array(this.maxLayers);
    this.liquidOffsets = new Float32Array(this.maxLayers);

    this.tints = Array.from(
      { length: this.maxLayers },
      () => new THREE.Color(0xffffff)
    );

    // Initialize arrays with default values
    for (let i = 0; i < this.maxLayers; i++) {
      const fi = this.maxLayers > 1 ? i / (this.maxLayers - 1) : 0;

      this.freqs[i] = THREE.MathUtils.lerp(0.7, 2.0, fi);
      this.bases[i] = THREE.MathUtils.lerp(0.35, 0.18, fi);
      this.amps[i] = THREE.MathUtils.lerp(0.35, 0.22, fi);

      this.opacities[i] = 0;
      this.speeds[i] = 0;
      this.offsets[i] = 0;
      this.heightOffsets[i] = 0;
      this.segmentCounts[i] = 1.0;
      this.segmentWidths[i] = 0.3;
      this.segmentWidthNoises[i] = 0.2;
      this.heightNoises[i] = 0.08;
      this.smoothnesss[i] = 0.1;

      this.liquidSpeeds[i] = 0.3 + Math.random() * 0.8;
      this.liquidOffsets[i] = Math.random() * 10.0;
    }

    this.material = new THREE.ShaderMaterial({
      vertexShader: bgScreenVert,
      fragmentShader: bgCompositeFrag,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(vw, vh) },
        uLayerCount: { value: 0 },
        uSpeed: { value: this.speeds },
        uOffset: { value: this.offsets },
        uTint: { value: this.tints },
        uOpacity: { value: this.opacities },
        uSkyLayer: { value: 0 },

        uMainSpeed: { value: 1.0 },
        uFluidSpeed: { value: 1.0 },

        uFreq: { value: this.freqs },
        uBase: { value: this.bases },
        uAmp: { value: this.amps },
        uHeightOffset: { value: this.heightOffsets },
        uHeightNoise: { value: this.heightNoises },
        uSegmentCount: { value: this.segmentCounts },
        uSegmentWidth: { value: this.segmentWidths },
        uSegmentWidthNoise: { value: this.segmentWidthNoises },
        uSmoothness: { value: this.smoothnesss },

        uLiquidSpeed: { value: this.liquidSpeeds },
        uLiquidOffset: { value: this.liquidOffsets },

        uKeyLightPosition: { value: new THREE.Vector3(1, 1, 1) },
        uKeyLightColor: { value: new THREE.Vector3(1, 1, 0.9) },
        uFillLightPosition: { value: new THREE.Vector3(-1, 0.5, 1) },
        uFillLightColor: { value: new THREE.Vector3(0.6, 0.8, 1.0) },
        uAmbientLight: { value: new THREE.Vector3(0.3, 0.4, 0.5) },

        // ✅ ADD FADE AMOUNT UNIFORM (for manual control only)
        uFadeAmount: { value: 0.0 },
      },
      depthTest: false,
      depthWrite: false,
      transparent: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
    this.loadSkyTextures();

    // ✅ NO AUTOMATIC RESET SYSTEM - Only manual triggering
  }

  loadSkyTextures() {
    const loader = new THREE.TextureLoader();

    const skyTexture1 = loader.load("/images/t1.png");
    const skyTexture2 = loader.load("/images/t2.png");
    const skyTexture3 = loader.load("/images/t3-a.png");
    const skyTexture4 = loader.load("/images/t4.png");

    [skyTexture1, skyTexture2, skyTexture3, skyTexture4].forEach((texture) => {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
    });

    this.skyTextures = [skyTexture1, skyTexture2, skyTexture3, skyTexture4];

    this.material.uniforms.uSkyTexture1 = { value: skyTexture1 };
    this.material.uniforms.uSkyTexture2 = { value: skyTexture2 };
    this.material.uniforms.uSkyTexture3 = { value: skyTexture3 };
    this.material.uniforms.uSkyTexture4 = { value: skyTexture4 };

    this.material.uniforms.uSkyAnimation1 = { value: 0 };
    this.material.uniforms.uSkyAnimation2 = { value: 0 };
    this.material.uniforms.uSkyAnimation3 = { value: 0 };
    this.material.uniforms.uSkyAnimation4 = { value: 0 };
  }

  // ✅ MANUAL RESET METHODS (only triggered by button)
  private startFadeSequence() {
    this.isResetting = true;
    console.log("🎬 Starting manual reset sequence...");

    // FADE IN verso nero
    this.animateFade(0, 1, this.fadeInDuration, () => {
      console.log("🌑 BLACK STARTED - Waiting for deep black...");

      // ✅ ASPETTA 400ms (metà del nero) PRIMA DEL RESET
      setTimeout(() => {
        console.log("🔄 DEEP BLACK - PERFORMING RESET NOW!");
        this.performCompleteReset();

        // ✅ ASPETTA ALTRI 400ms PRIMA DEL FADE OUT
        setTimeout(() => {
          console.log("🌅 STARTING FADE OUT");
          // FADE OUT dal nero
          this.animateFade(1, 0, this.fadeOutDuration, () => {
            console.log("✅ MANUAL RESET CYCLE COMPLETE");
            this.isResetting = false;
          });
        }, 400); // Seconda metà del nero
      }, 400); // Prima metà del nero - ASPETTA CHE SIA COMPLETAMENTE NERO
    });
  }

  private animateFade(
    from: number,
    to: number,
    duration: number,
    onComplete: () => void
  ) {
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Curva smooth (ease in/out)
      const eased = progress * progress * (3 - 2 * progress);
      this.fadeAmount = from + (to - from) * eased;

      // Applica fade allo shader
      this.material.uniforms.uFadeAmount.value = this.fadeAmount;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }

  private performCompleteReset() {
    console.log("🔄 PERFORMING COMPLETE SHADER RESET DURING BLACK SCREEN");

    // ✅ 1. RESET TEMPO A ZERO - FONDAMENTALE!
    this.material.uniforms.uTime.value = 0;

    // ✅ 2. RESET TUTTI GLI OFFSET A ZERO - RIPORTA POSIZIONE INIZIALE
    for (let i = 0; i < this.maxLayers; i++) {
      this.offsets[i] = 0.0; // ZERO, non random!
      this.liquidOffsets[i] = 0.0; // ZERO, non random!
    }

    // ✅ 3. CALL EXTERNAL RESET (ThreeEngine time reset)
    if (this.externalResetCallback) {
      console.log("🔗 Calling external reset callback...");
      this.externalResetCallback();
    }

    // ✅ 4. Randomizza solo i parametri fluidi (NON le posizioni)
    this.randomizeFluidParameters();

    // ✅ 5. Reset colori (opzionale)
    this.randomizeColors();

    // ✅ 6. Forza update di tutti gli uniform
    this.material.uniformsNeedUpdate = true;

    console.log("✅ SHADER RESET COMPLETE - TEMPO E POSIZIONE A ZERO!");
  }

  // ✅ SET EXTERNAL RESET CALLBACK
  setExternalResetCallback(callback: () => void) {
    this.externalResetCallback = callback;
  }

  private randomizeFluidParameters() {
    for (let i = 0; i < this.maxLayers; i++) {
      const baseSpeed = this.liquidSpeeds[i];
      this.liquidSpeeds[i] = baseSpeed * (0.8 + Math.random() * 0.4);
      this.liquidOffsets[i] = Math.random() * 10.0;
    }
  }

  private randomizeColors() {
    const colorPalettes = [
      [0x1c99ce, 0x00fffb, 0x40e0d0, 0x00ced1, 0x20b2aa],
      [0xff6b6b, 0xff8e8e, 0xffa8a8, 0xffb3b3, 0xffc9c9],
      [0x9b59b6, 0x8e44ad, 0x7d3c98, 0x6c3483, 0x5b2c6f],
      [0x2ecc71, 0x27ae60, 0x229954, 0x1e8449, 0x196f3d],
    ];

    const selectedPalette =
      colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

    for (let i = 0; i < Math.min(this.maxLayers, selectedPalette.length); i++) {
      this.tints[i].setHex(selectedPalette[i]);
    }
  }

  // ✅ PUBLIC CONTROL METHODS
  setFadeTiming(fadeIn: number, blackTime: number, fadeOut: number) {
    this.fadeInDuration = fadeIn * 1000;
    this.blackDuration = blackTime * 1000;
    this.fadeOutDuration = fadeOut * 1000;
  }

  // ✅ MAIN METHOD: Manual reset trigger
  forceReset() {
    if (!this.isResetting) {
      console.log("🔴 FORCE RESET TRIGGERED MANUALLY");
      this.startFadeSequence();
    } else {
      console.log("⚠️ Reset already in progress, ignoring...");
    }
  }

  // ✅ PUBLIC METHOD: Reset time externally (call from ThreeEngine)
  resetTimeToZero() {
    this.material.uniforms.uTime.value = 0;
    console.log("⏰ Time reset to ZERO externally");
  }

  // ✅ STATUS CHECK
  isCurrentlyResetting(): boolean {
    return this.isResetting;
  }

  // ✅ EXISTING METHODS (unchanged)
  setLayerCount(n: number) {
    this.material.uniforms.uLayerCount.value = Math.max(
      0,
      Math.min(this.maxLayers, n | 0)
    );
  }

  setSkyLayer(i: number) {
    this.material.uniforms.uSkyLayer.value = i;
  }

  setLayer(i: number, params: LayerParams) {
    if (i < 0 || i >= this.maxLayers) return;
    if (params.speed !== undefined) this.speeds[i] = params.speed;
    if (params.offset !== undefined) this.offsets[i] = params.offset;
    if (params.opacity !== undefined) this.opacities[i] = params.opacity;
    if (params.tint !== undefined) this.tints[i].set(params.tint as any);

    if (params.freq !== undefined) this.freqs[i] = params.freq;
    if (params.base !== undefined) this.bases[i] = params.base;
    if (params.amp !== undefined) this.amps[i] = params.amp;
    if (params.heightOffset !== undefined)
      this.heightOffsets[i] = params.heightOffset;
    if (params.segmentCount !== undefined)
      this.segmentCounts[i] = params.segmentCount;
    if (params.segmentWidth !== undefined)
      this.segmentWidths[i] = params.segmentWidth;
    if (params.segmentWidthNoise !== undefined)
      this.segmentWidthNoises[i] = params.segmentWidthNoise;
    if (params.heightNoise !== undefined)
      this.heightNoises[i] = params.heightNoise;
    if (params.smoothness !== undefined)
      this.smoothnesss[i] = params.smoothness;
    if (params.liquidSpeed !== undefined)
      this.liquidSpeeds[i] = params.liquidSpeed;
    if (params.liquidOffset !== undefined)
      this.liquidOffsets[i] = params.liquidOffset;
  }

  updateTime(t: number) {
    this.material.uniforms.uTime.value = t;
    this.updateSkyAnimation(t);
  }

  resize(vw: number, vh: number) {
    (this.material.uniforms.uResolution.value as THREE.Vector2).set(vw, vh);
  }

  randomizeLiquidTiming() {
    for (let i = 0; i < this.maxLayers; i++) {
      this.liquidSpeeds[i] = 0.3 + Math.random() * 0.8;
      this.liquidOffsets[i] = Math.random() * 10.0;
    }
  }

  updateSkyAnimation(currentTime: number) {
    const speed = this.material.uniforms.uMainSpeed?.value || 1.0;

    this.material.uniforms.uSkyAnimation1.value = currentTime * speed;
    this.material.uniforms.uSkyAnimation2.value = currentTime * speed;
    this.material.uniforms.uSkyAnimation3.value = currentTime * speed;
    this.material.uniforms.uSkyAnimation4.value = currentTime * speed;
  }

  setMainSpeed(speed: number) {
    this.material.uniforms.uMainSpeed.value = speed;
  }

  setFluidSpeed(speed: number) {
    this.material.uniforms.uFluidSpeed.value = speed;
  }

  getMainSpeed(): number {
    return this.material.uniforms.uMainSpeed?.value || 1.0;
  }

  getFluidSpeed(): number {
    return this.material.uniforms.uFluidSpeed?.value || 1.0;
  }

  // ✅ CONVENIENCE METHODS FOR FLUID CONTROL
  pauseFluidAnimation() {
    this.setFluidSpeed(0.0);
  }

  resumeFluidAnimation() {
    this.setFluidSpeed(1.0);
  }

  setSlowFluid(speed: number = 0.3) {
    this.setFluidSpeed(speed);
  }

  setFastFluid(speed: number = 2.0) {
    this.setFluidSpeed(speed);
  }
}
