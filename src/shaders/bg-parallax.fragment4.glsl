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
uniform float uSegmentCount[MAX_LAYERS];
uniform float uSegmentWidthNoise[MAX_LAYERS];

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
float fbm(vec2 st){ 
  float v=0., 
  a=.5; 
  for(int i=0;i<6;i++){ 
    v+=a*noise(st); 
    st*=2.; 
    a*=.5; 
  } 
  return v; 
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
float fbm_base2(vec2 st){
  float v = 0.0;
  float a = 0.5;
  vec2  p = st;
  for (int i=0; i<FBM_OCTAVES; i++){
    v += a * noise(p);
    p *= 0.3;
    a *= 0.5;
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
  return st + WARP_AMP * q * 0.1;
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

// == util ==
float hash11(float x){
  x = fract(x * 0.1031); x *= x + 33.33; x *= x + x;
  return fract(x);
}
struct Seg1D { float id,xL,xR,t,width; };

Seg1D seg1D(float x, float scale, float jitterAmt) {
  float gx = x * scale;
  float i  = floor(gx);

  float c0 = (i-1.0) + jitterAmt*(hash11(i-1.0)-0.5);
  float c1 =  i      + jitterAmt*(hash11(i    )-0.5);
  float c2 = (i+1.0) + jitterAmt*(hash11(i+1.0)-0.5);

  float d0 = abs(gx-c0), d1 = abs(gx-c1), d2 = abs(gx-c2);
  float id = i; float c = c1;
  if (d0<d1 && d0<d2){ id=i-1.0; c=c0; }
  else if (d2<d1 && d2<d0){ id=i+1.0; c=c2; }

  float cl=(id-1.0)+jitterAmt*(hash11(id-1.0)-0.5);
  float cr=(id+1.0)+jitterAmt*(hash11(id+1.0)-0.5);

  float xL=(cl+c)*0.5/scale, xR=(cr+c)*0.5/scale;
  float w = xR-xL;
  float t = clamp((x-xL)/max(w,1e-5),0.0,1.0);

  Seg1D s; s.id=id; s.xL=xL; s.xR=xR; s.t=t; s.width=w; return s;
}

// Offset discreti a scelta (tipo i tuoi -0.2, +0.1, ecc.)
float pickOffset(float id){
  float r = hash11(id * 17.0); // 0..1
  // mappa a un set discreto
  if (r < 0.05) return -0.10;
  if (r < 0.10) return -0.15;
  if (r < 0.15) return -0.1;
  if (r < 0.20) return -0.15;
  if (r < 0.25) return -0.1;
  if (r < 0.30) return  -0.05;
  if (r < 0.35) return  0.02;
  if (r < 0.40) return  -0.04;
  if (r < 0.45) return  -0.09;
  if (r < 0.50) return -0.1;
  if (r < 0.55) return 0.2;
  if (r < 0.60) return 0.0;
  if (r < 0.65) return 0.0;
  if (r < 0.70) return 0.0;
  if (r < 0.75) return 0.08;
  if (r < 0.80) return -0.07;
  if (r < 0.85) return -0.17;
  if (r < 0.90) return -0.07;
  if (r < 0.95) return -0.03;
  return -0.20; // o quello che vuoi
}

float pickOffsetRange(float id, float minV, float maxV){
  return mix(minV, maxV, hash11(id * 113.0));
}

// AA step
float aastep(float edge, float x){
  float w = fwidth(x);
  return smoothstep(edge-w, edge+w, x);
}

float terrainHeight(float x, int li) {
  float freq = 1.0;//uFreq[li];
  float base = uBase[li];
  float amp  = uAmp[li];

  // vec2 uv = vec2(x * freq, 10.0 + float(li) * 7.31);
  vec2 uv = vec2(x * 1.0, 2.0);
  
  // uv = rot2(100.6) * uv;   // ~34.4° – cambia 0.6 a piacere

  float ang = 0.35 + 0.15 * float(li); // layer 0 = 0.35, 1 = 0.5, 2 = 0.65...
  // uv = rot2(ang) * uv;

  uv = rot2(0.4 + 0.1 * sin(uTime * 0.2 + float(li))) * uv;

  uv = warp(uv);
  #ifdef NOISE_WARPED
    
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
// float n = fbm_base(uv * 1.0);//mix(nLarge, nDetail, 0.3);
float n = mix(nLarge, nDetail, 0.3);

  float vv = fbm(uv);
  float y = base + n * amp + uHeightOffset[li];
  return y;
  // float y = base + vv * amp + uHeightOffset[li];

// float scale      = uSegmentCount[li];   // ~quanti segmenti su [0,1]
// float jitterAmt  = uSegmentWidthNoise[li];   // 0 = larghezze costanti, 1 = molto variabili
// float baseY      = base + uHeightOffset[li];


// // calcola segmento per questo uv.x
// // Seg1D seg = seg1D(uv.x, scale, jitterAmt);

// // DOPO
// float sx = gl_FragCoord.x / uResolution.x;
// Seg1D seg = seg1D(sx + x, scale, jitterAmt);

// // scegli l’offset per-segmento (discreto oppure continuo)
// float segOffset = pickOffset(seg.id);

// // opzionale: aggiungi una leggera variazione interna al segmento (rampa/curva)
// // float slope = (hash11(seg.id * 7.0) - 0.5) * 0.2; // piccola pendenza
// // float shape = (seg.t - 0.5) * slope;             // rampa lineare centrata

// float shape = 0.0;

// // oppure: float segOffset = pickOffsetRange(seg.id, -0.25, 0.15);
//   // return y;//clamp(y, 0.0, 1.0);
//   float y = baseY + segOffset + shape;
//   return y;
  // if (uv.x > -1.0 && uv.x < 0.0){
  //   return base + uHeightOffset[li];
  // } else if(uv.x >= 0.0 && uv.x < 0.2) {
  //   return base + uHeightOffset[li];
  // } else if(uv.x >= 0.2 && uv.x < 0.3) {
  //   return base + uHeightOffset[li] - 0.2;
  // } else if(uv.x >= 0.3 && uv.x < 0.5) {
  //   return base + uHeightOffset[li] + 0.1;
  // } else if(uv.x >= 0.5 && uv.x < 0.55) {
  //   return base + uHeightOffset[li] -0.1;
  // } else if(uv.x >= 0.55 && uv.x < 0.75) {
  //   return base + uHeightOffset[li] -0.2;
  // } else{
  //   return base + uHeightOffset[li];
  // }
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
    // float world_x = st.x + t * 1.0 * uSpeed[i] + uOffset[i];
    // float h = terrainHeight(world_x, i);

  float xoff = t * 0.1 * uSpeed[i] + uOffset[i]; // SOLO offset
  float h = terrainHeight(xoff, i);

    float edge = 0.2;
    float mask;
    if (i == 0){
      edge = 0.02;
      mask = smoothstep(h, h - edge, st.y);
    }
    else if(i == 1){
           edge = 0.005;
      mask = smoothstep(h, h - edge, st.y);
    } else if(i == 2){
           edge = 0.009;
      mask = smoothstep(h, h - edge, st.y);
    }else {
       mask = step(st.y, h);
    }
    // float mask = step(st.y, h);

    // se vuoi oggetti cielo su un layer specifico (es. i==0)
    if (i == uSkyLayer) {
      vec3 skyObjs = generate_sky_objects(st, t);
      if (length(skyObjs) > 0.1) outCol = skyObjs;
    }

    vec3 layerCol = uTint[i];
    float a = clamp(uOpacity[i], 0.0, 1.0) * mask;

    outCol = mix(outCol, layerCol, a); // niente nero, solo tinta del layer
  }
  // vec3 layerColx = t;
  gl_FragColor = vec4(outCol, 1.0);
}
