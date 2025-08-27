// pastel_swirl.fragment.glsl
uniform float uTime;
uniform vec2 uResolution;

// Uniforms per le luci dal LightManager
uniform vec3 u_keyLightPosition;
uniform vec3 u_keyLightColor;
uniform float u_keyLightIntensity;

uniform vec3 u_fillLightPosition;
uniform vec3 u_fillLightColor;
uniform float u_fillLightIntensity;

uniform vec3 u_backLightPosition;
uniform vec3 u_backLightColor;
uniform float u_backLightIntensity;

uniform vec3 u_ambientColor;
uniform float u_ambientIntensity;

varying vec2 vUv;
varying vec3 vPosition;

// Simula un nastro 3D che si piega nello spazio con variazioni
vec3 ribbon3D(vec2 uv, float t, float time, float offset, float variation) {
    // Percorso del nastro nello spazio 3D con leggere variazioni
    float s = t + offset;
    vec3 centerLine = vec3(
        s,
        sin(s * (2.0 + variation * 0.3) + time) * 0.4 + cos(s * (1.5 + variation * 0.2) + time * 0.8) * 0.3,
        sin(s * (3.0 + variation * 0.4) + time * 1.2) * 0.2 // Profondità Z
    );
    
    
    // Vettore tangente (direzione del nastro)
    vec3 tangent = normalize(vec3(
        1.0,
        cos(s * (2.0 + variation * 0.3) + time) * 0.8 - sin(s * (1.5 + variation * 0.2) + time * 0.8) * 0.45,
        cos(s * (3.0 + variation * 0.4) + time * 1.2) * 0.6
    ));
    
    // Vettore normale (direzione della larghezza del nastro)
    vec3 up = vec3(0.0, 0.0, 1.0);
    vec3 normal = normalize(cross(tangent, up));
    
    // Rotazione del nastro su se stesso
    float twist = s * (1.5 + variation * 0.2) + time * 0.5;
    vec3 rotatedNormal = normal * cos(twist) + cross(tangent, normal) * sin(twist);
    
    return centerLine + rotatedNormal * (uv.y - 0.5) * 0.3;
}

// Calcola il contributo di una singola luce
vec3 calculateLighting(vec3 worldPos, vec3 normal, vec3 lightPos, vec3 lightColor, float lightIntensity, vec3 baseColor) {
    vec3 lightDir = normalize(lightPos - worldPos);
    float distance = length(lightPos - worldPos);
    
    // Attenuazione per distanza
    float attenuation = 1.0 / (1.0 + distance * distance * 0.05);
    
    // Diffuse
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // Specular
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0) - worldPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    
    vec3 diffuseColor = baseColor * lightColor * diffuse * lightIntensity * attenuation;
    vec3 specularColor = lightColor * specular * lightIntensity * attenuation * 0.8;
    
    return diffuseColor + specularColor;
}

// --- utils: hash & noise (leggeri) ---
float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float noise1D(float x) { // value noise 1D
    float i = floor(x);
    float f = fract(x);
    float u = f*f*(3.0-2.0*f);
    return mix(hash11(i), hash11(i+1.0), u);
}

float fbm1D(float x) {
    float a = 0.5, s = 0.0, f = 1.0;
    for(int i=0;i<5;i++){
        s += a * noise1D(x*f);
        f *= 2.01;      // incommensurabile
        a *= 0.5;
    }
    return s;
}

void main() {
    vec2 uv = vUv;
    
    float time = uTime * 1.3;

    // slow drift con FBM per non ripetere mai
    float timeWarp = time + 0.75 * fbm1D(time * 0.07 + 17.123);

    
    vec3 color = vec3(0.0, 0.0, 0.0);
    float width = 0.25;
    
    //  vec3 ribbonColors[12];
    // ribbonColors[0] = vec3(0.15, 0.3, 0.9);   // blu intenso
    // ribbonColors[1] = vec3(0.95, 0.88, 0.65); // giallo crema
    // ribbonColors[2] = vec3(0.2, 0.45, 0.85);  // blu medio
    // ribbonColors[3] = vec3(0.9, 0.85, 0.7);   // crema chiaro
    // ribbonColors[4] = vec3(0.3, 0.5, 0.95);   // blu chiaro
    // ribbonColors[5] = vec3(0.85, 0.75, 0.6);  // beige
    // ribbonColors[6] = vec3(0.6, 0.4, 0.8);    // viola pastello
    // ribbonColors[7] = vec3(0.9, 0.9, 0.75);   // giallo pallido
    // ribbonColors[8] = vec3(0.25, 0.4, 0.8);   // blu profondo
    // ribbonColors[9] = vec3(0.8, 0.6, 0.7);    // rosa pastello
    // ribbonColors[10] = vec3(0.4, 0.6, 0.9);   // azzurro
    // ribbonColors[11] = vec3(0.95, 0.8, 0.55); // oro pallido

    // vec3 ribbonColors[12];
// ribbonColors[0]  = vec3(0.05, 0.1, 0.3);
// ribbonColors[1]  = vec3(0.1, 0.2, 0.45);
// ribbonColors[2]  = vec3(0.15, 0.3, 0.6);
// ribbonColors[3]  = vec3(0.2, 0.4, 0.75);
// ribbonColors[4]  = vec3(0.25, 0.5, 0.85);
// ribbonColors[5]  = vec3(0.3, 0.6, 0.9);
// ribbonColors[6]  = vec3(0.35, 0.7, 0.95);
// ribbonColors[7]  = vec3(0.4, 0.8, 1.0);
// ribbonColors[8]  = vec3(0.3, 0.85, 0.9);
// ribbonColors[9]  = vec3(0.2, 0.9, 0.85);
// ribbonColors[10] = vec3(0.15, 0.95, 0.8);
// ribbonColors[11] = vec3(0.1, 1.0, 0.75);

// ribbonColors[0]  = vec3(0.95, 0.75, 0.85);
// ribbonColors[1]  = vec3(0.9, 0.6, 0.8);
// ribbonColors[2]  = vec3(0.85, 0.45, 0.75);
// ribbonColors[3]  = vec3(0.8, 0.3, 0.7);
// ribbonColors[4]  = vec3(0.7, 0.25, 0.75);
// ribbonColors[5]  = vec3(0.6, 0.2, 0.8);
// ribbonColors[6]  = vec3(0.5, 0.2, 0.85);
// ribbonColors[7]  = vec3(0.4, 0.25, 0.8);
// ribbonColors[8]  = vec3(0.35, 0.3, 0.75);
// ribbonColors[9]  = vec3(0.3, 0.35, 0.7);
// ribbonColors[10] = vec3(0.25, 0.3, 0.6);
// ribbonColors[11] = vec3(0.2, 0.25, 0.55);

// ribbonColors[0]  = vec3(0.95, 0.8, 0.85);
// ribbonColors[1]  = vec3(0.85, 0.9, 0.95);
// ribbonColors[2]  = vec3(0.9, 0.95, 0.8);
// ribbonColors[3]  = vec3(0.95, 0.85, 0.7);
// ribbonColors[4]  = vec3(0.8, 0.9, 0.85);
// ribbonColors[5]  = vec3(0.75, 0.85, 0.95);
// ribbonColors[6]  = vec3(0.7, 0.95, 0.9);
// ribbonColors[7]  = vec3(0.9, 0.75, 0.9);
// ribbonColors[8]  = vec3(0.95, 0.9, 0.65);
// ribbonColors[9]  = vec3(0.65, 0.9, 0.75);
// ribbonColors[10] = vec3(0.85, 0.75, 0.9);
// ribbonColors[11] = vec3(0.95, 0.85, 0.95);

// ribbonColors[0]  = vec3(1.0, 0.0, 0.5);
// ribbonColors[1]  = vec3(0.0, 1.0, 0.7);
// ribbonColors[2]  = vec3(0.9, 1.0, 0.0);
// ribbonColors[3]  = vec3(0.0, 0.5, 1.0);
// ribbonColors[4]  = vec3(0.95, 0.4, 0.95);
// ribbonColors[5]  = vec3(0.2, 1.0, 0.9);
// ribbonColors[6]  = vec3(1.0, 0.3, 0.1);
// ribbonColors[7]  = vec3(0.1, 0.9, 1.0);
// ribbonColors[8]  = vec3(0.95, 0.95, 0.2);
// ribbonColors[9]  = vec3(0.6, 0.2, 1.0);
// ribbonColors[10] = vec3(0.0, 1.0, 0.3);
// ribbonColors[11] = vec3(1.0, 0.5, 0.0);

// ribbonColors[0]  = vec3(0.35, 0.25, 0.2);
// ribbonColors[1]  = vec3(0.45, 0.3, 0.25);
// ribbonColors[2]  = vec3(0.55, 0.35, 0.2);
// ribbonColors[3]  = vec3(0.65, 0.45, 0.25);
// ribbonColors[4]  = vec3(0.75, 0.55, 0.35);
// ribbonColors[5]  = vec3(0.5, 0.6, 0.3);
// ribbonColors[6]  = vec3(0.4, 0.55, 0.25);
// ribbonColors[7]  = vec3(0.3, 0.5, 0.2);
// ribbonColors[8]  = vec3(0.25, 0.45, 0.25);
// ribbonColors[9]  = vec3(0.2, 0.35, 0.2);
// ribbonColors[10] = vec3(0.15, 0.25, 0.15);
// ribbonColors[11] = vec3(0.1, 0.2, 0.1);

// vec3 ribbonColors[30];
// ribbonColors[0]  = vec3(0.10, 0.07, 0.05);
// ribbonColors[1]  = vec3(0.15, 0.10, 0.07);
// ribbonColors[2]  = vec3(0.20, 0.12, 0.08);
// ribbonColors[3]  = vec3(0.25, 0.15, 0.10);
// ribbonColors[4]  = vec3(0.30, 0.18, 0.12);
// ribbonColors[5]  = vec3(0.35, 0.22, 0.15);
// ribbonColors[6]  = vec3(0.40, 0.26, 0.18);
// ribbonColors[7]  = vec3(0.45, 0.30, 0.20);
// ribbonColors[8]  = vec3(0.50, 0.35, 0.22);
// ribbonColors[9]  = vec3(0.55, 0.40, 0.25);
// ribbonColors[10] = vec3(0.60, 0.45, 0.28);
// ribbonColors[11] = vec3(0.65, 0.50, 0.30);
// ribbonColors[12] = vec3(0.70, 0.55, 0.32);
// ribbonColors[13] = vec3(0.75, 0.60, 0.35);
// ribbonColors[14] = vec3(0.80, 0.65, 0.38);
// ribbonColors[15] = vec3(0.60, 0.55, 0.30);
// ribbonColors[16] = vec3(0.55, 0.60, 0.28);
// ribbonColors[17] = vec3(0.50, 0.65, 0.25);
// ribbonColors[18] = vec3(0.45, 0.70, 0.22);
// ribbonColors[19] = vec3(0.40, 0.75, 0.20);
// ribbonColors[20] = vec3(0.35, 0.70, 0.22);
// ribbonColors[21] = vec3(0.30, 0.65, 0.25);
// ribbonColors[22] = vec3(0.25, 0.60, 0.28);
// ribbonColors[23] = vec3(0.20, 0.55, 0.30);
// ribbonColors[24] = vec3(0.18, 0.50, 0.28);
// ribbonColors[25] = vec3(0.15, 0.45, 0.25);
// ribbonColors[26] = vec3(0.12, 0.40, 0.22);
// ribbonColors[27] = vec3(0.10, 0.35, 0.20);
// ribbonColors[28] = vec3(0.08, 0.30, 0.18);
// ribbonColors[29] = vec3(0.05, 0.25, 0.15);

// vec3 ribbonColors[50];
// ribbonColors[0]  = vec3(0.08, 0.05, 0.03);
// ribbonColors[1]  = vec3(0.10, 0.06, 0.04);
// ribbonColors[2]  = vec3(0.12, 0.07, 0.05);
// ribbonColors[3]  = vec3(0.14, 0.08, 0.06);
// ribbonColors[4]  = vec3(0.16, 0.09, 0.07);
// ribbonColors[5]  = vec3(0.18, 0.10, 0.08);
// ribbonColors[6]  = vec3(0.20, 0.12, 0.09);
// ribbonColors[7]  = vec3(0.22, 0.14, 0.10);
// ribbonColors[8]  = vec3(0.24, 0.16, 0.11);
// ribbonColors[9]  = vec3(0.26, 0.18, 0.12);
// ribbonColors[10] = vec3(0.28, 0.20, 0.13);
// ribbonColors[11] = vec3(0.30, 0.22, 0.14);
// ribbonColors[12] = vec3(0.32, 0.24, 0.15);
// ribbonColors[13] = vec3(0.34, 0.26, 0.16);
// ribbonColors[14] = vec3(0.36, 0.28, 0.17);
// ribbonColors[15] = vec3(0.38, 0.30, 0.18);
// ribbonColors[16] = vec3(0.40, 0.32, 0.19);
// ribbonColors[17] = vec3(0.42, 0.34, 0.20);
// ribbonColors[18] = vec3(0.44, 0.36, 0.21);
// ribbonColors[19] = vec3(0.46, 0.38, 0.22);
// ribbonColors[20] = vec3(0.48, 0.40, 0.23);
// ribbonColors[21] = vec3(0.50, 0.42, 0.24);
// ribbonColors[22] = vec3(0.52, 0.44, 0.25);
// ribbonColors[23] = vec3(0.54, 0.46, 0.26);
// ribbonColors[24] = vec3(0.56, 0.48, 0.27);
// ribbonColors[25] = vec3(0.58, 0.50, 0.28);
// ribbonColors[26] = vec3(0.50, 0.55, 0.30);
// ribbonColors[27] = vec3(0.48, 0.58, 0.28);
// ribbonColors[28] = vec3(0.46, 0.60, 0.26);
// ribbonColors[29] = vec3(0.44, 0.62, 0.24);
// ribbonColors[30] = vec3(0.42, 0.64, 0.22);
// ribbonColors[31] = vec3(0.40, 0.66, 0.20);
// ribbonColors[32] = vec3(0.38, 0.68, 0.19);
// ribbonColors[33] = vec3(0.36, 0.70, 0.18);
// ribbonColors[34] = vec3(0.34, 0.72, 0.17);
// ribbonColors[35] = vec3(0.32, 0.74, 0.16);
// ribbonColors[36] = vec3(0.30, 0.76, 0.15);
// ribbonColors[37] = vec3(0.28, 0.78, 0.14);
// ribbonColors[38] = vec3(0.26, 0.80, 0.13);
// ribbonColors[39] = vec3(0.24, 0.78, 0.14);
// ribbonColors[40] = vec3(0.22, 0.76, 0.15);
// ribbonColors[41] = vec3(0.20, 0.74, 0.16);
// ribbonColors[42] = vec3(0.18, 0.72, 0.17);
// ribbonColors[43] = vec3(0.16, 0.70, 0.18);
// ribbonColors[44] = vec3(0.14, 0.68, 0.19);
// ribbonColors[45] = vec3(0.12, 0.66, 0.20);
// ribbonColors[46] = vec3(0.10, 0.64, 0.21);
// ribbonColors[47] = vec3(0.09, 0.62, 0.22);
// ribbonColors[48] = vec3(0.08, 0.60, 0.23);
// ribbonColors[49] = vec3(0.07, 0.58, 0.24);


// vec3 ribbonColors[50];
// ribbonColors[0]  = vec3(0.05, 0.00, 0.10);  // viola scurissimo
// ribbonColors[1]  = vec3(0.10, 0.00, 0.20);
// ribbonColors[2]  = vec3(0.15, 0.00, 0.30);
// ribbonColors[3]  = vec3(0.20, 0.00, 0.40);
// ribbonColors[4]  = vec3(0.25, 0.00, 0.50);
// ribbonColors[5]  = vec3(0.35, 0.00, 0.55);
// ribbonColors[6]  = vec3(0.45, 0.00, 0.60);
// ribbonColors[7]  = vec3(0.55, 0.00, 0.65);
// ribbonColors[8]  = vec3(0.65, 0.00, 0.70);
// ribbonColors[9]  = vec3(0.75, 0.00, 0.65);
// ribbonColors[10] = vec3(0.85, 0.05, 0.55);
// ribbonColors[11] = vec3(0.90, 0.10, 0.45);
// ribbonColors[12] = vec3(0.95, 0.15, 0.35);
// ribbonColors[13] = vec3(0.95, 0.20, 0.25);
// ribbonColors[14] = vec3(0.95, 0.25, 0.20);
// ribbonColors[15] = vec3(0.95, 0.30, 0.15);
// ribbonColors[16] = vec3(0.95, 0.35, 0.10);
// ribbonColors[17] = vec3(0.95, 0.40, 0.08);
// ribbonColors[18] = vec3(0.95, 0.45, 0.06);
// ribbonColors[19] = vec3(0.95, 0.50, 0.05);
// ribbonColors[20] = vec3(0.95, 0.55, 0.05);
// ribbonColors[21] = vec3(0.95, 0.60, 0.05);
// ribbonColors[22] = vec3(0.95, 0.65, 0.08);
// ribbonColors[23] = vec3(0.95, 0.70, 0.12);
// ribbonColors[24] = vec3(0.95, 0.75, 0.18);
// ribbonColors[25] = vec3(0.95, 0.80, 0.25);
// ribbonColors[26] = vec3(0.95, 0.82, 0.32);
// ribbonColors[27] = vec3(0.95, 0.84, 0.40);
// ribbonColors[28] = vec3(0.95, 0.86, 0.48);
// ribbonColors[29] = vec3(0.95, 0.88, 0.55);
// ribbonColors[30] = vec3(0.95, 0.90, 0.62);
// ribbonColors[31] = vec3(0.95, 0.92, 0.70);
// ribbonColors[32] = vec3(0.95, 0.93, 0.75);
// ribbonColors[33] = vec3(0.90, 0.88, 0.70);
// ribbonColors[34] = vec3(0.85, 0.82, 0.65);
// ribbonColors[35] = vec3(0.80, 0.75, 0.60);
// ribbonColors[36] = vec3(0.70, 0.65, 0.50);
// ribbonColors[37] = vec3(0.60, 0.55, 0.40);
// ribbonColors[38] = vec3(0.50, 0.45, 0.30);
// ribbonColors[39] = vec3(0.40, 0.35, 0.20);
// ribbonColors[40] = vec3(0.30, 0.25, 0.15);
// ribbonColors[41] = vec3(0.25, 0.20, 0.12);
// ribbonColors[42] = vec3(0.20, 0.15, 0.10);
// ribbonColors[43] = vec3(0.18, 0.12, 0.08);
// ribbonColors[44] = vec3(0.16, 0.10, 0.07);
// ribbonColors[45] = vec3(0.14, 0.08, 0.06);
// ribbonColors[46] = vec3(0.12, 0.06, 0.05);
// ribbonColors[47] = vec3(0.10, 0.05, 0.04);
// ribbonColors[48] = vec3(0.08, 0.04, 0.03);
// ribbonColors[49] = vec3(0.06, 0.03, 0.02);  // marrone/nero finale

vec3 ribbonColors[50];
ribbonColors[0]  = vec3(0.00, 0.95, 1.00);
ribbonColors[1]  = vec3(0.95, 0.00, 0.60);
ribbonColors[2]  = vec3(0.70, 1.00, 0.00);
ribbonColors[3]  = vec3(0.40, 0.00, 0.85);
ribbonColors[4]  = vec3(1.00, 0.95, 0.00);
ribbonColors[5]  = vec3(0.00, 0.30, 1.00);
ribbonColors[6]  = vec3(1.00, 0.20, 0.70);
ribbonColors[7]  = vec3(0.00, 0.75, 0.70);
ribbonColors[8]  = vec3(1.00, 0.55, 0.00);
ribbonColors[9]  = vec3(0.00, 0.60, 1.00);
ribbonColors[10] = vec3(0.60, 1.00, 0.10);
ribbonColors[11] = vec3(0.95, 0.00, 0.85);
ribbonColors[12] = vec3(1.00, 0.80, 0.10);
ribbonColors[13] = vec3(0.05, 0.05, 0.70);
ribbonColors[14] = vec3(0.65, 1.00, 0.85);
ribbonColors[15] = vec3(0.85, 0.00, 0.20);
ribbonColors[16] = vec3(1.00, 0.70, 0.55);
ribbonColors[17] = vec3(0.15, 0.00, 0.45);
ribbonColors[18] = vec3(0.00, 0.85, 0.75);
ribbonColors[19] = vec3(1.00, 0.35, 0.00);
ribbonColors[20] = vec3(0.80, 1.00, 0.00);
ribbonColors[21] = vec3(0.40, 0.00, 0.60);
ribbonColors[22] = vec3(1.00, 1.00, 0.40);
ribbonColors[23] = vec3(0.00, 0.15, 0.60);
ribbonColors[24] = vec3(1.00, 0.00, 0.65);
ribbonColors[25] = vec3(0.10, 0.75, 0.50);
ribbonColors[26] = vec3(1.00, 0.55, 0.20);
ribbonColors[27] = vec3(0.00, 0.55, 0.90);
ribbonColors[28] = vec3(0.00, 1.00, 0.60);
ribbonColors[29] = vec3(0.60, 0.30, 0.85);
ribbonColors[30] = vec3(1.00, 0.70, 0.00);
ribbonColors[31] = vec3(0.05, 0.25, 0.85);
ribbonColors[32] = vec3(1.00, 0.45, 0.40);
ribbonColors[33] = vec3(0.00, 0.60, 0.70);
ribbonColors[34] = vec3(0.55, 1.00, 0.80);
ribbonColors[35] = vec3(0.55, 0.00, 0.25);
ribbonColors[36] = vec3(1.00, 0.90, 0.30);
ribbonColors[37] = vec3(0.00, 0.20, 0.35);
ribbonColors[38] = vec3(0.00, 1.00, 0.30);
ribbonColors[39] = vec3(0.70, 0.00, 0.70);
ribbonColors[40] = vec3(1.00, 0.70, 0.40);
ribbonColors[41] = vec3(0.00, 0.70, 1.00);
ribbonColors[42] = vec3(0.70, 1.00, 0.20);
ribbonColors[43] = vec3(0.85, 0.10, 0.60);
ribbonColors[44] = vec3(1.00, 0.85, 0.00);
ribbonColors[45] = vec3(0.00, 0.35, 0.95);
ribbonColors[46] = vec3(1.00, 0.50, 0.75);
ribbonColors[47] = vec3(0.00, 0.80, 0.55);
ribbonColors[48] = vec3(0.60, 0.00, 1.00);
ribbonColors[49] = vec3(0.10, 1.00, 0.40);




    
    // Loop per creare molti nastri
    for(int i = 0; i < 30; i++) {
        float fi = float(i);
        
        // Parametri modulati da funzioni sin per creare avvicinamento/allontanamento
        float sinWave = 1.0;//sin(time * 0.8) * 0.3 + 0.3; // oscillazione tra 0 e 1
        
        // Modula la spaziatura spaziale - da 0.008 a quasi 0
        float spatialSpacing = 0.008;//0.008 * (0.1 + 0.9 * sinWave);
        
        // Modula l'offset temporale - da 0.015 a quasi 0  
        float temporalOffset = 0.015;//0.015 * (0.1 + 0.9 * sinWave);
        
        // Variazione per ogni nastro modulata
        float variation = sin(fi * 0.17) * cos(fi * 0.23);

        
        float modulatedVariation = variation * (0.5 + 0.8 * sinWave);
        
        // Coordinate parametriche per ogni nastro
        float t = (uv.x + fi * spatialSpacing) * 6.0 - 3.0;
        
        // Posizione 3D del nastro con parametri modulati
        vec3 pos = ribbon3D(uv, t, time, fi * temporalOffset, modulatedVariation);
        
        // Proiezione nel piano XY
        vec2 proj = pos.xy;
        float dist = length(uv * 2.0 - vec2(0.0, 1.0) - proj);

            float sinWave2 = sin(time * 0.4) * 0.3 + 0.3; // oscillazione tra 0 e 1
        // Maschera per il nastro
        float mask = smoothstep(width + sinWave2, width - sinWave2 - 0.2, dist);
        
        if (mask > 0.1) {
            vec3 ribbonColor = ribbonColors[i % 50];
            
            // Normale
            float normalVariation = sin(pos.x * 10.0) * cos(pos.y * 8.0) * 0.3;
            vec3 normal = normalize(vec3(normalVariation, normalVariation * 0.5, 1.0));
            
            // Primo spotlight - sinistra
            vec3 spotlight1Pos = vec3(-0.5, 0.2, 0.8);
            vec3 lightDir1 = normalize(spotlight1Pos - pos);
            float lightDistance1 = length(spotlight1Pos - pos);
            float attenuation1 = 1.0 / (1.0 + lightDistance1 * 0.3);
            float spotIntensity1 = smoothstep(1.5, 0.3, lightDistance1);
            
            // Secondo spotlight - destra dove c'è più movimento
            vec3 spotlight2Pos = vec3(1.8, -0.1, 0.6);
            vec3 lightDir2 = normalize(spotlight2Pos - pos);
            float lightDistance2 = length(spotlight2Pos - pos);
            float attenuation2 = 1.0 / (1.0 + lightDistance2 * 0.3);
            float spotIntensity2 = smoothstep(1.5, 0.3, lightDistance2);
            
            // Diffuse per entrambe le luci
            float diffuse1 = max(dot(normal, lightDir1), 0.0);
            float diffuse2 = max(dot(normal, lightDir2), 0.0);
            
            // Specular per entrambe le luci
            vec3 viewDir = vec3(0.0, 0.0, 1.0);
            vec3 reflectDir1 = reflect(-lightDir1, normal);
            vec3 reflectDir2 = reflect(-lightDir2, normal);
            float specular1 = pow(max(dot(viewDir, reflectDir1), 0.0), 20.0);
            float specular2 = pow(max(dot(viewDir, reflectDir2), 0.0), 20.0);
            
            // Effetti spotlight
            float lightEffect1 = attenuation1 * spotIntensity1;
            float lightEffect2 = attenuation2 * spotIntensity2;
            
            // Colore finale con entrambi gli spotlight
            vec3 finalColor = ribbonColor * 0.4; // luce ambiente
            
            // Primo spotlight (più caldo)
            finalColor += ribbonColor * diffuse1 * lightEffect1 * 1.2;
            finalColor += vec3(1.0, 0.95, 0.8) * specular1 * lightEffect1 * 0.8;
            
            // Secondo spotlight (più freddo)
            finalColor += ribbonColor * diffuse2 * lightEffect2 * 1.0;
            finalColor += vec3(0.8, 0.9, 1.0) * specular2 * lightEffect2 * 0.7;
            
            color = finalColor;
        }
    }
    
    gl_FragColor = vec4(color, 1.0);
}