"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * In-canvas film grain — a fullscreen clip-space quad drawn last over the cosmos
 * + moon (the canvas sits behind all page content, so this grains the backdrop).
 *
 * Deliberately NOT a DOM `mix-blend-mode` overlay: re-blending a fullscreen layer
 * over the animating canvas every frame cost ~15fps on the Intel GPU. And NOT the
 * old `fract(sin(dot(...)) * 43758)` hash with a growing time arg — on mediump
 * that overflowed and made the whole plane pulse. This uses `precision highp`, a
 * sin-free hash, screen-normalised coords, and a bounded (`mod`) time so the
 * animated argument can never grow large. Additive + faint so it reads as grain
 * over the near-black sky. Frozen (static) under reduced motion.
 */

const vert = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uOpacity;

  // sin-free hash, stable in highp (inputs kept small before the dot)
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy; // 0..1, resolution-independent
    float t = mod(uTime, 100.0);                // bounded → never overflows
    float n = hash(uv * 512.0 + t * 13.7);
    gl_FragColor = vec4(vec3(n) * uOpacity, 1.0);
  }
`;

export default function Grain({
  reduce,
  opacity = 0.022,
}: {
  reduce: boolean;
  opacity?: number;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uOpacity: { value: opacity },
    }),
    [opacity],
  );

  useFrame((state) => {
    // Mutate THROUGH the material ref's .current — the React-19-lint-safe hatch.
    const m = matRef.current;
    if (!m) return;
    const dpr = state.viewport.dpr;
    m.uniforms.uResolution.value.set(
      state.size.width * dpr,
      state.size.height * dpr,
    );
    if (!reduce) m.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh frustumCulled={false} renderOrder={999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
