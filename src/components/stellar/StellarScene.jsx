/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

const StellarScene = forwardRef(function StellarScene({ className = '' }, ref) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const composerRef = useRef(null);
  const starGroupRef = useRef(null);
  const starCoreRef = useRef(null);
  const auraRef = useRef(null);
  const flareRef = useRef({ lines: null, data: [] });
  const chargeRef = useRef(0); // seconds of fist hold (or normalized level)
  const chargeTimeRef = useRef(0);
  const chargeColorPhaseRef = useRef(0);
  const burstRef = useRef({ points: null, velocities: [], life: [] });
  const pulseRef = useRef({ active: false, t: 0, strength: 1 });
  const animRef = useRef(null);

  useImperativeHandle(ref, () => ({
    pulse(strength = 1) {
      const s = Math.max(0.5, Math.min(3, strength));
      pulseRef.current = { active: true, t: 0, strength: s };
      spawnBurst(s);
    },
    rotate(dx, dy) {
      const g = starGroupRef.current; if (!g) return;
      g.rotation.y += dx * 0.003;
      g.rotation.x += dy * 0.003;
    },
    setCharge(level = 0) {
      chargeRef.current = Math.max(0, level);
    }
  }), []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 2000);
    camera.position.set(0, 0, 140);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 1.2, 0.6, 0.85);
    const after = new AfterimagePass(0.85);
    composer.addPass(bloom);
    composer.addPass(after);
    composerRef.current = composer;

    // Star group
    const starGroup = new THREE.Group();
    scene.add(starGroup);
    starGroupRef.current = starGroup;

    // Core
    const coreGeom = new THREE.SphereGeometry(18, 48, 48);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.3, metalness: 0.2, roughness: 0.3 });
    const core = new THREE.Mesh(coreGeom, coreMat);
    starGroup.add(core);
    starCoreRef.current = core;

    // Stellar dust (points cloud)
    const pts = new Float32Array(4000 * 3);
    for (let i = 0; i < 4000; i++) {
      const r = 80 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pts[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pts[i * 3 + 1] = r * Math.cos(phi);
      pts[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0x00f5ff, size: 1.2, transparent: true, opacity: 0.8 });
    const dust = new THREE.Points(dustGeom, dustMat);
    starGroup.add(dust);

    // Star aura (sprite with radial gradient)
    const auraTex = makeRadialTexture('#ffffff');
    const auraMat = new THREE.SpriteMaterial({ map: auraTex, color: 0x88ddff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.45 });
    const aura = new THREE.Sprite(auraMat);
    aura.scale.setScalar(140);
    starGroup.add(aura);
    auraRef.current = aura;

    // Flare network (line segments radiating outward)
    const FLARE_COUNT = 80;
    const flarePositions = new Float32Array(FLARE_COUNT * 2 * 3);
    const flareData = [];
    for (let i = 0; i < FLARE_COUNT; i++) {
      // random direction
      const dir = new THREE.Vector3().randomDirection();
      const base = dir.clone().multiplyScalar(20);
      const maxLen = 120 + Math.random() * 60;
      // start at core surface
      flarePositions.set([base.x, base.y, base.z], i * 6);
      // end will be animated
      flarePositions.set([base.x, base.y, base.z], i * 6 + 3);
      flareData.push({ dir, base, maxLen, t: Math.random() * Math.PI });
    }
    const flareGeom = new THREE.BufferGeometry();
    flareGeom.setAttribute('position', new THREE.BufferAttribute(flarePositions, 3));
    const flareMat = new THREE.LineBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending });
    const flareLines = new THREE.LineSegments(flareGeom, flareMat);
    starGroup.add(flareLines);
    flareRef.current = { lines: flareLines, data: flareData };

    // Lights
    const a = new THREE.AmbientLight(0x404040, 1.6);
    scene.add(a);
    const p = new THREE.PointLight(0xffffff, 2.0, 500);
    scene.add(p);

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      // Idle rotation
      starGroup.rotation.y += 0.0008;

      // Charge shake + color shift
      if (chargeRef.current > 0) {
        chargeTimeRef.current += 0.02;
        chargeColorPhaseRef.current += 0.02;
        const c = Math.min(1.5, Math.pow(chargeRef.current, 1.2));
        // subtle shake scales with c
        const sx = Math.sin(chargeTimeRef.current * 12.0) * 0.2 * c;
        const sy = Math.cos(chargeTimeRef.current * 10.0) * 0.15 * c;
        starGroup.position.set(sx, sy, 0);
        // colorize core towards warm hues as charge grows
        if (starCoreRef.current) {
          const hue = THREE.MathUtils.lerp(0.6, 0.0, Math.min(1, c / 1.5)); // blue->red
          starCoreRef.current.material.emissive = new THREE.Color().setHSL(hue, 1.0, 0.5);
        }
        if (auraRef.current) {
          auraRef.current.material.color = new THREE.Color(0xff66aa);
        }
      } else {
        // ease back to center
        starGroup.position.multiplyScalar(0.92);
      }

      // Pulse anim
      if (pulseRef.current.active) {
        pulseRef.current.t += 0.04;
        const amp = 0.2 * (pulseRef.current.strength || 1);
        const s = 1 + Math.sin(pulseRef.current.t) * amp;
        core.scale.setScalar(s);
        if (auraRef.current) {
          const base = 0.35;
          const aamp = 0.2 * (pulseRef.current.strength || 1);
          auraRef.current.material.opacity = base + Math.sin(pulseRef.current.t) * aamp;
        }
        // extend flares with a wave
        updateFlares(true);
        if (pulseRef.current.t > Math.PI) {
          pulseRef.current = { active: false, t: 0 };
          core.scale.setScalar(1);
          if (auraRef.current) auraRef.current.material.opacity = 0.45;
          // restore core emissive after pulse if no charge
          if (starCoreRef.current && chargeRef.current <= 0) {
            starCoreRef.current.material.emissive.set(0xffffff);
          }
        }
      } else {
        updateFlares(false);
      }

      // Update burst particles
      updateBurst();

      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      composer.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%' }} />;

  function spawnBurst(strength) {
    const scene = sceneRef.current; if (!scene) return;
    // remove old
    if (burstRef.current.points) {
      scene.remove(burstRef.current.points);
      burstRef.current.points.geometry.dispose();
      burstRef.current.points.material.dispose();
      burstRef.current = { points: null, velocities: [], life: [] };
    }
    const N = Math.floor(300 * Math.min(3, strength));
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const vel = [];
    const life = [];
    for (let i = 0; i < N; i++) {
      pos[i * 3 + 0] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      const dir = new THREE.Vector3().randomDirection();
      const speed = 1.5 + Math.random() * 3.0 * strength;
      vel.push(dir.multiplyScalar(speed));
      life.push(1.0 + Math.random() * 1.5);
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffaa66, size: 2.2, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geom, mat);
    starGroupRef.current.add(points);
    burstRef.current = { points, velocities: vel, life };
  }

  function updateBurst() {
    const burst = burstRef.current; if (!burst.points) return;
    const dt = 0.016;
    const positions = burst.points.geometry.attributes.position.array;
    let alive = 0;
    for (let i = 0; i < burst.velocities.length; i++) {
      if (burst.life[i] <= 0) continue;
      alive++;
      const v = burst.velocities[i];
      positions[i * 3 + 0] += v.x * dt * 10;
      positions[i * 3 + 1] += v.y * dt * 10;
      positions[i * 3 + 2] += v.z * dt * 10;
      // fade
      burst.life[i] -= dt * 0.5;
    }
    burst.points.geometry.attributes.position.needsUpdate = true;
    burst.points.material.opacity *= 0.98;
    if (alive === 0 || burst.points.material.opacity < 0.02) {
      // cleanup
      const scene = sceneRef.current;
      starGroupRef.current.remove(burst.points);
      burst.points.geometry.dispose();
      burst.points.material.dispose();
      burstRef.current = { points: null, velocities: [], life: [] };
    }
  }
  function makeRadialTexture(hex) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, hex + 'ff');
    g.addColorStop(0.4, hex + '88');
    g.addColorStop(1, hex + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,size,size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function updateFlares(pulsing) {
    const ref = flareRef.current; if (!ref.lines) return;
    const pos = ref.lines.geometry.attributes.position.array;
    for (let i = 0; i < ref.data.length; i++) {
      const d = ref.data[i];
      d.t += 0.02;
      const wave = pulsing ? (0.6 + 0.4 * Math.sin(d.t * 3.0)) : (0.4 + 0.3 * Math.sin(d.t));
      const len = d.base.length() + wave * d.maxLen;
      const end = d.dir.clone().multiplyScalar(len);
      // start stays at base
      pos[i * 6 + 0] = d.base.x;
      pos[i * 6 + 1] = d.base.y;
      pos[i * 6 + 2] = d.base.z;
      // end
      pos[i * 6 + 3] = end.x;
      pos[i * 6 + 4] = end.y;
      pos[i * 6 + 5] = end.z;
    }
    ref.lines.geometry.attributes.position.needsUpdate = true;
  }
});

export default StellarScene;
