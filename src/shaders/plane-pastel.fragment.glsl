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

void main() {
    vec2 uv = vUv;
    float time = uTime * 0.3;
    
    vec3 color = vec3(0.96, 0.97, 0.98);
    float width = 0.25;
    
    // Definisci i colori per i nastri
    vec3 ribbonColors[8];
    ribbonColors[0] = vec3(0.15, 0.35, 0.85);  // blu scuro
    ribbonColors[1] = vec3(0.95, 0.85, 0.3);   // giallo
    ribbonColors[2] = vec3(0.25, 0.45, 0.9);   // blu medio
    ribbonColors[3] = vec3(0.75, 0.3, 0.85);   // viola
    ribbonColors[4] = vec3(0.35, 0.55, 0.95);  // blu chiaro
    ribbonColors[5] = vec3(0.9, 0.2, 0.3);     // rosso
    ribbonColors[6] = vec3(0.2, 0.8, 0.3);     // verde
    ribbonColors[7] = vec3(0.9, 0.6, 0.1);     // arancione
    
    // Loop per creare molti nastri
    for(int i = 0; i < 30; i++) {
        float fi = float(i);
        
        // Variazione per ogni nastro
        float variation = sin(fi * 0.17) * cos(fi * 0.23);
        
        // Coordinate parametriche per ogni nastro
        float t = (uv.x + fi * 0.008) * 6.0 - 3.0;
        
        // Posizione 3D del nastro con variazione
        vec3 pos = ribbon3D(uv, t, time, fi * 0.015, variation);
        
        // Proiezione nel piano XY
        vec2 proj = pos.xy;
        float dist = length(uv * 2.0 - vec2(0.0, 1.0) - proj);
        
        // Maschera per il nastro
        float mask = smoothstep(width + 0.5, width - 0.0, dist);
        
        if (mask > 0.1) {
            vec3 ribbonColor = ribbonColors[i % 8];
            
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