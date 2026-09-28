#include ./noise.glsl

uniform float uTime;
uniform float uSmokeSpeed;
uniform vec3 uWind;
uniform float uExtinguish;

varying vec2 vUv;
varying vec3 vWorldPos;
varying float vHeight;

void main() {
    vUv = uv;
    vec3 pos = position;

    float h = clamp(uv.y, 0.0, 1.0);
    vHeight = h;

    // Upward noise scroll
    vec3 noiseCoord = vec3(
        pos.x * 2.0 + uWind.x * 0.3,
        pos.y * 1.5 - uTime * uSmokeSpeed,
        pos.z * 2.0 + uWind.z * 0.3
    );

    // Lateral curling turbulence increases as smoke rises
    float curl = snoise3D(noiseCoord) * pow(h, 1.4) * 0.45;
    float curlZ = snoise3D(noiseCoord + 40.0) * pow(h, 1.4) * 0.45;

    pos.x += curl;
    pos.z += curlZ;

    // Wind pushes smoke horizontally
    pos += uWind * pow(h, 1.6) * 1.2;

    // Spread outward as smoke rises
    pos.x *= (1.0 + h * 0.8);
    pos.z *= (1.0 + h * 0.8);

    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
