precision mediump float;

uniform sampler2D tOffscreen;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEye;

const vec3 LIGHT = normalize(vec3(1, 1, 0.3));

void main() {
  vec2 screenUv = gl_FragCoord.xy / uResolution;

  vec3 normal = normalize(vNormal);
  vec3 eye = normalize(vEye);

  float fresnel = pow(1.0 + dot(eye, normal), 3.0);

  vec2 refr = normal.xy * 0.02;
  vec2 aber = normal.xy * fresnel * 0.007;

  vec3 offscreen;
  offscreen.r = texture2D(tOffscreen, screenUv - refr - aber).r;
  offscreen.g = texture2D(tOffscreen, screenUv - refr).g;
  offscreen.b = texture2D(tOffscreen, screenUv - refr + aber).b;

  vec3 color = offscreen;
  color = mix(color, normal, fresnel * 0.1);
  color += fresnel * 0.5;

  vec3 refl = reflect(eye, normal);
  float speculer = dot(refl, LIGHT);
  speculer = clamp(pow(speculer, 5.0), 0.0, 1.0);
  color = mix(color, normal, speculer * 0.7);
  color += speculer * 0.7;

  gl_FragColor = vec4(color, 1.0);
}