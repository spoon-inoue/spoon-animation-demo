attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix; 
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEye;

void main() {
  vUv = uv;
  vNormal = normalMatrix * normal;
  vEye = (viewMatrix * modelMatrix * vec4( position, 1.0 )).xyz;

  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );
}