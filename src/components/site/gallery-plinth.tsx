'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Arc Souk hero — a hand-cast gypsum sculpture on a gallery plinth.
 *
 * A polished, brand-lit art object slowly turns on a museum pedestal under a
 * soft spotlight: a cast shadow falls on the plinth, a contact shadow grounds
 * it on the floor, and a faint brand halo sits behind. Gentle float + auto
 * turntable + subtle pointer parallax. Pure three.js — no external assets.
 */
export function GalleryPlinth() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = mount.clientWidth || 400;
    let height = mount.clientHeight || 500;

    // ---- renderer ----
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, width / height, 0.1, 100);
    camera.position.set(0, 0.55, 7.6);
    camera.lookAt(0, 0.1, 0);

    // ---- studio reflections (no external HDR) ----
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    // ---- lights: gallery spotlight (white key, casts shadow) + brand rims ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.38));

    const spot = new THREE.SpotLight(0xffffff, 90, 24, 0.6, 0.6, 1.2);
    spot.position.set(2.6, 7.2, 4.4);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.camera.near = 1;
    spot.shadow.camera.far = 20;
    spot.shadow.bias = -0.0002;
    spot.shadow.radius = 6;
    scene.add(spot);

    const blue = new THREE.DirectionalLight(0x3b82f6, 1.45); blue.position.set(-6, 2.5, 3); scene.add(blue);
    const pink = new THREE.DirectionalLight(0xf05bc4, 1.2); pink.position.set(6, -0.5, 2.5); scene.add(pink);
    const cyan = new THREE.DirectionalLight(0x22d3ee, 0.85); cyan.position.set(-1, 3, -5); scene.add(cyan);

    // ---- group (everything that floats / parallaxes together) ----
    const piece = new THREE.Group();
    const OFFSET_Y = -0.85;
    piece.position.y = OFFSET_Y;
    scene.add(piece);
    spot.target = piece;

    // ---- plinth (tapered display pedestal) ----
    const PLINTH_TOP = 0; // local y of the plinth's top surface
    const PLINTH_H = 2.55;
    const plinthMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#e9edf7'),
      metalness: 0.0, roughness: 0.85, clearcoat: 0.15, clearcoatRoughness: 0.6, envMapIntensity: 0.55,
    });
    const plinthGeo = new THREE.CylinderGeometry(1.04, 1.2, PLINTH_H, 72);
    plinthGeo.translate(0, PLINTH_TOP - PLINTH_H / 2, 0);
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.receiveShadow = true;
    plinth.castShadow = true;
    piece.add(plinth);

    // subtle top-edge ring so the rim reads crisply
    const edge = new THREE.Mesh(
      new THREE.TorusGeometry(1.04, 0.018, 14, 80),
      new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#d3dbee'), metalness: 0.2, roughness: 0.6, envMapIntensity: 0.8 }),
    );
    edge.rotation.x = Math.PI / 2;
    edge.position.y = PLINTH_TOP;
    piece.add(edge);

    // ---- the sculpture: polished hand-cast gypsum art object ----
    const SCULPT_Y = PLINTH_TOP + 1.02;
    const sculptMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#eef1fb'),
      metalness: 0.0, roughness: 0.24, clearcoat: 0.9, clearcoatRoughness: 0.16,
      iridescence: 0.32, iridescenceIOR: 1.3, envMapIntensity: 1.15,
    });
    const sculptGeo = new THREE.TorusKnotGeometry(0.62, 0.2, 260, 36, 2, 3);
    const sculpture = new THREE.Mesh(sculptGeo, sculptMat);
    sculpture.castShadow = true;
    sculpture.scale.set(1, 1.12, 1);
    sculpture.position.y = SCULPT_Y;
    sculpture.rotation.x = 0.32;
    piece.add(sculpture);

    // ---- faint brand halo behind the sculpture ----
    function makeHaloTexture() {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      g.addColorStop(0, 'rgba(124,92,255,0.42)');
      g.addColorStop(0.45, 'rgba(240,91,196,0.20)');
      g.addColorStop(1, 'rgba(124,92,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    const haloTex = makeHaloTexture();
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 4.6),
      new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0.42, depthWrite: false }),
    );
    halo.position.set(0, SCULPT_Y, -1.6);
    piece.add(halo);

    // ---- soft contact shadow on the floor ----
    function makeRadialTexture() {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
      g.addColorStop(0, 'rgba(20,30,60,0.5)');
      g.addColorStop(0.55, 'rgba(20,30,60,0.18)');
      g.addColorStop(1, 'rgba(20,30,60,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    const shTex = makeRadialTexture();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 5.2),
      new THREE.MeshBasicMaterial({ map: shTex, transparent: true, opacity: 0.5, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = PLINTH_TOP - PLINTH_H - 0.02;
    piece.add(shadow);

    // ---- pointer parallax ----
    let targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
    const onPointer = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      targetRY = Math.max(-1, Math.min(1, nx)) * 0.32;
      targetRX = Math.max(-1, Math.min(1, ny)) * 0.16;
    };
    window.addEventListener('pointermove', onPointer);

    // ---- animate ----
    const clock = new THREE.Clock();
    let elapsed = 0;
    let raf = 0;
    const render = () => {
      const dt = clock.getDelta();
      elapsed += dt;
      const t = elapsed;
      curRY += (targetRY - curRY) * 0.06;
      curRX += (targetRX - curRX) * 0.06;
      piece.rotation.y = Math.sin(t * 0.28) * 0.12 + curRY;
      piece.rotation.x = curRX * 0.5;
      piece.position.y = OFFSET_Y + Math.sin(t * 0.9) * 0.04;
      sculpture.rotation.y += dt * 0.5;
      sculpture.position.y = SCULPT_Y + Math.sin(t * 1.1) * 0.05;
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
      haloTex.dispose();
      shTex.dispose();
      envRT.texture.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden style={{ width: 'clamp(300px,82vw,440px)', height: 'clamp(400px,92vw,540px)' }} />;
}
