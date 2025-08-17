// Terrain Landscape - Fragment Shader
precision highp float;

uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

const float PI = 3.141592653589793;

// Utility Functions
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

// SDF functions for shapes
float sdf_circle(vec2 p, float r) {
    return length(p) - r;
}

float sdf_box(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdf_triangle(vec2 p, vec2 a, vec2 b, vec2 c) {
    vec2 e0 = b - a;
    vec2 e1 = c - b; 
    vec2 e2 = a - c;
    
    vec2 v0 = p - a;
    vec2 v1 = p - b;
    vec2 v2 = p - c;
    
    vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
    vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
    vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
    
    float s = sign(e0.x * e2.y - e0.y * e2.x);
    vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)),
                     vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))),
                     vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
    
    return -sqrt(d.x) * sign(d.y);
}

// Continuous terrain generation
float get_terrain_height(float x, int layer) {
    float height = 0.0;
    
    if (layer == 0) { // Background mountains
        height = 0.4 + fbm(vec2(x * 0.8, 0.0)) * 0.5;
        height += fbm(vec2(x * 2.0, 10.0)) * 0.1;
    } else if (layer == 1) { // Mid mountains  
        height = 0.25 + fbm(vec2(x * 1.2, 20.0)) * 0.4;
        height += fbm(vec2(x * 3.0, 30.0)) * 0.08;
    } else { // Foreground hills
        height = 0.15 + fbm(vec2(x * 1.8, 40.0)) * 0.25;
        height += fbm(vec2(x * 4.0, 50.0)) * 0.05;
    }
    
    return height;
}

// Generate celestial objects
vec3 generate_sky_objects(vec2 st, float u_time) {
    vec3 color = vec3(0.0);
    
    // Main celestial body (moves slowly)
    vec2 main_pos = vec2(
        0.2 + 0.6 * sin(u_time * 0.02),
        0.75 + 0.15 * cos(u_time * 0.015)
    );
    float main_size = 0.08;
    
    // Main body
    if (sdf_circle(st - main_pos, main_size) < 0.0) {
        color = vec3(0.0);
        
        // Add surface details
        vec2 crater1 = main_pos + vec2(0.025, 0.02);
        if (sdf_circle(st - crater1, main_size * 0.25) < 0.0) {
            color = vec3(0.88);
        }
        
        vec2 crater2 = main_pos + vec2(-0.02, 0.03);
        if (sdf_circle(st - crater2, main_size * 0.15) < 0.0) {
            color = vec3(0.88);
        }
    }
    
    // Rings (if it's a planet)
    if (sin(u_time * 0.01) > 0.0) {
        float ring_dist = length(st - main_pos);
        float ring_angle = atan(st.y - main_pos.y, st.x - main_pos.x);
        float ring_thickness = 0.005 * (1.0 + 0.3 * sin(ring_angle * 8.0));
        
        if (ring_dist > main_size * 1.4 && ring_dist < main_size * 2.2) {
            if (abs(ring_dist - main_size * 1.8) < ring_thickness) {
                color = vec3(0.0);
            }
        }
    }
    
    // Smaller moon
    vec2 moon_pos = vec2(
        0.7 + 0.2 * cos(u_time * 0.03),
        0.6 + 0.1 * sin(u_time * 0.025)
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

// Generate complex structures within terrain
vec3 generate_terrain_details(vec2 st, float terrain_height, float world_x) {
    vec3 color = vec3(0.0);
    float depth_below = terrain_height - st.y;
    
    if (depth_below > 0.0) {
        // Cave systems
        float cave_noise = fbm(vec2(world_x * 3.0, st.y * 8.0));
        float cave_mask = fbm(vec2(world_x * 1.5, st.y * 4.0 + 100.0));
        
        if (cave_noise > 0.6 && cave_mask > 0.4 && depth_below > 0.05 && depth_below < 0.4) {
            color = vec3(0.88); // Light cave interior
            
            // Stalactites and stalagmites
            float spike_noise = noise(vec2(world_x * 12.0, st.y * 12.0));
            if (spike_noise > 0.8) {
                color = vec3(0.0); // Black spikes
            }
        }
        
        // Underground structures/ruins
        float structure_spacing = 0.6;
        float structure_id = floor(world_x / structure_spacing);
        float structure_x = fract(world_x / structure_spacing);
        float structure_seed = random(vec2(structure_id, 0.0));
        
        if (structure_seed > 0.75 && depth_below > 0.1 && depth_below < 0.35) {
            // Ancient pillars
            float pillar_x = 0.5;
            float pillar_width = 0.04;
            float pillar_height = 0.25;
            
            if (abs(structure_x - pillar_x) < pillar_width) {
                float pillar_y = terrain_height - pillar_height;
                if (st.y > pillar_y && st.y < terrain_height - 0.05) {
                    color = vec3(0.88);
                    
                    // Pillar segments
                    float segment = floor((terrain_height - st.y) * 8.0);
                    if (fract(segment * 0.5) < 0.1) {
                        color = vec3(0.0);
                    }
                }
            }
            
            // Arches
            vec2 arch_center = vec2(pillar_x, terrain_height - 0.12);
            float arch_outer = sdf_circle(st - arch_center, 0.08);
            float arch_inner = sdf_circle(st - arch_center, 0.05);
            
            if (arch_outer < 0.0 && arch_inner > 0.0 && st.y < terrain_height - 0.05) {
                color = vec3(0.88);
            }
        }
        
        // Geometric patterns in rock
        float pattern_scale = 15.0;
        float pattern_noise = noise(vec2(world_x * pattern_scale, st.y * pattern_scale));
        vec2 pattern_grid = floor(vec2(world_x * pattern_scale, st.y * pattern_scale));
        float pattern_seed = random(pattern_grid);
        
        if (pattern_seed > 0.9 && pattern_noise > 0.7) {
            vec2 cell_pos = fract(vec2(world_x * pattern_scale, st.y * pattern_scale));
            
            // Hexagonal cells
            vec2 hex_center = vec2(0.5);
            float hex_dist = length(cell_pos - hex_center);
            if (hex_dist > 0.3 && hex_dist < 0.4) {
                color = vec3(0.88);
            }
        }
        
        // Mineral veins
        float vein_noise = fbm(vec2(world_x * 8.0 + st.y * 2.0, st.y * 6.0));
        float vein_flow = fbm(vec2(world_x * 4.0, st.y * 10.0 + world_x * 2.0));
        
        if (vein_noise > 0.7 && vein_flow > 0.6) {
            color = vec3(0.88);
        }
        
        // Surface structures
        if (depth_below < 0.08) {
            float surface_structure = random(vec2(floor(world_x * 2.0), 0.0));
            float local_x = fract(world_x * 2.0);
            
            if (surface_structure > 0.8) {
                // Pyramids
                float pyramid_center = 0.5;
                float pyramid_width = 0.3;
                float pyramid_height = 0.15;
                
                float pyramid_dist = abs(local_x - pyramid_center);
                float pyramid_y = terrain_height - pyramid_height * (1.0 - pyramid_dist / pyramid_width);
                
                if (st.y > pyramid_y && st.y < terrain_height && pyramid_dist < pyramid_width) {
                    color = vec3(0.88);
                    
                    // Pyramid steps
                    float step_height = 0.02;
                    float step_level = floor((terrain_height - st.y) / step_height);
                    float step_width = pyramid_width * (1.0 - step_level * step_height / pyramid_height);
                    
                    if (pyramid_dist > step_width) {
                        color = vec3(0.0);
                    }
                }
            } else if (surface_structure > 0.7) {
                // Obelisks
                float obelisk_center = 0.5;
                float obelisk_width = 0.03;
                float obelisk_height = 0.12;
                
                if (abs(local_x - obelisk_center) < obelisk_width) {
                    if (st.y > terrain_height - obelisk_height && st.y < terrain_height) {
                        color = vec3(0.88);
                        
                        // Obelisk tip
                        float tip_factor = (terrain_height - st.y) / obelisk_height;
                        float tip_width = obelisk_width * (1.0 - tip_factor * 0.7);
                        if (abs(local_x - obelisk_center) > tip_width) {
                            color = vec3(0.0);
                        }
                    }
                }
            }
        }
    }
    
    return color;
}

void main() {
    vec2 st = vUv;
    st.x *= uResolution.x / uResolution.y;
    
    float scroll_speed = uTime * 0.1;
    float world_x = st.x + scroll_speed;
    
    // Sky gradient
    vec3 color = mix(
        vec3(0.85, 0.85, 0.87),
        vec3(0.78, 0.78, 0.82),
        smoothstep(0.0, 1.0, st.y)
    );
    
    // Add sky objects
    vec3 sky_objects = generate_sky_objects(st, uTime);
    if (length(sky_objects) > 0.1) {
        color = sky_objects;
    }
    
    // Generate continuous terrain layers
    float back_terrain = get_terrain_height(world_x, 0);
    float mid_terrain = get_terrain_height(world_x, 1);
    float front_terrain = get_terrain_height(world_x, 2);
    
    // Render terrain from back to front
    if (st.y < back_terrain) {
        color = vec3(0.0);
    }
    
    if (st.y < mid_terrain) {
        color = vec3(0.0);
    }
    
    if (st.y < front_terrain) {
        color = vec3(0.0);
        
        // Add detailed structures within the terrain
        vec3 terrain_details = generate_terrain_details(st, front_terrain, world_x);
        if (length(terrain_details) > 0.1) {
            color = terrain_details;
        }
    }
    
    gl_FragColor = vec4(color, 1.0);
}