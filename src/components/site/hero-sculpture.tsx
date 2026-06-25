'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Arc Souk hero sculpture — a glossy porcelain archway (the brand glyph) on a
 * round plinth, with a floating gradient gem, a gold orbit ring and a small
 * "network" constellation. Brand rim-lighting, gentle float + auto-rotate,
 * subtle pointer parallax and a soft contact shadow. Pure three.js, no asset.
 */
export function HeroSculpture() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = mount.clientWidth || 400;
    let height = mount.clientHeight || 460;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    // ---- studio reflections (no external HDR) ----
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    // ---- lights: white key + brand-coloured rims ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(5, 8, 6); scene.add(key);
    const blue = new THREE.DirectionalLight(0x3b82f6, 1.5); blue.position.set(-6, 2, 3); scene.add(blue);
    const pink = new THREE.DirectionalLight(0xf05bc4, 1.25); pink.position.set(6, -1, 2.5); scene.add(pink);
    const cyan = new THREE.DirectionalLight(0x22d3ee, 0.9); cyan.position.set(0, 3, -5); scene.add(cyan);

    const piece = new THREE.Group();
    const OFFSET_Y = -1.4;
    piece.position.y = OFFSET_Y;
    scene.add(piece);

    // ---- porcelain material (shared by arch + plinth) ----
    const white = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#eef1fb'),
      metalness: 0.0, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.25, envMapIntensity: 1.0,
    });

    // ---- arch (frame band: legs + semicircular top) ----
    const W = 1.5, t = 0.44, Ls = 1.5;
    const Ro = W, Ri = W - t;
    const shape = new THREE.Shape();
    shape.moveTo(-W, 0);
    shape.lineTo(-W, Ls);
    shape.absarc(0, Ls, Ro, Math.PI, 0, true);
    shape.lineTo(W, 0);
    shape.lineTo(W - t, 0);
    shape.lineTo(W - t, Ls);
    shape.absarc(0, Ls, Ri, 0, Math.PI, false);
    shape.lineTo(-(W - t), 0);
    shape.lineTo(-W, 0);
    const archGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.5, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4, curveSegments: 64,
    });
    archGeo.translate(0, 0, -0.25);
    piece.add(new THREE.Mesh(archGeo, white));

    // ---- round plinth ----
    const baseGeo = new THREE.CylinderGeometry(1.7, 1.88, 0.28, 64);
    baseGeo.translate(0, -0.14, 0);
    piece.add(new THREE.Mesh(baseGeo, white));

    // ---- gradient gem (brand colours baked as vertex colours) ----
    const GEM_Y = 1.5;
    const gemGeo = new THREE.OctahedronGeometry(0.62, 0);
    gemGeo.computeVertexNormals();
    const posAttr = gemGeo.getAttribute('position');
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < posAttr.count; i++) { const y = posAttr.getY(i); if (y < minY) minY = y; if (y > maxY) maxY = y; }
    const cA = new THREE.Color('#0A5BFF'), cB = new THREE.Color('#7C5CFF'), cC = new THREE.Color('#F05BC4');
    const cols = new Float32Array(posAttr.count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < posAttr.count; i++) {
      const f = (posAttr.getY(i) - minY) / (maxY - minY || 1);
      if (f < 0.5) tmp.copy(cA).lerp(cB, f / 0.5); else tmp.copy(cB).lerp(cC, (f - 0.5) / 0.5);
      cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
    }
    gemGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const gemMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true, metalness: 0.3, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.12,
      iridescence: 0.7, iridescenceIOR: 1.3, envMapIntensity: 1.6,
    });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, GEM_Y, 0.55);
    piece.add(gem);

    // ---- gold orbit ring ----
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.98, 0.022, 16, 96),
      new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#E9B95F'), metalness: 1, roughness: 0.22, envMapIntensity: 1.3, clearcoat: 0.6 }),
    );
    ring.position.set(0, GEM_Y, 0.55);
    ring.rotation.x = Math.PI * 0.36;
    piece.add(ring);

    // ---- constellation "network" points ----
    const dotData: Array<[number, number, number, string]> = [
      [0.95, GEM_Y - 0.55, 0.7, '#22d3ee'],
      [1.5, GEM_Y - 1.15, 0.6, '#F05BC4'],
      [1.15, GEM_Y - 1.7, 0.65, '#7C5CFF'],
    ];
    const dotPositions: THREE.Vector3[] = [];
    for (const [x, y, z, c] of dotData) {
      const d = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 20, 20),
        new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c), emissiveIntensity: 1.4, roughness: 0.35, metalness: 0.1 }),
      );
      d.position.set(x, y, z);
      piece.add(d);
      dotPositions.push(d.position.clone());
    }
    const linePts = [new THREE.Vector3(0.35, GEM_Y - 0.2, 0.55), ...dotPositions];
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(linePts),
      new THREE.LineBasicMaterial({ color: '#9aa6d8', transparent: true, opacity: 0.5 }),
    );
    piece.add(line);

    // ---- soft contact shadow ----
    function makeRadialTexture() {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
      g.addColorStop(0, 'rgba(20,30,60,0.55)');
      g.addColorStop(0.55, 'rgba(20,30,60,0.20)');
      g.addColorStop(1, 'rgba(20,30,60,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    const shTex = makeRadialTexture();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshBasicMaterial({ map: shTex, transparent: true, opacity: 0.45, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = OFFSET_Y - 0.18;
    scene.add(shadow);

    // ---- pointer parallax ----
    let targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
    const onPointer = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      targetRY = Math.max(-1, Math.min(1, nx)) * 0.35;
      targetRX = Math.max(-1, Math.min(1, ny)) * 0.2;
    };
    window.addEventListener('pointermove', onPointer);

    // ---- animate ----
    const clock = new THREE.Clock();
    let elapsed = 0;
    let raf = 0;
    const render = () => {
      const dt = clock.getDelta();
      elapsed += dt;
      const t2 = elapsed;
      curRY += (targetRY - curRY) * 0.06;
      curRX += (targetRX - curRX) * 0.06;
      piece.rotation.y = Math.sin(t2 * 0.4) * 0.4 + curRY;
      piece.rotation.x = curRX * 0.6;
      piece.position.y = OFFSET_Y + Math.sin(t2 * 0.9) * 0.06;
      gem.rotation.y += dt * 0.6;
      gem.rotation.x = Math.sin(t2 * 0.5) * 0.18;
      gem.position.y = GEM_Y + Math.sin(t2 * 1.2) * 0.07;
      ring.position.y = gem.position.y;
      ring.rotation.z += dt * 0.5;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    if (reduce) renderer.render(scene, camera);
    else raf = requestAnimationFrame(render);

    // ---- resize ----
    const ro = new ResizeObserver(() => {
      width = mount.clientWidth || width;
      height = mount.clientHeight || height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    ro.observe(mount);

    // ---- cleanup ----
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      scene.traverse((o) => {
        const d = o as unknown as { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
        if (d.geometry) d.geometry.dispose();
        if (Array.isArray(d.material)) d.material.forEach((m) => m.dispose());
        else if (d.material) d.material.dispose();
      });
      shTex.dispose();
      envRT.texture.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden style={{ width: 'clamp(300px,82vw,440px)', height: 'clamp(380px,86vw,500px)' }} />;
}
