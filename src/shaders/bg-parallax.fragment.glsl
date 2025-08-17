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
uniform float uFluidSpeed;

uniform float uFreq[MAX_LAYERS];
uniform float uBase[MAX_LAYERS];
uniform float uAmp[MAX_LAYERS];
uniform float uHeightOffset[MAX_LAYERS];
uniform float uHeightNoise[MAX_LAYERS];
uniform float uSmoothness[MAX_LAYERS];

uniform float uLiquidSpeed[MAX_LAYERS];
uniform float uLiquidOffset[MAX_LAYERS];

uniform vec3 uKeyLightPosition;
uniform vec3 uKeyLightColor;
uniform vec3 uFillLightPosition;
uniform vec3 uFillLightColor;
uniform vec3 uAmbientLight;

uniform float uMainSpeed;

// ✅ MANUAL RESET SYSTEM - No automatic timing
uniform float uFadeAmount;

// Add these uniforms to your shader
uniform sampler2D uSkyTexture1; // Main sky layer (planets, sun, moon)
uniform sampler2D uSkyTexture2; // Stars layer 1
uniform sampler2D uSkyTexture3; // Stars layer 2 (different animation speed)
uniform sampler2D uSkyTexture4; // Clouds/nebulae layer
uniform float uSkyAnimation1; // Animation frame for texture 1
uniform float uSkyAnimation2; // Animation frame for texture 2  
uniform float uSkyAnimation3; // Animation frame for texture 3
uniform float uSkyAnimation4; // Animation frame for texture 4

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

// Hybrid sky function: Textures + Procedural planets
vec3 generate_sky_objects_HYBRID(vec2 st, float t){
  vec3 col = vec3(0.0);
  
  // ========== BACKGROUND TEXTURE LAYER ==========
  bool uShowTexture = true;
  if(uShowTexture) {
    // ✅ CONTROLLED TEXTURE SIZE AND POSITIONING
    vec2 uv = st;
    
    // ✅ APPLY SCALE (1.0 = exact fit, 2.0 = zoomed in, 0.5 = zoomed out)
    uv = (uv - 0.5) /0.3 + 0.5;

    vec2 textureOffset = vec2(0.0, -0.8); // Move texture UP by 0.2
    uv += textureOffset;
    
    // ✅ VERY MINIMAL MOVEMENT
    float skyTime = t * uMainSpeed;
    uv += vec2(skyTime * 0.0001, 0.0);
    
    // ✅ CLAMP TO PREVENT REPETITION
    uv = clamp(uv, 0.0, 1.0);
    
    // ✅ SAMPLE BACKGROUND TEXTURE
    vec3 backgroundTexture = texture2D(uSkyTexture3, uv).rrr;
    col = backgroundTexture * 1.0;
  }
  
  // ========== PROCEDURAL OBJECTS LAYER ==========
  bool uShowProcedural = true;
  if(uShowProcedural) {
    float skyTime = t * uMainSpeed;
    
    // ✅ TRACK IF WE HAVE A PROCEDURAL OBJECT AT THIS PIXEL
    bool hasObject = false;
    vec3 objectColor = vec3(0.0);
    
    // ✅ MOVING CLOUDS
    vec2 cloud1_pos = vec2(.3 + .1 * sin(skyTime * .001), .7 + .05 * cos(skyTime * .0015));
    float cloud1_dist = length(st - cloud1_pos);
    float cloud1_noise = noise(st * 8.0 + skyTime * 0.1);
    
    if(cloud1_dist < .15 && cloud1_noise > .3) {
      float cloud_alpha = smoothstep(.15, .05, cloud1_dist) * (cloud1_noise - .3) * 2.0;
      if(cloud_alpha > 0.3) {
        hasObject = true;
        objectColor = vec3(.1);
      }
    }
    
    // ✅ SECOND CLOUD
    if(!hasObject) { // Only check if we don't already have an object
      vec2 cloud7_pos = vec2(.8 + .14 * sin(skyTime * .13), .45 + .12 * cos(skyTime * .05));
      float cloud7_dist = length(st - cloud7_pos);
      float cloud7_noise = noise(st * 6.5 + skyTime * 0.25);
      
      if(cloud7_dist < .20 && cloud7_noise > .28) {
        float cloud_alpha = smoothstep(.20, .07, cloud7_dist) * (cloud7_noise - .28) * 2.2;
        if(cloud_alpha > 0.3) {
          hasObject = true;
          objectColor = vec3(.11);
        }
      }
    }
    
    // ✅ SIMPLE STARS
    if(!hasObject) {
      vec2 cell_star = floor(st * 32.);
      if(random(cell_star + 222.22) > .98 && st.y > .4){
        vec2 sp = fract(st * 32.);
        if(length(sp - vec2(.5)) < .015) {
          hasObject = true;
          objectColor = vec3(0.9);
        }
      }
    }
    
    // ✅ MOVING PLANETS
    if(!hasObject) {
      vec2 planet1 = vec2(.15 + .25 * sin(skyTime * .05), .85 + .15 * cos(skyTime * .1));
      if(length(st - planet1) < .035) {
        hasObject = true;
        objectColor = vec3(0.9, 0.8, 0.6);
      }
    }
    
    if(!hasObject) {
      vec2 planet2 = vec2(.8 + .30 * cos(skyTime * .07), .8 + .20 * sin(skyTime * .22));
      if(length(st - planet2) < .028) {
        hasObject = true;
        objectColor = vec3(1.0, 0.8, 0.6);
      }
    }
    
    // ✅ IF WE HAVE A PROCEDURAL OBJECT, REPLACE THE BACKGROUND
    if(hasObject) {
      col = objectColor; // Complete replacement, no mixing
    }
  }
  
  return col;
}

mat2 rot2(float a){
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float terrainHeight(float x, int li) {
  float freq = uFreq[li];
  float base = uBase[li];
  float amp  = uAmp[li];

  vec2 baseUv = vec2(x * 1.0, 2.0);
  
  if(uFluidSpeed > 0.001) {
    baseUv = warp2(baseUv, float(li) * 12.34);
  } else {
    baseUv = warp2(baseUv, float(li) * 12.34);
  }
  
  float liquidPhase = 0.0;
  if(uFluidSpeed > 0.001) {
    float layerSpeed = 0.1;
    float layerOffset = float(li) * 2.7;
    float fluidTime = uTime * layerSpeed * uFluidSpeed + layerOffset;
    liquidPhase = sin(fluidTime) * 0.2;
  }

  float timeComponent = uTime * (0.1 + float(li) * 0.05) * uMainSpeed;
  
  float baseRotation = 0.4 + float(li) * 0.2;
  float totalRotation = baseRotation + liquidPhase;
  
  vec2 uvLarge = rot2(totalRotation) * vec2(baseUv.x, baseUv.y + timeComponent);
  vec2 uvDetail = rot2(totalRotation * 0.5) * vec2(baseUv.x, baseUv.y + timeComponent * 1.5);
  
  float nLarge = fbm_base(uvLarge * 0.4);
  float nDetail = fbm_base(uvDetail * 1.0);
  float n = mix(nLarge, nDetail, uHeightNoise[li]);

  float y = base + n * amp + uHeightOffset[li];
  return clamp(y, 0.0, 1.0);
}

void main(){
  vec2 st = vUv;
  st.x *= uResolution.x / uResolution.y;
  
  // ✅ SIMPLE TIME - NO AUTOMATIC RESET
  float t = mod(uTime * 0.2, 1000.0);
  float horizontalTime = (uTime * uMainSpeed) / 5.0;

  // 1) base: cielo
  vec3 outCol = skyColor(st);
  
  // RENDER GLI SKY OBJECTS
  if (uSkyLayer >= 0) {
    vec3 skyObjs = generate_sky_objects_HYBRID(st, t);
    if (length(skyObjs) > 0.1) outCol = skyObjs;
  }

  // ✅ NORMAL world_x calculation (no reset logic)
  float world_x = st.x + horizontalTime;

  // 2) compositing layers
  for (int i=0; i<MAX_LAYERS; i++) {
    if (i >= uLayerCount) break;
    if (uOpacity[i] <= 0.0) continue;
    
    float layer_world_x = world_x * uSpeed[i] + uOffset[i];
    float h = terrainHeight(layer_world_x, i);

    float bigNoise = noise(st * 10.0 * uSmoothness[i]) * 0.02;
    float medNoise = noise(st * 15.0 * uSmoothness[i]) * 0.01;
    float smallNoise = noise(st * 25.0 * uSmoothness[i]) * 0.005;
    float noisyHeight = h + bigNoise + medNoise + smallNoise;

    float edge = 0.010;
    float extendedMask = smoothstep(noisyHeight + 0.008, noisyHeight - edge, st.y);
    
    if (st.y < noisyHeight) {
      vec2 reflectUv = st;
      reflectUv.y = noisyHeight + (noisyHeight - st.y);
      
      float distortionStrength = 0.01;
      float distortion = noise(st * 15.0) * distortionStrength;
      reflectUv.x += distortion;
      
      vec3 reflectedColor = skyColor(reflectUv);
      if (uSkyLayer >= 0) {
        vec3 reflectedSkyObjs = generate_sky_objects_HYBRID(reflectUv, t);
        if (length(reflectedSkyObjs) > 0.1) reflectedColor = reflectedSkyObjs;
      }
      
      float depth = noisyHeight - st.y;
      float reflectionStrength = 0.6 * exp(-depth * 3.0);
      vec3 waterTint = vec3(0.8, 0.9, 1.0);
      
      vec3 layerCol = uTint[i] * waterTint;
      layerCol = mix(layerCol, reflectedColor, reflectionStrength);
      
      vec3 lighting = uAmbientLight + uKeyLightColor * 0.5 + uFillLightColor * 0.3;
      layerCol = layerCol * lighting;
      
      float a = clamp(uOpacity[i], 0.0, 1.0) * extendedMask;
      outCol = mix(outCol, layerCol, a);
    } else {
      vec3 layerCol = uTint[i];
      vec3 lighting = uAmbientLight + uKeyLightColor * 0.7 + uFillLightColor * 0.4;
      layerCol = layerCol * lighting;
      
      float a = clamp(uOpacity[i], 0.0, 1.0) * extendedMask;
      outCol = mix(outCol, layerCol, a);
    }
    
    float distFromSurface = st.y - noisyHeight;
    float variation1 = noise(vec2(layer_world_x * 8.0, 0.0)) * 0.5 + 0.5;
    float variableThickness = mix(0.001, 0.008, variation1);
    
    if (distFromSurface > -variableThickness * 0.3 && distFromSurface < variableThickness) {
      float borderStrength = smoothstep(variableThickness, variableThickness * 0.3, abs(distFromSurface));
      outCol = mix(outCol, vec3(1.0), borderStrength);
    }
  }

  // ✅ MANUAL FADE CONTROL (only when triggered)
  vec3 targetColor = vec3(0.0);
  outCol = mix(outCol, targetColor, uFadeAmount);

  gl_FragColor = vec4(outCol, 1.0);
}