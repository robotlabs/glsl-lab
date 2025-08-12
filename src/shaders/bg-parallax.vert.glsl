precision highp float;

uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0); // full-screen quad
}
