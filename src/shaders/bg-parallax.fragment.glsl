precision highp float;

uniform float uTime;
uniform vec2  uResolution;

#define MAX_LAYERS 15
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
uniform float uHeightNoise[MAX_LAYERS];
uniform float uSmoothness[MAX_LAYERS];

uniform vec3 uKeyLightPosition;
uniform vec3 uKeyLightColor;
uniform vec3 uFillLightPosition;
uniform vec3 uFillLightColor;
uniform vec3 uAmbientLight;

#define FBM_OCTAVES 3

const float FBM_LACUNARITY = 1.0;
const float FBM_GAIN       = 0.5;
const float WARP_AMP  = 2.10;
const float WARP_FREQ = 2.3;

varying vec2 vUv;

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
  vec3 col = vec3(0.);
  
  // SOLE/LUNA principale
  vec2 main_pos = vec2(.2 + .6 * sin(t * .02), .75 + .15 * cos(t * 1.15));
  float main_size = .08;

  if(sdf_circle(st - main_pos, main_size) < 0.){ 
    col = vec3(0.);
    vec2 c1 = main_pos + vec2(.025, .02); 
    if(sdf_circle(st - c1, main_size * .25) < 0.) col = vec3(.88);
    vec2 c2 = main_pos + vec2(-.02, .03); 
    if(sdf_circle(st - c2, main_size * .15) < 0.) col = vec3(.88);
  }
  
  // Alone intorno al sole (quando visibile)
  if(sin(t * .01) > 0.){
    float rd = length(st - main_pos);
    float ang = atan(st.y - main_pos.y, st.x - main_pos.x);
    float thick = .005 * (1. + .3 * sin(ang * 8.));
    if(rd > main_size * 1.4 && rd < main_size * 2.2) 
      if(abs(rd - main_size * 1.8) < thick) col = vec3(0.);
  }
  
  // LUNA secondaria
  vec2 moon = vec2(.7 + .2 * cos(t * .03), .6 + .1 * sin(t * .025));
  if(sdf_circle(st - moon, .025) < 0.) col = vec3(0.);
  
  // PIANETI più GRANDI - sostituisci tutti i pianeti con questi
// PIANETI che SI MUOVONO DAVVERO - sostituisci tutti
vec2 planet1 = vec2(.15 + .25 * sin(t * .05), .85 + .15 * cos(t * .1));
if(sdf_circle(st - planet1, .035) < 0.) col = vec3(0.9);

vec2 planet2 = vec2(.8 + .30 * cos(t * .07), .8 + .20 * sin(t * .22));
if(sdf_circle(st - planet2, .028) < 0.) col = vec3(1.0, 0.8, 0.6);

vec2 planet3 = vec2(.5 + .35 * sin(t * .03), .9 + .10 * cos(t * .16));
if(sdf_circle(st - planet3, .025) < 0.) col = vec3(0.6, 0.8, 1.0);

vec2 planet4 = vec2(.2 + .20 * cos(t * .09), .75 + .25 * sin(t * .14));
if(sdf_circle(st - planet4, .020) < 0.) col = vec3(1.0, 0.9, 0.7);

vec2 planet5 = vec2(.7 + .40 * sin(t * .11), .70 + .18 * cos(t * .16));
if(sdf_circle(st - planet5, .040) < 0.) col = vec3(0.8, 1.0, 0.8);

vec2 planet6 = vec2(.3 + .28 * cos(t * .04), .95 + .08 * sin(t * .13));
if(sdf_circle(st - planet6, .032) < 0.) col = vec3(1.0, 0.7, 0.9);

vec2 planet7 = vec2(.85 + .15 * sin(t * .14), .60 + .30 * cos(t * .15));
if(sdf_circle(st - planet7, .038) < 0.) col = vec3(0.9, 0.7, 1.0);

vec2 planet8 = vec2(.1 + .22 * cos(t * .08), .55 + .35 * sin(t * .20));
if(sdf_circle(st - planet8, .022) < 0.) col = vec3(1.0, 1.0, 0.6);

vec2 planet9 = vec2(.9 + .18 * sin(t * .06), .85 + .12 * cos(t * .15));
if(sdf_circle(st - planet9, .045) < 0.) col = vec3(0.7, 0.9, 1.0);

vec2 planet10 = vec2(.4 + .32 * cos(t * .02), .65 + .28 * sin(t * .17));
if(sdf_circle(st - planet10, .030) < 0.) col = vec3(1.0, 0.8, 0.8);

  // STELLE CHE SI MUOVONO - sostituisci tutte le stelle con queste

// Stelle giganti che orbitano
vec2 cell_giant = floor(st * 8.);
vec2 giant_offset = vec2(sin(t * 0.02 + cell_giant.x), cos(t * 0.23 + cell_giant.y)) * 0.1;
if(random(cell_giant + 111.11) > .85 && st.y > .6){
 vec2 sp = fract(st * 8.) + giant_offset;
 if(length(sp - vec2(.5)) < .18) col = vec3(0.9);
}

// Stelle micro che danzano
vec2 cell_micro = floor(st * 200.);
vec2 micro_dance = vec2(sin(t * 0.8 + cell_micro.x * 10.0), cos(t * 3.2 + cell_micro.y * 15.0)) * 0.02;
if(random(cell_micro + 999.99) > .985 && st.y > .1){
 vec2 sp = fract(st * 200.) + micro_dance;
 if(length(sp - vec2(.5)) < .01) col = vec3(0.8);
}

// Stelle triangolari che volano
vec2 cell_tri = floor(st * 24.);
vec2 tri_flight = vec2(sin(t * 0.05 + cell_tri.x * 3.0), cos(t * 0.37 + cell_tri.y * 2.0)) * 0.08;
if(random(cell_tri + 333.33) > .94 && st.y > .55){
 vec2 sp = fract(st * 24.) + tri_flight;
 vec2 center = sp - vec2(.5);
 float tri = max(abs(center.x), abs(center.y) + center.x * 0.5);
 if(tri < .04) col = vec3(0.85);
}

// Stelle a stella che girano e si muovono
vec2 cell_star = floor(st * 16.);
vec2 star_movement = vec2(cos(t * 0.04 + cell_star.x), sin(t * 0.26 + cell_star.y)) * 0.06;
if(random(cell_star + 777.77) > .91 && st.y > .65){
 vec2 sp = fract(st * 16.) + star_movement;
 vec2 center = sp - vec2(.5);
 float angle = atan(center.y, center.x) + t * 2.0; // Rotazione
 float r = length(center);
 float star_shape = cos(angle * 6.0) * 0.02 + 0.04;
 if(r < star_shape) col = vec3(0.9);
}

// Stelle pulsanti che vagano
vec2 cell_rainbow = floor(st * 26.);
float rainbowRandom = random(cell_rainbow + 555.55);
vec2 rainbow_wander = vec2(sin(t * 0.03 + rainbowRandom * 50.0), cos(t * 0.54 + rainbowRandom * 30.0)) * 0.05;
if(rainbowRandom > .96 && st.y > .5){
 vec2 sp = fract(st * 26.) + rainbow_wander;
 float pulse = 0.4 + 0.6 * sin(t * 4.0 + rainbowRandom * 150.0);
 float starSize = .035 + .02 * pulse;
 if(length(sp - vec2(.5)) < starSize) {
   vec3 rainbow = vec3(
     0.5 + 0.5 * sin(t * 2.0 + rainbowRandom),
     0.5 + 0.5 * sin(t * 2.0 + rainbowRandom + 2.0),
     0.5 + 0.5 * sin(t * 2.0 + rainbowRandom + 4.0)
   );
   col = rainbow;
 }
}

// Stelle rotanti che orbitano
vec2 cell_spin = floor(st * 20.);
vec2 spin_orbit = vec2(cos(t * 0.08 + cell_spin.x * 2.0), sin(t * 1.1 + cell_spin.y * 1.5)) * 0.07;
if(random(cell_spin + 444.44) > .93 && st.y > .7){
 vec2 sp = fract(st * 20.) + spin_orbit;
 vec2 center = sp - vec2(.5);
 float angle = atan(center.y, center.x) + t * 3.0; // Rotazione veloce
 float r = length(center);
 float spin_shape = abs(cos(angle * 2.0)) * 0.03 + 0.02;
 if(r < spin_shape) col = vec3(0.95);
}

// Stelle doppie che danzano insieme
vec2 cell_double_color = floor(st * 14.);
vec2 double_dance = vec2(sin(t * 0.06 + cell_double_color.x), cos(t * 0.49 + cell_double_color.y)) * 0.04;
if(random(cell_double_color + 666.66) > .89 && st.y > .6){
 vec2 sp = fract(st * 14.) + double_dance;
 if(length(sp - vec2(.42, .5)) < .05) col = vec3(1.0, 0.7, 0.7); // Rosso
 if(length(sp - vec2(.58, .5)) < .05) col = vec3(0.7, 0.7, 1.0); // Blu
}

// Stelle quadrate che scivolano
vec2 cell_square = floor(st * 32.);
vec2 square_slide = vec2(sin(t * 0.12 + cell_square.y * 5.0), cos(t * 0.35 + cell_square.x * 4.0)) * 0.03;
if(random(cell_square + 222.22) > .95 && st.y > .4){
 vec2 sp = fract(st * 32.) + square_slide;
 vec2 center = abs(sp - vec2(.5));
 if(max(center.x, center.y) < .025) col = vec3(0.8);
}

// Stelle con alone che fluttuano
vec2 cell_halo = floor(st * 18.);
vec2 halo_float = vec2(cos(t * 0.27 + cell_halo.x * 1.5), sin(t * 10.55 + cell_halo.y * 12.0)) * 0.06;
if(random(cell_halo + 888.88) > .92 && st.y > .58){
 vec2 sp = fract(st * 18.) + halo_float;
 float dist = length(sp - vec2(.5));
 if(dist < .03) col = vec3(1.0); // Stella centrale
 else if(dist < .08) col = mix(col, vec3(0.9), 0.3); // Alone
}
  
  // NUVOLE/NEBULAE - forme più grandi e soffici
  vec2 cloud1_pos = vec2(.3 + .1 * sin(t * .001), .7 + .05 * cos(t * .0015));
  float cloud1_dist = length(st - cloud1_pos);
  float cloud1_noise = noise(st * 8.0 + t * 0.1);
  if(cloud1_dist < .15 && cloud1_noise > .3) {
    float cloud_alpha = smoothstep(.15, .05, cloud1_dist) * (cloud1_noise - .3) * 2.0;
    col = mix(col, vec3(.1), cloud_alpha);
  }
  
  vec2 cloud2_pos = vec2(.75 + .08 * cos(t * .0012), .65 + .06 * sin(t * .0018));
  float cloud2_dist = length(st - cloud2_pos);
  float cloud2_noise = noise(st * 6.0 + t * 0.05);
  if(cloud2_dist < .12 && cloud2_noise > .4) {
    float cloud_alpha = smoothstep(.12, .03, cloud2_dist) * (cloud2_noise - .4) * 3.0;
    col = mix(col, vec3(.15), cloud_alpha);
  }

  vec2 cloud3_pos = vec2(.1 + .15 * sin(t * .08), .8 + .1 * cos(t * .12));
float cloud3_dist = length(st - cloud3_pos);
float cloud3_noise = noise(st * 5.0 + t * 0.3);
if(cloud3_dist < .18 && cloud3_noise > .25) {
  float cloud_alpha = smoothstep(.18, .06, cloud3_dist) * (cloud3_noise - .25) * 2.5;
  col = mix(col, vec3(.08), cloud_alpha);
}

vec2 cloud4_pos = vec2(.9 + .12 * cos(t * .06), .75 + .08 * sin(t * .09));
float cloud4_dist = length(st - cloud4_pos);
float cloud4_noise = noise(st * 7.0 + t * 0.2);
if(cloud4_dist < .14 && cloud4_noise > .35) {
  float cloud_alpha = smoothstep(.14, .04, cloud4_dist) * (cloud4_noise - .35) * 3.0;
  col = mix(col, vec3(.12), cloud_alpha);
}

vec2 cloud5_pos = vec2(.6 + .2 * sin(t * .04), .55 + .15 * cos(t * .07));
float cloud5_dist = length(st - cloud5_pos);
float cloud5_noise = noise(st * 4.0 + t * 0.4);
if(cloud5_dist < .22 && cloud5_noise > .2) {
  float cloud_alpha = smoothstep(.22, .08, cloud5_dist) * (cloud5_noise - .2) * 2.0;
  col = mix(col, vec3(.06), cloud_alpha);
}

vec2 cloud6_pos = vec2(.35 + .18 * cos(t * .11), .9 + .06 * sin(t * .14));
float cloud6_dist = length(st - cloud6_pos);
float cloud6_noise = noise(st * 9.0 + t * 0.15);
if(cloud6_dist < .16 && cloud6_noise > .3) {
  float cloud_alpha = smoothstep(.16, .05, cloud6_dist) * (cloud6_noise - .3) * 2.8;
  col = mix(col, vec3(.09), cloud_alpha);
}

vec2 cloud7_pos = vec2(.8 + .14 * sin(t * .13), .45 + .12 * cos(t * .05));
float cloud7_dist = length(st - cloud7_pos);
float cloud7_noise = noise(st * 6.5 + t * 0.25);
if(cloud7_dist < .20 && cloud7_noise > .28) {
  float cloud_alpha = smoothstep(.20, .07, cloud7_dist) * (cloud7_noise - .28) * 2.2;
  col = mix(col, vec3(.11), cloud_alpha);
}
  
  return col;
}

mat2 rot2(float a){
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float terrainHeight(float x, int li, float liquidTime) {
  float freq = uFreq[li];
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
  float n = mix(nLarge, nDetail, uHeightNoise[li]);

  float y = base + n * amp + uHeightOffset[li];
  return clamp(y, 0.0, 1.0);
}
void main(){
  vec2 st = vUv;
  st.x *= uResolution.x / uResolution.y;
  
  // Normalizza anche questi tempi per evitare overflow
  float t = mod(uTime * 0.2, 1000.0);
  float horizontalTime = mod(uTime * 1.7, 1000.0);
  float liquidTime = mod(uTime * 0.5, 628.318);

  // 1) base: cielo
  vec3 outCol = skyColor(st);
  
  // RENDER GLI SKY OBJECTS UNA SOLA VOLTA ALL'INIZIO
  if (uSkyLayer >= 0) {
    vec3 skyObjs = generate_sky_objects(st, t);
    if (length(skyObjs) > 0.1) outCol = skyObjs;
  }

  // 2) compositing back -> front WITH BORDERS AND WATER REFLECTIONS
  for (int i=0; i<MAX_LAYERS; i++) {
    if (i >= uLayerCount) break;
    
    if (uOpacity[i] <= 0.0) continue;

    float world_x = st.x + horizontalTime * 0.1 * uSpeed[i] + uOffset[i];
    float h = terrainHeight(world_x, i, liquidTime);

    float bigNoise = noise(st * 10.0 * uSmoothness[i] + t * 0.5) * 0.08;
    float medNoise = noise(st * 10.0* uSmoothness[i] + t * 0.5) * 0.04;
    float smallNoise = noise(st * 20.0 * uSmoothness[i]+ t * 3.0) * 0.002;
    float noisyHeight = h+ bigNoise + medNoise + smallNoise;

    // MASK ESTESO per coprire anche il border
    float edge = 0.010;
    float extendedMask = smoothstep(noisyHeight + 0.008, noisyHeight - edge, st.y);
    
    // Layer normale
    if (st.y < noisyHeight) {
      vec2 reflectUv = st;
      reflectUv.y = noisyHeight + (noisyHeight - st.y);
      
      float distortionStrength = 0.02;
      float distortion = noise(st * 15.0 + t * 0.5) * distortionStrength;
      reflectUv.x += distortion;
      
      vec3 reflectedColor = skyColor(reflectUv);
      // RIFLETTI ANCHE GLI SKY OBJECTS
      if (uSkyLayer >= 0) {
        vec3 reflectedSkyObjs = generate_sky_objects(reflectUv, t);
        if (length(reflectedSkyObjs) > 0.1) reflectedColor = reflectedSkyObjs;
      }
      
      float depth = noisyHeight - st.y;
      float reflectionStrength = 0.6 * exp(-depth * 3.0);
      vec3 waterTint = vec3(0.8, 0.9, 1.0);
      
      vec3 layerCol = uTint[i] * waterTint;
      layerCol = mix(layerCol, reflectedColor, reflectionStrength);
      
      vec3 worldPos = vec3(st.x, st.y, 0.0);
      vec3 normal = vec3(0.0, 0.0, 1.0);
      vec3 keyLightDir = normalize(uKeyLightPosition - worldPos);
      float keyDot = max(0.2, dot(normal, keyLightDir));
      vec3 keyContrib = uKeyLightColor * keyDot;
      vec3 fillLightDir = normalize(uFillLightPosition - worldPos);
      float fillDot = max(0.0, dot(normal, fillLightDir));
      vec3 fillContrib = uFillLightColor * fillDot;
      vec3 lighting = uAmbientLight + keyContrib * 0.8 + fillContrib;
      layerCol = layerCol * lighting;
      
      float a = clamp(uOpacity[i], 0.0, 1.0) * extendedMask;
      outCol = mix(outCol, layerCol, a);
    } else {
      // RIMUOVI IL CHECK PER SKY OBJECTS QUI - non renderizzarli più nel loop
      
      vec3 layerCol = uTint[i];
      vec3 worldPos = vec3(st.x, st.y, 0.0);
      vec3 normal = vec3(0.0, 0.0, 1.0);
      vec3 keyLightDir = normalize(uKeyLightPosition - worldPos);
      float keyDot = max(0.3, dot(normal, keyLightDir));
      vec3 keyContrib = uKeyLightColor * keyDot;
      vec3 fillLightDir = normalize(uFillLightPosition - worldPos);
      float fillDot = max(0.0, dot(normal, fillLightDir));
      vec3 fillContrib = uFillLightColor * fillDot;
      vec3 lighting = uAmbientLight + keyContrib + fillContrib;
      layerCol = layerCol * lighting;
      
      float a = clamp(uOpacity[i], 0.0, 1.0) * extendedMask;
      outCol = mix(outCol, layerCol, a);
    }
    
    // Border BIANCO PURO sopra al layer
float distFromSurface = st.y - noisyHeight;

// Combina più tipi di variazione
float variation1 = noise(vec2(world_x * 8.0, t * 0.5)) * 0.5 + 0.5;
float variation2 = sin(world_x * 25.0 + t * 2.0) * 0.5 + 0.5;
float combinedVariation = mix(variation1, variation2, 0.6);

float variableThickness = mix(0.0005, 0.010, combinedVariation);

// A volte il border scompare completamente
if (combinedVariation > 0.1) { // Solo quando la variazione è sopra 0.1
  if (distFromSurface > -variableThickness * 0.3 && distFromSurface < variableThickness) {
    float borderStrength = smoothstep(variableThickness, variableThickness * 0.3, abs(distFromSurface));
    outCol = mix(outCol, vec3(1.0), borderStrength);
  }
}

  }

  gl_FragColor = vec4(outCol, 1.0);
}