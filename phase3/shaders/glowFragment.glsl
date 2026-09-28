uniform float uTime;
uniform vec3 uGlowColor;        // Warm amber / golden core
uniform float uGlowIntensity;   // Aura intensity multiplier
uniform float uFlameFlicker;    // Realtime flicker
uniform float uExtinguish;      // Fade out on extinguish

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    // Distance from center (0.0 to 1.0)
    vec2 center = vUv - vec2(0.5);
    float dist = length(center) * 2.0;

    if (dist > 1.0) discard;

    // Multi-tier radial Gaussian-like falloff
    float coreGlow = pow(clamp(1.0 - dist, 0.0, 1.0), 3.5);
    float softAura = pow(clamp(1.0 - dist, 0.0, 1.0), 1.6) * 0.4;
    float combined = coreGlow + softAura;

    // Subtle flicker pulsation
    float pulse = 0.9 + 0.15 * uFlameFlicker;
    float alpha = combined * uGlowIntensity * pulse * (1.0 - uExtinguish);

    // Warm radiant color
    vec3 col = uGlowColor * (1.2 + coreGlow * 1.5);

    gl_FragColor = vec4(col, alpha);
}
