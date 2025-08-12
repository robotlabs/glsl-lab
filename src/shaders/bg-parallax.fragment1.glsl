precision highp float;

uniform float uTime;
uniform vec2  uResolution;

#define MAX_LAYERS 8
uniform int   uLayerCount;      // quanti layer attivi (0..MAX_LAYERS)
uniform float uSpeed[MAX_LAYERS];
uniform float uOffset[MAX_LAYERS];
uniform vec3  uTint[MAX_LAYERS];
uniform float uOpacity[MAX_LAYERS]; // 0..1
uniform int   uSkyLayer;        // -1 = nessuno; altrimenti index (di solito 0)

// 👇 NUOVE uniform per controllo per-layer
uniform float uFreq[MAX_LAYERS];
uniform float uBase[MAX_LAYERS];
uniform float uAmp[MAX_LAYERS];
uniform float uHeightOffset[MAX_LAYERS];

// ===== Noise controls (solo shader) =====


// Scegline uno -> commenta/attiva
//#define NOISE_DUNES          // morbido, sabbioso
// #define FBM_OCTAVES 3          // 3..8
// const float FBM_LACUNARITY = 0.5;
// const float FBM_GAIN       = 0.5;

//  #define NOISE_RIDGED         // creste affilate
//  #define FBM_OCTAVES 3          // 3..8
// const float FBM_LACUNARITY = 3.0;
// const float FBM_GAIN       =0.5;

#define FBM_OCTAVES 3          // 3..8
#define NOISE_WARPED          // organico (domain warping)
 
const float FBM_LACUNARITY = 1.0;
const float FBM_GAIN       = 0.5;

const float WARP_AMP  = 2.10;  // 0..0.25 (solo NOISE_WARPED)
const float WARP_FREQ = 2.3;   // 0.6..2.0



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
float fbm(vec2 st){ float v=0., a=.5; for(int i=0;i<6;i++){ v+=a*noise(st); st*=2.; a*=.5; } return v; }

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

// “billow” = dune morbide
float fbm_billow(vec2 st){
  float v = 0.0, a = 0.5; vec2 p = st;
  for (int i=0; i<FBM_OCTAVES; i++){
    float n = noise(p);
    n = abs(2.0*n - 1.0); // “billow”
    v += a * n;
    p *= FBM_LACUNARITY;
    a *= FBM_GAIN;
  }
  return v;
}

// “ridged” = creste affilate
float fbm_ridged(vec2 st){
  float v = 0.0, a = 0.5; vec2 p = st;
  for (int i=0; i<FBM_OCTAVES; i++){
    float n = noise(p);
    n = 1.0 - abs(2.0*n - 1.0); // inverti le valli
    v += a * n;
    p *= FBM_LACUNARITY;
    a *= FBM_GAIN;
  }
  return v;
}

vec2 warp(vec2 st){
  // piccolo dominio di distorsione (indipendente)
  vec2 q = vec2(
    fbm_base(st * (WARP_FREQ*1.7) + vec2(37.2, 11.5)),
    fbm_base(st * (WARP_FREQ*1.1) + vec2(-9.1, 5.3))
  );
  return st + WARP_AMP * q * 3.0;
}

// ---------- sky ----------
float sdf_circle(vec2 p, float r){ return length(p)-r; }

vec3 skyColor(vec2 st) {
  // semplice gradiente cielo
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
float tri(float x) {               // continuous, piecewise-linear
    return (2.0/3.14159265) * asin(sin(x));
}
float terrainHeight(float x, int li) {
  float freq = 1.0;//uFreq[li];
  float base = uBase[li];
  float amp  = uAmp[li];

  // vec2 uv = vec2(x * freq, 10.0 + float(li) * 7.31);
  vec2 uv = vec2(x * 1.0, 2.0);
  
  // uv = rot2(100.6) * uv;   // ~34.4° – cambia 0.6 a piacere

  // float ang = 0.35 + 0.15 * float(li); // layer 0 = 0.35, 1 = 0.5, 2 = 0.65...
// uv = rot2(ang) * uv;

// uv = rot2(0.4 + 0.1 * sin(uTime * 0.2 + float(li))) * uv;


  #ifdef NOISE_WARPED
    uv = warp(uv);
  #endif

  // float n =
  // #ifdef NOISE_RIDGED
  //   fbm_ridged(uv);
  // #elif defined(NOISE_DUNES)
  //   fbm_billow(uv);
  // #else
  //   fbm_base(uv);
  // #endif

  // grande struttura
float nLarge = fbm_base(uv * 0.4); // 0.5 = scala più larga
// dettaglio fine
float nDetail = fbm_base(uv * 1.0); // 4.0 = scala molto più piccola

// blend — 0.3 = quanta “roccia fine” aggiungi
float n = mix(nLarge, nDetail, 0.3);

  float y = base + n * amp + uHeightOffset[li];
  return clamp(y, 0.0, 1.0);
}

void main(){
  vec2 st = vUv;
  st.x *= uResolution.x / uResolution.y;
  float t = uTime * 2.0;

  // 1) base: cielo una sola volta
  vec3 outCol = skyColor(st);
  if (uSkyLayer == 0) {
    vec3 skyObjs = generate_sky_objects(st, t);
    if (length(skyObjs) > 0.1) outCol = skyObjs;
  }

  // 2) compositing back -> front (solo sagoma, niente "nero")
  for (int i=0; i<MAX_LAYERS; i++) {
    if (i >= uLayerCount) break;

    float world_x = st.x + t * 0.1 * uSpeed[i] + uOffset[i];
    float h = terrainHeight(world_x, i);

    float edge = 0.002;
    // float mask = smoothstep(h, h - edge, st.y);
    float mask = step(st.y, h);

    // se vuoi oggetti cielo su un layer specifico (es. i==0)
    if (i == uSkyLayer) {
      vec3 skyObjs = generate_sky_objects(st, t);
      if (length(skyObjs) > 0.1) outCol = skyObjs;
    }

    vec3 layerCol = uTint[i];
    float a = clamp(uOpacity[i], 0.0, 1.0) * mask;

    outCol = mix(outCol, layerCol, a); // niente nero, solo tinta del layer
  }

  gl_FragColor = vec4(outCol, 1.0);
}
