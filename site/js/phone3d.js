/* =====================================================================
   BLONDVIRGO – phone3d.js
   A silver/white iPhone 5 built from primitives in Three.js, loaded only
   on /phone by main.js. No build step: this is an ES module and the
   engine files sit in js/vendor/. If WebGL is missing the page falls
   back to the CSS phone.
   ===================================================================== */
import * as THREE from "three";
import { RoundedBoxGeometry } from "./vendor/RoundedBoxGeometry.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

export function createPhone(holder, opts) {
  opts = opts || {};
  var W = 58.6, H = 123.8, D = 7.6, R = 8.6;                  // iPhone 5, mm
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  holder.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  var camera = new THREE.PerspectiveCamera(28, 1, 1, 2000);
  camera.position.set(0, 0, 330);

  var key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(80, 120, 160); scene.add(key);
  var rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(-120, 40, -100); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  var fill = new THREE.DirectionalLight(0xffffff, 1.0); fill.position.set(-60, -80, 140); scene.add(fill);

  var group = new THREE.Group(); scene.add(group);

  // ---- materials ----
  var aluminium = new THREE.MeshPhysicalMaterial({ color: 0xeceef0, metalness: 0.85, roughness: 0.32, clearcoat: 0.3, clearcoatRoughness: 0.3 });
  var ceramic = new THREE.MeshPhysicalMaterial({ color: 0xfafaf8, metalness: 0.02, roughness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.15 });
    var dark = new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.4, roughness: 0.6 });
  var chrome = new THREE.MeshPhysicalMaterial({ color: 0xcfcfcf, metalness: 1, roughness: 0.25 });

  // ---- body: the aluminium band is the whole rounded slab ----
  var body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 6, R * 0.42), aluminium);
  group.add(body);

  // front glass: black, inset a hair, with a rounded-rectangle outline
  function roundedPlane(w, h, r, depth, mat) {
    var s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    var g = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false });
    return new THREE.Mesh(g, mat);
  }
  var front = roundedPlane(W - 2.2, H - 2.2, R * 0.38, 0.6, ceramic);   // white front bezel
  front.position.z = D / 2 - 0.3; group.add(front);

  // ---- the screen: a canvas texture showing the lock screen ----
  var scrW = 51.7, scrH = 90.4;
  var canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 1136;
  var ctx = canvas.getContext("2d");
  var screenTex = new THREE.CanvasTexture(canvas); screenTex.colorSpace = THREE.SRGBColorSpace;
  var screenMat = new THREE.MeshPhysicalMaterial({ map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 0.9, roughness: 0.1, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 });
  var screenGlass = new THREE.Mesh(new THREE.PlaneGeometry(scrW + 1.4, scrH + 1.4), new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 }));
  screenGlass.position.set(0, 1.2, D / 2 + 0.31); group.add(screenGlass);
  var screen = new THREE.Mesh(new THREE.PlaneGeometry(scrW, scrH), screenMat);
  screen.position.set(0, 1.2, D / 2 + 0.32); group.add(screen);

  function drawScreen(time, date, line) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 640, 1136);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.font = "500 26px Inter, system-ui, sans-serif";
    ctx.fillText("blondvirgo", 90, 40); ctx.fillText(time, 320, 40);
    ctx.fillRect(560, 24, 44, 16); ctx.fillStyle = "#000"; ctx.fillRect(563, 27, 38, 10); ctx.fillStyle = "#fff"; ctx.fillRect(563, 27, 30, 10);
    ctx.font = "200 150px Inter, system-ui, sans-serif"; ctx.fillText(time, 320, 300);
    ctx.font = "400 34px Inter, system-ui, sans-serif"; ctx.globalAlpha = 0.85; ctx.fillText(date, 320, 360); ctx.globalAlpha = 1;
    ctx.font = "400 32px Inter, system-ui, sans-serif"; ctx.globalAlpha = 0.7; ctx.fillText(line || "tap to use", 320, 1060); ctx.globalAlpha = 1;
    screenTex.needsUpdate = true;
  }

  // front details: earpiece, camera, home button
  var ear = new THREE.Mesh(new RoundedBoxGeometry(11, 1.4, 0.6, 2, 0.6), dark); ear.position.set(0, H / 2 - 9.6, D / 2 + 0.2); group.add(ear);
  var fcam = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.6, 24), dark); fcam.rotation.x = Math.PI / 2; fcam.position.set(0, H / 2 - 5.6, D / 2 + 0.2); group.add(fcam);
  var home = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 0.5, 48), new THREE.MeshPhysicalMaterial({ color: 0xf2f2f0, roughness: 0.3, clearcoat: 0.8 }));
  home.rotation.x = Math.PI / 2; home.position.set(0, -H / 2 + 9.8, D / 2 + 0.25); group.add(home);
  var homeRing = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.25, 8, 48), chrome); homeRing.position.copy(home.position); group.add(homeRing);
  var homeSq = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 4, 4), new THREE.MeshStandardMaterial({ color: 0xb5b5b5, metalness: 0.5, roughness: 0.4 }));
  homeSq.rotation.z = Math.PI / 4; homeSq.position.copy(home.position); homeSq.position.z += 0.3; group.add(homeSq);

  // ---- back: aluminium middle + two ceramic glass inlays, logo, text ----
  var backTexCanvas = document.createElement("canvas"); backTexCanvas.width = 512; backTexCanvas.height = 1024;
  var bctx = backTexCanvas.getContext("2d");
  bctx.fillStyle = "rgba(0,0,0,0)"; bctx.clearRect(0, 0, 512, 1024);
  // apple silhouette (own drawing), centred around y=330
  bctx.fillStyle = "#2a2a2a";
  bctx.save(); bctx.translate(256, 330); bctx.scale(1.15, 1.15);
  bctx.beginPath();
  bctx.moveTo(0, -46); bctx.bezierCurveTo(-8, -54, -24, -52, -34, -40);
  bctx.bezierCurveTo(-52, -18, -46, 28, -24, 52); bctx.bezierCurveTo(-14, 62, -4, 58, 0, 56);
  bctx.bezierCurveTo(4, 58, 14, 62, 24, 52); bctx.bezierCurveTo(46, 28, 52, -18, 34, -40);
  bctx.bezierCurveTo(24, -52, 8, -54, 0, -46); bctx.closePath(); bctx.fill();
  bctx.globalCompositeOperation = "destination-out"; bctx.beginPath(); bctx.arc(38, -56, 20, 0, Math.PI * 2); bctx.fill();
  bctx.globalCompositeOperation = "source-over";
  bctx.beginPath(); bctx.moveTo(2, -50); bctx.bezierCurveTo(2, -70, 16, -80, 26, -80); bctx.bezierCurveTo(26, -62, 14, -52, 2, -50); bctx.fill();
  bctx.restore();
  bctx.fillStyle = "#2a2a2a"; bctx.textAlign = "center";
  bctx.font = "500 44px Inter, system-ui, sans-serif"; bctx.fillText("iPhone", 256, 720);
  bctx.fillStyle = "#5a5a5a"; bctx.font = "400 9px Inter, system-ui, sans-serif";
  bctx.fillText("Designed by Apple in California   Assembled in China", 256, 744);
  bctx.fillText("Model A1429   FCC ID: BCG-E2599A   IC: 579C-E2599A", 256, 756);
  bctx.font = "500 14px Inter, system-ui, sans-serif"; bctx.fillText("FC  CE  ⓘ  ♲", 256, 778);
  var backTex = new THREE.CanvasTexture(backTexCanvas); backTex.colorSpace = THREE.SRGBColorSpace;
  var backPlate = new THREE.Mesh(new THREE.PlaneGeometry(W - 1.2, H - 1.2), new THREE.MeshPhysicalMaterial({ map: backTex, transparent: true, metalness: 0.85, roughness: 0.38, color: 0xe6e8ea }));
  backPlate.rotation.y = Math.PI; backPlate.position.z = -D / 2 - 0.05; group.add(backPlate);
  var inlayTop = new THREE.Mesh(new THREE.BoxGeometry(W - 1.4, 16, 0.5), ceramic); inlayTop.position.set(0, H / 2 - 8.7, -D / 2 - 0.15); group.add(inlayTop);
  var inlayBot = new THREE.Mesh(new THREE.BoxGeometry(W - 1.4, 16, 0.5), ceramic); inlayBot.position.set(0, -H / 2 + 8.7, -D / 2 - 0.15); group.add(inlayBot);
  var lens = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.8, 32), new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.1, clearcoat: 1 }));
  lens.rotation.x = Math.PI / 2; lens.position.set(-W / 2 + 8.2, H / 2 - 8.6, -D / 2 - 0.5); group.add(lens);
  var lensRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.3, 8, 32), chrome); lensRing.position.copy(lens.position); group.add(lensRing);
  var flash = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0xf2eedc, roughness: 0.5 }));
  flash.rotation.x = Math.PI / 2; flash.position.set(-W / 2 + 16.5, H / 2 - 8.6, -D / 2 - 0.3); group.add(flash);
  var mic = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16), dark); mic.rotation.x = Math.PI / 2; mic.position.set(-W / 2 + 12.4, H / 2 - 8.6, -D / 2 - 0.3); group.add(mic);

  // ---- sides: buttons and ports ----
  var mute = new THREE.Mesh(new RoundedBoxGeometry(1.4, 5, 2.4, 2, 0.5), chrome); mute.position.set(-W / 2 - 0.4, H / 2 - 23, 0); group.add(mute);
  var vUp = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.2, 24), chrome); vUp.rotation.z = Math.PI / 2; vUp.position.set(-W / 2 - 0.4, H / 2 - 33, 0); group.add(vUp);
  var vDn = vUp.clone(); vDn.position.y = H / 2 - 42; group.add(vDn);
  var power = new THREE.Mesh(new RoundedBoxGeometry(8, 1.4, 2.4, 2, 0.5), chrome); power.position.set(W / 2 - 10, H / 2 + 0.4, 0); group.add(power);
  var port = new THREE.Mesh(new RoundedBoxGeometry(7, 1.2, 2.6, 2, 0.5), dark); port.position.set(0, -H / 2 - 0.3, 0); group.add(port);
  var jack = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 1.4, 24), dark); jack.position.set(-W / 2 + 10, -H / 2 - 0.3, 0); group.add(jack);
  for (var i = 0; i < 6; i++) {
    var hole = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 12), dark);
    hole.position.set(W / 2 - 20 + i * 2.6, -H / 2 - 0.3, 0); group.add(hole);
  }

  // ---- state ----
  var ry = -0.5, rx = 0.1, targetRy = ry, targetRx = rx, spinning = opts.spin !== false, dragging = false, zoom = 1, targetZoom = 1;
  var inertia = 0;

  function resize() {
    var w = holder.clientWidth, h = holder.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    // fit the phone height to ~82% of the holder
    var fov = camera.fov * Math.PI / 180;
    camera.position.z = (H * 1.08 / 2) / Math.tan(fov / 2);
  }
  resize();
  window.addEventListener("resize", resize);

  var running = true;
  (function loop() {
    if (!running) return;
    if (spinning && !dragging) targetRy += 0.004 + inertia;
    inertia *= 0.95;
    ry += (targetRy - ry) * 0.12; rx += (targetRx - rx) * 0.12; zoom += (targetZoom - zoom) * 0.1;
    group.rotation.set(rx, ry, 0); group.scale.setScalar(zoom);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();

  return {
    canvas: renderer.domElement,
    drawScreen: drawScreen,
    setSpin: function (v) { spinning = !!v; },
    drag: function (dx, dy) { targetRy += dx * 0.008; targetRx = Math.max(-0.6, Math.min(0.6, targetRx - dy * 0.005)); inertia = dx * 0.0006; },
    setDragging: function (v) { dragging = !!v; },
    faceFront: function () { spinning = false; targetRy = Math.round(ry / (Math.PI * 2)) * Math.PI * 2; targetRx = 0; targetZoom = 1.08; },
    release: function (spin) { targetZoom = 1; targetRx = 0.1; spinning = !!spin; },
    dispose: function () { running = false; renderer.dispose(); }
  };
}
