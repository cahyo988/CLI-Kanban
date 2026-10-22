// "Kantor 3D": every live Claude Code session is a robot at a desk, every running agent a drone
// circling that desk, every background process a blinking server box. Loaded only when the 3D view opens.
import * as THREE from 'three';
import { OrbitControls } from '/vendor/three/OrbitControls.js';

const MAX_DESKS = 6;      // per project pod; the rest show up as "+N" on the pod sign
const MAX_DRONES = 8;     // per desk
const MAX_PODS = 12;      // active projects always show; idle ones fill up to this
const POD_GAP = 13;
const DESK_DX = 2.9, DESK_DZ = 3.6;

// Pod slots spiral out from the centre, so the busiest office stays in the middle.
const SLOTS = (() => {
  const out = [];
  for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) out.push([x, z]);
  return out.sort((a, b) => (a[0] ** 2 + a[1] ** 2) - (b[0] ** 2 + b[1] ** 2) || Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
})();

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');

function cssColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return {
    bg: v('--bg'), surface: v('--surface'), sunken: v('--sunken'), border: v('--border'), border2: v('--border-2'),
    text: v('--text'), text3: v('--text-3'), accent: v('--accent'),
    green: v('--green'), amber: v('--amber'), red: v('--red'), blue: v('--blue'), purple: v('--purple'), teal: v('--teal'),
    dark: document.documentElement.dataset.theme === 'dark'
      || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches),
  };
}

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
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  camera.position.set(26, 30, 34);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.38;
  controls.minDistance = 6;
  controls.maxDistance = 140;
  controls.autoRotateSpeed = 0.6;
  controls.target.set(0, 1, 0);

  /* ---------- lights, floor, ambience ---------- */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.4);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(30, 50, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 160 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const floorMat = new THREE.MeshStandardMaterial({ roughness: 0.95 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  let grid = null;

  const DUST = 160;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) { dustPos[i * 3] = (Math.random() - 0.5) * 70; dustPos[i * 3 + 1] = Math.random() * 14; dustPos[i * 3 + 2] = (Math.random() - 0.5) * 70; }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ size: 0.09, transparent: true, opacity: 0.35, depthWrite: false });
  scene.add(new THREE.Points(dustGeo, dustMat));

  /* ---------- particles (bursts for finished agents, new prompts, completed tasks) ---------- */
  const PN = 500;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PN * 3).fill(-999);
  const pCol = new Float32Array(PN * 3);
  const pVel = new Float32Array(PN * 3);
  const pLife = new Float32Array(PN);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.2, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false });
  const particles = new THREE.Points(pGeo, pMat);
  particles.frustumCulled = false;
  scene.add(particles);
  let pNext = 0;
  function burst(pos, color, n = 40, speed = 4) {
    const c = new THREE.Color(color);
    for (let k = 0; k < n; k++) {
      const i = pNext; pNext = (pNext + 1) % PN;
      pPos[i * 3] = pos.x; pPos[i * 3 + 1] = pos.y; pPos[i * 3 + 2] = pos.z;
      const a = Math.random() * Math.PI * 2, up = Math.random();
      const sp = speed * (0.4 + Math.random() * 0.6);
      pVel[i * 3] = Math.cos(a) * sp * (1 - up * 0.5); pVel[i * 3 + 1] = up * sp * 1.3 + 1; pVel[i * 3 + 2] = Math.sin(a) * sp * (1 - up * 0.5);
      pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
      pLife[i] = 1 + Math.random() * 0.6;
    }
  }
  function stepParticles(dt) {
    for (let i = 0; i < PN; i++) {
      if (pLife[i] <= 0) continue;
      pLife[i] -= dt;
      if (pLife[i] <= 0) { pPos[i * 3 + 1] = -999; continue; }
      pVel[i * 3 + 1] -= 6 * dt;
      pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
      if (pPos[i * 3 + 1] < 0.05) { pPos[i * 3 + 1] = 0.05; pVel[i * 3 + 1] *= -0.3; pVel[i * 3] *= 0.6; pVel[i * 3 + 2] *= 0.6; }
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;
  }

  /* ---------- shared geometry and materials ---------- */
  const G = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 20),
    sphere: new THREE.SphereGeometry(1, 20, 14),
    body: new THREE.CapsuleGeometry(0.32, 0.5, 6, 14),
    arm: new THREE.CapsuleGeometry(0.09, 0.42, 4, 8),
    ring: new THREE.RingGeometry(0.75, 0.95, 40),
    torus: new THREE.TorusGeometry(0.27, 0.025, 8, 32),
    leaf: new THREE.IcosahedronGeometry(0.45, 0),
    plane: new THREE.PlaneGeometry(1, 1),
    paper: new THREE.ConeGeometry(0.22, 0.5, 3),
  };
  const M = {
    desk: new THREE.MeshStandardMaterial({ roughness: 0.6 }),
    deskLeg: new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.4, metalness: 0.3 }),
    chair: new THREE.MeshStandardMaterial({ color: 0x3b3f47, roughness: 0.7 }),
    head: new THREE.MeshStandardMaterial({ color: 0xf1ede6, roughness: 0.35, metalness: 0.1 }),
    pot: new THREE.MeshStandardMaterial({ color: 0xb8653f, roughness: 0.8 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x4f9a5a, roughness: 0.8, flatShading: true }),
    eye: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    paper: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, side: THREE.DoubleSide }),
  };
  const glow = {};      // status colour → emissive material, rebuilt when the theme changes
  const glowMat = (key) => glow[key] || (glow[key] = new THREE.MeshStandardMaterial({ roughness: 0.3 }));
  const bodyMats = new Map();
  const bodyMat = (hex) => {
    if (!bodyMats.has(hex)) bodyMats.set(hex, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.55 }));
    return bodyMats.get(hex);
  };

  let C = null;
  function applyTheme() {
    const c = cssColors();
    const sig = JSON.stringify(c);
    if (C && C.sig === sig) return;
    C = { ...c, sig };
    renderer.setClearColor(c.bg);
    scene.fog = new THREE.Fog(c.bg, 70, 190);
    floorMat.color.set(c.sunken);
    if (grid) { scene.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
    grid = new THREE.GridHelper(240, 120, c.border2, c.border);
    grid.position.y = 0.005;
    grid.material.transparent = true;
    grid.material.opacity = c.dark ? 0.6 : 0.8;
    scene.add(grid);
    hemi.color.set(c.dark ? 0xc9d2ff : 0xffffff);
    hemi.groundColor.set(c.dark ? 0x1b1a18 : 0xb9b2a6);
    hemi.intensity = c.dark ? 0.9 : 1.5;
    sun.intensity = c.dark ? 1.3 : 2.3;
    M.desk.color.set(c.dark ? 0x4a4038 : 0xd9c3a5);
    M.deskLeg.color.set(c.dark ? 0x2c2a27 : 0x9d978d);
    dustMat.color.set(c.dark ? 0xffffff : c.text3);
    for (const [key, col] of Object.entries({ working: c.green, waiting: c.amber, needs: c.amber, starting: c.blue, agent: c.purple, bg: c.teal, idle: c.text3 })) {
      const m = glowMat(key);
      m.color.set(col);
      m.emissive.set(col);
      m.emissiveIntensity = c.dark ? 1.1 : 0.7;
    }
    for (const pod of pods.values()) pod.recolor();
  }

  /* ---------- canvas textures ---------- */
  function bubbleTexture(text, color) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = color;
    g.beginPath(); g.arc(64, 58, 46, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(46, 96); g.lineTo(64, 124); g.lineTo(76, 96); g.fill();
    g.fillStyle = '#fff';
    g.font = 'bold 64px Segoe UI, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 64, 62);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  // Monitor screens: scrolling "code" while working, a message while waiting, dark when idle.
  class Screen {
    constructor() {
      this.cv = document.createElement('canvas');
      this.cv.width = 192; this.cv.height = 112;
      this.g = this.cv.getContext('2d');
      this.tex = new THREE.CanvasTexture(this.cv);
      this.tex.colorSpace = THREE.SRGBColorSpace;
      this.lines = Array.from({ length: 12 }, () => this.line());
      this.scroll = 0; this.acc = 0; this.mode = null; this.flash = 0;
    }
    line() { return { indent: Math.floor(Math.random() * 4), parts: Array.from({ length: 1 + Math.floor(Math.random() * 4) }, () => [8 + Math.random() * 40, Math.floor(Math.random() * 4)]) }; }
    draw(mode, dt, text) {
      this.acc += dt;
      if (mode === this.mode && mode !== 'working' && this.flash <= 0) return;
      if (mode === 'working' && this.acc < 0.09 && this.mode === mode) return;
      this.acc = 0;
      this.mode = mode;
      const g = this.g, W = 192, H = 112;
      const dark = '#0f1115';
      g.fillStyle = mode === 'idle' ? '#15171b' : dark;
      g.fillRect(0, 0, W, H);
      if (mode === 'working') {
        this.scroll += 2.2;
        if (this.scroll >= 9) { this.scroll = 0; this.lines.shift(); this.lines.push(this.line()); }
        const pal = [C.green, C.blue, C.purple, '#c9c4ba'];
        this.lines.forEach((ln, i) => {
          let x = 8 + ln.indent * 10;
          const y = 8 + i * 9 - this.scroll;
          for (const [w, ci] of ln.parts) { g.fillStyle = pal[ci]; g.fillRect(x, y, w, 4); x += w + 5; }
        });
        if (Math.floor(performance.now() / 400) % 2) { g.fillStyle = C.green; g.fillRect(8, H - 12, 7, 6); }
      } else if (mode === 'waiting' || mode === 'needs') {
        g.fillStyle = C.amber;
        g.font = 'bold 17px Segoe UI, system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText(mode === 'needs' ? 'Butuh izin / jawaban' : 'Menunggu kamu', W / 2, 52);
        g.font = '12px Segoe UI, system-ui, sans-serif';
        g.fillStyle = '#c9c4ba';
        g.fillText(clip(text || '', 30), W / 2, 74);
      } else if (mode === 'starting') {
        g.fillStyle = C.blue;
        g.font = 'bold 16px Segoe UI, system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText('Memulai…', W / 2, 60);
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
      const s = Math.max(0.55, Math.min(1, 34 / dist));
      lab.el.style.display = '';
      const far = s < 0.78;
      if (far !== lab.far) { lab.far = far; lab.el.classList.toggle('far', far); }
      lab.el.style.transform = `translate(${((tmpV.x + 1) / 2) * w}px, ${((1 - tmpV.y) / 2) * h}px) translate(-50%, -100%) scale(${s.toFixed(3)})`;
      lab.el.style.zIndex = String(1000 - Math.round(dist));
    }
  }

  /* ---------- a desk with its robot worker ---------- */
  const pickables = [];
  const pick = (mesh, info) => { mesh.userData.pick = info; pickables.push(mesh); return mesh; };
  const unpick = (root) => root.traverse((o) => { const i = pickables.indexOf(o); if (i >= 0) pickables.splice(i, 1); });
  const mesh = (geo, mat, sx, sy, sz, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(sx, sy, sz); m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };

  class Desk {
    constructor(pod, id) {
      this.pod = pod; this.id = id;
      this.group = new THREE.Group();
      this.group.scale.setScalar(0.001);
      this.appear = 0; this.leaving = 0;
      this.target = new THREE.Vector3();
      this.info = { kind: 'session', desk: this };
      const g = this.group;
      // desk, legs, keyboard, monitor
      g.add(mesh(G.box, M.desk, 2.1, 0.1, 1.05, 0, 1.36, -0.82));
      g.add(mesh(G.box, M.deskLeg, 0.08, 1.31, 0.95, -0.98, 0.655, -0.82));
      g.add(mesh(G.box, M.deskLeg, 0.08, 1.31, 0.95, 0.98, 0.655, -0.82));
      g.add(mesh(G.box, M.dark, 0.8, 0.04, 0.26, 0, 1.43, -0.56));
      g.add(mesh(G.box, M.dark, 0.08, 0.32, 0.08, 0, 1.56, -1.12));
      g.add(mesh(G.box, M.dark, 1.28, 0.8, 0.07, 0, 2.05, -1.14));
      this.screen = new Screen();
      const scr = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: this.screen.tex, toneMapped: false }));
      scr.scale.set(1.18, 0.7, 1); scr.position.set(0, 2.05, -1.1);
      g.add(pick(scr, this.info));
      this.screenPos = new THREE.Vector3(0, 2.05, -1.1);
      // status ring on the floor
      this.ringMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false });
      const ring = new THREE.Mesh(G.ring, this.ringMat);
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02;
      g.add(ring);
      // the seat: chair + robot rotate together, so a waiting robot can turn round to face you
      this.seat = new THREE.Group();
      g.add(this.seat);
      const s = this.seat;
      s.add(mesh(G.cyl, M.dark, 0.42, 0.06, 0.42, 0, 0.08, 0));
      s.add(mesh(G.cyl, M.dark, 0.05, 0.62, 0.05, 0, 0.42, 0));
      s.add(mesh(G.box, M.chair, 0.9, 0.12, 0.88, 0, 0.78, 0));
      s.add(mesh(G.box, M.chair, 0.88, 0.95, 0.12, 0, 1.32, 0.46));
      this.robot = new THREE.Group();
      s.add(this.robot);
      const r = this.robot;
      this.bodyMesh = pick(mesh(G.body, bodyMat(colorOf(pod.key)), 1, 1, 1, 0, 1.46, 0.05), this.info);
      r.add(this.bodyMesh);
      this.head = new THREE.Group();
      this.head.position.set(0, 2.3, 0);
      r.add(this.head);
      this.head.add(pick(mesh(G.box, M.head, 0.64, 0.52, 0.56), this.info));
      this.visor = mesh(G.box, glowMat('idle'), 0.5, 0.13, 0.03, 0, 0.03, -0.29);
      this.head.add(this.visor);
      this.head.add(mesh(G.cyl, M.dark, 0.02, 0.22, 0.02, 0, 0.36, 0));
      this.antenna = mesh(G.sphere, glowMat('idle'), 0.065, 0.065, 0.065, 0, 0.5, 0);
      this.head.add(this.antenna);
      this.arms = [-1, 1].map((side) => {
        const p = new THREE.Group();
        p.position.set(side * 0.42, 1.8, 0);
        p.add(mesh(G.arm, bodyMat(colorOf(pod.key)), 1, 1, 1, 0, -0.3, 0));
        r.add(p);
        return p;
      });
      // bubble over the head while waiting
      this.bubbleMat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false });
      this.bubble = new THREE.Sprite(this.bubbleMat);
      this.bubble.scale.set(0.8, 0.8, 1);
      this.bubble.position.set(0, 3.25, 0);
      this.bubble.visible = false;
      g.add(this.bubble);
      this.bubbleKey = '';
      // server box for background processes
      this.server = new THREE.Group();
      this.server.position.set(1.45, 0, -0.75);
      this.server.add(mesh(G.box, M.dark, 0.5, 1.1, 0.62, 0, 0.55, 0));
      this.leds = [0, 1, 2].map((i) => { const l = mesh(G.box, glowMat('bg'), 0.3, 0.05, 0.02, 0, 0.35 + i * 0.25, 0.32); this.server.add(l); return l; });
      this.server.visible = false;
      g.add(this.server);
      this.drones = new Map();
      this.label = makeLabel('sess', this.labelAnchor = new THREE.Object3D());
      this.labelAnchor.position.set(0, 3.7, 0);
      g.add(this.labelAnchor);
      this.turn = 0; this.phase = Math.random() * 10; this.data = null;
      pod.group.add(g);
    }
    setEmpty() {
      this.data = null;
      this.robot.visible = false;
      this.server.visible = false;
      this.label.visible = false;
      this.mode = 'idle';
      this.ringMat.color.set(C.text3);
      this.ringMat.opacity = 0.18;
      for (const d of this.drones.values()) d.dispose(false);
      this.drones.clear();
    }
    set(a) {
      const prev = this.data;
      this.data = a;
      this.robot.visible = true;
      this.label.visible = true;
      const mode = a.starting ? 'starting' : a.status === 'working' ? 'working' : a.needs ? 'needs' : 'waiting';
      this.mode = mode;
      this.visor.material = this.antenna.material = glowMat(mode);
      this.ringMat.color.set({ working: C.green, waiting: C.amber, needs: C.amber, starting: C.blue }[mode]);
      if (!prev || (prev.lastText && prev.lastText.text) !== (a.lastText && a.lastText.text)) this.screen.mode = null;
      if (prev) {
        if (a.request && prev.request && a.request.id !== prev.request.id && a.request.id) office.flyPaper(this);
        if (a.activity && (!prev.activity || a.activity.ts !== prev.activity.ts)) this.screen.flash = 1;
        if (a.progress && prev.progress && a.progress.done > prev.progress.done) burst(this.worldPoint(0, 2.8, -0.6), C.green, 60, 5);
        if (prev.status === 'working' && a.status === 'waiting') burst(this.worldPoint(0, 3, 0), C.amber, 24, 2.5);
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
    recolor() {
      this.bodyMesh.material = bodyMat(colorOf(this.pod.key));
      this.arms.forEach((p) => { p.children[0].material = this.bodyMesh.material; });
      if (this.data) this.set(this.data); else this.setEmpty();
      this.screen.mode = null;
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
        const k = ease(this.appear);
        this.group.scale.setScalar(Math.max(0.001, k * (1 + Math.sin(k * Math.PI) * 0.15)));
      }
      this.group.position.lerp(this.target, Math.min(1, dt * 4));
      const mode = this.mode || 'idle';
      const amp = reduced ? 0.3 : 1;
      const ph = t + this.phase;
      // typing arms + small head bob while working; arms down while waiting
      const typing = mode === 'working' || mode === 'starting';
      this.arms.forEach((p, k) => {
        const goal = typing ? -1.15 + Math.sin(ph * 17 + k * Math.PI) * 0.13 * amp : -0.2 + Math.sin(ph * 1.3 + k) * 0.04;
        p.rotation.x = lerp(p.rotation.x, goal, Math.min(1, dt * 10));
      });
      this.head.position.y = 2.3 + (typing ? Math.abs(Math.sin(ph * 8.5)) * 0.03 * amp : Math.sin(ph * 1.6) * 0.02);
      this.head.rotation.z = typing ? Math.sin(ph * 0.7) * 0.05 : 0;
      // waiting robots swivel round to look at the camera
      // (the robot faces -z; turning by θ points it at (-sin θ, -cos θ))
      let goalTurn = 0;
      if (mode === 'waiting' || mode === 'needs') {
        const p = this.group.getWorldPosition(tmpV);
        goalTurn = Math.atan2(-(camera.position.x - p.x), -(camera.position.z - p.z));
      }
      const diff = Math.atan2(Math.sin(goalTurn - this.turn), Math.cos(goalTurn - this.turn));
      this.turn += diff * Math.min(1, dt * 3);
      this.seat.rotation.y = this.turn;
      this.antenna.scale.setScalar(0.065 * (typing ? 1 + Math.max(0, Math.sin(ph * 6)) * 0.6 : 1));
      if (mode === 'working') this.ringMat.opacity = 0.35 + Math.sin(ph * 3) * 0.2;
      else if (mode !== 'idle') this.ringMat.opacity = 0.55;
      // bubble
      const bk = mode === 'needs' ? '!' : mode === 'waiting' ? '…' : '';
      if (bk !== this.bubbleKey) {
        this.bubbleKey = bk;
        if (this.bubbleMat.map) this.bubbleMat.map.dispose();
        this.bubbleMat.map = bk ? bubbleTexture(bk, C.amber) : null;
        this.bubbleMat.needsUpdate = true;
        this.bubble.visible = !!bk;
      }
      if (bk) {
        this.bubble.position.y = 3.25 + Math.abs(Math.sin(ph * (bk === '!' ? 5 : 2.2))) * 0.22 * amp;
        const s = bk === '!' ? 0.8 + Math.sin(ph * 10) * 0.06 : 0.75;
        this.bubble.scale.set(s, s, 1);
      }
      this.leds.forEach((l, k) => { l.material = Math.sin(ph * (7 + k * 3) + k) > 0 ? glowMat('bg') : M.dark; });
      this.screen.draw(mode, dt, this.data && this.data.lastText ? this.data.lastText.text : '');
      for (const [id, d] of this.drones) if (d.tick(t, dt) === false) this.drones.delete(id);
      for (const d of this.dying || []) d.tick(t, dt);
      if (this.dying) this.dying = this.dying.filter((d) => !d.dead);
      return true;
    }
    leave() {
      this.leaving = 0.001;
      this.label.visible = false;
      if (this.data) burst(this.worldPoint(0, 2, 0), C.text3, 30, 3);
    }
    dispose() {
      unpick(this.group);
      this.label.remove();
      for (const d of this.drones.values()) d.dispose(false);
      for (const d of this.dying || []) d.dispose(false);
      this.screen.dispose();
      this.ringMat.dispose();
      if (this.bubbleMat.map) this.bubbleMat.map.dispose();
      this.bubbleMat.dispose();
      this.group.parent && this.group.parent.remove(this.group);
    }
  }

  /* ---------- agent drones ---------- */
  class Drone {
    constructor(desk, ag) {
      this.desk = desk;
      this.group = new THREE.Group();
      this.info = { kind: 'agent', drone: this };
      this.group.add(pick(mesh(G.sphere, glowMat('agent'), 0.17, 0.17, 0.17), this.info));
      this.ring = mesh(G.torus, M.dark, 1, 1, 1);
      this.ring.rotation.x = Math.PI / 2;
      this.group.add(this.ring);
      this.group.add(mesh(G.sphere, M.eye, 0.05, 0.05, 0.05, 0, 0.02, 0.16));
      this.group.position.copy(desk.screenPos);
      this.group.scale.setScalar(0.01);
      desk.group.add(this.group);
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
      if (this.dying) {
        this.dying += dt;
        this.group.position.y += dt * 4;
        this.group.scale.setScalar(Math.max(0.001, 1 - this.dying / 1.2));
        this.beamMat.opacity = Math.max(0, 0.4 - this.dying);
        if (this.dying >= 1.2) { this.dispose(false); this.dead = true; return false; }
        return true;
      }
      const amp = reduced ? 0.4 : 1;
      this.angle += dt * 0.7 * amp;
      const a = this.angle + this.slot;
      const grow = Math.min(1, this.age * 1.5);
      const goal = new THREE.Vector3(Math.cos(a) * 1.55, 2.95 + Math.sin(t * 2.2 + this.slot * 3) * 0.18 * amp, -0.6 + Math.sin(a) * 1.25);
      this.group.position.lerp(goal, grow < 1 ? ease(grow) * 0.2 + 0.02 : Math.min(1, dt * 3));
      this.group.scale.setScalar(Math.max(0.01, ease(grow)));
      this.group.lookAt(this.desk.group.localToWorld(this.desk.screenPos.clone()));
      this.ring.rotation.z += dt * 6;
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
        burst(this.group.getWorldPosition(new THREE.Vector3()), C.purple, 40, 3.5);
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

  /* ---------- project pods ---------- */
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
      scene.add(this.group);
      this.info = { kind: 'project', pod: this };
      this.platMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
      this.plat = pick(mesh(G.box, this.platMat, 1, 0.16, 1, 0, 0.08, 0), this.info);
      this.plat.castShadow = false;
      this.group.add(this.plat);
      this.edgeMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.7 });
      this.edge = new THREE.Mesh(G.box, this.edgeMat);
      this.edge.position.y = 0.05;
      this.group.add(this.edge);
      this.plants = [-1, 1].map((sd) => {
        const p = new THREE.Group();
        p.add(mesh(G.cyl, M.pot, 0.26, 0.42, 0.26, 0, 0.37, 0));
        p.add(mesh(G.leaf, M.leaf, 1, 1.25, 1, 0, 1.0, 0));
        p.userData.side = sd;
        this.group.add(p);
        return p;
      });
      this.size = new THREE.Vector2(4, 4);
      this.sizeGoal = new THREE.Vector2(4, 4);
      this.desks = new Map();
      this.deskSlots = new Map();
      this.leaving = 0;
      this.signAnchor = new THREE.Object3D();
      this.group.add(this.signAnchor);
      this.label = makeLabel('proj', this.signAnchor);
      this.recolor();
    }
    recolor() {
      const base = new THREE.Color(C.surface);
      const tint = new THREE.Color(colorOf(this.key));
      this.platMat.color.copy(base).lerp(tint, this.active ? (C.dark ? 0.4 : 0.3) : 0.1);
      this.edgeMat.color.copy(tint);
      for (const d of this.desks.values()) d.recolor();
    }
    set(p, sessions, now) {
      this.name = p.name;
      const wasActive = this.active;
      this.active = sessions.length > 0;
      if (wasActive !== this.active) this.recolor();
      const want = sessions.slice(0, MAX_DESKS);
      const ids = new Set(want.map((a) => a.sessionId));
      if (!want.length) ids.add('__empty');
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
        d.target.set(((i % 3) - (cols - 1) / 2) * DESK_DX, 0.16, (Math.floor(i / 3) - (rows - 1) / 2) * DESK_DZ + 0.3);
        if (d.appear === 0) d.group.position.copy(d.target);
        // neighbouring desks hold their labels at different heights so they don't cover each other
        d.labelAnchor.position.y = 3.7 + (i % 2) * 1.05;
        if (id === '__empty') d.setEmpty();
        else d.set(want.find((a) => a.sessionId === id));
      }
      this.sizeGoal.set(cols * DESK_DX + 2.4, rows * DESK_DZ + 1.8);
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
      const k = this.leaving ? Math.max(0.001, 1 - ease(Math.min(1, this.leaving))) : 1;
      if (this.leaving) this.leaving += dt * 1.6;
      this.group.scale.setScalar(k);
      this.plat.scale.set(this.size.x, 0.16, this.size.y);
      // a glowing rim just below the platform top, visible only around its edge
      this.edge.scale.set(this.size.x + 0.18, 0.1, this.size.y + 0.18);
      this.edgeMat.opacity = this.active ? 0.55 + Math.sin(t * 2.4 + this.slot) * 0.25 : 0.25;
      this.plants.forEach((p) => p.position.set(p.userData.side * (this.size.x / 2 - 0.45), 0.16, -this.size.y / 2 + 0.45));
      this.signAnchor.position.set(0, 0.3, this.size.y / 2 + 0.2);
      for (const [id, d] of this.desks) d.tick(t, dt);
      if (this.leavingDesks) this.leavingDesks = this.leavingDesks.filter((d) => { if (d.tick(t, dt) === false) { d.dispose(); return false; } return true; });
      return !(this.leaving && this.leaving >= 1);
    }
    dispose() {
      for (const d of this.desks.values()) d.dispose();
      for (const d of this.leavingDesks || []) d.dispose();
      unpick(this.group);
      this.label.remove();
      this.platMat.dispose();
      this.edgeMat.dispose();
      scene.remove(this.group);
      usedSlots.delete(this.slot);
    }
  }

  /* ---------- paper planes: a new prompt flies to its desk ---------- */
  const flyers = [];
  function flyPaper(desk) {
    const m = new THREE.Mesh(G.paper, M.paper);
    m.scale.set(1, 1, 0.25);
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
      f.m.rotateX(Math.PI / 2);
      f.m.position.copy(p);
      if (f.t >= 1) { burst(f.to, C.blue, 30, 3); scene.remove(f.m); flyers.splice(i, 1); }
    }
  }

  /* ---------- camera fitting and focus ---------- */
  let fly = null;
  function flyTo(target, distance, dir) {
    const d = (dir || camera.position.clone().sub(controls.target)).normalize();
    fly = { t: 0, fromT: controls.target.clone(), fromP: camera.position.clone(), toT: target.clone(), toP: target.clone().add(d.multiplyScalar(distance)) };
  }
  controls.addEventListener('start', () => { fly = null; });
  function fit(instant) {
    const box = new THREE.Box3();
    for (const p of pods.values()) if (!p.leaving) box.expandByPoint(new THREE.Vector3(p.group.position.x - 6, 0, p.group.position.z - 6)).expandByPoint(new THREE.Vector3(p.group.position.x + 6, 3, p.group.position.z + 6));
    if (box.isEmpty()) box.set(new THREE.Vector3(-6, 0, -6), new THREE.Vector3(6, 3, 6));
    const c = box.getCenter(new THREE.Vector3());
    const r = box.getSize(new THREE.Vector3()).length() / 2;
    const aspect = Math.min(1, camera.aspect);
    const dist = Math.max(18, (r / Math.sin((camera.fov * Math.PI) / 360)) * 0.56 / Math.pow(aspect, 0.8));
    const dir = new THREE.Vector3(0.55, 0.78, 0.95);
    if (instant) { controls.target.copy(c); camera.position.copy(c).add(dir.normalize().multiplyScalar(dist)); }
    else flyTo(c, dist, dir);
  }

  /* ---------- picking: hover tooltip and click ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function hit(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(pickables, false)[0];
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
    if (info.kind === 'project') return `${info.pod.name}\nKlik: dekatkan kamera · klik 2x: terminal + /resume terakhir`;
    if (info.kind === 'session') return `${info.desk.pod.name}\nKlik 2x: buka terminal + /resume terakhir`;
    return null;
  }
  let hovered = null;
  function onMove(ev) {
    const info = hit(ev);
    hovered = info;
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
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  renderer.domElement.addEventListener('pointerleave', () => { renderer.domElement.removeAttribute('data-tip'); });
  labelLayer.addEventListener('click', onLabelClick);
  labelLayer.addEventListener('dblclick', onLabelDbl);

  function focusPod(key) {
    const p = pods.get(key);
    if (!p) return;
    flyTo(p.group.position.clone().setY(1.5), 15 + p.size.y * 0.6, new THREE.Vector3(0.45, 0.75, 1));
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
    for (const [key, p] of pods) if (p.tick(t, dt) === false) { p.dispose(); pods.delete(key); }
    const dp = dustGeo.attributes.position.array;
    for (let i = 0; i < DUST; i++) { dp[i * 3 + 1] += dt * 0.25; if (dp[i * 3 + 1] > 14) dp[i * 3 + 1] = 0; }
    dustGeo.attributes.position.needsUpdate = true;
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
      const now = Date.now();
      const byProject = new Map();
      for (const a of data.active || []) {
        if (!byProject.has(a.projectKey)) byProject.set(a.projectKey, []);
        byProject.get(a.projectKey).push(a);
      }
      const projects = new Map((data.projects || []).map((p) => [p.key, p]));
      const want = [...byProject.keys()];
      // Keep idle pods already on screen before adding others, so the room doesn't reshuffle.
      const idle = (data.projects || []).filter((p) => !byProject.has(p.key)).sort((a, b) => (pods.has(b.key) - pods.has(a.key)) || b.lastTs - a.lastTs);
      for (const p of idle) { if (want.length >= Math.max(MAX_PODS, byProject.size)) break; want.push(p.key); }
      const wantSet = new Set(want);
      for (const [key, p] of pods) if (!wantSet.has(key) && !p.leaving) p.leaving = 0.001;
      for (const key of want) {
        let pod = pods.get(key);
        if (pod && pod.leaving) { pod.leaving = 0; }
        const proj = projects.get(key) || { key, name: (byProject.get(key) || [{}])[0].projectName || key, lastTs: 0 };
        if (!pod) { pod = new Pod(key, proj.name); pods.set(key, pod); }
        pod.set(proj, byProject.get(key) || [], now);
      }
      if (!fitted) { fitted = true; fit(true); }
    },
    fit() { fit(false); },
    focus: focusPod,
    setAutoRotate(on) { controls.autoRotate = !!on && !reduced; },
    setAgentLabels(on) {
      office.agentLabels = !!on;
      for (const p of pods.values()) for (const d of p.desks.values()) for (const dr of d.drones.values()) dr.label.visible = office.agentLabels;
    },
    stats() {
      let desks = 0, drones = 0;
      for (const p of pods.values()) for (const d of p.desks.values()) { if (d.data) desks++; drones += d.drones.size; }
      return { pods: pods.size, desks, drones };
    },
    dispose() {
      disposed = true;
      clearTimeout(clickTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      for (const p of pods.values()) p.dispose();
      pods.clear();
      for (const f of flyers) scene.remove(f.m);
      controls.dispose();
      Object.values(G).forEach((g) => g.dispose());
      Object.values(M).forEach((m) => m.dispose());
      Object.values(glow).forEach((m) => m.dispose());
      bodyMats.forEach((m) => m.dispose());
      floorMat.dispose(); dustGeo.dispose(); dustMat.dispose(); pGeo.dispose(); pMat.dispose();
      if (grid) { grid.geometry.dispose(); grid.material.dispose(); }
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
