// "Kantor 3D", voxel style: a small island where every project gets a plot. A project with live sessions is an
// open-air office: each Claude Code session is a voxel robot at a desk, each running agent a drone circling it,
// each background process a blinking server. A quiet project is a little house. Loaded only when the 3D view opens.
import * as THREE from 'three';
import { OrbitControls } from '/vendor/three/OrbitControls.js';

const MAX_DESKS = 6;      // per project; the rest show up as "+N" on the project sign
const MAX_DRONES = 8;     // per desk
const MAX_PODS = 12;      // active projects always show; quiet ones fill up to this
const POD_GAP = 12;
const DESK_DX = 3.1, DESK_DZ = 3.5;
const RUG_Y = 0.12;       // top of a plot's floor: desks and houses stand on it
const ISLAND_H = 1.6;
const WATER_Y = -1.05;

// Plot slots spiral out from the centre, so the busiest projects sit in the middle of the island.
const SLOTS = (() => {
  const out = [];
  for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) out.push([x, z]);
  return out.sort((a, b) => (a[0] ** 2 + a[1] ** 2) - (b[0] ** 2 + b[1] ** 2) || Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
})();

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const pop = (t) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;   // ease-out with a little overshoot
const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');
// Seeded random, so trees, flowers and desk props land in the same place on every load.
function rng(seed) {
  let a = 2166136261;
  for (const ch of String(seed)) a = Math.imul(a ^ ch.charCodeAt(0), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Scene art per theme; the dark theme is night on the island. Status colours come from the page's CSS tokens.
const ART = {
  day: {
    sky: '#bfe4f3', water: '#5ec3e4', water2: '#74cdea', foam: '#effaff', grass: '#8fd06a', grass2: '#85c661', yard: '#9bd676', yard2: '#92cf6d',
    dirt: '#b97f48', dirt2: '#9a673a', leaf: '#5db85a', leaf2: '#7dcd5f', trunk: '#8b5a2b', wood: '#d6a064', wood2: '#a8743f',
    cream: '#f7eedd', metal: '#3b404b', metal2: '#6a7180', face: '#1f2431', stone: '#d3ccbc', brick: '#c0583e', cloud: '#ffffff',
    window: '#86bcd9', windowLit: '#ffd27a', lamp: '#fff3cf', hemiSky: '#ffffff', hemiGround: '#93c178', hemi: 1.35, sun: '#fff4e2', sunI: 2.6, lampI: 0,
  },
  night: {
    sky: '#0f1a2d', water: '#1a3954', water2: '#21445f', foam: '#3e6283', grass: '#4b7c46', grass2: '#46753f', yard: '#53884c', yard2: '#4d8046',
    dirt: '#6d4b2d', dirt2: '#583c23', leaf: '#3e7d45', leaf2: '#4c9150', trunk: '#5c3d20', wood: '#94693f', wood2: '#73512f',
    cream: '#cfc5b3', metal: '#2b2f37', metal2: '#4a505c', face: '#151925', stone: '#8d877b', brick: '#8a3f2d', cloud: '#55678a',
    window: '#2c3e55', windowLit: '#ffc861', lamp: '#ffd98a', hemiSky: '#8ea3e2', hemiGround: '#263826', hemi: 0.75, sun: '#a9bcff', sunI: 1.05, lampI: 16,
  },
};
const FLOWERS = ['#ff8fb1', '#ffd34d', '#ffffff', '#b98cf2', '#ff9a52'];

function cssColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return {
    surface: v('--surface'), text3: v('--text-3'), accent: v('--accent'),
    green: v('--green'), amber: v('--amber'), red: v('--red'), blue: v('--blue'), purple: v('--purple'), teal: v('--teal'),
    dark: document.documentElement.dataset.theme === 'dark',
  };
}

// Tiny canvas textures drawn pixel by pixel; nearest-neighbour sampling keeps the voxel look up close.
function pixelTexture(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const checker = (a, b) => pixelTexture(2, 2, (g) => { g.fillStyle = a; g.fillRect(0, 0, 2, 2); g.fillStyle = b; g.fillRect(0, 0, 1, 1); g.fillRect(1, 1, 1, 1); });

export function createOffice(container, opts = {}) {
  const esc = opts.esc || ((s) => String(s));
  const colorOf = opts.color || (() => '#888');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'o3d-canvas';
  container.appendChild(renderer.domElement);
  const labelLayer = document.createElement('div');
  labelLayer.className = 'o3d-labels';
  container.appendChild(labelLayer);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 500);
  camera.position.set(24, 30, 32);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.22;
  controls.minDistance = 8;
  controls.maxDistance = 170;
  controls.autoRotateSpeed = 0.5;
  controls.target.set(0, 1, 0);

  /* ---------- shared geometry, materials, textures ---------- */
  const G = { box: new THREE.BoxGeometry(1, 1, 1), plane: new THREE.PlaneGeometry(1, 1) };
  const lam = (extra) => new THREE.MeshLambertMaterial(extra);
  const M = {
    trunk: lam(), leaf: lam(), leaf2: lam(), wood: lam(), wood2: lam(), cream: lam(), metal: lam(), metal2: lam(),
    face: lam(), stone: lam(), brick: lam(), white: lam({ color: 0xffffff }), pot: lam({ color: 0xd9774f }),
    cloud: lam(), window: lam(), lampHead: lam(), dirtBottom: lam(),
    bubbleWhite: new THREE.MeshBasicMaterial({ color: 0xffffff }), bubbleInk: new THREE.MeshBasicMaterial({ color: 0x2b2f38 }),
  };
  const flowerMats = FLOWERS.map((c) => lam({ color: c }));
  const glow = {};      // status → emissive material, recoloured when the theme changes
  const glowMat = (key) => glow[key] || (glow[key] = lam());
  const solids = new Map();
  const solid = (hex, k = 1) => {
    const key = hex + k;
    if (!solids.has(key)) solids.set(key, lam({ color: new THREE.Color(hex).multiplyScalar(k) }));
    return solids.get(key);
  };
  const T = {};         // theme textures, rebuilt by applyTheme

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x88aa77, 1.3);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  /* ---------- picking registry and the voxel builder ---------- */
  const pickables = [];
  const pick = (m, info) => { m.userData.pick = info; pickables.push(m); return m; };
  const unpick = (root) => root.traverse((o) => { const i = pickables.indexOf(o); if (i >= 0) pickables.splice(i, 1); });
  // A box w×h×d standing on y (voxel builders think in floors, not centres).
  function vox(parent, w, h, d, mat, x = 0, y = 0, z = 0, info) {
    const m = new THREE.Mesh(G.box, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    if (info) pick(m, info);
    parent.add(m);
    return m;
  }

  /* ---------- the island, the water around it ---------- */
  const islandMat = { top: lam(), sideX: lam(), sideZ: lam() };
  const island = new THREE.Mesh(G.box, [islandMat.sideX, islandMat.sideX, islandMat.top, M.dirtBottom, islandMat.sideZ, islandMat.sideZ]);
  island.receiveShadow = true; island.castShadow = true;
  scene.add(island);
  const isl = { size: new THREE.Vector2(16, 16), sizeGoal: new THREE.Vector2(16, 16), c: new THREE.Vector3(), cGoal: new THREE.Vector3() };
  const waterMat = lam();
  const water = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER_Y;
  water.receiveShadow = true;
  scene.add(water);
  const foamMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
  const foam = new THREE.Mesh(G.box, foamMat);
  scene.add(foam);

  // Point (u along the edge, 0..1) on a rectangle inset from the island's edge.
  function rim(u, inset, out) {
    const w = Math.max(0.5, isl.size.x / 2 - inset), h = Math.max(0.5, isl.size.y / 2 - inset);
    let d = (((u % 1) + 1) % 1) * (4 * w + 4 * h);
    let x, z;
    if (d < 2 * w) { x = -w + d; z = -h; } else if ((d -= 2 * w) < 2 * h) { x = w; z = -h + d; } else if ((d -= 2 * h) < 2 * w) { x = w - d; z = h; } else { d -= 2 * w; x = -w; z = h - d; }
    return out.set(isl.c.x + x, 0, isl.c.z + z);
  }

  /* ---------- decoration: trees, flowers, lamps, clouds, fireflies ---------- */
  const decor = [];
  {
    const r = rng('trees');
    for (let i = 0; i < 20; i++) {
      const g = new THREE.Group();
      const s = 0.8 + r() * 0.5;
      if (r() < 0.72) {
        vox(g, 0.36, 0.9, 0.36, M.trunk);
        vox(g, 1.3, 1.0, 1.3, M.leaf, 0, 0.85, 0);
        vox(g, 0.9, 0.75, 0.9, M.leaf2, 0, 1.85, 0);
        if (r() < 0.5) vox(g, 0.5, 0.45, 0.5, M.leaf, 0, 2.6, 0);
      } else {
        vox(g, 0.95, 0.6, 0.95, M.leaf);
        vox(g, 0.55, 0.45, 0.55, M.leaf2, 0.25, 0.5, 0.15);
      }
      g.scale.setScalar(s);
      g.rotation.y = r() * Math.PI;
      scene.add(g);
      decor.push({ g, u: (i + r() * 0.6) / 20, inset: 1.2 + r() * 0.9, sway: r() * 6 });
    }
    for (let i = 0; i < 18; i++) {
      const g = new THREE.Group();
      vox(g, 0.06, 0.28, 0.06, M.leaf);
      vox(g, 0.2, 0.14, 0.2, flowerMats[Math.floor(r() * flowerMats.length)], 0, 0.28, 0);
      scene.add(g);
      decor.push({ g, u: (i + 0.5 + r() * 0.4) / 18, inset: 0.5 + r() * 0.5, sway: r() * 6, flower: true });
    }
  }
  const lamps = [0.125, 0.375, 0.625, 0.875].map((u) => {
    const g = new THREE.Group();
    vox(g, 0.14, 2.3, 0.14, M.metal);
    vox(g, 0.42, 0.36, 0.42, M.lampHead, 0, 2.3, 0);
    vox(g, 0.52, 0.08, 0.52, M.metal, 0, 2.66, 0);
    const light = new THREE.PointLight(0xffd98a, 0, 11, 2);
    light.position.y = 2.2;
    g.add(light);
    scene.add(g);
    return { g, u, light };
  });
  const clouds = [];
  {
    const r = rng('clouds');
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      vox(g, 3.2, 1.0, 2.0, M.cloud);
      vox(g, 2.0, 0.8, 1.6, M.cloud, 1.4 + r(), 0.3, 0.2);
      vox(g, 1.7, 0.7, 1.4, M.cloud, -1.5 - r(), 0.2, -0.1);
      if (r() < 0.6) vox(g, 1.4, 0.6, 1.2, M.cloud, 0.3, 0.9, 0);
      g.traverse((o) => { o.receiveShadow = false; });
      scene.add(g);
      clouds.push({ g, x: (r() - 0.5) * 80, z: -30 + r() * 50, y: 12 + r() * 4, speed: 0.5 + r() * 0.7 });
    }
  }
  const FLIES = 36;
  const flyMat = new THREE.MeshBasicMaterial({ color: 0xffe58a });
  const flies = new THREE.InstancedMesh(G.box, flyMat, FLIES);
  flies.frustumCulled = false;
  scene.add(flies);
  const flyState = Array.from({ length: FLIES }, (_, i) => ({ u: (i * 0.618) % 1, inset: 0.8 + ((i * 37) % 30) / 10, h: 0.5 + ((i * 13) % 17) / 10, ph: i * 1.7 }));

  /* ---------- voxel confetti and smoke (one instanced mesh, gravity per particle) ---------- */
  const PN = 420;
  const pMat = lam({ color: 0xffffff });
  const parts = new THREE.InstancedMesh(G.box, pMat, PN);
  parts.frustumCulled = false;
  parts.castShadow = false;
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < PN; i++) { parts.setMatrixAt(i, zero); parts.setColorAt(i, new THREE.Color(1, 1, 1)); }
  scene.add(parts);
  const P = { pos: new Float32Array(PN * 3), vel: new Float32Array(PN * 3), rot: new Float32Array(PN * 3), life: new Float32Array(PN), max: new Float32Array(PN), size: new Float32Array(PN), grav: new Float32Array(PN) };
  let pNext = 0, pAlive = 0;
  const tmpO = new THREE.Object3D();
  const tmpC = new THREE.Color();
  function burst(pos, color, n = 30, speed = 4, o = {}) {
    tmpC.set(color);
    for (let k = 0; k < n; k++) {
      const i = pNext; pNext = (pNext + 1) % PN;
      if (P.life[i] <= 0) pAlive++;
      P.pos[i * 3] = pos.x + (Math.random() - 0.5) * (o.spread || 0); P.pos[i * 3 + 1] = pos.y; P.pos[i * 3 + 2] = pos.z + (Math.random() - 0.5) * (o.spread || 0);
      const a = Math.random() * Math.PI * 2, up = Math.random();
      const sp = speed * (0.4 + Math.random() * 0.6);
      P.vel[i * 3] = Math.cos(a) * sp * (1 - up * 0.5); P.vel[i * 3 + 1] = (o.up ?? 1) * (up * sp * 1.3 + 1); P.vel[i * 3 + 2] = Math.sin(a) * sp * (1 - up * 0.5);
      P.rot[i * 3] = Math.random() * 6; P.rot[i * 3 + 1] = Math.random() * 6; P.rot[i * 3 + 2] = Math.random() * 6;
      P.life[i] = P.max[i] = (o.life || 1.2) * (0.8 + Math.random() * 0.5);
      P.size[i] = (o.size || 0.16) * (0.7 + Math.random() * 0.6);
      P.grav[i] = o.grav ?? 9;
      parts.setColorAt(i, o.vary ? tmpC.clone().offsetHSL((Math.random() - 0.5) * 0.25, 0, (Math.random() - 0.5) * 0.15) : tmpC);
    }
    parts.instanceColor.needsUpdate = true;
  }
  function confetti(pos, n = 50) {
    for (const c of [C.green, C.amber, C.blue, C.purple, C.accent]) burst(pos, c, Math.ceil(n / 5), 4.5, { vary: true });
  }
  function stepParticles(dt) {
    if (!pAlive) return;
    for (let i = 0; i < PN; i++) {
      if (P.life[i] <= 0) continue;
      P.life[i] -= dt;
      if (P.life[i] <= 0) { parts.setMatrixAt(i, zero); pAlive--; continue; }
      const g = P.grav[i];
      P.vel[i * 3 + 1] -= g * dt;
      if (g < 0) { P.vel[i * 3] *= 0.98; P.vel[i * 3 + 2] *= 0.98; }
      P.pos[i * 3] += P.vel[i * 3] * dt; P.pos[i * 3 + 1] += P.vel[i * 3 + 1] * dt; P.pos[i * 3 + 2] += P.vel[i * 3 + 2] * dt;
      if (g > 0 && P.pos[i * 3 + 1] < RUG_Y + 0.05) { P.pos[i * 3 + 1] = RUG_Y + 0.05; P.vel[i * 3 + 1] *= -0.35; P.vel[i * 3] *= 0.6; P.vel[i * 3 + 2] *= 0.6; }
      P.rot[i * 3] += dt * 5; P.rot[i * 3 + 2] += dt * 4;
      const k = P.life[i] / P.max[i];
      // smoke grows as it rises; confetti shrinks away at the end
      const s = P.size[i] * (g < 0 ? 0.6 + (1 - k) * 1.6 : Math.min(1, k * 3));
      tmpO.position.set(P.pos[i * 3], P.pos[i * 3 + 1], P.pos[i * 3 + 2]);
      tmpO.rotation.set(P.rot[i * 3], P.rot[i * 3 + 1], P.rot[i * 3 + 2]);
      tmpO.scale.setScalar(g < 0 && k < 0.25 ? s * (k / 0.25) : s);
      tmpO.updateMatrix();
      parts.setMatrixAt(i, tmpO.matrix);
    }
    parts.instanceMatrix.needsUpdate = true;
  }

  /* ---------- theme ---------- */
  let C = null, A = ART.day;
  function applyTheme() {
    const c = cssColors();
    const sig = JSON.stringify(c);
    if (C && C.sig === sig) return;
    C = { ...c, sig };
    A = c.dark ? ART.night : ART.day;
    renderer.setClearColor(A.sky);
    scene.fog = new THREE.Fog(A.sky, 70, 210);
    hemi.color.set(A.hemiSky); hemi.groundColor.set(A.hemiGround); hemi.intensity = A.hemi;
    sun.color.set(A.sun); sun.intensity = A.sunI;
    for (const k of ['trunk', 'leaf', 'leaf2', 'wood', 'wood2', 'cream', 'metal', 'metal2', 'face', 'stone', 'brick', 'cloud']) M[k].color.set(A[k]);
    M.cloud.emissive.set(A.cloud).multiplyScalar(c.dark ? 0.1 : 0.25);
    M.dirtBottom.color.set(A.dirt2);
    M.window.color.set(c.dark ? A.windowLit : A.window);
    M.window.emissive.set(c.dark ? A.windowLit : '#000000');
    M.window.emissiveIntensity = c.dark ? 0.9 : 0;
    M.lampHead.color.set(A.lamp);
    M.lampHead.emissive.set(A.lamp);
    M.lampHead.emissiveIntensity = c.dark ? 1.2 : 0.15;
    for (const l of lamps) { l.light.intensity = A.lampI; l.light.color.set(A.lamp); }
    flies.visible = c.dark;
    foamMat.color.set(A.foam);
    for (const k of Object.keys(T)) T[k].dispose();
    T.top = checker(A.grass, A.grass2);
    T.sideX = pixelTexture(8, 8, (g) => { g.fillStyle = A.dirt; g.fillRect(0, 0, 8, 8); g.fillStyle = A.dirt2; for (const [x, y] of [[1, 4], [5, 3], [3, 6], [6, 7], [0, 7]]) g.fillRect(x, y, 1, 1); g.fillStyle = A.grass; g.fillRect(0, 0, 8, 2); g.fillRect(2, 2, 1, 1); g.fillRect(6, 2, 1, 1); });
    T.sideZ = T.sideX.clone(); T.sideZ.needsUpdate = true;
    T.water = pixelTexture(4, 4, (g) => { g.fillStyle = A.water; g.fillRect(0, 0, 4, 4); g.fillStyle = A.water2; g.fillRect(0, 0, 2, 1); g.fillRect(2, 2, 2, 1); });
    T.water.repeat.set(200, 200);
    T.yard = checker(A.yard, A.yard2);
    islandMat.top.map = T.top; islandMat.sideX.map = T.sideX; islandMat.sideZ.map = T.sideZ; waterMat.map = T.water;
    for (const m of [islandMat.top, islandMat.sideX, islandMat.sideZ, waterMat]) { m.color.set(0xffffff); m.needsUpdate = true; }
    for (const [key, col] of Object.entries({ working: c.green, waiting: c.amber, needs: c.amber, starting: c.blue, agent: c.purple, bg: c.teal, idle: c.text3 })) {
      const m = glowMat(key);
      m.color.set(col); m.emissive.set(col);
      m.emissiveIntensity = c.dark ? 0.9 : 0.55;
    }
    for (const pod of pods.values()) pod.recolor();
  }

  /* ---------- monitor screens: chunky pixel code while working, an icon while waiting ---------- */
  class Screen {
    constructor() {
      this.tex = pixelTexture(64, 36, () => {});
      this.tex.minFilter = THREE.NearestFilter;
      this.tex.generateMipmaps = false;
      this.g = this.tex.image.getContext('2d');
      this.lines = Array.from({ length: 14 }, () => this.line());
      this.scroll = 0; this.acc = 0; this.mode = null; this.flash = 0;
    }
    line() { return { indent: Math.floor(Math.random() * 4), parts: Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => [3 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 4)]) }; }
    draw(mode, dt) {
      this.acc += dt;
      if (mode === this.mode && mode !== 'working' && this.flash <= 0) return;
      if (mode === 'working' && this.acc < 0.12 && this.mode === mode && this.flash <= 0) return;
      this.acc = 0;
      this.mode = mode;
      const g = this.g, W = 64, H = 36;
      g.fillStyle = mode === 'idle' ? '#15171b' : '#0e1117';
      g.fillRect(0, 0, W, H);
      if (mode === 'working') {
        if (++this.scroll >= 3) { this.scroll = 0; this.lines.shift(); this.lines.push(this.line()); }
        const pal = [C.green, C.blue, C.purple, '#c9c4ba'];
        this.lines.forEach((ln, i) => {
          let x = 3 + ln.indent * 3;
          const y = 2 + i * 3 - this.scroll;
          for (const [w, ci] of ln.parts) { g.fillStyle = pal[ci]; g.fillRect(x, y, w, 2); x += w + 2; }
        });
        if (Math.floor(performance.now() / 400) % 2) { g.fillStyle = C.green; g.fillRect(3, H - 5, 3, 3); }
      } else if (mode === 'waiting') {
        g.fillStyle = C.amber;
        for (const x of [22, 30, 38]) g.fillRect(x, 16, 4, 4);
      } else if (mode === 'needs') {
        g.fillStyle = C.amber;
        g.fillRect(30, 7, 4, 14); g.fillRect(30, 24, 4, 4);
      } else if (mode === 'starting') {
        g.fillStyle = '#2a3140'; g.fillRect(12, 16, 40, 4);
        g.fillStyle = C.blue; g.fillRect(12, 16, 10 + Math.floor(performance.now() / 120) % 30, 4);
      }
      if (this.flash > 0) {
        g.fillStyle = `rgba(255,255,255,${this.flash * 0.35})`;
        g.fillRect(0, 0, W, H);
        this.flash = Math.max(0, this.flash - dt * 3);
      }
      this.tex.needsUpdate = true;
    }
    dispose() { this.tex.dispose(); }
  }

  /* ---------- robot faces: 16×10 pixel art on the face plate ---------- */
  // Each expression is a list of [x, y, w, h] pixel blocks; cheeks are drawn on every face but the blink.
  const FACES = {
    work: { eyes: [[3, 4, 2, 2], [11, 4, 2, 2]], mouth: [[6, 8, 4, 1]] },
    happy: { eyes: [[4, 3, 1, 1], [3, 4, 1, 1], [5, 4, 1, 1], [2, 5, 1, 1], [6, 5, 1, 1], [12, 3, 1, 1], [11, 4, 1, 1], [13, 4, 1, 1], [10, 5, 1, 1], [14, 5, 1, 1]], mouth: [[5, 7, 1, 1], [10, 7, 1, 1], [6, 8, 4, 1]] },
    wide: { eyes: [[2, 2, 3, 3], [11, 2, 3, 3]], mouth: [[7, 7, 2, 2]] },
    blink: { eyes: [[2, 4, 4, 1], [10, 4, 4, 1]], mouth: [[6, 8, 4, 1]] },
    load: { eyes: [[2, 4, 4, 1], [11, 3, 2, 2]], mouth: [[6, 8, 4, 1]] },
  };
  class Face {
    constructor() {
      this.tex = pixelTexture(16, 10, () => {});
      this.tex.minFilter = THREE.NearestFilter;
      this.tex.generateMipmaps = false;
      this.g = this.tex.image.getContext('2d');
      this.key = '';
    }
    draw(expr, color) {
      const key = expr + color;
      if (key === this.key) return;
      this.key = key;
      const g = this.g, f = FACES[expr];
      g.fillStyle = A.face;
      g.fillRect(0, 0, 16, 10);
      g.fillStyle = color;
      for (const [x, y, w, h] of [...f.eyes, ...f.mouth]) g.fillRect(x, y, w, h);
      if (expr !== 'blink') { g.fillStyle = '#ff8fa8'; g.fillRect(0, 6, 2, 1); g.fillRect(14, 6, 2, 1); }
      this.tex.needsUpdate = true;
    }
    dispose() { this.tex.dispose(); }
  }

  /* ---------- HTML labels that follow 3D points ---------- */
  const labels = new Set();
  function makeLabel(cls, anchor) {
    const el = document.createElement('div');
    el.className = 'o3d-lab ' + cls;
    labelLayer.appendChild(el);
    const lab = { el, anchor, html: '', visible: true, set(html) { if (html !== this.html) { this.html = html; el.innerHTML = html; } }, remove() { el.remove(); labels.delete(lab); } };
    labels.add(lab);
    return lab;
  }
  const tmpV = new THREE.Vector3();
  function placeLabels(w, h) {
    for (const lab of labels) {
      if (!lab.visible) { lab.el.style.display = 'none'; continue; }
      lab.anchor.getWorldPosition(tmpV);
      const dist = camera.position.distanceTo(tmpV);
      tmpV.project(camera);
      if (tmpV.z > 1 || tmpV.x < -1.2 || tmpV.x > 1.2 || tmpV.y < -1.2 || tmpV.y > 1.2) { lab.el.style.display = 'none'; continue; }
      const s = Math.max(0.55, Math.min(1, 46 / dist));
      lab.el.style.display = '';
      const far = s < 0.78;
      if (far !== lab.far) { lab.far = far; lab.el.classList.toggle('far', far); }
      lab.el.style.transform = `translate(${((tmpV.x + 1) / 2) * w}px, ${((1 - tmpV.y) / 2) * h}px) translate(-50%, -100%) scale(${s.toFixed(3)})`;
      lab.el.style.zIndex = String(1000 - Math.round(dist));
    }
  }

  /* ---------- a desk with its voxel robot ---------- */
  class Desk {
    constructor(pod, id) {
      this.pod = pod; this.id = id;
      this.group = new THREE.Group();
      this.group.scale.setScalar(0.001);
      this.appear = 0; this.leaving = 0;
      this.target = new THREE.Vector3();
      this.info = { kind: 'session', desk: this };
      const g = this.group, I = this.info;
      const r = rng(id);
      // desk, monitor, keyboard, mug, maybe a plant (the robot faces -z, towards the monitor)
      vox(g, 2.3, 0.16, 1.15, M.wood, 0, 0.94, -0.6, I);
      for (const [x, z] of [[-1, -0.18], [1, -0.18], [-1, -1.02], [1, -1.02]]) vox(g, 0.14, 0.94, 0.14, M.wood2, x, 0, z);
      vox(g, 0.16, 0.26, 0.16, M.metal, 0, 1.1, -0.85);
      vox(g, 1.36, 0.86, 0.14, M.metal, 0, 1.34, -0.92, I);
      this.screen = new Screen();
      const scr = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: this.screen.tex, toneMapped: false }));
      scr.scale.set(1.2, 0.7, 1); scr.position.set(0, 1.77, -0.845);
      g.add(pick(scr, I));
      this.screenPos = new THREE.Vector3(0, 1.77, -0.845);
      vox(g, 0.84, 0.06, 0.3, M.metal2, 0, 1.1, -0.36);
      if (r() < 0.75) { vox(g, 0.2, 0.24, 0.2, M.white, 0.82, 1.1, -0.42); vox(g, 0.06, 0.12, 0.05, M.white, 0.95, 1.16, -0.42); }
      if (r() < 0.5) { vox(g, 0.26, 0.22, 0.26, M.pot, -0.85, 1.1, -0.78); vox(g, 0.36, 0.32, 0.36, M.leaf, -0.85, 1.32, -0.78); }
      // status frame on the floor
      this.ringMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false });
      for (const [w, d, x, z] of [[2.9, 0.14, 0, -1.45], [2.9, 0.14, 0, 1.15], [0.14, 2.6, -1.45, -0.15], [0.14, 2.6, 1.45, -0.15]]) {
        const f = new THREE.Mesh(G.box, this.ringMat);
        f.scale.set(w, 0.03, d); f.position.set(x, 0.02, z);
        g.add(f);
      }
      // the seat: chair and robot turn together, so a waiting robot can swivel round to face you
      this.seat = new THREE.Group();
      this.seat.position.z = 0.55;
      this.seat.scale.setScalar(1.2);   // chibi: the robot is a size bigger than its furniture
      g.add(this.seat);
      const s = this.seat;
      vox(s, 0.7, 0.08, 0.7, M.metal);
      vox(s, 0.12, 0.45, 0.12, M.metal, 0, 0.08);
      vox(s, 0.9, 0.14, 0.86, M.metal2, 0, 0.53, 0, I);
      vox(s, 0.9, 0.4, 0.14, M.metal2, 0, 0.67, 0.5, I);
      this.robot = new THREE.Group();
      s.add(this.robot);
      const R = this.robot;
      const body = bodyFor(pod.key);
      for (const x of [-0.18, 0.18]) { vox(R, 0.24, 0.22, 0.55, M.metal, x, 0.67, -0.2); vox(R, 0.24, 0.5, 0.22, M.metal, x, 0.2, -0.47); }
      this.bodyParts = [vox(R, 0.82, 0.72, 0.6, body, 0, 0.69, 0, I)];
      vox(R, 0.5, 0.42, 0.12, M.metal, 0, 0.85, 0.36, I);
      this.led = vox(R, 0.36, 0.08, 0.03, glowMat('idle'), 0, 1.12, 0.43);
      this.arms = [-1, 1].map((side) => {
        const p = new THREE.Group();
        p.position.set(side * 0.52, 1.32, 0);
        this.bodyParts.push(vox(p, 0.2, 0.52, 0.2, body, 0, -0.52, 0));
        vox(p, 0.22, 0.14, 0.22, M.cream, 0, -0.64, 0);
        R.add(p);
        return p;
      });
      this.head = new THREE.Group();
      this.head.position.set(0, 1.42, 0);
      R.add(this.head);
      const H = this.head;
      vox(H, 0.96, 0.8, 0.82, M.cream, 0, 0, 0, I);
      vox(H, 0.8, 0.54, 0.04, M.face, 0, 0.15, -0.42);
      this.face = new Face();
      const face = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: this.face.tex, toneMapped: false }));
      face.scale.set(0.76, 0.475, 1);
      face.position.set(0, 0.42, -0.445);
      face.rotation.y = Math.PI;
      H.add(pick(face, I));
      for (const x of [-0.52, 0.52]) this.bodyParts.push(vox(H, 0.1, 0.24, 0.24, body, x, 0.3, 0));
      this.bodyParts.push(vox(H, 0.6, 0.1, 0.03, body, 0, 0.55, 0.42));
      vox(H, 0.06, 0.28, 0.06, M.metal, 0, 0.8, 0);
      this.antenna = vox(H, 0.16, 0.16, 0.16, glowMat('idle'), 0, 1.08, 0);
      // speech bubble over the shoulder while waiting ("…") or needing you ("!")
      this.bubble = new THREE.Group();
      this.bubble.position.set(0.95, 2.9, 0.55);
      this.bubble.visible = false;
      g.add(this.bubble);
      this.bubbleKey = '';
      // server for background processes
      this.server = new THREE.Group();
      this.server.position.set(1.62, 0, -0.5);
      vox(this.server, 0.6, 1.3, 0.6, M.metal);
      this.leds = [0, 1, 2].map((i) => vox(this.server, 0.36, 0.06, 0.03, glowMat('bg'), 0, 0.35 + i * 0.28, 0.31));
      this.server.visible = false;
      g.add(this.server);
      this.drones = new Map();
      this.labelAnchor = new THREE.Object3D();
      this.labelAnchor.position.set(0, 3.75, 0.2);
      g.add(this.labelAnchor);
      this.label = makeLabel('sess', this.labelAnchor);
      this.turn = 0; this.phase = r() * 10; this.data = null; this.mode = 'idle';
      this.hop = 0; this.blink = 2 + r() * 3; this.wave = 3 + r() * 3;
      pod.group.add(g);
    }
    set(a) {
      const prev = this.data;
      this.data = a;
      const mode = a.starting ? 'starting' : a.status === 'working' ? 'working' : a.needs ? 'needs' : 'waiting';
      this.mode = mode;
      for (const m of [this.led, this.antenna]) m.material = glowMat(mode);
      this.ringMat.color.set({ working: C.green, waiting: C.amber, needs: C.amber, starting: C.blue }[mode]);
      if (prev) {
        if (a.request && prev.request && a.request.id !== prev.request.id && a.request.id) office.flyPaper(this);
        if (a.activity && (!prev.activity || a.activity.ts !== prev.activity.ts)) this.screen.flash = 1;
        if (a.progress && prev.progress && a.progress.done > prev.progress.done) { this.hop = 1; confetti(this.worldPoint(0, 3, 0.2), 60); }
        if (prev.status === 'working' && a.status === 'waiting') burst(this.worldPoint(0, 2.6, 0.3), C.amber, 18, 2.2);
      }
      // drones = running agents
      const seen = new Set();
      a.agents.slice(0, MAX_DRONES).forEach((ag) => {
        seen.add(ag.id);
        let d = this.drones.get(ag.id);
        if (!d) { d = new Drone(this, ag); this.drones.set(ag.id, d); }
        d.set(ag);
      });
      for (const [id, d] of this.drones) if (!seen.has(id)) { d.dispose(true); this.drones.delete(id); }
      let i = 0;
      const n = this.drones.size;
      for (const d of this.drones.values()) d.slot = (i++ / Math.max(1, n)) * Math.PI * 2;
      this.server.visible = a.bg.length > 0;
      this.leds.forEach((l, k) => { l.visible = k < a.bg.length; });
      this.updateLabel();
    }
    updateLabel() {
      const a = this.data;
      if (!a) return;
      const tone = { working: 'green', waiting: 'amber', needs: 'amber', starting: 'blue' }[this.mode];
      const status = { working: 'Bekerja', waiting: 'Menunggu kamu', needs: 'Butuh kamu', starting: 'Memulai…' }[this.mode];
      const act = this.mode === 'working' && a.activity ? `${esc(a.activity.tool)} · ${esc(clip(a.activity.text || '', 46))}` : this.mode === 'needs' ? esc(a.needs) : a.activeTask ? esc(clip(a.activeTask, 46)) : '';
      const prog = a.progress ? `<span class="o3d-prog"><i style="width:${Math.round((a.progress.done / a.progress.total) * 100)}%"></i></span><small class="num">${a.progress.done}/${a.progress.total}</small>` : '';
      const card = a.request && a.request.id ? ` data-card="${esc(a.sessionId + ':p' + a.request.id)}"` : '';
      this.label.set(`<div class="o3d-sess tone-${tone}"${card} data-project="${esc(a.projectKey)}">
        <div class="o3d-sess-top"><span class="dot"></span><b>${esc(clip(a.title, 38))}</b></div>
        <div class="o3d-sess-sub"><span class="st">${status}</span>${a.agents.length ? `<span class="o3d-ag">${a.agents.length} agent</span>` : ''}${prog}</div>
        ${act ? `<div class="o3d-sess-act">${act}</div>` : ''}
      </div>`);
    }
    setBubble(key) {
      if (key === this.bubbleKey) return;
      this.bubbleKey = key;
      const b = this.bubble;
      while (b.children.length) b.remove(b.children[0]);
      b.visible = !!key;
      if (key === '…') {
        vox(b, 0.9, 0.55, 0.16, M.bubbleWhite, 0, -0.27, 0);
        vox(b, 0.18, 0.18, 0.16, M.bubbleWhite, -0.22, -0.45, 0);
        for (const x of [-0.22, 0, 0.22]) vox(b, 0.12, 0.12, 0.04, M.bubbleInk, x, -0.06, 0.09);
      } else if (key === '!') {
        vox(b, 0.55, 0.78, 0.16, glowMat('needs'), 0, -0.39, 0);
        vox(b, 0.18, 0.18, 0.16, glowMat('needs'), -0.12, -0.56, 0);
        vox(b, 0.13, 0.32, 0.04, M.bubbleWhite, 0, -0.1, 0.09);
        vox(b, 0.13, 0.11, 0.04, M.bubbleWhite, 0, -0.3, 0.09);
      }
      b.traverse((o) => { o.castShadow = false; });
    }
    recolor() {
      const body = bodyFor(this.pod.key);
      for (const m of this.bodyParts) m.material = body;
      if (this.data) this.set(this.data);
      this.screen.mode = null;
      this.face.key = '';
    }
    worldPoint(x, y, z) { return this.group.localToWorld(new THREE.Vector3(x, y, z)); }
    tick(t, dt) {
      // appear / leave
      if (this.leaving) {
        this.leaving = Math.min(1, this.leaving + dt * 1.8);
        this.group.scale.setScalar(Math.max(0.001, 1 - ease(this.leaving)));
        if (this.leaving >= 1) return false;
      } else if (this.appear < 1) {
        this.appear = Math.min(1, this.appear + dt * 1.6);
        this.group.scale.setScalar(Math.max(0.001, pop(this.appear)));
      }
      this.group.position.lerp(this.target, Math.min(1, dt * 4));
      const mode = this.mode;
      const amp = reduced ? 0.3 : 1;
      const ph = t + this.phase;
      const typing = mode === 'working' || mode === 'starting';
      const asking = mode === 'waiting' || mode === 'needs';
      // a hop (with arms up) when a task gets done
      this.hop = Math.max(0, this.hop - dt * 1.8);
      const hopping = this.hop > 0;
      this.robot.position.y = hopping ? Math.sin((1 - this.hop) * Math.PI) * 0.55 * amp : typing ? Math.abs(Math.sin(ph * 8.5)) * 0.02 * amp : 0;
      // arms: typing forwards, cheering up, or the right one waving while it waits for you
      this.wave -= dt;
      if (this.wave < -1.4) this.wave = 3 + Math.random() * 3;
      const waving = asking && this.wave < 0 && !reduced;
      this.arms.forEach((p, k) => {
        let gx = -0.08 + Math.sin(ph * 1.3 + k) * 0.04, gz = 0;
        if (hopping) gx = 2.9;
        else if (typing) gx = 1.25 + Math.sin(ph * 17 + k * Math.PI) * 0.13 * amp;
        if (waving && k === 1) { gx = 0; gz = 2.55 + Math.sin(ph * 14) * 0.35; }
        p.rotation.x = lerp(p.rotation.x, gx, Math.min(1, dt * 10));
        p.rotation.z = lerp(p.rotation.z, gz, Math.min(1, dt * 10));
      });
      this.head.rotation.z = asking ? Math.sin(ph * 1.8) * 0.12 * amp : typing ? Math.sin(ph * 0.7) * 0.04 : 0;
      this.head.rotation.x = typing ? 0.12 : 0;
      // face: happy squint while waiting, wide eyes when it needs you, a blink now and then
      this.blink -= dt;
      if (this.blink < -0.12) this.blink = 2 + Math.random() * 4;
      const expr = this.blink < 0 && mode !== 'needs' ? 'blink' : { working: 'work', waiting: 'happy', needs: 'wide', starting: Math.sin(ph * 4) > 0 ? 'load' : 'work' }[mode] || 'work';
      this.face.draw(expr, { working: C.green, waiting: C.amber, needs: C.amber, starting: C.blue }[mode] || C.text3);
      // waiting robots swivel round to look at the camera (the robot faces -z; turning by θ points it at (-sin θ, -cos θ))
      let goalTurn = 0;
      if (asking) {
        const p = this.group.getWorldPosition(tmpV);
        goalTurn = Math.atan2(-(camera.position.x - p.x), -(camera.position.z - p.z));
      }
      const diff = Math.atan2(Math.sin(goalTurn - this.turn), Math.cos(goalTurn - this.turn));
      this.turn += diff * Math.min(1, dt * 3);
      this.seat.rotation.y = this.turn;
      this.antenna.scale.setScalar(0.16 * (typing ? 1 + Math.max(0, Math.sin(ph * 6)) * 0.5 : 1));
      if (mode === 'working') this.ringMat.opacity = 0.35 + Math.sin(ph * 3) * 0.2;
      else this.ringMat.opacity = 0.6;
      // bubble, turned towards the camera
      this.setBubble(mode === 'needs' ? '!' : mode === 'waiting' ? '…' : '');
      if (this.bubbleKey) {
        this.bubble.quaternion.copy(camera.quaternion);
        this.bubble.position.y = 2.9 + Math.abs(Math.sin(ph * (this.bubbleKey === '!' ? 5 : 2.2))) * 0.2 * amp;
        this.bubble.scale.setScalar(this.bubbleKey === '!' ? 1 + Math.sin(ph * 10) * 0.05 : 1);
      }
      this.leds.forEach((l, k) => { l.material = Math.sin(ph * (7 + k * 3) + k) > 0 ? glowMat('bg') : M.metal2; });
      this.screen.draw(mode, dt);
      for (const [id, d] of this.drones) if (d.tick(t, dt) === false) this.drones.delete(id);
      for (const d of this.dying || []) d.tick(t, dt);
      if (this.dying) this.dying = this.dying.filter((d) => !d.dead);
      return true;
    }
    leave() {
      this.leaving = 0.001;
      this.label.visible = false;
      if (this.data) burst(this.worldPoint(0, 1.5, 0), A.cloud, 26, 2.5, { size: 0.3 });
    }
    dispose() {
      unpick(this.group);
      this.label.remove();
      for (const d of this.drones.values()) d.dispose(false);
      for (const d of this.dying || []) d.dispose(false);
      this.screen.dispose();
      this.face.dispose();
      this.ringMat.dispose();
      this.group.parent && this.group.parent.remove(this.group);
    }
  }
  const bodyFor = (key) => solid(colorOf(key));

  /* ---------- agent drones ---------- */
  class Drone {
    constructor(desk, ag) {
      this.desk = desk;
      this.group = new THREE.Group();
      this.info = { kind: 'agent', drone: this };
      const g = this.group;
      vox(g, 0.42, 0.3, 0.42, glowMat('agent'), 0, -0.15, 0, this.info);
      vox(g, 0.16, 0.1, 0.03, M.bubbleWhite, 0, -0.02, 0.215);
      vox(g, 0.05, 0.12, 0.05, M.metal, 0, 0.15, 0);
      this.prop = vox(g, 0.72, 0.03, 0.1, M.metal2, 0, 0.27, 0);
      for (const x of [-0.13, 0.13]) vox(g, 0.06, 0.12, 0.06, M.metal, x, -0.27, 0);
      g.position.copy(desk.screenPos);
      g.scale.setScalar(0.01);
      this.size = 1.35;
      desk.group.add(g);
      this.beamGeo = new THREE.BufferGeometry();
      this.beamGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      this.beamMat = new THREE.LineBasicMaterial({ color: C.purple, transparent: true, opacity: 0.4 });
      this.beam = new THREE.Line(this.beamGeo, this.beamMat);
      this.beam.frustumCulled = false;
      desk.group.add(this.beam);
      this.label = makeLabel('agent', this.group);
      this.slot = 0; this.angle = Math.random() * 6; this.flash = 0; this.age = 0; this.dead = false;
      this.dying = 0;
    }
    set(ag) {
      if (this.data && ag.activity && (!this.data.activity || ag.activity.ts !== this.data.activity.ts)) this.flash = 1;
      this.data = ag;
      this.beamMat.color.set(C.purple);
      const act = ag.activity ? `${esc(ag.activity.tool)} · ${esc(clip(ag.activity.text || '', 40))}` : 'memulai…';
      this.label.set(`<div class="o3d-agent" data-card="${esc(this.desk.data.sessionId + ':a' + ag.id)}" data-project="${esc(this.desk.data.projectKey)}"><b>${esc(clip(ag.description, 40))}</b><small>${esc(ag.type || 'agent')} · ${act}</small></div>`);
      this.label.visible = office.agentLabels;
    }
    tick(t, dt) {
      this.age += dt;
      this.prop.rotation.y += dt * 22;
      if (this.dying) {
        this.dying += dt;
        this.group.position.y += dt * 4;
        this.group.scale.setScalar(Math.max(0.001, (1 - this.dying / 1.2) * this.size));
        this.beamMat.opacity = Math.max(0, 0.4 - this.dying);
        if (this.dying >= 1.2) { this.dispose(false); this.dead = true; return false; }
        return true;
      }
      const amp = reduced ? 0.4 : 1;
      this.angle += dt * 0.7 * amp;
      const a = this.angle + this.slot;
      const grow = Math.min(1, this.age * 1.5);
      const goal = new THREE.Vector3(Math.cos(a) * 2.0, 3.25 + Math.sin(t * 2.2 + this.slot * 3) * 0.2 * amp, -0.4 + Math.sin(a) * 1.5);
      this.group.position.lerp(goal, grow < 1 ? ease(grow) * 0.2 + 0.02 : Math.min(1, dt * 3));
      this.group.scale.setScalar(Math.max(0.01, ease(grow) * this.size));
      this.group.lookAt(this.desk.group.localToWorld(this.desk.screenPos.clone()));
      this.flash = Math.max(0, this.flash - dt * 1.5);
      this.beamMat.opacity = 0.18 + Math.max(0, Math.sin(t * 4 + this.slot * 2)) * 0.25 + this.flash * 0.6;
      const p = this.beamGeo.attributes.position.array;
      p[0] = this.group.position.x; p[1] = this.group.position.y; p[2] = this.group.position.z;
      p[3] = this.desk.screenPos.x; p[4] = this.desk.screenPos.y; p[5] = this.desk.screenPos.z;
      this.beamGeo.attributes.position.needsUpdate = true;
      return true;
    }
    dispose(animated) {
      if (animated) {
        this.dying = 0.001;
        this.label.remove();
        unpick(this.group);
        const at = this.group.getWorldPosition(new THREE.Vector3());
        burst(at, C.purple, 30, 3.5, { vary: true });
        (this.desk.dying || (this.desk.dying = [])).push(this);
        return;
      }
      unpick(this.group);
      this.label.remove();
      this.group.parent && this.group.parent.remove(this.group);
      this.beam.parent && this.beam.parent.remove(this.beam);
      this.beamGeo.dispose();
      this.beamMat.dispose();
    }
  }

  /* ---------- project plots: an open-air office while sessions run, a little house otherwise ---------- */
  const pods = new Map();
  const usedSlots = new Set();
  class Pod {
    constructor(key, name) {
      this.key = key; this.name = name;
      let slot = 0;
      while (usedSlots.has(slot)) slot++;
      usedSlots.add(slot);
      this.slot = slot;
      const [sx, sz] = SLOTS[Math.min(slot, SLOTS.length - 1)];
      this.group = new THREE.Group();
      this.group.position.set(sx * POD_GAP, 0, sz * POD_GAP);
      this.group.scale.setScalar(0.001);
      this.appear = 0;
      scene.add(this.group);
      this.info = { kind: 'project', pod: this };
      const g = this.group, I = this.info;
      // floor: a chequered rug in the project's colour, or a lawn round the house
      this.rugMat = lam();
      this.rug = new THREE.Mesh(G.box, this.rugMat);
      this.rug.position.y = RUG_Y / 2;
      this.rug.receiveShadow = true;
      g.add(pick(this.rug, I));
      // a low fence with a gap at the front, posts at the corners
      this.fenceMat = lam();
      this.fence = [0, 1, 2, 3, 4].map(() => { const m = new THREE.Mesh(G.box, this.fenceMat); m.castShadow = m.receiveShadow = true; g.add(m); return m; });
      this.posts = [0, 1, 2, 3, 4, 5].map(() => { const m = new THREE.Mesh(G.box, M.wood); m.castShadow = true; g.add(m); return m; });
      this.bushes = [-1, 1].map((sd) => {
        const b = new THREE.Group();
        vox(b, 0.9, 0.7, 0.9, M.leaf);
        vox(b, 0.5, 0.4, 0.5, M.leaf2, 0.15, 0.6, -0.1);
        b.userData.side = sd;
        g.add(b);
        return b;
      });
      this.flag = new THREE.Group();
      vox(this.flag, 0.1, 2.3, 0.1, M.metal);
      this.flagCloth = new THREE.Group();
      this.flagCloth.position.set(0.05, 2.25, 0);
      this.flagMat = lam();
      vox(this.flagCloth, 0.75, 0.45, 0.05, this.flagMat, 0.375, -0.45, 0);
      this.flag.add(this.flagCloth);
      g.add(this.flag);
      this.house = this.buildHouse();
      this.houseK = 0;
      this.size = new THREE.Vector2(5.6, 5.2);
      this.sizeGoal = new THREE.Vector2(5.6, 5.2);
      this.desks = new Map();
      this.deskSlots = new Map();
      this.leaving = 0;
      this.smoke = 1 + Math.random() * 3;
      this.signAnchor = new THREE.Object3D();
      g.add(this.signAnchor);
      this.label = makeLabel('proj', this.signAnchor);
      this.recolor();
    }
    buildHouse() {
      const h = new THREE.Group();
      const I = this.info;
      const y = RUG_Y;
      this.roofMats = [lam(), lam()];
      vox(h, 3.0, 1.9, 2.5, M.cream, 0, y, 0, I);
      [3.5, 2.7, 1.9, 1.1].forEach((w, i) => vox(h, w, 0.42, 2.9, this.roofMats[i % 2], 0, y + 1.9 + i * 0.42, 0, I));
      vox(h, 0.42, 1.55, 0.42, M.brick, 0.95, y + 2.3, -0.5, I);
      this.chimneyTop = new THREE.Vector3(0.95, y + 3.9, -0.5);
      vox(h, 0.72, 1.15, 0.06, M.wood2, 0, y, 1.27, I);
      vox(h, 0.08, 0.08, 0.06, M.metal, 0.22, y + 0.58, 1.31);
      for (const x of [-0.95, 0.95]) {
        vox(h, 0.74, 0.66, 0.05, M.wood, x, y + 0.84, 1.255);
        vox(h, 0.6, 0.52, 0.06, M.window, x, y + 0.91, 1.26, I);
      }
      vox(h, 0.8, 0.05, 0.5, M.stone, 0, y, 1.85);
      vox(h, 0.7, 0.05, 0.45, M.stone, 0.1, y, 2.4);
      this.mailMat = lam();
      vox(h, 0.1, 0.8, 0.1, M.wood2, 1.75, y, 1.9);
      vox(h, 0.36, 0.3, 0.5, this.mailMat, 1.75, y + 0.8, 1.9);
      h.scale.setScalar(0.001);
      this.group.add(h);
      return h;
    }
    recolor() {
      const tint = new THREE.Color(colorOf(this.key));
      const base = new THREE.Color(C.dark ? '#1b2130' : '#ffffff');
      if (this.rugTex) this.rugTex.dispose();
      this.rugTex = checker('#' + tint.clone().lerp(base, C.dark ? 0.45 : 0.55).getHexString(), '#' + tint.clone().lerp(base, C.dark ? 0.55 : 0.68).getHexString());
      this.fenceMat.color.copy(tint).multiplyScalar(C.dark ? 0.75 : 0.9);
      this.flagMat.color.copy(tint);
      this.mailMat.color.copy(tint);
      this.roofMats[0].color.copy(tint);
      this.roofMats[1].color.copy(tint).multiplyScalar(0.84);
      this.applyFloor();
      for (const d of this.desks.values()) d.recolor();
    }
    applyFloor() {
      this.rugMat.map = this.active ? this.rugTex : T.yard;
      this.rugMat.needsUpdate = true;
    }
    set(p, sessions) {
      this.name = p.name;
      const wasActive = this.active;
      this.active = sessions.length > 0;
      if (wasActive !== this.active) this.applyFloor();
      const want = sessions.slice(0, MAX_DESKS);
      const ids = new Set(want.map((a) => a.sessionId));
      for (const [id, d] of this.desks) if (!ids.has(id)) { d.leave(); this.deskSlots.delete(id); this.desks.delete(id); (this.leavingDesks || (this.leavingDesks = [])).push(d); }
      for (const id of ids) {
        if (this.desks.has(id)) continue;
        let s = 0;
        const taken = new Set(this.deskSlots.values());
        while (taken.has(s)) s++;
        this.deskSlots.set(id, s);
        this.desks.set(id, new Desk(this, id));
      }
      // Re-pack slots so desks fill rows from the front.
      const order = [...this.deskSlots.entries()].sort((a, b) => a[1] - b[1]).map((e) => e[0]);
      order.forEach((id, i) => this.deskSlots.set(id, i));
      const n = Math.max(1, this.desks.size);
      const cols = Math.min(3, n), rows = Math.ceil(n / 3);
      for (const [id, d] of this.desks) {
        const i = this.deskSlots.get(id);
        d.target.set(((i % 3) - (cols - 1) / 2) * DESK_DX, RUG_Y, (Math.floor(i / 3) - (rows - 1) / 2) * DESK_DZ + 0.2);
        if (d.appear === 0) d.group.position.copy(d.target);
        // neighbouring desks hold their labels at different heights so they don't cover each other
        d.labelAnchor.position.y = 3.75 + (i % 2) * 0.95;
        d.set(want.find((a) => a.sessionId === id));
      }
      if (this.active) this.sizeGoal.set(cols * DESK_DX + 2.4, rows * DESK_DZ + 2.4);
      else this.sizeGoal.set(5.6, 5.4);
      const working = sessions.filter((a) => a.status === 'working').length;
      const waiting = sessions.length - working;
      const extra = sessions.length - want.length;
      const meta = this.active
        ? [working ? `<span class="tone-green">${working} bekerja</span>` : '', waiting ? `<span class="tone-amber">${waiting} menunggu</span>` : '', extra > 0 ? `+${extra} sesi lain` : ''].filter(Boolean).join(' · ')
        : `sepi · ${opts.ago ? opts.ago(p.lastTs) : ''}`;
      this.label.set(`<div class="o3d-proj${this.active ? ' on' : ''}" style="--pc:${esc(colorOf(this.key))}">
        <button type="button" class="o3d-proj-name" data-o3d-focus="${esc(this.key)}" title="Dekatkan kamera"><i></i>${esc(p.name)}</button>
        <span class="o3d-proj-meta">${meta}</span>
        <a class="o3d-open" href="#/p/${encodeURIComponent(this.key)}" title="Buka project">↗</a>
      </div>`);
    }
    tick(t, dt) {
      this.size.lerp(this.sizeGoal, Math.min(1, dt * 4));
      if (this.appear < 1) this.appear = Math.min(1, this.appear + dt * 1.5);
      const k = this.leaving ? Math.max(0.001, 1 - ease(Math.min(1, this.leaving))) : Math.max(0.001, pop(this.appear));
      if (this.leaving) this.leaving += dt * 1.6;
      this.group.scale.setScalar(k);
      const W = this.size.x, D = this.size.y;
      this.rug.scale.set(W, RUG_Y, D);
      if (this.rugMat.map) this.rugMat.map.repeat.set(W, D);
      // fence: back, left, right, and the front split round the gate
      const fy = RUG_Y + 0.12, gate = 0.9;
      const half = (W / 2 - gate) / 2;
      const seg = [[W, 0, -D / 2], [0, -W / 2, 0, D], [0, W / 2, 0, D], [W / 2 - gate, -(gate + half), D / 2], [W / 2 - gate, gate + half, D / 2]];
      this.fence.forEach((m, i) => {
        const s = seg[i];
        if (i === 1 || i === 2) { m.scale.set(0.14, 0.12, D); m.position.set(s[1], fy, 0); } else { m.scale.set(Math.max(0.01, s[0]), 0.12, 0.14); m.position.set(s[1], fy, s[2]); }
      });
      [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2], [-gate, D / 2], [gate, D / 2]].forEach(([x, z], i) => {
        const p = this.posts[i];
        p.scale.set(0.22, 0.42, 0.22); p.position.set(x, RUG_Y + 0.21, z);
      });
      this.bushes.forEach((b) => b.position.set(b.userData.side * (W / 2 - 0.65), RUG_Y, -D / 2 + 0.65));
      this.flag.position.set(-W / 2 + 0.35, RUG_Y, D / 2 - 0.35);
      this.flagCloth.rotation.y = reduced ? 0 : Math.sin(t * 3 + this.slot) * 0.3;
      this.signAnchor.position.set(0, 0.3, D / 2 + 0.25);
      // the house pops up when the last session ends and tucks away when one starts
      const hg = this.active ? 0 : 1;
      this.houseK += Math.sign(hg - this.houseK) * Math.min(Math.abs(hg - this.houseK), dt * 1.6);
      this.house.scale.setScalar(Math.max(0.001, hg ? pop(this.houseK) : ease(this.houseK)));
      this.house.visible = this.houseK > 0.01;
      if (!this.active && this.houseK > 0.9 && !reduced && (this.smoke -= dt) < 0) {
        this.smoke = 1.6 + Math.random() * 2.5;
        burst(this.group.localToWorld(this.chimneyTop.clone()), C.dark ? '#7d8597' : '#e8e6e1', 2, 0.35, { grav: -0.9, size: 0.3, life: 2.6, up: 0.4 });
      }
      for (const d of this.desks.values()) d.tick(t, dt);
      if (this.leavingDesks) this.leavingDesks = this.leavingDesks.filter((d) => { if (d.tick(t, dt) === false) { d.dispose(); return false; } return true; });
      return !(this.leaving && this.leaving >= 1);
    }
    dispose() {
      for (const d of this.desks.values()) d.dispose();
      for (const d of this.leavingDesks || []) d.dispose();
      unpick(this.group);
      this.label.remove();
      for (const m of [this.rugMat, this.fenceMat, this.flagMat, this.mailMat, ...this.roofMats]) m.dispose();
      if (this.rugTex) this.rugTex.dispose();
      scene.remove(this.group);
      usedSlots.delete(this.slot);
    }
  }

  /* ---------- envelopes: a new prompt flies to its desk ---------- */
  const flyers = [];
  function flyPaper(desk) {
    const m = new THREE.Group();
    vox(m, 0.55, 0.06, 0.38, M.white, 0, -0.03, 0);
    vox(m, 0.57, 0.02, 0.1, glowMat('starting'), 0, 0.03, 0);
    const to = desk.worldPoint(desk.screenPos.x, desk.screenPos.y + 0.3, desk.screenPos.z);
    const from = to.clone().add(new THREE.Vector3(-6, 9, 10));
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 4, 0));
    scene.add(m);
    flyers.push({ m, from, mid, to, t: 0 });
  }
  function stepFlyers(dt) {
    for (let i = flyers.length - 1; i >= 0; i--) {
      const f = flyers[i];
      f.t += dt / 1.3;
      const k = Math.min(1, f.t);
      const a = f.from.clone().lerp(f.mid, k), b = f.mid.clone().lerp(f.to, k);
      const p = a.lerp(b, k);
      f.m.lookAt(p);
      f.m.position.copy(p);
      f.m.rotation.z += Math.sin(k * 12) * 0.2;
      if (f.t >= 1) { burst(f.to, C.blue, 24, 3); scene.remove(f.m); flyers.splice(i, 1); }
    }
  }

  /* ---------- camera fitting and focus ---------- */
  let fly = null;
  function flyTo(target, distance, dir) {
    const d = (dir || camera.position.clone().sub(controls.target)).normalize();
    fly = { t: 0, fromT: controls.target.clone(), fromP: camera.position.clone(), toT: target.clone(), toP: target.clone().add(d.multiplyScalar(distance)) };
  }
  controls.addEventListener('start', () => { fly = null; });
  // Frames the plots with live sessions (or every plot): the robots are what you came to see.
  function fit(instant, all) {
    const box = new THREE.Box3();
    const list = [...pods.values()].filter((p) => !p.leaving);
    const busy = list.filter((p) => p.active);
    for (const p of all || !busy.length ? list : busy) {
      const hx = p.sizeGoal.x / 2 + 1.5, hz = p.sizeGoal.y / 2 + 1.5;
      box.expandByPoint(new THREE.Vector3(p.group.position.x - hx, 0, p.group.position.z - hz)).expandByPoint(new THREE.Vector3(p.group.position.x + hx, 3, p.group.position.z + hz));
    }
    if (box.isEmpty()) box.set(new THREE.Vector3(-6, 0, -6), new THREE.Vector3(6, 3, 6));
    const c = box.getCenter(new THREE.Vector3());
    const r = box.getSize(new THREE.Vector3()).length() / 2;
    const aspect = Math.min(1, camera.aspect);
    const dist = Math.max(18, (r / Math.sin((camera.fov * Math.PI) / 360)) * 0.56 / Math.pow(aspect, 0.8));
    const dir = new THREE.Vector3(0.6, 0.85, 1);
    if (instant) { controls.target.copy(c); camera.position.copy(c).add(dir.normalize().multiplyScalar(dist)); }
    else flyTo(c, dist, dir);
  }
  function focusPod(key) {
    const p = pods.get(key);
    if (!p) return;
    flyTo(p.group.position.clone().setY(1.5), 18 + p.size.y * 0.8, new THREE.Vector3(0.45, 0.75, 1));
  }

  /* ---------- picking: hover tooltip and click ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function hit(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(pickables, false).find((x) => x.object.visible && x.object.parent && x.object.parent.visible);
    return h ? h.object.userData.pick : null;
  }
  function tipOf(info) {
    if (!info) return null;
    if (info.kind === 'session' && info.desk.data) {
      const a = info.desk.data;
      const lines = [`${a.projectName} · ${a.title}`];
      lines.push(({ working: 'Bekerja', waiting: 'Menunggu kamu', needs: 'Butuh kamu: ' + a.needs, starting: 'Memulai…' })[info.desk.mode]);
      if (a.request && a.request.text) lines.push('Request: ' + clip(a.request.text, 90));
      if (a.activity && a.status === 'working') lines.push('Sekarang: ' + a.activity.tool + ' ' + clip(a.activity.text || '', 70));
      if (a.agents.length) lines.push(`${a.agents.length} agent berjalan`);
      if (a.bg.length) lines.push(`${a.bg.length} proses background`);
      lines.push('Klik: detail · klik 2x: terminal + /resume terakhir');
      return lines.join('\n');
    }
    if (info.kind === 'agent' && info.drone.data) {
      const g = info.drone.data;
      return [`Agent · ${g.description}`, g.type || 'agent', g.activity ? 'Sekarang: ' + g.activity.tool + ' ' + clip(g.activity.text || '', 70) : 'memulai…', 'Klik: detail · klik 2x: terminal + /resume terakhir'].join('\n');
    }
    if (info.kind === 'project') return `${info.pod.name}${info.pod.active ? '' : '\nSedang sepi, tidak ada sesi yang berjalan'}\nKlik: dekatkan kamera · klik 2x: terminal + /resume terakhir`;
    if (info.kind === 'session') return `${info.desk.pod.name}\nKlik 2x: buka terminal + /resume terakhir`;
    return null;
  }
  function onMove(ev) {
    const info = hit(ev);
    const t = tipOf(info);
    if (t) renderer.domElement.setAttribute('data-tip', t);
    else renderer.domElement.removeAttribute('data-tip');
    renderer.domElement.style.cursor = info ? 'pointer' : '';
  }
  let downAt = null;
  const onDown = (ev) => { downAt = [ev.clientX, ev.clientY]; };
  // What a double click opens a terminal on: the project, and the session when a robot was hit.
  function terminalTarget(info) {
    if (info.kind === 'project') return { key: info.pod.key, sessionId: null };
    const desk = info.kind === 'agent' ? info.drone.desk : info.desk;
    const a = desk.data;
    return { key: desk.pod.key, sessionId: a && !a.starting ? a.sessionId : null };
  }
  // One click opens details and two open a terminal, so a single click waits a moment to tell them apart.
  let clickTimer = null, lastClick = null;
  function onUp(ev) {
    if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 5) return;
    downAt = null;
    const info = hit(ev);
    if (!info) return;
    const target = terminalTarget(info);
    if (clickTimer && lastClick && lastClick.key === target.key) {
      clearTimeout(clickTimer);
      clickTimer = null;
      if (opts.onTerminal) opts.onTerminal(target.key, target.sessionId);
      return;
    }
    clearTimeout(clickTimer);
    lastClick = target;
    clickTimer = setTimeout(() => { clickTimer = null; singleClick(info); }, 260);
  }
  function singleClick(info) {
    if (disposed) return;
    if (info.kind === 'project') focusPod(info.pod.key);
    else if (info.kind === 'session' && info.desk.data && opts.onOpen) {
      const a = info.desk.data;
      if (a.starting) return;
      opts.onOpen(a.projectKey, a.request && a.request.id ? a.sessionId + ':p' + a.request.id : null);
    } else if (info.kind === 'agent' && info.drone.data && opts.onOpen) opts.onOpen(info.drone.desk.data.projectKey, info.drone.desk.data.sessionId + ':a' + info.drone.data.id);
  }
  function onLabelClick(ev) {
    const f = ev.target.closest('[data-o3d-focus]');
    if (f) { ev.preventDefault(); focusPod(f.dataset.o3dFocus); }
  }
  function onLabelDbl(ev) {
    const f = ev.target.closest('[data-o3d-focus]');
    if (f && opts.onTerminal) { ev.preventDefault(); opts.onTerminal(f.dataset.o3dFocus, null); }
  }
  const onLeave = () => renderer.domElement.removeAttribute('data-tip');
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  renderer.domElement.addEventListener('pointerleave', onLeave);
  labelLayer.addEventListener('click', onLabelClick);
  labelLayer.addEventListener('dblclick', onLabelDbl);

  /* ---------- island size follows the plots ---------- */
  function islandGoal() {
    const box = new THREE.Box2();
    for (const p of pods.values()) {
      if (p.leaving) continue;
      const hx = p.sizeGoal.x / 2, hz = p.sizeGoal.y / 2;
      box.expandByPoint(new THREE.Vector2(p.group.position.x - hx, p.group.position.z - hz)).expandByPoint(new THREE.Vector2(p.group.position.x + hx, p.group.position.z + hz));
    }
    if (box.isEmpty()) box.set(new THREE.Vector2(-4, -4), new THREE.Vector2(4, 4));
    const m = 4.5;
    isl.sizeGoal.set(Math.max(16, box.max.x - box.min.x + m * 2), Math.max(16, box.max.y - box.min.y + m * 2));
    isl.cGoal.set((box.min.x + box.max.x) / 2, 0, (box.min.y + box.max.y) / 2);
  }
  const tmpP = new THREE.Vector3();
  function stepWorld(t, dt) {
    isl.size.lerp(isl.sizeGoal, Math.min(1, dt * 3));
    isl.c.lerp(isl.cGoal, Math.min(1, dt * 3));
    const sx = isl.size.x, sz = isl.size.y;
    island.scale.set(sx, ISLAND_H, sz);
    island.position.set(isl.c.x, -ISLAND_H / 2, isl.c.z);
    T.top.repeat.set(sx / 1.5, sz / 1.5);
    T.sideX.repeat.set(sz / ISLAND_H, 1);
    T.sideZ.repeat.set(sx / ISLAND_H, 1);
    const f = 1 + Math.sin(t * 1.4) * 0.06;
    foam.scale.set(sx + 0.9 * f, 0.04, sz + 0.9 * f);
    foam.position.set(isl.c.x, WATER_Y + 0.02, isl.c.z);
    T.water.offset.set((t * 0.02) % 1, (t * 0.012) % 1);
    for (const d of decor) {
      rim(d.u, d.inset, tmpP);
      d.g.position.copy(tmpP);
      if (!d.flower && !reduced) d.g.rotation.z = Math.sin(t * 1.1 + d.sway) * 0.03;
    }
    for (const l of lamps) l.g.position.copy(rim(l.u, 0.9, tmpP));
    for (const c of clouds) {
      c.x += c.speed * dt * (reduced ? 0.2 : 1);
      if (c.x > 45) c.x = -45;
      c.g.position.set(isl.c.x + c.x, c.y, isl.c.z + c.z);
    }
    if (flies.visible) {
      flyState.forEach((s, i) => {
        rim(s.u + Math.sin(t * 0.1 + s.ph) * 0.01, s.inset, tmpP);
        tmpO.position.set(tmpP.x + Math.sin(t * 0.7 + s.ph) * 0.6, s.h + Math.sin(t * 1.3 + s.ph) * 0.3, tmpP.z + Math.cos(t * 0.6 + s.ph) * 0.6);
        tmpO.rotation.set(0, 0, 0);
        tmpO.scale.setScalar(0.07 * (0.6 + Math.max(0, Math.sin(t * 3 + s.ph)) * 0.8));
        tmpO.updateMatrix();
        flies.setMatrixAt(i, tmpO.matrix);
      });
      flies.instanceMatrix.needsUpdate = true;
    }
    // the sun's shadow box follows the island
    const half = Math.max(sx, sz) / 2 + 8;
    Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 160 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.position.set(isl.c.x + 22, 42, isl.c.z + 16);
    sun.target.position.copy(isl.c);
  }

  /* ---------- size + loop ---------- */
  let W = 1, H = 1;
  function resize() {
    W = Math.max(1, container.clientWidth); H = Math.max(1, container.clientHeight);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const clock = new THREE.Clock();
  let raf = 0, disposed = false, fitted = false;
  function frame() {
    raf = requestAnimationFrame(frame);
    const raw = clock.getDelta();
    const dt = Math.min(0.05, raw);
    const t = clock.elapsedTime;
    if (fly) {
      // camera moves run on wall-clock time, so they finish on time even when frames are slow
      fly.t = Math.min(1, fly.t + Math.min(0.25, raw) / 1.1);
      const k = ease(fly.t);
      controls.target.lerpVectors(fly.fromT, fly.toT, k);
      camera.position.lerpVectors(fly.fromP, fly.toP, k);
      if (fly.t >= 1) fly = null;
    }
    controls.update(dt);
    for (const [key, p] of pods) if (p.tick(t, dt) === false) { p.dispose(); pods.delete(key); islandGoal(); }
    stepWorld(t, dt);
    stepParticles(dt);
    stepFlyers(dt);
    renderer.render(scene, camera);
    placeLabels(W, H);
  }

  const office = {
    agentLabels: false,
    flyPaper,
    update(data) {
      if (disposed) return;
      applyTheme();
      const byProject = new Map();
      for (const a of data.active || []) {
        if (!byProject.has(a.projectKey)) byProject.set(a.projectKey, []);
        byProject.get(a.projectKey).push(a);
      }
      const projects = new Map((data.projects || []).map((p) => [p.key, p]));
      const want = [...byProject.keys()];
      // Keep quiet plots already on screen before adding others, so the island doesn't reshuffle.
      const idle = (data.projects || []).filter((p) => !byProject.has(p.key)).sort((a, b) => (pods.has(b.key) - pods.has(a.key)) || b.lastTs - a.lastTs);
      for (const p of idle) { if (want.length >= Math.max(MAX_PODS, byProject.size)) break; want.push(p.key); }
      const wantSet = new Set(want);
      for (const [key, p] of pods) if (!wantSet.has(key) && !p.leaving) p.leaving = 0.001;
      for (const key of want) {
        let pod = pods.get(key);
        if (pod && pod.leaving) pod.leaving = 0;
        const proj = projects.get(key) || { key, name: (byProject.get(key) || [{}])[0].projectName || key, lastTs: 0 };
        if (!pod) { pod = new Pod(key, proj.name); pods.set(key, pod); }
        pod.set(proj, byProject.get(key) || []);
      }
      islandGoal();
      if (!fitted) {
        fitted = true;
        isl.size.copy(isl.sizeGoal); isl.c.copy(isl.cGoal);
        fit(true);
      }
    },
    fit() { fit(false, true); },
    focus: focusPod,
    setAutoRotate(on) { controls.autoRotate = !!on && !reduced; },
    setAgentLabels(on) {
      office.agentLabels = !!on;
      for (const p of pods.values()) for (const d of p.desks.values()) for (const dr of d.drones.values()) dr.label.visible = office.agentLabels;
    },
    stats() {
      let desks = 0, drones = 0;
      for (const p of pods.values()) for (const d of p.desks.values()) { if (d.data) desks++; drones += d.drones.size; }
      return { pods: pods.size, desks, drones, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
    },
    dispose() {
      disposed = true;
      clearTimeout(clickTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      labelLayer.removeEventListener('click', onLabelClick);
      labelLayer.removeEventListener('dblclick', onLabelDbl);
      for (const p of pods.values()) p.dispose();
      pods.clear();
      for (const f of flyers) scene.remove(f.m);
      controls.dispose();
      Object.values(G).forEach((g) => g.dispose());
      water.geometry.dispose();
      [...Object.values(M), ...Object.values(islandMat), ...flowerMats, ...Object.values(glow), ...solids.values(), waterMat, foamMat, flyMat, pMat].forEach((m) => m.dispose());
      Object.values(T).forEach((t) => t.dispose());
      parts.dispose(); flies.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      labelLayer.remove();
    },
    el: container,
  };
  applyTheme();
  frame();
  return office;
}
