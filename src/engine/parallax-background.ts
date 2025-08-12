import * as THREE from "three";
import bgScreenVert from "@/shaders/bg-parallax.vert.glsl";
import bgCompositeFrag from "@/shaders/bg-parallax.fragment.glsl";

type LayerParams = {
  speed?: number;
  offset?: number;
  tint?: THREE.Color | number | string;
  opacity?: number;

  // 👇 nuovi controlli
  freq?: number;
  base?: number;
  amp?: number;
  heightOffset?: number;
  segmentCount?: number;
  segmentWidth?: number;
  segmentWidthNoise?: number;
  heightNoise?: number;
  smoothness?: number;
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
    this.smoothnesss = new Float32Array(this.maxLayers); // FIX: Era duplicata heightNoises

    this.tints = Array.from(
      { length: this.maxLayers },
      () => new THREE.Color(0xffffff)
    );

    // FIX: Inizializza TUTTI gli array con valori default sensati
    for (let i = 0; i < this.maxLayers; i++) {
      const fi = this.maxLayers > 1 ? i / (this.maxLayers - 1) : 0;

      // Valori per noise e terrain
      this.freqs[i] = THREE.MathUtils.lerp(0.7, 2.0, fi);
      this.bases[i] = THREE.MathUtils.lerp(0.35, 0.18, fi);
      this.amps[i] = THREE.MathUtils.lerp(0.35, 0.22, fi);

      // FIX: Inizializza TUTTI i valori
      this.opacities[i] = 0; // layer spento finché non lo setti
      this.speeds[i] = 0;
      this.offsets[i] = 0;
      this.heightOffsets[i] = 0;
      this.segmentCounts[i] = 1.0;
      this.segmentWidths[i] = 0.3;
      this.segmentWidthNoises[i] = 0.2;
      this.heightNoises[i] = 0.08;
      this.smoothnesss[i] = 0.1;
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

        // nuove uniform
        uFreq: { value: this.freqs },
        uBase: { value: this.bases },
        uAmp: { value: this.amps },
        uHeightOffset: { value: this.heightOffsets },
        uHeightNoise: { value: this.heightNoises },
        uSegmentCount: { value: this.segmentCounts },
        uSegmentWidth: { value: this.segmentWidths },
        uSegmentWidthNoise: { value: this.segmentWidthNoises },

        uSmoothness: { value: this.smoothnesss }, // FIX: Era smoothnesss invece di smoothness
      },
      depthTest: false,
      depthWrite: false,
      transparent: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
  }

  setLayerCount(n: number) {
    this.material.uniforms.uLayerCount.value = Math.max(
      0,
      Math.min(this.maxLayers, n | 0)
    );
  }

  setSkyLayer(i: number) {
    this.material.uniforms.uSkyLayer.value = i; // -1 per disattivare
  }

  setLayer(i: number, params: LayerParams) {
    if (i < 0 || i >= this.maxLayers) return;
    if (params.speed !== undefined) this.speeds[i] = params.speed;
    if (params.offset !== undefined) this.offsets[i] = params.offset;
    if (params.opacity !== undefined) this.opacities[i] = params.opacity;
    if (params.tint !== undefined) this.tints[i].set(params.tint as any);

    // FIX: Aggiorna TUTTI i parametri mancanti
    if (params.freq !== undefined) this.freqs[i] = params.freq;
    if (params.base !== undefined) this.bases[i] = params.base;
    if (params.amp !== undefined) this.amps[i] = params.amp;
    if (params.heightOffset !== undefined)
      this.heightOffsets[i] = params.heightOffset;
    if (params.segmentCount !== undefined)
      this.segmentCounts[i] = params.segmentCount;

    // FIX: Questi erano completamente mancanti!
    if (params.segmentWidth !== undefined)
      this.segmentWidths[i] = params.segmentWidth;
    if (params.segmentWidthNoise !== undefined)
      this.segmentWidthNoises[i] = params.segmentWidthNoise;
    if (params.heightNoise !== undefined)
      this.heightNoises[i] = params.heightNoise;
    if (params.smoothness !== undefined)
      this.smoothnesss[i] = params.smoothness;
  }
  updateTime(t: number) {
    this.material.uniforms.uTime.value = t;
  }

  resize(vw: number, vh: number) {
    (this.material.uniforms.uResolution.value as THREE.Vector2).set(vw, vh);
  }
}
