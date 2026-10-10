/* ==========================================================================
   CIBERESCUDO 2.0 – MOTOR PRINCIPAL & TÁCTICAS DE CIBERSEGURIDAD
   Sistema de voz fluido, conciso y sin interrupciones abruptas
   ========================================================================== */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// Estado Global
const S = {
  name: 'Agente',
  role: 'Sentinel',
  score: 100,
  blocked: 0,
  voice: true,
  sfx: true,
  crit: 0,
  auto: true,
  vpn: false,
  rate: 1.05,
  combo: 0,
  xp: 120,
  lockdown: false
};

// Cargar estado previo
try {
  S.name = localStorage.getItem('ce_name') || 'Agente';
  S.role = localStorage.getItem('ce_role') || 'Sentinel';
  if (localStorage.getItem('ce_theme')) {
    document.body.dataset.theme = localStorage.getItem('ce_theme');
  }
} catch (e) {}

// ==========================================================================
// 1. SINTETIZADOR DE AUDIO WEB (SFX PROCEDURAL)
// ==========================================================================
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

const SFX = {
  beep(freq = 600, type = 'sine', duration = 0.08) {
    if (!S.sfx || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  },
  shieldZap() {
    if (!S.sfx || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {}
  },
  empPulse() {
    if (!S.sfx || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(650, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
  },
  alarm() {
    if (!S.sfx || !audioCtx) return;
    SFX.beep(880, 'square', 0.15);
    setTimeout(() => SFX.beep(660, 'square', 0.15), 160);
  },
  success() {
    if (!S.sfx || !audioCtx) return;
    SFX.beep(523.25, 'sine', 0.1);
    setTimeout(() => SFX.beep(659.25, 'sine', 0.1), 100);
    setTimeout(() => SFX.beep(783.99, 'sine', 0.18), 200);
  }
};

// ==========================================================================
// 2. LIVE CLOCK & DYNAMIC ISLAND
// ==========================================================================
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  if ($('#liveClock')) $('#liveClock').textContent = `${h}:${m}`;
}
setInterval(updateClock, 1000);
updateClock();

function notifyIsland(text, icon = '🛡️', duration = 3000) {
  const island = $('#dynamicIsland');
  if (!island) return;
  $('#islandText').textContent = text;
  $('#islandIcon').textContent = icon;
  island.classList.add('expanded');
  setTimeout(() => island.classList.remove('expanded'), duration);
}

// ==========================================================================
// 3. MOTOR DE VOZ FLUIDO & COLA INTELIGENTE (SIN CORTES)
// ==========================================================================
const orb = $('#orb');
let activeUtterance = null;
let speechQueue = [];
let isSpeaking = false;

function processSpeechQueue() {
  if (speechQueue.length === 0) {
    isSpeaking = false;
    if (orb) orb.classList.remove('talk');
    if ($('#aiVoiceIndicator')) $('#aiVoiceIndicator').textContent = 'AUDIO ON';
    return;
  }

  isSpeaking = true;
  const item = speechQueue.shift();
  if ($('#bubble')) $('#bubble').textContent = item.text;

  if (!S.voice || !('speechSynthesis' in window)) {
    setTimeout(processSpeechQueue, 400);
    return;
  }

  try {
    const u = new SpeechSynthesisUtterance(item.text);
    activeUtterance = u; // Mantener referencia para evitar garbage collection bug en Chrome
    u.lang = 'es-ES';
    u.rate = S.rate || 1.05;
    u.pitch = 0.85;

    const voices = speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Sabina') || v.name.includes('Alvaro') || v.name.includes('Castilian') || v.name.includes('Helena')));
    if (esVoice) u.voice = esVoice;

    u.onstart = () => {
      if (orb) orb.classList.add('talk');
      if ($('#aiVoiceIndicator')) $('#aiVoiceIndicator').textContent = 'HABLANDO...';
    };

    u.onend = () => {
      activeUtterance = null;
      setTimeout(processSpeechQueue, 150);
    };

    u.onerror = () => {
      activeUtterance = null;
      setTimeout(processSpeechQueue, 100);
    };

    speechSynthesis.speak(u);
  } catch (e) {
    setTimeout(processSpeechQueue, 100);
  }
}

/**
 * Función principal para hablar:
 * @param {string} text - Texto a pronunciar
 * @param {boolean} urgent - Si es true, cancela lo anterior limpiamente para atender la acción inmediata del usuario
 */
function say(text, urgent = true) {
  if (!text) return;
  if ($('#bubble')) $('#bubble').textContent = text;

  if (urgent) {
    // Si el usuario tocó un botón explícitamente, cancelamos la cola y hablamos esto inmediatamente
    speechQueue = [{ text }];
    if ('speechSynthesis' in window) {
      try { speechSynthesis.cancel(); } catch (e) {}
    }
    isSpeaking = false;
    processSpeechQueue();
  } else {
    // Si no es urgente, lo agregamos a la cola para que termine lo que está diciendo
    speechQueue.push({ text });
    if (!isSpeaking) {
      processSpeechQueue();
    }
  }
}

if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

$('#voiceBtn').onclick = () => {
  initAudio();
  S.voice = !S.voice;
  $('#voiceBtn').textContent = S.voice ? '🔊' : '🔇';
  $('#aiVoiceIndicator').textContent = S.voice ? 'AUDIO ON' : 'MUTED';
  if (!S.voice) {
    speechQueue = [];
    try { speechSynthesis.cancel(); } catch (e) {}
    if (orb) orb.classList.remove('talk');
  } else {
    say('Voz de Jarvis activada.');
  }
  SFX.beep(600, 'sine', 0.05);
};

// ==========================================================================
// 4. BIOMETRIC PARTICLES CANVAS (BOOT)
// ==========================================================================
const bioCv = $('#bioCanvas'), bioCx = bioCv ? bioCv.getContext('2d') : null;
let bioParticles = [];
if (bioCv) {
  for (let i = 0; i < 35; i++) {
    bioParticles.push({
      x: Math.random() * 180,
      y: Math.random() * 180,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      rad: Math.random() * 2 + 1
    });
  }
}
function drawBioParticles() {
  if (!bioCx || $('#boot').classList.contains('hidden')) return;
  bioCx.clearRect(0, 0, 180, 180);
  bioCx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#00f0ff';
  bioCx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
  bioCx.lineWidth = 0.8;

  bioParticles.forEach((p, idx) => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > 180) p.vx *= -1;
    if (p.y < 0 || p.y > 180) p.vy *= -1;

    bioCx.beginPath();
    bioCx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
    bioCx.fill();

    for (let j = idx + 1; j < bioParticles.length; j++) {
      const p2 = bioParticles[j];
      const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
      if (dist < 40) {
        bioCx.beginPath();
        bioCx.moveTo(p.x, p.y);
        bioCx.lineTo(p2.x, p2.y);
        bioCx.stroke();
      }
    }
  });
  if ($('#boot').classList.contains('on')) {
    requestAnimationFrame(drawBioParticles);
  }
}
drawBioParticles();

// Roles en Boot con locución concisa
const ROLE_VOICES = {
  'Sentinel': 'Rol Sentinel. Defensa y mitigación de amenazas.',
  'Ethical Hacker': 'Rol NetSec. Auditoría y escaneo de vulnerabilidades.',
  'Admin Corp': 'Rol Director. Supervisión de métricas ejecutivas.'
};

$$('.role-chip').forEach(btn => {
  btn.onclick = () => {
    initAudio();
    $$('.role-chip').forEach(c => c.classList.remove('on'));
    btn.classList.add('on');
    S.role = btn.dataset.role;
    SFX.beep(700, 'sine', 0.05);
    say(ROLE_VOICES[S.role] || `Rol ${S.role}.`);
  };
});

// Boot Form Trigger
$('#nameIn').value = S.name === 'Agente' ? '' : S.name;
$('#go').onclick = startBootSequence;
$('#nameIn').addEventListener('keydown', e => { if (e.key === 'Enter') startBootSequence(); });

function startBootSequence() {
  initAudio();
  const n = $('#nameIn').value.trim() || 'Agente';
  S.name = n;
  try {
    localStorage.setItem('ce_name', n);
    localStorage.setItem('ce_role', S.role);
  } catch (e) {}

  $('#bootForm').hidden = true;
  $('#scanBox').hidden = false;
  SFX.success();
  say(`Iniciando escaneo biométrico para ${S.role} ${S.name}.`);

  const steps = [
    { t: 'Mapeando rostro…', bio: 'CORRECTO (99.8%)', net: 'GENERANDO LLAVES' },
    { t: 'Cifrado cuántico de canal…', bio: 'VALIDADO', net: 'CANAL SHA-512 OK' },
    { t: 'Sincronizando satélites…', bio: 'VALIDADO', fw: 'DEFENSA ACTIVA' },
    { t: `Acceso concedido a ${S.role} ${S.name}`, bio: 'COMPLETADO', fw: 'NIVEL QUANTUM' }
  ];

  let i = 0;
  const interval = setInterval(() => {
    const s = steps[i++];
    $('#scanTxt').textContent = s.t;
    if (s.bio) $('#bioStatus').textContent = s.bio;
    if (s.net) $('#netStatus').textContent = s.net;
    if (s.fw) $('#fwStatus').textContent = s.fw;
    $('#bar').style.width = (i / steps.length * 100) + '%';
    SFX.beep(400 + i * 120, 'sine', 0.06);

    if (i >= steps.length) {
      clearInterval(interval);
      setTimeout(enterApp, 900);
    }
  }, 800);
}

function enterApp() {
  $('#boot').classList.remove('on');
  $('#app').classList.add('on');
  $('#hello').textContent = `Hola, ${S.name}`;
  $('#userRoleBadge').textContent = S.role.toUpperCase();
  
  sizeCanvas();
  renderDevices();
  renderTips();
  calcScore();
  renderLog();

  notifyIsland(`Bienvenido ${S.role} ${S.name}`, '🛡️', 3500);
  say(`Bienvenido ${S.role} ${S.name}. Escudo activo.`);

  // Simulación continua de tráfico en segundo plano
  setInterval(() => {
    if (S.auto && A.length < 5) spawnAttack(false);
  }, 2600);

  requestAnimationFrame(drawMap);
}

// ==========================================================================
// 5. NAVEGACIÓN ENTRE TABS CON NARRACIÓN CONCISA
// ==========================================================================
const TAB_NARRATIONS = {
  'map': 'Mapa global de amenazas en vivo.',
  'dev': 'Topología de equipos de la red.',
  'alert': 'Historial de alertas e incidentes.',
  'tips': 'Academia y desafíos de ciberseguridad.',
  'more': 'Ciber-Laboratorio y herramientas.'
};

function showView(viewId) {
  initAudio();
  SFX.beep(550, 'sine', 0.04);
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + viewId));
  $$('.cyber-tabs button').forEach(b => b.classList.toggle('on', b.dataset.view === viewId));
  if (viewId === 'map') sizeCanvas();
  
  if (TAB_NARRATIONS[viewId]) {
    say(TAB_NARRATIONS[viewId]);
  }
}
$$('.cyber-tabs button').forEach(btn => btn.onclick = () => showView(btn.dataset.view));

// FAB Flotante
$('#fab').onclick = () => {
  initAudio();
  const isOpen = $('#fabwrap').classList.toggle('open');
  SFX.beep(isOpen ? 650 : 450, 'sine', 0.06);
  say(isOpen ? 'Menú de opciones abierto.' : 'Menú cerrado.');
};

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  $('#fabwrap').classList.remove('open');
  const action = btn.dataset.act;
  if (action === 'sim') spawnAttack(true);
  else if (action === 'scan') { showView('dev'); scanDevices(); }
  else if (action === 'status') showStatusDiagnostic();
  else if (action === 'quiz') startQuiz();
  else if (action === 'report') reportSheet();
});

// ==========================================================================
// 6. MODAL FLOTANTE (BOTTOM SHEET)
// ==========================================================================
function sheet(title, html) {
  initAudio();
  $('#shT').textContent = title;
  $('#shB').innerHTML = html;
  $('#sheet').classList.add('on');
  $('#sheetBg').classList.add('on');
  SFX.beep(750, 'sine', 0.05);
}
function closeSheet() {
  $('#sheet').classList.remove('on');
  $('#sheetBg').classList.remove('on');
  SFX.beep(400, 'sine', 0.04);
}
$('#sheetBg').onclick = closeSheet;

// ==========================================================================
// 7. PUNTAJE, SALUD Y TELEMETRÍA
// ==========================================================================
function setScoreVisual(score) {
  const s = Math.max(0, Math.min(100, score));
  $('#scoreTxt').textContent = s;
  
  const ring = $('#ringFg');
  if (ring) {
    ring.style.strokeDashoffset = 138 - (138 * s / 100);
  }

  const lvlDot = $('#lvlDot');
  const lvlTxt = $('#lvl');
  if (s >= 80) {
    lvlDot.className = 'pill-dot ok';
    lvlTxt.textContent = 'Amenaza Baja';
  } else if (s >= 55) {
    lvlDot.className = 'pill-dot mid';
    lvlTxt.textContent = 'Riesgo Moderado';
  } else {
    lvlDot.className = 'pill-dot hi';
    lvlTxt.textContent = 'Amenaza Crítica';
  }
}

function calcScore() {
  let score = 100;
  const riskCount = D.filter(d => d.state === 'done' && d.r > 0).length;
  score -= riskCount * 12;
  if (S.vpn) score += 4;
  score -= S.crit * 3;
  S.score = Math.max(20, Math.min(100, score));
  setScoreVisual(S.score);

  const safe = D.filter(d => d.state === 'done' && d.r === 0).length;
  const risks = D.filter(d => d.state === 'done' && d.r > 0).length;
  if ($('#devCountSafe')) $('#devCountSafe').textContent = safe;
  if ($('#devCountRisk')) $('#devCountRisk').textContent = risks;
}

// ==========================================================================
// 8. DISPOSITIVOS & TOPOLOGÍA DE RED
// ==========================================================================
const D = [
  { n: 'Smartphone Operador', i: '📱', ip: '192.168.1.12', port: '8080 (TLS)', r: 0, m: 'Protegido con clave biométrica y sandbox activo.' },
  { n: 'Estación Laptop Pro', i: '💻', ip: '192.168.1.20', port: '443 (HTTPS)', r: 0, m: 'EDR y firewall cuántico activos.' },
  { n: 'Gateway Wi-Fi 6', i: '📡', ip: '192.168.1.1', port: '80 (Inseguro)', r: 1, m: 'Firmware con parche pendiente CVE-2025-4109.', fix: 'Inyectar Parche Cuántico' },
  { n: 'Smart TV QLED', i: '📺', ip: '192.168.1.31', port: '8008 (Cast)', r: 0, m: 'Tráfico aislado en VLAN de invitados.' },
  { n: 'Cámara IP Perímetro', i: '📷', ip: '192.168.1.45', port: '554 (RTSP)', r: 2, m: 'Credencial por defecto «admin/1234». Riesgo de botnet.', fix: 'Rotar Credencial a SHA-256' },
  { n: 'Smartwatch Ultra', i: '⌚', ip: '192.168.1.52', port: 'BLE Encrypted', r: 0, m: 'Enlace cifrado con teléfono.' },
  { n: 'Servidor NAS Backup', i: '💾', ip: '192.168.1.80', port: '445 (SMBv1)', r: 1, m: 'Protocolo SMBv1 vulnerable a WannaCry.', fix: 'Actualizar a SMBv3 Cifrado' }
];

const RISK_TEXTS = ['SEGURO', 'VULNERABILIDAD MEDIA', 'RIESGO CRÍTICO'];
let isScanningDevs = false;

function renderDevices() {
  const list = $('#devList');
  if (!list) return;
  list.innerHTML = D.map((d, k) => `
    <li data-k="${k}">
      <span class="ic">${d.i}</span>
      <div class="tx">
        <b>${d.n}</b>
        <span>${d.ip} · ${d.state === undefined ? 'Sin escanear' : d.state === 'sc' ? 'Escaneando puertos…' : RISK_TEXTS[d.r]}</span>
      </div>
      <i class="dot ${d.state === 'sc' ? 'sc' : d.state === undefined ? '' : d.r === 0 ? 'ok' : d.r === 1 ? 'mid' : 'hi'}"></i>
    </li>
  `).join('');

  $$('#devList li').forEach(li => {
    li.onclick = () => showDeviceDetail(+li.dataset.k);
  });
}

function scanDevices() {
  if (isScanningDevs) return;
  initAudio();
  isScanningDevs = true;
  D.forEach(d => delete d.state);
  renderDevices();
  $('#devBar').style.width = '0%';
  say('Escaneando dispositivos de la red.');
  notifyIsland('Escaneando Red Local...', '📡');

  let k = 0;
  const step = () => {
    if (k > 0) D[k - 1].state = 'done';
    if (k < D.length) {
      D[k].state = 'sc';
      $('#devBar').style.width = `${((k + 1) / D.length) * 100}%`;
      renderDevices();
      SFX.beep(500 + k * 80, 'sine', 0.05);
      k++;
      setTimeout(step, 550);
    } else {
      isScanningDevs = false;
      renderDevices();
      calcScore();
      const vulns = D.filter(d => d.r > 0).length;
      if (vulns > 0) {
        SFX.alarm();
        say(`Escaneo listo. Se detectaron ${vulns} equipos con riesgo.`);
        notifyIsland(`${vulns} Vulnerabilidades`, '⚠️');
      } else {
        SFX.success();
        say('Escaneo completo. Todos los dispositivos están seguros.');
        notifyIsland('Red 100% Blindada', '🛡️');
      }
    }
  };
  step();
}

function showDeviceDetail(k) {
  const d = D[k];
  if (d.state !== 'done') return;
  sheet(`${d.i} ${d.n}`, `
    <p><b>IP Local:</b> <code>${d.ip}</code><br><b>Puerto:</b> ${d.port}<br><b>Estado:</b> <b style="color:var(--${d.r === 0 ? 'accent' : d.r === 1 ? 'warn' : 'danger'})">${RISK_TEXTS[d.r]}</b></p>
    <p>${d.m}</p>
    ${d.r > 0 ? `<button class="btn" id="btnPatchDev">${d.fix}</button>` : ''}
    <button class="btn alt" onclick="closeSheet()">Cerrar</button>
  `);

  if (d.r > 0) {
    say(`${d.n}. Estado: ${RISK_TEXTS[d.r]}.`);
    $('#btnPatchDev').onclick = () => {
      d.r = 0;
      d.m = 'Vulnerabilidad mitigada. Puerto protegido.';
      renderDevices();
      calcScore();
      closeSheet();
      SFX.success();
      say(`Parche aplicado a ${d.n}.`);
      notifyIsland(`${d.n} Reparado`, '✅');
    };
  } else {
    say(`${d.n}. Equipo seguro.`);
  }
}
$('#btnDevScan').onclick = () => scanDevices();

// ==========================================================================
// 9. MAPA GLOBAL TÁCTICO & INTERCEPTOR DE AMENAZAS
// ==========================================================================
const mapCv = $('#map'), mapCx = mapCv ? mapCv.getContext('2d') : null;
let mW = 0, mH = 0;

function sizeCanvas() {
  if (!mapCv) return;
  const rect = mapCv.getBoundingClientRect();
  if (!rect.width) return;
  const dpr = window.devicePixelRatio || 1;
  mapCv.width = rect.width * dpr;
  mapCv.height = rect.height * dpr;
  mapCx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mW = rect.width;
  mH = rect.height;
}
window.addEventListener('resize', sizeCanvas);

const mapProj = (lo, la) => [(lo + 180) / 360 * mW, (80 - la) / 140 * mH];

const LAND = [
  [[-168,66],[-140,70],[-95,72],[-62,60],[-55,48],[-80,25],[-97,18],[-85,10],[-105,22],[-125,40],[-135,58]],
  [[-80,10],[-60,10],[-35,-6],[-40,-23],[-58,-38],[-68,-55],[-75,-45],[-71,-18],[-81,-5]],
  [[-10,36],[-9,43],[0,50],[10,58],[30,70],[40,60],[40,45],[28,36],[10,38]],
  [[-17,21],[-5,36],[32,31],[43,12],[51,11],[40,-15],[20,-35],[12,-17],[9,4],[-17,14]],
  [[40,45],[40,60],[60,72],[110,76],[170,68],[140,45],[122,30],[110,10],[100,2],[78,8],[58,24],[45,13],[36,36]],
  [[114,-22],[130,-12],[142,-11],[153,-27],[146,-39],[115,-34]]
];

const CITIES = [
  { c: 'Moscú', la: 55.7, lo: 37.6 }, { c: 'Pekín', la: 39.9, lo: 116.4 }, { c: 'Lagos', la: 6.5, lo: 3.4 },
  { c: 'São Paulo', la: -23.5, lo: -46.6 }, { c: 'Teherán', la: 35.7, lo: 51.4 }, { c: 'Nueva York', la: 40.7, lo: -74 },
  { c: 'Fráncfort', la: 50.1, lo: 8.7 }, { c: 'Tokio', la: 35.6, lo: 139.6 }, { c: 'Sídney', la: -33.9, lo: 151.2 }
];

const DEFENSE_TARGET = { c: 'Lima (Base)', la: -12, lo: -77 };

const THREAT_TYPES = [
  { n: 'Phishing', col: '#ffb43b', ic: '🎣', tip: 'Correos que suplantan identidad para robar contraseñas.', cve: 'CVE-2025-0144' },
  { n: 'Ransomware', col: '#ff2a6d', ic: '🔒', tip: 'Intento de secuestro y cifrado de datos locales.', cve: 'CVE-2025-8812' },
  { n: 'DDoS', col: '#b026ff', ic: '🌊', tip: 'Bombardeo de paquetes para saturar ancho de banda.', cve: 'CVE-2024-9901' },
  { n: 'Troyano', col: '#00f0ff', ic: '🦠', tip: 'Inyección de software espía camuflado.', cve: 'CVE-2025-1033' },
  { n: 'Fuerza Bruta', col: '#ff5500', ic: '🔨', tip: 'Diccionario de contraseñas contra puerto SSH.', cve: 'CVE-2024-3401' }
];

let A = [];
let R = [];
let LOG = [];
let attackId = 0;

function spawnAttack(forced = false) {
  const o = CITIES[Math.floor(Math.random() * CITIES.length)];
  const k = THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)];
  const crit = forced || Math.random() < 0.15;
  A.push({ id: ++attackId, o, k, p: 0, crit, speed: crit ? 0.013 : 0.007 });
  
  if (forced) {
    SFX.alarm();
    say(`Simulando ataque ${k.n} desde ${o.c}.`);
    notifyIsland(`Ataque ${k.n}`, '⚡');
  }
}

function getBezierPoint(a, b, t) {
  const [x1, y1] = mapProj(a.lo, a.la);
  const [x2, y2] = mapProj(b.lo, b.la);
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - Math.hypot(x2 - x1, y2 - y1) * 0.32;
  const u = 1 - t;
  return [
    u * u * x1 + 2 * u * t * mx + t * t * x2,
    u * u * y1 + 2 * u * t * my + t * t * y2
  ];
}

function drawMap() {
  if (mW && mapCx) {
    mapCx.clearRect(0, 0, mW, mH);

    // Rejilla táctica
    mapCx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    mapCx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      mapCx.beginPath(); mapCx.moveTo(i * mW / 10, 0); mapCx.lineTo(i * mW / 10, mH); mapCx.stroke();
    }
    for (let i = 1; i < 6; i++) {
      mapCx.beginPath(); mapCx.moveTo(0, i * mH / 6); mapCx.lineTo(mW, i * mH / 6); mapCx.stroke();
    }

    // Continentes
    mapCx.fillStyle = 'rgba(10, 45, 80, 0.35)';
    mapCx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    mapCx.lineWidth = 1;
    LAND.forEach(poly => {
      mapCx.beginPath();
      poly.forEach(([lo, la], i) => {
        const [x, y] = mapProj(lo, la);
        i ? mapCx.lineTo(x, y) : mapCx.moveTo(x, y);
      });
      mapCx.closePath();
      mapCx.fill();
      mapCx.stroke();
    });

    // Ciudades
    CITIES.forEach(c => {
      const [x, y] = mapProj(c.lo, c.la);
      mapCx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      mapCx.beginPath();
      mapCx.arc(x, y, 2.5, 0, Math.PI * 2);
      mapCx.fill();
    });

    // Nodo Base Defensivo (Lima)
    const [tx, ty] = mapProj(DEFENSE_TARGET.lo, DEFENSE_TARGET.la);
    const pulse = 8 + 4 * Math.sin(Date.now() / 250);
    mapCx.strokeStyle = '#39ff7a';
    mapCx.lineWidth = 2;
    mapCx.beginPath();
    mapCx.arc(tx, ty, pulse, 0, Math.PI * 2);
    mapCx.stroke();
    mapCx.fillStyle = '#39ff7a';
    mapCx.beginPath();
    mapCx.arc(tx, ty, 3.5, 0, Math.PI * 2);
    mapCx.fill();

    // Animación de Ataques
    A.forEach(a => {
      a.p += a.speed;
      mapCx.strokeStyle = a.k.col;
      mapCx.lineWidth = a.crit ? 3.5 : 2;
      mapCx.beginPath();
      const startT = Math.max(0, a.p - 0.28);
      for (let t = startT; t <= a.p; t += 0.02) {
        const [x, y] = getBezierPoint(a.o, DEFENSE_TARGET, t);
        t <= startT + 0.001 ? mapCx.moveTo(x, y) : mapCx.lineTo(x, y);
      }
      mapCx.stroke();

      const [hx, hy] = getBezierPoint(a.o, DEFENSE_TARGET, Math.min(a.p, 1));
      mapCx.fillStyle = a.k.col;
      mapCx.beginPath();
      mapCx.arc(hx, hy, a.crit ? 5 : 3.5, 0, Math.PI * 2);
      mapCx.fill();

      a.curX = hx; a.curY = hy;

      if (a.p >= 1) {
        a.done = true;
        R.push({ x: tx, y: ty, r: 4, col: a.k.col });
        handleAttackBlocked(a, false);
      }
    });

    A = A.filter(a => !a.done);

    // Ondas de Impacto / Deflexión
    R.forEach(r => {
      r.r += 1.2;
      mapCx.strokeStyle = r.col;
      mapCx.globalAlpha = Math.max(0, 1 - r.r / 35);
      mapCx.lineWidth = 2;
      mapCx.beginPath();
      mapCx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      mapCx.stroke();
      mapCx.globalAlpha = 1;
    });
    R = R.filter(r => r.r < 35);

    if ($('#nLive')) $('#nLive').textContent = A.length;
  }
  requestAnimationFrame(drawMap);
}

function handleAttackBlocked(a, manual = false) {
  S.blocked++;
  if (manual) {
    S.combo++;
    S.xp += 25;
    SFX.shieldZap();
    notifyIsland(`¡Interceptado! +25 XP (x${S.combo})`, '💥', 1800);
    say(`¡Ataque ${a.k.n} interceptado!`);
  } else {
    // Los bloqueos automáticos solo hacen SFX sutil, NUNCA cortan la voz del usuario
    SFX.beep(250, 'square', 0.06);
  }

  $('#nBlocked').textContent = S.blocked;
  $('#defenseCombo').textContent = manual ? `x${S.combo}` : '100%';

  if (a.crit) {
    S.crit++;
    calcScore();
    setTimeout(() => { S.crit = Math.max(0, S.crit - 1); calcScore(); }, 12000);
  }

  const timeStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  LOG.unshift({ ...a, manual, t: timeStr });
  if (LOG.length > 40) LOG.pop();
  renderLog();
}

// Intercepción táctica interactiva en mapa
if (mapCv) {
  mapCv.addEventListener('click', ev => {
    initAudio();
    const rect = mapCv.getBoundingClientRect();
    const clickX = ev.clientX - rect.left;
    const clickY = ev.clientY - rect.top;

    const targetAtk = A.find(a => Math.hypot(a.curX - clickX, a.curY - clickY) < 26);
    if (targetAtk) {
      targetAtk.done = true;
      R.push({ x: targetAtk.curX, y: targetAtk.curY, r: 6, col: '#00f0ff' });
      handleAttackBlocked(targetAtk, true);
      return;
    }

    const touchedCity = CITIES.find(c => {
      const [px, py] = mapProj(c.lo, c.la);
      return Math.hypot(px - clickX, py - clickY) < 20;
    });

    if (touchedCity) {
      const count = LOG.filter(l => l.o.c === touchedCity.c).length;
      sheet(`📍 Nodo ${touchedCity.c}`, `
        <p>Ataques originados desde este nodo: <b>${count}</b></p>
        <button class="btn" id="btnBlockCity">Aislar Nodo en Firewall</button>
        <button class="btn alt" onclick="closeSheet()">Cerrar</button>
      `);
      say(`Nodo ${touchedCity.c}. ${count} incidentes.`);
      $('#btnBlockCity').onclick = () => {
        closeSheet();
        SFX.success();
        say(`Nodo ${touchedCity.c} aislado en firewall.`);
        notifyIsland(`Nodo ${touchedCity.c} Aislado`, '🔒');
      };
    }
  });
}

// Botones de acción del mapa
$('#btnSpawnAttack').onclick = () => {
  initAudio();
  spawnAttack(true);
};
$('#btnEmpPulse').onclick = () => {
  initAudio();
  if (A.length === 0) {
    spawnAttack(false);
  }
  SFX.empPulse();
  A.forEach(a => {
    a.done = true;
    R.push({ x: a.curX || mW / 2, y: a.curY || mH / 2, r: 8, col: '#00f0ff' });
    handleAttackBlocked(a, true);
  });
  say('Pulso electromagnético detonado.');
  notifyIsland('Pulso EMP Detonado', '💥', 3000);
};

// ==========================================================================
// 10. REGISTRO & LOGS TÁCTICOS
// ==========================================================================
function renderLog() {
  const formatLi = (e, k) => `
    <li data-k="${k}">
      <span class="ic">${e.k.ic}</span>
      <div class="tx">
        <b>${e.k.n} (${e.o.c})</b>
        <span>${e.t} · ${e.manual ? '⚡ Interceptado' : '🛡️ Escudo'} · ${e.k.cve}</span>
      </div>
      <i class="dot ${e.crit ? 'hi' : 'ok'}"></i>
    </li>
  `;

  const mini = $('#miniFeed');
  if (mini) {
    mini.innerHTML = LOG.slice(0, 4).map(formatLi).join('') || '<li><div class="tx"><span>Esperando telemetría...</span></div></li>';
  }
  const full = $('#alertList');
  if (full) {
    full.innerHTML = LOG.map(formatLi).join('') || '<li><div class="tx"><span>No hay incidentes registrados. Usa ⚡ para simular uno.</span></div></li>';
  }
  if ($('#feedCountBadge')) $('#feedCountBadge').textContent = `${LOG.length} eventos`;

  $$('#miniFeed li[data-k], #alertList li[data-k]').forEach(li => {
    li.onclick = () => {
      const e = LOG[+li.dataset.k];
      if (!e) return;
      sheet(`${e.k.ic} ${e.k.n}`, `
        <p><b>Origen:</b> ${e.o.c}<br><b>Hora:</b> ${e.t}<br><b>Firma:</b> <code>${e.k.cve}</code><br><b>Estado:</b> Neutralizado</p>
        <p>${e.k.tip}</p>
        <button class="btn" id="btnAudioExplain">Explicación por Voz</button>
        <button class="btn alt" onclick="closeSheet()">Cerrar</button>
      `);
      say(`Ataque ${e.k.n} neutralizado.`);
      $('#btnAudioExplain').onclick = () => say(`${e.k.n}. ${e.k.tip}`);
    };
  });
}
$('#btnClearLogs').onclick = () => {
  initAudio();
  LOG = [];
  renderLog();
  SFX.beep(400, 'sine', 0.05);
  say('Historial de alertas limpiado.');
};

// ==========================================================================
// 11. CIBER-ACADEMIA & DESAFÍO INTERACTIVO
// ==========================================================================
const TIPS = [
  ['🔑', 'Claves de Alta Entropía', 'Usa frases de 16 caracteres y no repitas claves.'],
  ['🛡️', '2FA Seguro', 'Prefiere aplicaciones autenticadoras sobre SMS.'],
  ['🎣', 'Detección de Phishing', 'Desconfía de la urgencia y revisa el remitente.'],
  ['📶', 'Wi-Fi Público Seguro', 'Navega siempre con VPN en redes públicas.'],
  ['🔄', 'Parcheo de Zero-Days', 'Mantén actualizados tus dispositivos y aplicaciones.'],
  ['💾', 'Copias de Seguridad', 'Realiza respaldos offline para protegerte del Ransomware.']
];

function renderTips() {
  const list = $('#tipList');
  if (!list) return;
  list.innerHTML = TIPS.map((t, k) => `
    <li data-k="${k}">
      <span class="ic">${t[0]}</span>
      <div class="tx">
        <b>${t[1]}</b>
        <span>Toca para escuchar explicación</span>
      </div>
      <span class="arrow-tag">TUTOR</span>
    </li>
  `).join('');

  $$('#tipList li').forEach(li => {
    li.onclick = () => {
      const item = TIPS[+li.dataset.k];
      sheet(`${item[0]} ${item[1]}`, `
        <p>${item[2]}</p>
        <button class="btn" onclick="say('${item[1]}. ${item[2]}')">🔊 Escuchar a Jarvis</button>
        <button class="btn alt" onclick="closeSheet()">Cerrar</button>
      `);
      say(`${item[1]}. ${item[2]}`);
    };
  });
}

// Ciber-Quiz Gamificado
const QUIZ_QUESTIONS = [
  {
    q: 'Recibes un SMS urgente del banco pidiendo verificar tu clave. ¿Qué haces?',
    opts: ['Hago clic en el enlace', 'Entro por la app oficial del banco', 'Reenvío el mensaje'],
    ans: 1,
    exp: 'Correcto. Nunca abras enlaces de mensajes urgentes.'
  },
  {
    q: '¿Qué contraseña es más resistente a un ataque de fuerza bruta?',
    opts: ['Carlos123456*', 'Tr0nador_Azul#2026!Galaxia', 'Admin@2025'],
    ans: 1,
    exp: 'Correcto. La longitud de 26 caracteres la hace impenetrable.'
  },
  {
    q: '¿Cuál método de 2FA es el más seguro frente a SIM-Swapping?',
    opts: ['Código por SMS', 'Llamada telefónica', 'App autenticadora o llave física'],
    ans: 2,
    exp: 'Correcto. Las apps de autenticación no dependen de la línea celular.'
  }
];

function startQuiz() {
  initAudio();
  say('Iniciando test de ciberseguridad.');
  let curQ = 0, scoreQuiz = 0;
  function renderQ() {
    const q = QUIZ_QUESTIONS[curQ];
    sheet(`🎯 Desafío (${curQ + 1}/${QUIZ_QUESTIONS.length})`, `
      <p style="font-size:14px; color:#fff; font-weight:600">${q.q}</p>
      ${q.opts.map((opt, i) => `
        <button class="btn alt opt-btn" data-idx="${i}" style="margin-bottom:8px; text-align:left">${i + 1}. ${opt}</button>
      `).join('')}
    `);

    $$('.opt-btn').forEach(btn => {
      btn.onclick = () => {
        const chosen = +btn.dataset.idx;
        if (chosen === q.ans) {
          scoreQuiz++;
          SFX.success();
          btn.style.borderColor = 'var(--accent)';
          btn.style.background = 'rgba(57, 255, 122, 0.2)';
          say(q.exp);
        } else {
          SFX.alarm();
          btn.style.borderColor = 'var(--danger)';
          btn.style.background = 'rgba(255, 42, 109, 0.2)';
          say('Incorrecto. ' + q.exp);
        }
        setTimeout(() => {
          curQ++;
          if (curQ < QUIZ_QUESTIONS.length) {
            renderQ();
          } else {
            showQuizResult(scoreQuiz);
          }
        }, 1100);
      };
    });
  }
  renderQ();
}
$('#startQuizBtn').onclick = startQuiz;

function showQuizResult(score) {
  const total = QUIZ_QUESTIONS.length;
  const isPerfect = score === total;
  sheet(`🏆 Resultado del Test`, `
    <p style="text-align:center; font-size:24px; font-weight:700; color:var(--primary)">${score} / ${total} Correctas</p>
    <p style="text-align:center">${isPerfect ? '¡Excelente! Rango Ciber-Defensor Legendario alcanzado.' : 'Test completado. Revisa las recomendaciones en Academia.'}</p>
    <button class="btn" onclick="closeSheet()">Finalizar</button>
  `);
  if (isPerfect) {
    SFX.success();
    say(`¡Puntaje perfecto! ${score} de ${total}.`);
  } else {
    say(`Test completado con ${score} aciertos.`);
  }
}

// ==========================================================================
// 12. HERRAMIENTAS AVANZADAS (CIBER-LABORATORIO) CON VOZ CONCISA
// ==========================================================================
$$('[data-tool]').forEach(li => {
  li.onclick = () => {
    const tool = li.dataset.tool;
    if (tool === 'link') linkScannerSheet();
    else if (tool === 'pass') passVaultSheet();
    else if (tool === 'darkweb') darkWebSheet();
    else if (tool === 'stats') statsSheet();
    else if (tool === 'report') reportSheet();
  };
});

// A. Escáner IA de Phishing & SMS
function linkScannerSheet() {
  say('Escáner de Phishing y SMS abierto.');
  sheet('🔍 Escáner IA de Phishing & SMS', `
    <p>Pega cualquier enlace o mensaje para analizar riesgos.</p>
    <textarea id="phishInput" placeholder="Ej: Tu cuenta fue suspendida, ingresa a http://banco-alerta.com"></textarea>
    <button class="btn" id="btnRunPhish">Analizar</button>
    <div id="phishResult"></div>
  `);

  $('#btnRunPhish').onclick = () => {
    const txt = $('#phishInput').value.trim();
    if (!txt) return;
    initAudio();
    SFX.beep(700, 'sine', 0.1);

    const issues = [];
    let risk = 10;
    const lower = txt.toLowerCase();

    if (lower.includes('http://')) { risk += 30; issues.push('Conexión HTTP no cifrada.'); }
    if (/\d+\.\d+\.\d+\.\d+/.test(txt)) { risk += 35; issues.push('Apunta a una dirección IP directa.'); }
    if (lower.includes('urgente') || lower.includes('inmediato') || lower.includes('suspend') || lower.includes('bloqueo')) {
      risk += 25; issues.push('Patrón de urgencia psicológica.');
    }
    if (lower.includes('premio') || lower.includes('ganador') || lower.includes('gratis') || lower.includes('paquete')) {
      risk += 20; issues.push('Gancho de premio o entrega falso.');
    }

    const isSafe = risk < 35;
    const isMid = risk >= 35 && risk < 65;
    const color = isSafe ? 'accent' : isMid ? 'warn' : 'danger';
    const tag = isSafe ? 'SEGURO' : isMid ? 'SOSPECHOSO' : 'PELIGRO PHISHING';

    $('#phishResult').innerHTML = `
      <div style="margin-top:12px; padding:10px; border-radius:10px; background:rgba(0,0,0,0.4); border:1px solid var(--${color})">
        <b style="color:var(--${color}); font-size:14px">${tag} (Riesgo ${risk}/100)</b>
        <ul style="padding-left:18px; margin-top:6px; font-size:12px; color:var(--text-muted)">
          ${issues.length ? issues.map(i => `<li>${i}</li>`).join('') : '<li>No se hallaron amenazas conocidas.</li>'}
        </ul>
      </div>
    `;
    say(`Análisis: ${tag}. Riesgo ${risk} sobre 100.`);
  };
}

// B. Bóveda & Entropía Cuántica de Claves
function passVaultSheet() {
  say('Bóveda de contraseñas.');
  sheet('🔐 Bóveda & Entropía Cuántica', `
    <p>Mide la fuerza de tu clave o genera una militar.</p>
    <input id="pwdIn" placeholder="Escribe tu clave" type="text" autocomplete="off">
    <div class="barwrap-cyber"><div id="pwdBar" class="bar-fill"></div></div>
    <div id="pwdMeta" style="font-size:12px; margin-bottom:10px; color:var(--text-muted)">Escribe para calcular fuerza...</div>
    <button class="btn" id="btnGenPass">⚡ Generar Clave Militar</button>
    <button class="btn alt" id="btnCopyPass">Copiar</button>
  `);

  const analyzePass = () => {
    const p = $('#pwdIn').value;
    let score = Math.min(40, p.length * 3.5);
    if (/[a-z]/.test(p)) score += 15;
    if (/[A-Z]/.test(p)) score += 15;
    if (/\d/.test(p)) score += 15;
    if (/[^a-zA-Z0-9]/.test(p)) score += 20;
    if (/(.)\1\1|123|password|admin|qwerty/i.test(p)) score -= 30;
    score = Math.max(0, Math.min(100, score));

    const bar = $('#pwdBar');
    bar.style.width = score + '%';
    const timeCrack = score > 80 ? '3.8 mil millones de años' : score > 50 ? '4 meses' : '3 segundos';
    const col = score > 80 ? 'var(--accent)' : score > 50 ? 'var(--warn)' : 'var(--danger)';
    bar.style.background = col;

    $('#pwdMeta').innerHTML = `Fuerza: <b style="color:${col}">${score}%</b> · Tiempo de hackeo: <b style="color:#fff">${timeCrack}</b>`;
  };

  $('#pwdIn').oninput = analyzePass;
  $('#btnGenPass').onclick = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?_-';
    const rand = new Uint32Array(24);
    crypto.getRandomValues(rand);
    $('#pwdIn').value = [...rand].map(n => chars[n % chars.length]).join('');
    analyzePass();
    SFX.success();
    say('Contraseña militar de 24 caracteres generada.');
  };
  $('#btnCopyPass').onclick = () => {
    navigator.clipboard.writeText($('#pwdIn').value);
    notifyIsland('Clave Copiada', '📋');
    SFX.beep(800, 'sine', 0.05);
    say('Copiada al portapapeles.');
  };
}

// C. Dark Web Breach Simulator
function darkWebSheet() {
  say('Radar de filtraciones Dark Web.');
  sheet('🕵️ Radar de Filtraciones Dark Web', `
    <p>Ingresa tu correo para buscar filtraciones en la red.</p>
    <input id="dwEmail" placeholder="tu-correo@ejemplo.com" type="email">
    <button class="btn" id="btnDwScan">Buscar Filtraciones</button>
    <div id="dwResults"></div>
  `);

  $('#btnDwScan').onclick = () => {
    const email = $('#dwEmail').value.trim();
    if (!email) return;
    initAudio();
    SFX.beep(600, 'sine', 0.1);
    say('Buscando en registros de la Dark Web...');

    setTimeout(() => {
      $('#dwResults').innerHTML = `
        <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px">
          <div style="background:rgba(255,42,109,0.15); border:1px solid var(--danger); padding:10px; border-radius:10px">
            <b style="color:var(--danger)">⚠️ Filtración Histórica Detectada</b>
            <p style="font-size:11px; margin:2px 0 0; color:var(--text-muted)">Datos expuestos: Contraseñas cifradas y correos.</p>
          </div>
          <p style="font-size:11px; color:var(--accent)">💡 Recomendación: Activa 2FA y renueva tus claves.</p>
        </div>
      `;
      SFX.alarm();
      say('Se detectaron filtraciones antiguas asociadas a este correo.');
    }, 600);
  };
}

// D. Telemetría & Estadísticas
function statsSheet() {
  say(`Telemetría: ${S.blocked} ataques bloqueados en total.`);
  sheet('📊 Telemetría & Gráficos Cuánticos', `
    <p>Ataques interceptados por vector</p>
    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px">
      ${THREAT_TYPES.map(k => {
        const count = LOG.filter(l => l.k.n === k.n).length;
        const pct = Math.min(100, count * 15 + 10);
        return `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px">
              <span>${k.ic} ${k.n}</span>
              <b>${count}</b>
            </div>
            <div class="barwrap-cyber"><div class="bar-fill" style="width:${pct}%; background:${k.col}"></div></div>
          </div>
        `;
      }).join('')}
    </div>
    <button class="btn alt" onclick="closeSheet()">Cerrar</button>
  `);
}

// E. Informe Forense
function reportSheet() {
  say('Generando informe de seguridad.');
  const when = new Date().toLocaleString('es-PE');
  const safeCount = D.filter(d => d.r === 0).length;
  const reportText = `================================================
INFORME FORENSE DE CIBERSEGURIDAD – CIBERESCUDO 2.0
================================================
Operador: ${S.name} (${S.role})
Fecha: ${when}
Puntaje: ${S.score} / 100
Ataques Bloqueados: ${S.blocked}
Dispositivos: ${D.length} (${safeCount} Seguros, ${D.length - safeCount} Vulnerables)
VPN: ${S.vpn ? 'ACTIVA' : 'DESACTIVADA'}

EVENTOS:
${LOG.slice(0, 10).map(l => `- [${l.t}] ${l.k.n} (${l.k.cve})`).join('\n') || '- Sin incidentes'}
================================================`;

  sheet('📑 Informe Forense', `
    <p><b>Operador:</b> ${S.name} · <b>Score:</b> ${S.score}%<br><b>Ataques Bloqueados:</b> ${S.blocked}</p>
    <button class="btn" id="btnDlReport">📥 Descargar Archivo (.txt)</button>
    <button class="btn alt" onclick="closeSheet()">Cerrar</button>
  `);

  $('#btnDlReport').onclick = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reporte-ciberescudo-${Date.now()}.txt`;
    a.click();
    SFX.success();
    say('Informe descargado.');
    notifyIsland('Informe Descargado', '📄');
  };
}

// ==========================================================================
// 13. AJUSTES, TEMAS & PROTOCOLO LOCKDOWN CON VOZ
// ==========================================================================
// VPN Toggle
function toggleVpn() {
  initAudio();
  S.vpn = !S.vpn;
  const swV = $('#swVpn');
  if (swV) {
    swV.classList.toggle('on', S.vpn);
    swV.setAttribute('aria-pressed', S.vpn);
  }
  $('#vpnTx').textContent = S.vpn ? 'Activa · Túnel AES-256' : 'Desactivada · IP Expuesta';
  $('#vpnPillText').textContent = S.vpn ? 'VPN On' : 'VPN Off';
  calcScore();
  SFX.beep(S.vpn ? 800 : 400, 'sine', 0.08);
  say(S.vpn ? 'VPN cuántica activada.' : 'VPN desactivada.');
  notifyIsland(S.vpn ? 'VPN Conectada' : 'VPN Desconectada', '🌐');
}
$('#swVpn').onclick = toggleVpn;
$('#pillVpnQuick').onclick = toggleVpn;

// SFX Toggle
$('#swSfx').onclick = () => {
  initAudio();
  S.sfx = !S.sfx;
  $('#swSfx').classList.toggle('on', S.sfx);
  $('#swSfx').setAttribute('aria-pressed', S.sfx);
  say(S.sfx ? 'Sonido activado.' : 'Sonido silenciado.');
};

// Voice Settings
$('#swVoice').onclick = () => $('#voiceBtn').click();
$('#rate').oninput = e => { S.rate = +e.target.value; };
$('#rate').onchange = () => say('Velocidad de voz ajustada.');

// Auto Attacks
$('#swAuto').onclick = () => {
  initAudio();
  S.auto = !S.auto;
  $('#swAuto').classList.toggle('on', S.auto);
  $('#swAuto').setAttribute('aria-pressed', S.auto);
  say(S.auto ? 'Tráfico automático activado.' : 'Tráfico en pausa.');
};

// Themes con locución
const THEME_NAMES = {
  'cyber': 'Cian',
  'neon': 'Violeta',
  'matrix': 'Matrix',
  'solar': 'Ámbar',
  'crimson': 'Rojo'
};

$$('.th-btn').forEach(btn => {
  btn.onclick = () => {
    initAudio();
    const t = btn.dataset.t;
    document.body.dataset.theme = t;
    $$('.th-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    try { localStorage.setItem('ce_theme', t); } catch (e) {}
    SFX.beep(750, 'sine', 0.05);
    say(`Tema ${THEME_NAMES[t] || t}.`);
  };
});

// Rename Operator
$('#rename').onclick = () => {
  const n = prompt('Nuevo alias:', S.name);
  if (n && n.trim()) {
    S.name = n.trim().slice(0, 20);
    try { localStorage.setItem('ce_name', S.name); } catch (e) {}
    $('#hello').textContent = `Hola, ${S.name}`;
    say(`Nombre actualizado a ${S.name}.`);
  }
};

// Protocolo de Emergencia Lockdown
$('#panicBtn').onclick = () => {
  initAudio();
  S.lockdown = !S.lockdown;
  document.body.classList.toggle('lockdown-active', S.lockdown);
  
  if (S.lockdown) {
    SFX.alarm();
    if (!S.vpn) toggleVpn();
    say('¡Protocolo Lockdown activado! Red aislada.');
    notifyIsland('EMERGENCIA LOCKDOWN', '🚨', 4000);
  } else {
    SFX.success();
    say('Lockdown desactivado.');
    notifyIsland('Lockdown Desactivado', '🛡️');
  }
};

// Diagnóstico General
function showStatusDiagnostic() {
  sheet('🛡️ Diagnóstico de Seguridad', `
    <p><b>Operador:</b> ${S.name} (${S.role})<br>
    <b>Nivel de Blindaje:</b> ${S.score}%<br>
    <b>Ataques Bloqueados:</b> ${S.blocked}<br>
    <b>VPN:</b> ${S.vpn ? 'Protegida' : 'Inactiva'}</p>
    <button class="btn" onclick="scanDevices(); closeSheet()">Escanear Red</button>
    <button class="btn alt" onclick="closeSheet()">Cerrar</button>
  `);
  say(`Diagnóstico: Blindaje al ${S.score} por ciento. ${S.blocked} ataques bloqueados.`);
}
$('#scoreWrapBtn').onclick = showStatusDiagnostic;

// ==========================================================================
// 14. CHAT IA & PROCESAMIENTO DE COMANDOS
// ==========================================================================
const KB = [
  [/phishing|estafa|sms falso/, 'El phishing usa mensajes falsos para robar tus claves. Nunca abras enlaces urgentes.'],
  [/ransomware|secuestro|cifrado/, 'El ransomware cifra tus archivos. Mantén siempre copias de seguridad desconectadas.'],
  [/ddos|denegaci/, 'Un DDoS satura los servidores con tráfico basura para tirar el servicio.'],
  [/fuerza bruta|diccionario/, 'La fuerza bruta prueba miles de contraseñas. Usa claves largas de 16 caracteres.'],
  [/vpn|t[uú]nel/, 'Una VPN cifra tu conexión para proteger tu privacidad en redes públicas.'],
  [/jarvis|qui[eé]n eres/, 'Soy Jarvis 2.0, tu copiloto de ciberseguridad. Te ayudo a monitorear y proteger tus dispositivos.']
];

function processCommand(cmdText) {
  const txt = cmdText.toLowerCase().trim();
  if (!txt) return;

  const matchKb = KB.find(k => k[0].test(txt));
  if (matchKb) {
    say(matchKb[1]);
    return;
  }

  if (txt.includes('mapa') || txt.includes('ataque')) {
    showView('map');
  } else if (txt.includes('escan') || txt.includes('equipo') || txt.includes('red')) {
    showView('dev');
    scanDevices();
  } else if (txt.includes('alerta') || txt.includes('log')) {
    showView('alert');
  } else if (txt.includes('consejo') || txt.includes('academia') || txt.includes('test')) {
    showView('tips');
  } else if (txt.includes('vpn')) {
    toggleVpn();
  } else if (txt.includes('simul')) {
    spawnAttack(true);
  } else {
    say(`Comando ${cmdText} ejecutado.`);
  }
}

$('#cmdIn').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    processCommand(e.target.value);
    e.target.value = '';
  }
});

// Reconocimiento de Voz
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRec) {
  const rec = new SpeechRec();
  rec.lang = 'es-PE';
  rec.onstart = () => {
    $('#mic').classList.add('rec');
    say('Te escucho...');
  };
  rec.onend = () => $('#mic').classList.remove('rec');
  rec.onresult = e => {
    const transcript = e.results[0][0].transcript;
    $('#bubble').textContent = `«${transcript}»`;
    processCommand(transcript);
  };
  $('#mic').onclick = () => { initAudio(); rec.start(); };
} else {
  $('#mic').onclick = () => say('Usa el teclado para escribir comandos.');
}

// Chat Completo
const CHAT_LOG = [];
function openChatSheet() {
  say('Chat con Jarvis abierto.');
  if (CHAT_LOG.length === 0) {
    CHAT_LOG.push({ sender: 'jarvis', text: `Hola, ${S.name}. ¿Qué duda de ciberseguridad tienes?` });
  }

  const renderMsgs = () => {
    const stream = $('#chatStream');
    if (!stream) return;
    stream.innerHTML = CHAT_LOG.map(m => `
      <div class="chat-msg ${m.sender}">${m.text}</div>
    `).join('');
    stream.scrollTop = stream.scrollHeight;
  };

  sheet('🤖 Chat con Jarvis AI', `
    <div class="chat-stream" id="chatStream"></div>
    <input id="chatInput" placeholder="Pregunta sobre phishing, claves, vpn..." autocomplete="off">
    <button class="btn" id="btnSendChat">Enviar</button>
  `);
  renderMsgs();

  const send = () => {
    const inp = $('#chatInput');
    const val = inp.value.trim();
    if (!val) return;
    CHAT_LOG.push({ sender: 'user', text: val });
    inp.value = '';
    renderMsgs();

    const match = KB.find(k => k[0].test(val.toLowerCase()));
    const reply = match ? match[1] : `Revisa tus contraseñas y mantén tus dispositivos actualizados.`;
    
    setTimeout(() => {
      CHAT_LOG.push({ sender: 'jarvis', text: reply });
      renderMsgs();
      say(reply);
      SFX.beep(650, 'sine', 0.05);
    }, 350);
  };

  $('#btnSendChat').onclick = send;
  $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
}
$('#chatBtn').onclick = openChatSheet;
$('#orbReactorBtn').onclick = openChatSheet;