#include ./noise.glsl

uniform float uTime;
uniform float uFlameFlicker;
uniform float uExtinguish;
uniform float uEmberGlow;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(-vPosition);

    // Fresnel rim on ember
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.0);

    // Charcoal noise texture
    float n = snoise3D(vPosition * 40.0 + uTime * 0.5);

    // Hot glowing core
    vec3 hotColor = vec3(1.0, 0.45, 0.08); // Hot orange
    vec3 coreColor = vec3(1.0, 0.9, 0.4);  // White hot
    vec3 coldColor = vec3(0.08, 0.04, 0.02); // Charred wick

    // Pulsing ember heat
    float pulse = 0.8 + 0.2 * sin(uTime * 10.0) * uFlameFlicker;
    float heat = clamp(uEmberGlow * pulse * (1.0 - uExtinguish * 0.7), 0.0, 1.0);

    vec3 emberCol = mix(coldColor, hotColor, heat);
    emberCol = mix(emberCol, coreColor, pow(heat, 3.0) * (0.5 + 0.5 * n));
    emberCol += hotColor * fresnel * heat * 1.5;

    gl_FragColor = vec4(emberCol * 2.2, 1.0);
}
