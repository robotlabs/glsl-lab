precision highp float;

uniform float uTime;
uniform vec2  uResolution;

#define MAX_LAYERS 8
uniform int   uLayerCount;
uniform float uSpeed[MAX_LAYERS];
uniform float uOffset[MAX_LAYERS];
uniform vec3  uTint[MAX_LAYERS];
uniform float uOpacity[MAX_LAYERS];
uniform int   uSkyLayer;

uniform float uFreq[MAX_LAYERS];
uniform float uBase[MAX_LAYERS];
uniform float uAmp[MAX_LAYERS];
uniform float uHeightOffset[MAX_LAYERS];

#define FBM_OCTAVES 3
#define NOISE_WARPED

const float FBM_LACUNARITY = 1.0;
const float FBM_GAIN       = 0.5;
const float WARP_AMP  = 2.10;
const float WARP_FREQ = 2.3;

varying vec2 vUv;

// ---------- noise/fbm ----------
float random(vec2 st){ return fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453123); }
float noise(vec2 st){
  vec2 i=floor(st), f=fract(st);
  float a=random(i);
  float b=random(i+vec2(1.,0.));
  float c=random(i+vec2(0.,1.));
  float d=random(i+vec2(1.,1.));
  vec2 u=f*f*(3.-2.*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
}

float fbm_base(vec2 st){
  float v = 0.0;
  float a = 0.5;
  vec2  p = st;
  for (int i=0; i<FBM_OCTAVES; i++){
    v += a * noise(p);
    p *= FBM_LACUNARITY;
    a *= FBM_GAIN;
  }
  return v;
}

vec2 warp2(vec2 st, float staticSeed){
  vec2 q = vec2(
    fbm_base(st * (WARP_FREQ*1.7) + vec2(37.2 + staticSeed, 11.5)),
    fbm_base(st * (WARP_FREQ*1.1) + vec2(-9.1, 5.3 + staticSeed))
  );
  return st + WARP_AMP * q * 3.0;
}

// ---------- sky ----------
float sdf_circle(vec2 p, float r){ return length(p)-r; }

vec3 skyColor(vec2 st) {
  return mix(vec3(.85,.85,.87), vec3(.78,.78,.82), smoothstep(0.,1., st.y));
}

vec3 generate_sky_objects(vec2 st, float t){
  vec3 col=vec3(0.);
  vec2 main_pos=vec2(.2+.6*sin(t*.02), .75+.15*cos(t*.015));
  float main_size=.08;

  if(sdf_circle(st-main_pos, main_size)<0.){ 
    col=vec3(0.);
    vec2 c1=main_pos+vec2(.025,.02); if(sdf_circle(st-c1, main_size*.25)<0.) col=vec3(.88);
    vec2 c2=main_pos+vec2(-.02,.03); if(sdf_circle(st-c2, main_size*.15)<0.) col=vec3(.88);
  }
  if(sin(t*.01)>0.){
    float rd=length(st-main_pos);
    float ang=atan(st.y-main_pos.y, st.x-main_pos.x);
    float thick=.005*(1.+.3*sin(ang*8.));
    if(rd>main_size*1.4 && rd<main_size*2.2) if(abs(rd-main_size*1.8)<thick) col=vec3(0.);
  }
  vec2 moon=vec2(.7+.2*cos(t*.03), .6+.1*sin(t*.025));
  if(sdf_circle(st-moon, .025)<0.) col=vec3(0.);
  vec2 cell=floor(st*25.);
  if(random(cell)>.95 && st.y>.5){
    vec2 sp=fract(st*25.);
    if(length(sp-vec2(.5))<.1) col=vec3(0.);
  }
  return col;
}

mat2 rot2(float a){
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float terrainHeight(float x, int li, float liquidTime) {
  float freq = 1.0;
  float base = uBase[li];
  float amp  = uAmp[li];

  float normalizedX = mod(x, 50.0);
  vec2 baseUv = vec2(normalizedX * 1.0, 2.0);
  
  baseUv = warp2(baseUv, float(li) * 12.34);
  
  // SOLUZIONE: Usa mod() per mantenere il tempo in un range limitato
  // Questo previene l'accumulo di errori numerici
  float safeTime = mod(uTime * 0.9, 6.318) +  float(li) * 2.0; // ~100 * 2π per un ciclo lungo ma stabile
  float liquidPhase = sin(safeTime) * 0.2;
  
  vec2 uvLarge = rot2(0.4 + liquidPhase + float(li) * 0.2) * baseUv;
  vec2 uvDetail = rot2(0.4 + liquidPhase * 0.5 + float(li) * 0.2) * baseUv;
  
  float nLarge = fbm_base(uvLarge * 0.4);
  float nDetail = fbm_base(uvDetail * 1.0);
  float n = mix(nLarge, nDetail, 0.3);

  float y = base + n * amp + uHeightOffset[li];
  return clamp(y, 0.0, 1.0);
}

void main(){
  vec2 st = vUv;
  st.x *= uResolution.x / uResolution.y;
  
  // Normalizza anche questi tempi per evitare overflow
  float t = mod(uTime * 1.5, 1000.0);
  float horizontalTime = mod(uTime * 2.0, 1000.0);
  float liquidTime = mod(uTime * 0.5, 628.318);

  // 1) base: cielo
  vec3 outCol = skyColor(st);
  if (uSkyLayer == 0) {
    vec3 skyObjs = generate_sky_objects(st, t);
    if (length(skyObjs) > 0.1) outCol = skyObjs;
  }

  // 2) compositing back -> front
  for (int i=0; i<MAX_LAYERS; i++) {
    if (i >= uLayerCount) break;

    float world_x = st.x + horizontalTime * 0.1 * uSpeed[i] + uOffset[i];
    float h = terrainHeight(world_x, i, liquidTime);

    float edge = 0.01;
    float mask = smoothstep(h, h - edge, st.y);

    if (i == uSkyLayer) {
      vec3 skyObjs = generate_sky_objects(st, t);
      if (length(skyObjs) > 0.1) outCol = skyObjs;
    }

    vec3 layerCol = uTint[i];
    float a = clamp(uOpacity[i], 0.0, 1.0) * mask;

    outCol = mix(outCol, layerCol, a);
  }

  gl_FragColor = vec4(outCol, 1.0);
}