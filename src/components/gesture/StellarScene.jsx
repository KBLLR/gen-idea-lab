/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const NOISE_SHADER = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
`;

export default function StellarScene({ onTriggerPulse }) {
    const containerRef = useRef();
    const sceneRef = useRef();
    const composerRef = useRef();
    const pulseRef = useRef({ active: false, progress: 1.0, strength: 0 });
    const starGroupRef = useRef();
    const flareLinesRef = useRef([]);
    const timeRef = useRef(0);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(
            75,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            2000
        );
        camera.position.set(0, 0, 120);
        camera.lookAt(scene.position);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        // Post-processing
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(containerRef.current.clientWidth, containerRef.current.clientHeight),
            1.6,
            0.7,
            0.1
        );
        composer.addPass(bloomPass);
        composerRef.current = composer;

        // Create nebula
        const nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x21094e) },
                color2: { value: new THREE.Color(0xf9009a) }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;
                uniform float time;
                varying vec3 vWorldPosition;
                ${NOISE_SHADER}
                void main() {
                    float f = 0.0;
                    vec3 p = vWorldPosition * 0.01;
                    f += 0.50 * snoise(p + time * 0.1);
                    f += 0.25 * snoise(p * 2.0 + time * 0.2);
                    f += 0.125 * snoise(p * 5.0 + time * 0.4);
                    f = pow(f, 2.0);
                    vec3 color = mix(color1, color2, smoothstep(0.0, 1.0, f));
                    gl_FragColor = vec4(color, f * 0.6);
                }
            `,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const nebula = new THREE.Mesh(new THREE.SphereGeometry(1000, 64, 64), nebulaMaterial);
        scene.add(nebula);

        // Create star core
        const starGroup = new THREE.Group();
        starGroupRef.current = starGroup;
        scene.add(starGroup);

        const starShape = createStarShape(25, 12, 5);
        const starGeometry = new THREE.ExtrudeGeometry(starShape, {
            depth: 8,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 2,
            bevelSize: 1,
            bevelThickness: 1
        });
        starGeometry.center();

        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pulse: { value: 0 },
                color: { value: new THREE.Color(0xffffff) }
            },
            vertexShader: `
                uniform float time;
                uniform float pulse;
                varying float vNoise;
                ${NOISE_SHADER}
                void main() {
                    float displacement = snoise(position * 0.1 + time * 0.5) * 3.0;
                    displacement += snoise(position * 0.5 + time) * 1.5;
                    vNoise = snoise(position * 2.0 + time * 2.0);
                    vec3 newPosition = position + normal * (displacement + vNoise * (2.0 + pulse * 8.0));
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float pulse;
                uniform vec3 color;
                varying float vNoise;
                void main() {
                    float intensity = pow(0.6 - abs(vNoise), 2.0);
                    gl_FragColor = vec4(color, 1.0) * intensity + vec4(1.0, 1.0, 1.0, 1.0) * pulse * intensity * 2.0;
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        const starCore = new THREE.Mesh(starGeometry, starMaterial);
        starGroup.add(starCore);

        // Create flare network
        const flareLines = [];
        const NUM_ENDPOINTS = 18;
        for (let i = 0; i < NUM_ENDPOINTS; i++) {
            const phi = Math.acos(-1 + (2 * i) / NUM_ENDPOINTS);
            const theta = Math.sqrt(NUM_ENDPOINTS * Math.PI) * phi;
            const r = 65 + Math.random() * 45;
            const endPoint = new THREE.Vector3(
                r * Math.cos(theta) * Math.sin(phi),
                r * Math.sin(theta) * Math.sin(phi),
                r * Math.cos(phi)
            );

            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3()
                    .lerpVectors(new THREE.Vector3(0, 0, 0), endPoint, 0.5)
                    .add(new THREE.Vector3(
                        (Math.random() - 0.5) * 40,
                        (Math.random() - 0.5) * 40,
                        (Math.random() - 0.5) * 40
                    )),
                endPoint
            );

            const lineMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    pulse: { value: 0 },
                    color: { value: new THREE.Color(0x00f5ff) }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float pulse;
                    uniform vec3 color;
                    varying vec2 vUv;
                    void main() {
                        float intensity1 = pow(1.0 - abs(vUv.x - pulse), 30.0);
                        float intensity2 = pow(1.0 - abs(vUv.x - pulse * 1.3), 20.0) * 0.4;
                        float totalIntensity = intensity1 + intensity2;
                        vec3 fireColor = mix(color, vec3(1.0, 1.0, 1.0), intensity1 * 1.5);
                        gl_FragColor = vec4(fireColor, totalIntensity * 3.5);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const geometry = new THREE.TubeGeometry(curve, 32, 0.15, 8, false);
            const line = new THREE.Mesh(geometry, lineMaterial);
            line.visible = false;
            flareLines.push(line);
            starGroup.add(line);
        }
        flareLinesRef.current = flareLines;

        // Create stellar dust
        const dustGeo = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 1200; i++) {
            const p = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize().multiplyScalar(30 + Math.random() * 220);
            vertices.push(p.x, p.y, p.z);
        }
        dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const dustMat = new THREE.PointsMaterial({
            size: 0.6,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            color: 0x00ffaa
        });
        const stellarDust = new THREE.Points(dustGeo, dustMat);
        scene.add(stellarDust);

        // Animation loop
        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            timeRef.current += 0.01;

            nebulaMaterial.uniforms.time.value = timeRef.current;
            starMaterial.uniforms.time.value = timeRef.current;

            // Update pulse
            if (pulseRef.current.active) {
                pulseRef.current.progress += 0.02;
                if (pulseRef.current.progress >= 1.0) {
                    pulseRef.current.active = false;
                    pulseRef.current.progress = 1.0;
                }
            }
            pulseRef.current.strength = Math.sin(pulseRef.current.progress * Math.PI);

            starMaterial.uniforms.pulse.value = pulseRef.current.strength;

            flareLinesRef.current.forEach(line => {
                line.visible = pulseRef.current.active;
                if (line.visible) {
                    line.material.uniforms.pulse.value = pulseRef.current.progress;
                }
            });

            // Update dust
            const positions = stellarDust.geometry.attributes.position;
            const corePos = starGroup.position;
            for (let i = 0; i < positions.count; i++) {
                const p = new THREE.Vector3().fromBufferAttribute(positions, i);
                const direction = p.clone().sub(corePos).normalize();
                p.add(direction.multiplyScalar(0.1 + Math.random() * 0.2));

                if (p.distanceTo(corePos) > 250) {
                    const resetVector = new THREE.Vector3(
                        Math.random() - 0.5,
                        Math.random() - 0.5,
                        Math.random() - 0.5
                    ).normalize().multiplyScalar(30 + Math.random() * 10);
                    p.copy(corePos).add(resetVector);
                }
                positions.setXYZ(i, p.x, p.y, p.z);
            }
            positions.needsUpdate = true;

            composer.render();
        };

        animate();

        // Handle resize
        const handleResize = () => {
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            composer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            renderer.dispose();
            containerRef.current?.removeChild(renderer.domElement);
        };
    }, []);

    // Trigger pulse from parent
    useEffect(() => {
        if (onTriggerPulse) {
            const trigger = () => {
                if (!pulseRef.current.active) {
                    pulseRef.current.active = true;
                    pulseRef.current.progress = 0;
                }
            };
            onTriggerPulse.current = trigger;
        }
    }, [onTriggerPulse]);

    // Move star group
    useEffect(() => {
        window.moveStar = (deltaX, deltaY) => {
            if (starGroupRef.current) {
                starGroupRef.current.position.x += deltaX * 150;
                starGroupRef.current.position.y -= deltaY * 150;
            }
        };
        return () => {
            delete window.moveStar;
        };
    }, []);

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

function createStarShape(outerRadius, innerRadius, numPoints) {
    const shape = new THREE.Shape();
    const angle = (Math.PI * 2) / (numPoints * 2);
    shape.moveTo(outerRadius, 0);
    for (let i = 1; i < numPoints * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle * i) * r;
        const y = Math.sin(angle * i) * r;
        shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
}
