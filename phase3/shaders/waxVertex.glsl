#include ./noise.glsl

uniform float uTime;
uniform float uMeltProgress;      // 0.0 (tall fresh candle) to 1.0 (melted stub)
uniform float uWaxDripIntensity;  // Drip displacement strength
uniform float uCandleHeight;      // Full height of candle

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying float vTopPoolMask;
varying float vDripFactor;

void main() {
    vUv = uv;
    vec3 pos = position;
    vec3 norm = normal;

    // Detect top cap: normal pointing upwards and near candle top
    float isTopCap = step(0.65, norm.y);
    float topDistFromCenter = length(pos.xz);

    // 1. PROCEDURAL MELT POOL DEPRESSION (Top Cap)
    // Carve a smooth concave molten wax basin around the wick
    if (isTopCap > 0.5) {
        float poolDip = smoothstep(1.0, 0.0, topDistFromCenter) * 0.18;
        pos.y -= poolDip;
        // Perturb normal slightly towards center for concave lighting
        norm.xz += normalize(pos.xz + 0.0001) * poolDip * 2.0;
        norm = normalize(norm);
    }
    vTopPoolMask = isTopCap * smoothstep(1.0, 0.2, topDistFromCenter);

    // 2. PROCEDURAL WAX DRIPS (Lateral cylinder surface)
    float angle = atan(pos.z, pos.x);
    // Normalized angle in [0, 1]
    float uAngle = (angle + 3.14159) / 6.28318;

    // Multi-frequency noise for organic wax drip tendrils running down
    float dripNoise = snoise2D(vec2(uAngle * 10.0, pos.y * 1.5 - 0.5));
    float dripMask = smoothstep(0.15, 0.8, dripNoise);
    // Drips form below the top rim and taper out near bottom
    float heightMask = smoothstep(uCandleHeight * 0.5, uCandleHeight * 0.3, pos.y) * smoothstep(-uCandleHeight * 0.5, -uCandleHeight * 0.3, pos.y);
    float dripDisplacement = dripMask * heightMask * uWaxDripIntensity;

    // Displace outward along lateral normal
    pos.xz += norm.xz * dripDisplacement;
    vDripFactor = dripMask * heightMask;

    // 3. CANDLE MELT PROGRESSION
    // Sinks the candle down and slightly bulges the base
    float meltSink = uMeltProgress * (uCandleHeight * 0.6);
    float topWeight = smoothstep(-uCandleHeight * 0.5, uCandleHeight * 0.5, pos.y);
    pos.y -= meltSink * topWeight;

    // Molten base pooling
    float baseBulge = (1.0 - topWeight) * uMeltProgress * 0.35;
    pos.xz += norm.xz * baseBulge;

    vLocalPos = pos;
    vNormal = normalize(normalMatrix * norm);
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
