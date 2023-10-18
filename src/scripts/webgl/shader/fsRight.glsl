precision mediump float;

uniform sampler2D tImage;

varying vec2 vUv;

void main() {
  vec4 tex = texture2D(tImage, vUv);
  float a = step(0.1, dot(vec3(1), tex.rgb));
  gl_FragColor = vec4(tex.rgb, a);
}