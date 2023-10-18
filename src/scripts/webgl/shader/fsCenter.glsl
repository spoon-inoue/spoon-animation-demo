precision mediump float;

uniform sampler2D tImage;
uniform vec2 uCoveredScale;

varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) * uCoveredScale + 0.5;
  vec4 tex = texture2D(tImage, uv);
  float a = step(0.1, dot(vec3(1), tex.rgb));
  gl_FragColor = vec4(tex.rgb, a);
}