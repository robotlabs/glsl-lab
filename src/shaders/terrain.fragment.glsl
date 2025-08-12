uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vPosition;

// ------------------ Utility ------------------
const float PI = 3.141592653589793;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// ------------------ SDF ------------------
float sdf_circle(vec2 p, float r) {
    return length(p) - r;
}

float sdf_box(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0);
}

// ------------------ Terrain height ------------------
float get_terrain_height(float x, int layer) {
    float height = 0.0;
    if (layer == 0) {
        height = 0.4 + fbm(vec2(x * 0.8, 0.0)) * 0.5;
        height += fbm(vec2(x * 2.0, 10.0)) * 0.1;
    } else if (layer == 1) {
        height = 0.25 + fbm(vec2(x * 1.2, 20.0)) * 0.4;
        height += fbm(vec2(x * 3.0, 30.0)) * 0.08;
    } else {
        height = 0.15 + fbm(vec2(x * 1.8, 40.0)) * 0.25;
        height += fbm(vec2(x * 4.0, 50.0)) * 0.05;
    }
    return height;
}

// ------------------ Sky objects ------------------
vec3 generate_sky_objects(vec2 st, float t) {
    vec3 color = vec3(0.0);
    vec2 main_pos = vec2(
        0.2 + 0.6 * sin(t * 0.02),
        0.75 + 0.15 * cos(t * 0.015)
    );
    float main_size = 0.08;

    if (sdf_circle(st - main_pos, main_size) < 0.0) {
        color = vec3(0.0);
        vec2 crater1 = main_pos + vec2(0.025, 0.02);
        if (sdf_circle(st - crater1, main_size * 0.25) < 0.0) color = vec3(0.88);
        vec2 crater2 = main_pos + vec2(-0.02, 0.03);
        if (sdf_circle(st - crater2, main_size * 0.15) < 0.0) color = vec3(0.88);
    }

    // Rings
    if (sin(t * 0.01) > 0.0) {
        float ring_dist = length(st - main_pos);
        float ring_angle = atan(st.y - main_pos.y, st.x - main_pos.x);
        float ring_thickness = 0.005 * (1.0 + 0.3 * sin(ring_angle * 8.0));
        if (ring_dist > main_size * 1.4 && ring_dist < main_size * 2.2) {
            if (abs(ring_dist - main_size * 1.8) < ring_thickness) {
                color = vec3(0.0);
            }
        }
    }

    // Moon
    vec2 moon_pos = vec2(
        0.7 + 0.2 * cos(t * 0.03),
        0.6 + 0.1 * sin(t * 0.025)
    );
    if (sdf_circle(st - moon_pos, 0.025) < 0.0) {
        color = vec3(0.0);
    }

    // Stars
    vec2 star_cell = floor(st * 25.0);
    float star_noise = random(star_cell);
    if (star_noise > 0.95 && st.y > 0.5) {
        vec2 star_pos = fract(st * 25.0);
        if (length(star_pos - vec2(0.5)) < 0.1) {
            color = vec3(0.0);
        }
    }
    return color;
}

// ------------------ Main ------------------
void main() {
    vec2 st = vUv;
    st.x *= uResolution.x / uResolution.y;

    float scroll_speed = uTime * 0.1;
    float world_x = st.x + scroll_speed;

    vec3 color = mix(
        vec3(0.85, 0.85, 0.87),
        vec3(0.78, 0.78, 0.82),
        smoothstep(0.0, 1.0, st.y)
    );

    vec3 sky_objects = generate_sky_objects(st, uTime);
    if (length(sky_objects) > 0.1) color = sky_objects;

    float back_terrain = get_terrain_height(world_x, 0);
    float mid_terrain = get_terrain_height(world_x, 1);
    float front_terrain = get_terrain_height(world_x, 2);

    if (st.y < back_terrain) color = vec3(0.0);
    if (st.y < mid_terrain) color = vec3(0.0);
    if (st.y < front_terrain) color = vec3(0.0);

    gl_FragColor = vec4(color, 1.0);
}
