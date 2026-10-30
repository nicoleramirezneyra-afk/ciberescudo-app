/* ==========================================================================
   CIBERESCUDO 2.0 â€“ MOTOR PRINCIPAL & TÃCTICAS DE CIBERSEGURIDAD
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

function notifyIsland(text, icon = 'ðŸ›¡ï¸', duration = 3000) {
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
 * FunciÃ³n principal para hablar:
 * @param {string} text - Texto a pronunciar
 * @param {boolean} urgent - Si es true, cancela lo anterior limpiamente para atender la acciÃ³n inmediata del usuario
 */
function say(text, urgent = true) {
  if (!text) return;
  if ($('#bubble')) $('#bubble').textContent = text;

  if (urgent) {
    // Si el usuario tocÃ³ un botÃ³n explÃ­citamente, cancelamos la cola y hablamos esto inmediatamente
    speechQueue = [{ text }];
    if ('speechSynthesis' in window) {
      try { speechSynthesis.cancel(); } catch (e) {}
    }
    isSpeaking = false;
    processSpeechQueue();
  } else {
    // Si no es urgente, lo agregamos a la cola para que termine lo que estÃ¡ diciendo
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
  $('#voiceBtn').textContent = S.voice ? 'ðŸ”Š' : 'ðŸ”‡';
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

// Roles en Boot con locuciÃ³n concisa
const ROLE_VOICES = {
  'Sentinel': 'Rol Sentinel. Defensa y mitigaciÃ³n de amenazas.',
  'Ethical Hacker': 'Rol NetSec. AuditorÃ­a y escaneo de vulnerabilidades.',
  'Admin Corp': 'Rol Director. SupervisiÃ³n de mÃ©tricas ejecutivas.'
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
  say(`Iniciando escaneo biomÃ©trico para ${S.role} ${S.name}.`);

  const steps = [
    { t: 'Mapeando rostroâ€¦', bio: 'CORRECTO (99.8%)', net: 'GENERANDO LLAVES' },
    { t: 'Cifrado cuÃ¡ntico de canalâ€¦', bio: 'VALIDADO', net: 'CANAL SHA-512 OK' },
    { t: 'Sincronizando satÃ©litesâ€¦', bio: 'VALIDADO', fw: 'DEFENSA ACTIVA' },
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

function seedInitialTelemetry() {
  if (LOG.length > 0) return;
  const initialThreats = [
    { typeIdx: 7, cityIdx: 0, manual: false, crit: true, minsAgo: 1 },   // Zero-Day MoscÃº
    { typeIdx: 0, cityIdx: 5, manual: true, crit: false, minsAgo: 2 },   // Phishing NY
    { typeIdx: 5, cityIdx: 1, manual: false, crit: true, minsAgo: 4 },   // SQLi PekÃ­n
    { typeIdx: 9, cityIdx: 6, manual: false, crit: false, minsAgo: 6 },  // Cryptojacking FrÃ¡ncfort
    { typeIdx: 6, cityIdx: 9, manual: true, crit: false, minsAgo: 8 },   // MitM Londres
    { typeIdx: 8, cityIdx: 11, manual: false, crit: false, minsAgo: 11 }, // Spyware SeÃºl
    { typeIdx: 1, cityIdx: 3, manual: false, crit: true, minsAgo: 14 },  // Ransomware SÃ£o Paulo
    { typeIdx: 2, cityIdx: 4, manual: true, crit: false, minsAgo: 16 },  // DDoS TeherÃ¡n
    { typeIdx: 10, cityIdx: 7, manual: false, crit: false, minsAgo: 19 }, // XSS Tokio
    { typeIdx: 11, cityIdx: 8, manual: false, crit: false, minsAgo: 22 }  // DNS Spoofing SÃ­dney
  ];
  const now = Date.now();
  initialThreats.forEach(item => {
    const k = THREAT_TYPES[item.typeIdx % THREAT_TYPES.length];
    const o = CITIES[item.cityIdx % CITIES.length];
    const t = new Date(now - item.minsAgo * 60000).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    LOG.push({ id: ++attackId, o, k, crit: item.crit, manual: item.manual, t });
    S.blocked++;
  });
  if ($('#nBlocked')) $('#nBlocked').textContent = S.blocked;
}

function enterApp() {
  $('#boot').classList.remove('on');
  $('#app').classList.add('on');
  $('#hello').textContent = `Hola, ${S.name}`;
  $('#userRoleBadge').textContent = S.role.toUpperCase();
  
  seedInitialTelemetry();
  sizeCanvas();
  renderDevices();
  renderTips();
  calcScore();
  renderLog();

  notifyIsland(`Bienvenido ${S.role} ${S.name}`, 'ðŸ›¡ï¸', 3500);
  say(`Bienvenido ${S.role} ${S.name}. Escudo activo.`);

  // SimulaciÃ³n continua de trÃ¡fico en segundo plano
  setInterval(() => {
    if (S.auto && A.length < 5) spawnAttack(false);
  }, 2600);

  requestAnimationFrame(drawMap);
}

// ==========================================================================
// 5. NAVEGACIÃ“N ENTRE TABS CON NARRACIÃ“N CONCISA
// ==========================================================================
const TAB_NARRATIONS = {
  'map': 'Mapa global de amenazas en vivo.',
  'dev': 'TopologÃ­a de equipos de la red.',
  'alert': 'Historial de alertas e incidentes.',
  'tips': 'Academia y desafÃ­os de ciberseguridad.',
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
  say(isOpen ? 'MenÃº de opciones abierto.' : 'MenÃº cerrado.');
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
// 7. PUNTAJE, SALUD Y TELEMETRÃA
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
    lvlTxt.textContent = 'Amenaza CrÃ­tica';
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
// 8. DISPOSITIVOS & TOPOLOGÃA DE RED
// ==========================================================================
const D = [
  {
    n: 'Smartphone Operador',
    i: 'ðŸ“±',
    ip: '192.168.1.12',
    port: '8080 (TLS)',
    mac: 'E4:5F:01:28:C2:11',
    os: 'Android 15 Â· Sandbox',
    r: 0,
    state: 'done',
    m: 'Protegido con clave biomÃ©trica, sandbox activo y cifrado en reposo.',
    fix: 'ValidaciÃ³n de integridad OK'
  },
  {
    n: 'EstaciÃ³n Laptop Pro',
    i: 'ðŸ’»',
    ip: '192.168.1.20',
    port: '443 (HTTPS)',
    mac: '3C:22:FB:8A:44:90',
    os: 'Windows 11 Pro Â· EDR',
    r: 0,
    state: 'done',
    m: 'EDR y firewall cuÃ¡ntico activos. Firmware TPM 2.0 validado.',
    fix: 'ProtecciÃ³n Endpoint activa'
  },
  {
    n: 'Gateway Wi-Fi 6',
    i: 'ðŸ“¡',
    ip: '192.168.1.1',
    port: '80 (HTTP Inseguro)',
    mac: '00:1A:2B:6C:88:12',
    os: 'OpenWrt 23.05',
    r: 1,
    state: 'done',
    m: 'Panel de administraciÃ³n en HTTP sin cifrar y parche pendiente CVE-2025-4109.',
    fix: 'Inyectar Parche CuÃ¡ntico y Forzar HTTPS'
  },
  {
    n: 'Smart TV QLED',
    i: 'ðŸ“º',
    ip: '192.168.1.31',
    port: '8008 (Cast)',
    mac: '74:D0:2B:F1:09:A5',
    os: 'Tizen OS 7.0',
    r: 0,
    state: 'done',
    m: 'TrÃ¡fico multimedia aislado en VLAN de invitados sin acceso a la LAN privada.',
    fix: 'Aislamiento VLAN verificado'
  },
  {
    n: 'CÃ¡mara IP PerÃ­metro',
    i: 'ðŸ“·',
    ip: '192.168.1.45',
    port: '554 (RTSP Abierto)',
    mac: 'A0:B1:C2:D3:E4:F5',
    os: 'Embedded Linux 4.9',
    r: 2,
    state: 'done',
    m: 'Credencial por defecto de fÃ¡brica Â«admin/1234Â» detectada. Riesgo crÃ­tico de botnet Mirai.',
    fix: 'Rotar Credencial a SHA-256 y Cifrar RTSP'
  },
  {
    n: 'Smartwatch Ultra',
    i: 'âŒš',
    ip: '192.168.1.52',
    port: 'BLE Encrypted v5.3',
    mac: '58:CB:52:80:11:F2',
    os: 'WatchOS Tactical 10',
    r: 0,
    state: 'done',
    m: 'Enlace BLE cifrado mediante intercambio de llaves ECDH con el smartphone principal.',
    fix: 'Enlace seguro verificado'
  },
  {
    n: 'Servidor NAS Backup',
    i: 'ðŸ’¾',
    ip: '192.168.1.80',
    port: '445 (SMBv1 Legado)',
    mac: '90:09:D0:33:66:BB',
    os: 'TrueNAS Core 13.0',
    r: 1,
    state: 'done',
    m: 'Protocolo SMBv1 vulnerable a exploit EternalBlue (WannaCry) habilitado.',
    fix: 'Migrar a SMBv3 Cifrado con Firma Digital'
  },
  {
    n: 'Asistente IoT DomÃ³tico',
    i: 'ðŸŽ™ï¸',
    ip: '192.168.1.95',
    port: '1883 (MQTT Abierto)',
    mac: '60:01:94:4A:2C:19',
    os: 'ESP32 FreeRTOS v4',
    r: 1,
    state: 'done',
    m: 'Broker MQTT escuchando sin autenticaciÃ³n TLS en la red interna.',
    fix: 'Habilitar MQTTS con Certificados X.509'
  }
];

const RISK_TEXTS = ['SEGURO', 'VULNERABILIDAD MEDIA', 'RIESGO CRÃTICO'];
let isScanningDevs = false;

function renderDevices() {
  const list = $('#devList');
  if (!list) return;
  list.innerHTML = D.map((d, k) => `
    <li data-k="${k}">
      <span class="dev-num-badge">#0${k + 1}</span>
      <span class="ic">${d.i}</span>
      <div class="tx">
        <b>${d.n}</b>
        <span>${d.ip} Â· ${d.port} Â· ${d.os}</span>
      </div>
      <div class="dev-status-wrap">
        <span class="dev-status-pill ${d.state === 'sc' ? 'sc' : d.r === 0 ? 'ok' : d.r === 1 ? 'mid' : 'hi'}">
          ${d.state === 'sc' ? 'Escaneandoâ€¦' : RISK_TEXTS[d.r]}
        </span>
      </div>
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
  notifyIsland('Escaneando Red Local...', 'ðŸ“¡');

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
        notifyIsland(`${vulns} Vulnerabilidades`, 'âš ï¸');
      } else {
        SFX.success();
        say('Escaneo completo. Todos los dispositivos estÃ¡n seguros.');
        notifyIsland('Red 100% Blindada', 'ðŸ›¡ï¸');
      }
    }
  };
  step();
}

function showDeviceDetail(k) {
  const d = D[k];
  sheet(`${d.i} #${k + 1 < 10 ? '0' : ''}${k + 1} ${d.n}`, `
    <div class="threat-modal-content">
      <div class="threat-meta-grid">
        <div class="t-meta-item">
          <span class="m-lbl">DIRECCIÃ“N IP</span>
          <b class="m-val"><code>${d.ip}</code></b>
        </div>
        <div class="t-meta-item">
          <span class="m-lbl">PUERTO / PROTOCOLO</span>
          <b class="m-val">${d.port}</b>
        </div>
        <div class="t-meta-item">
          <span class="m-lbl">DIRECCIÃ“N MAC</span>
          <b class="m-val"><code>${d.mac}</code></b>
        </div>
        <div class="t-meta-item">
          <span class="m-lbl">SISTEMA OPERATIVO</span>
          <b class="m-val">${d.os}</b>
        </div>
      </div>

      <div class="threat-info-box">
        <div class="box-badge">DIAGNÃ“STICO TÃCTICO</div>
        <p>${d.m}</p>
      </div>

      <div class="threat-solution-box" style="border-color: var(--${d.r === 0 ? 'accent' : d.r === 1 ? 'warn' : 'danger'})">
        <div class="solution-header">
          <span class="sol-icon">${d.r === 0 ? 'ðŸ›¡ï¸' : 'âš ï¸'}</span>
          <b style="color: var(--${d.r === 0 ? 'accent' : d.r === 1 ? 'warn' : 'danger'})">
            ESTADO: ${RISK_TEXTS[d.r]}
          </b>
        </div>
        <p>${d.r === 0 ? 'Este dispositivo cumple con las directivas de blindaje y cifrado activo.' : 'Vulnerabilidad detectada. Aplica el parche tÃ¡ctico a continuaciÃ³n para mitigar vectores de intrusiÃ³n.'}</p>
      </div>

      <div class="modal-actions-row">
        ${d.r > 0 ? `<button class="btn" id="btnPatchDev">ðŸ› ï¸ ${d.fix}</button>` : `<button class="btn" id="btnDevAudio">ðŸ”Š DiagnÃ³stico por Voz</button>`}
        <button class="btn alt" onclick="closeSheet()">Cerrar</button>
      </div>
    </div>
  `);

  if (d.r > 0) {
    say(`${d.n}. Estado: ${RISK_TEXTS[d.r]}. ${d.m}`);
    $('#btnPatchDev').onclick = () => {
      d.r = 0;
      d.m = 'Vulnerabilidad mitigada con Ã©xito. Puerto protegido y cifrado activo.';
      renderDevices();
      calcScore();
      closeSheet();
      SFX.success();
      say(`Parche aplicado a ${d.n}. Dispositivo blindado.`);
      notifyIsland(`${d.n} Reparado`, 'âœ…');
    };
  } else {
    say(`${d.n}. Dispositivo seguro.`);
    const btnAudio = $('#btnDevAudio');
    if (btnAudio) {
      btnAudio.onclick = () => say(`${d.n}. IP ${d.ip}. Puerto ${d.port}. ${d.m}`);
    }
  }
}
$('#btnDevScan').onclick = () => scanDevices();

// ==========================================================================
// 9. MAPA GLOBAL TÃCTICO & INTERCEPTOR DE AMENAZAS
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
  { c: 'MoscÃº', la: 55.7, lo: 37.6 }, { c: 'PekÃ­n', la: 39.9, lo: 116.4 }, { c: 'Lagos', la: 6.5, lo: 3.4 },
  { c: 'SÃ£o Paulo', la: -23.5, lo: -46.6 }, { c: 'TeherÃ¡n', la: 35.7, lo: 51.4 }, { c: 'Nueva York', la: 40.7, lo: -74 },
  { c: 'FrÃ¡ncfort', la: 50.1, lo: 8.7 }, { c: 'Tokio', la: 35.6, lo: 139.6 }, { c: 'SÃ­dney', la: -33.9, lo: 151.2 },
  { c: 'Londres', la: 51.5, lo: -0.1 }, { c: 'Singapur', la: 1.35, lo: 103.8 }, { c: 'SeÃºl', la: 37.5, lo: 126.9 },
  { c: 'Ãmsterdam', la: 52.3, lo: 4.9 }, { c: 'Buenos Aires', la: -34.6, lo: -58.3 }, { c: 'Toronto', la: 43.6, lo: -79.3 },
  { c: 'Madrid', la: 40.4, lo: -3.7 }, { c: 'DubÃ¡i', la: 25.2, lo: 55.2 }
];

const DEFENSE_TARGET = { c: 'Lima (Base)', la: -12, lo: -77 };

const THREAT_TYPES = [
  {
    n: 'Phishing',
    col: '#ffb43b',
    ic: 'ðŸŽ£',
    tip: 'Correos y SMS que suplantan identidad institucional para robar contraseÃ±as.',
    cve: 'CVE-2025-0144',
    fix: 'Verifica remitentes y URLs oficiales, nunca ingreses credenciales por enlaces urgentes y activa 2FA con llaves fÃ­sicas o apps autenticadoras.'
  },
  {
    n: 'Ransomware',
    col: '#ff2a6d',
    ic: 'ðŸ”’',
    tip: 'Intento de secuestro y cifrado malicioso de archivos locales con extorsiÃ³n.',
    cve: 'CVE-2025-8812',
    fix: 'AÃ­sla el equipo de la red al instante, no pagues el rescate y restaura respaldos inmutables desconectados (estrategia 3-2-1).'
  },
  {
    n: 'DDoS Masivo',
    col: '#b026ff',
    ic: 'ðŸŒŠ',
    tip: 'Bombardeo volumÃ©trico de paquetes SYN/UDP para saturar ancho de banda.',
    cve: 'CVE-2024-9901',
    fix: 'Activa protecciÃ³n Anycast/CDN (Cloudflare/AWS Shield), configura rate limiting en el reverse proxy y descarta trÃ¡fico malicioso con SYN Cookies.'
  },
  {
    n: 'Troyano EspÃ­a',
    col: '#00f0ff',
    ic: 'ðŸ¦ ',
    tip: 'InyecciÃ³n de software espÃ­a camuflado en instaladores o adjuntos.',
    cve: 'CVE-2025-1033',
    fix: 'Inicia en modo seguro, realiza un anÃ¡lisis EDR profundo, remueve llaves de persistencia en el registro y descarga software solo de fuentes verificadas.'
  },
  {
    n: 'Fuerza Bruta SSH',
    col: '#ff5500',
    ic: 'ðŸ”¨',
    tip: 'Diccionario automatizado de alta frecuencia contra puertos de acceso remoto.',
    cve: 'CVE-2024-3401',
    fix: 'Deshabilita acceso root por contraseÃ±a, cambia el puerto 22, exige autenticaciÃ³n por llaves ed25519 e instala fail2ban para bloqueo automÃ¡tico tras 3 intentos.'
  },
  {
    n: 'InyecciÃ³n SQL (SQLi)',
    col: '#ff0055',
    ic: 'ðŸ’‰',
    tip: 'InyecciÃ³n de sentencias SQL maliciosas para extraer bases de datos sensibles.',
    cve: 'CVE-2025-2401',
    fix: 'Usa consultas parametrizadas (Prepared Statements / ORM), sanitiza entradas en el backend y asigna al usuario de BD privilegios mÃ­nimos.'
  },
  {
    n: 'Man-in-the-Middle (MitM)',
    col: '#e040fb',
    ic: 'ðŸ“¡',
    tip: 'IntercepciÃ³n no autorizada de paquetes y trÃ¡fico sin cifrar en redes Wi-Fi.',
    cve: 'CVE-2025-4190',
    fix: 'Fuerza HTTPS estricto con directiva HSTS, navega siempre con VPN cifrada en redes pÃºblicas y desconfÃ­a de certificados SSL invÃ¡lidos.'
  },
  {
    n: 'Exploit Zero-Day',
    col: '#ff0033',
    ic: 'âš¡',
    tip: 'Ataque que aprovecha una vulnerabilidad crÃ­tica sin parche disponible.',
    cve: 'CVE-2026-0019',
    fix: 'Aplica segmentaciÃ³n de red estricta (VLANs), activa anÃ¡lisis de comportamiento en el EDR y mitiga deshabilitando temporalmente el servicio afectado.'
  },
  {
    n: 'Spyware / Keylogger',
    col: '#00e5ff',
    ic: 'ðŸ‘ï¸',
    tip: 'Monitoreo clandestino de pulsaciones del teclado, pantalla y credenciales.',
    cve: 'CVE-2025-6310',
    fix: 'Audita extensiones del navegador y programas de inicio, ejecuta anÃ¡lisis anti-rootkit y rota contraseÃ±as desde otro dispositivo no comprometido.'
  },
  {
    n: 'Cryptojacking',
    col: '#ffd600',
    ic: 'â›ï¸',
    tip: 'Secuestro del procesador y GPU para minar criptomonedas en segundo plano.',
    cve: 'CVE-2024-7714',
    fix: 'Inspecciona procesos con alto consumo de CPU/GPU en el Administrador de Tareas, bloquea scripts de minerÃ­a en el navegador y filtra dominios de pools mineros en el firewall.'
  },
  {
    n: 'Cross-Site Scripting (XSS)',
    col: '#76ff03',
    ic: 'ðŸ“œ',
    tip: 'InyecciÃ³n de scripts en navegadores de usuarios para robar cookies de sesiÃ³n.',
    cve: 'CVE-2025-1829',
    fix: 'Implementa encabezados Content Security Policy (CSP) estrictos, codifica caracteres HTML especiales en el renderizado y marca cookies con HttpOnly y SameSite.'
  },
  {
    n: 'Spoofing DNS',
    col: '#2979ff',
    ic: 'ðŸŒ',
    tip: 'Envenenamiento de cachÃ© DNS para redirigir trÃ¡fico a sitios web fraudulentos.',
    cve: 'CVE-2024-9012',
    fix: 'Habilita DNS over HTTPS (DoH) o DNSSEC en el router, limpia la cachÃ© local con ipconfig /flushdns y utiliza servidores DNS seguros (1.1.1.1 o 9.9.9.9).'
  },
  {
    n: 'Secuestro de SesiÃ³n',
    col: '#ff6d00',
    ic: 'ðŸª',
    tip: 'Robo y reutilizaciÃ³n de tokens JWT o cookies activas para suplantar identidad.',
    cve: 'CVE-2025-5022',
    fix: 'Configura tiempos de vida cortos para tokens, rota identificadores de sesiÃ³n al autenticar y cierra sesiones activas desde el panel de seguridad.'
  },
  {
    n: 'Fuga de Credencial API',
    col: '#ff1744',
    ic: 'ðŸ”‘',
    tip: 'ExfiltraciÃ³n de llaves secretas y credenciales maestras de la nube.',
    cve: 'CVE-2025-3388',
    fix: 'Revoca y regenera la clave API de inmediato en tu consola cloud, audita llamadas recientes y almacena secretos en variables de entorno o almacÃ©n seguro (Vault).'
  },
  {
    n: 'Cadena de Suministro',
    col: '#c51162',
    ic: 'ðŸ“¦',
    tip: 'Compromiso de dependencias de cÃ³digo abierto de terceros para infiltrar malware.',
    cve: 'CVE-2025-7140',
    fix: 'Fija versiones exactas con checksums de integridad (lockfiles), analiza dependencias con herramientas SCA (npm audit, Snyk) y no uses paquetes no verificados.'
  },
  {
    n: 'Botnet Zombie C2',
    col: '#a855f7',
    ic: 'ðŸ¤–',
    tip: 'Intento de reclutamiento del nodo para una red de ataque teledirigida.',
    cve: 'CVE-2025-4509',
    fix: 'Bloquea puertos de comunicaciÃ³n saliente hacia IPs de mando y control (C2), actualiza el firmware de routers e IoT y cambia claves predeterminadas.'
  },
  {
    n: 'Ataque Pass-the-Hash',
    col: '#ff9100',
    ic: 'ðŸŽ«',
    tip: 'Movimiento lateral utilizando hashes de autenticaciÃ³n sin requerir la clave.',
    cve: 'CVE-2024-8120',
    fix: 'Habilita Windows Defender Credential Guard, desactiva NTLM a favor de Kerberos moderno y limita los derechos de administradores locales en la red.'
  },
  {
    n: 'InyecciÃ³n Comandos OS',
    col: '#d50000',
    ic: 'ðŸ’»',
    tip: 'EjecuciÃ³n remota de comandos del sistema operativo a travÃ©s de sockets web.',
    cve: 'CVE-2025-9921',
    fix: 'Evita ejecutar comandos del sistema directamente desde cÃ³digo, usa APIs nativas seguras, valida con lista blanca estricta y ejecuta en un contenedor sin privilegios.'
  }
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
    notifyIsland(`Ataque ${k.n}`, 'âš¡');
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

    // Rejilla tÃ¡ctica
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

    // AnimaciÃ³n de Ataques
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

    // Ondas de Impacto / DeflexiÃ³n
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
    notifyIsland(`Â¡Interceptado! +25 XP (x${S.combo})`, 'ðŸ’¥', 1800);
    say(`Â¡Ataque ${a.k.n} interceptado!`);
  } else {
    // Los bloqueos automÃ¡ticos solo hacen SFX sutil, NUNCA cortan la voz del usuario
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

// IntercepciÃ³n tÃ¡ctica interactiva en mapa
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
      sheet(`ðŸ“ Nodo ${touchedCity.c}`, `
        <p>Ataques originados desde este nodo: <b>${count}</b></p>
        <button class="btn" id="btnBlockCity">Aislar Nodo en Firewall</button>
        <button class="btn alt" onclick="closeSheet()">Cerrar</button>
      `);
      say(`Nodo ${touchedCity.c}. ${count} incidentes.`);
      $('#btnBlockCity').onclick = () => {
        closeSheet();
        SFX.success();
        say(`Nodo ${touchedCity.c} aislado en firewall.`);
        notifyIsland(`Nodo ${touchedCity.c} Aislado`, 'ðŸ”’');
      };
    }
  });
}

// Botones de acciÃ³n del mapa
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
  say('Pulso electromagnÃ©tico detonado.');
  notifyIsland('Pulso EMP Detonado', 'ðŸ’¥', 3000);
};

// ==========================================================================
// 10. REGISTRO & LOGS TÃCTICOS
// ==========================================================================
function renderLog() {
  const formatLi = (e, k) => `
    <li data-k="${k}">
      <span class="dev-num-badge">#${k + 1 < 10 ? '0' : ''}${k + 1}</span>
      <span class="ic">${e.k.ic}</span>
      <div class="tx">
        <b>${e.k.n} (${e.o.c})</b>
        <span>${e.t} Â· ${e.manual ? 'âš¡ Interceptado' : 'ðŸ›¡ï¸ Escudo'} Â· ${e.k.cve}</span>
      </div>
      <i class="dot ${e.crit ? 'hi' : 'ok'}"></i>
    </li>
  `;

  const mini = $('#miniFeed');
  if (mini) {
    mini.innerHTML = LOG.slice(0, 10).map(formatLi).join('') || '<li><div class="tx"><span>Esperando telemetrÃ­a...</span></div></li>';
  }
  const full = $('#alertList');
  if (full) {
    full.innerHTML = LOG.map(formatLi).join('') || '<li><div class="tx"><span>No hay incidentes registrados. Usa âš¡ para simular uno.</span></div></li>';
  }
  if ($('#feedCountBadge')) $('#feedCountBadge').textContent = `${LOG.length} eventos`;

  $$('#miniFeed li[data-k], #alertList li[data-k]').forEach(li => {
    li.onclick = () => {
      const e = LOG[+li.dataset.k];
      if (!e) return;
      sheet(`${e.k.ic} ${e.k.n}`, `
        <div class="threat-modal-content">
          <div class="threat-meta-grid">
            <div class="t-meta-item">
              <span class="m-lbl">ORIGEN</span>
              <b class="m-val">${e.o.c}</b>
            </div>
            <div class="t-meta-item">
              <span class="m-lbl">HORA</span>
              <b class="m-val">${e.t}</b>
            </div>
            <div class="t-meta-item">
              <span class="m-lbl">FIRMA</span>
              <b class="m-val"><code>${e.k.cve}</code></b>
            </div>
            <div class="t-meta-item">
              <span class="m-lbl">ESTADO</span>
              <b class="m-val ok">Neutralizado</b>
            </div>
          </div>

          <div class="threat-info-box">
            <div class="box-badge">VECTOR DE ATAQUE</div>
            <p>${e.k.tip}</p>
          </div>

          <div class="threat-solution-box">
            <div class="solution-header">
              <span class="sol-icon">ðŸ› ï¸</span>
              <b>Â¿CÃ“MO SOLUCIONARLO / PROTOCOLO DE MITIGACIÃ“N?</b>
            </div>
            <p>${e.k.fix}</p>
          </div>

          <div class="modal-actions-row">
            <button class="btn" id="btnAudioExplain">ðŸ”Š ExplicaciÃ³n por Voz</button>
            <button class="btn alt" onclick="closeSheet()">Cerrar</button>
          </div>
        </div>
      `);
      say(`Ataque ${e.k.n} neutralizado.`);
      $('#btnAudioExplain').onclick = () => say(`${e.k.n}. ${e.k.tip}. Para solucionarlo: ${e.k.fix}`);
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
// 11. CIBER-ACADEMIA & DESAFÃO INTERACTIVO
// ==========================================================================
const TIPS = [
  {
    icon: 'ðŸ”‘',
    title: 'Claves de Alta EntropÃ­a',
    desc: 'Crea contraseÃ±as de mÃ­nimo 16 caracteres combinando mayÃºsculas, minÃºsculas, nÃºmeros y sÃ­mbolos. Nunca repitas la misma clave en distintos servicios.',
    tag: 'CONTRASEÃ‘AS',
    examples: [
      { bad: true,  text: '"carlos123" â€” Solo 8 chars, nombre comÃºn â†’ se crackea en segundos' },
      { bad: false, text: '"Tr0nador_Azul#2026!Galaxia" â€” 26 chars, mixto â†’ imposible por fuerza bruta' },
      { bad: false, text: 'Usa un gestor como Bitwarden o 1Password para no memorizar nada' },
      { bad: true,  text: 'Anotar contraseÃ±as en un papel o bloc de notas del PC â†’ riesgo fÃ­sico' }
    ],
    voice: 'Claves de alta entropÃ­a. Usa mÃ­nimo 16 caracteres con mayÃºsculas, nÃºmeros y sÃ­mbolos. Nunca repitas contraseÃ±as.'
  },
  {
    icon: 'ðŸ›¡ï¸',
    title: '2FA Seguro',
    desc: 'La autenticaciÃ³n de dos factores aÃ±ade una segunda capa de seguridad. Aunque roben tu contraseÃ±a, no podrÃ¡n entrar sin el segundo factor.',
    tag: '2FA',
    examples: [
      { bad: true,  text: '2FA por SMS â†’ vulnerable a SIM-Swapping (clonan tu nÃºmero)' },
      { bad: false, text: 'Google Authenticator / Authy â†’ cÃ³digo temporal cada 30 seg, sin internet' },
      { bad: false, text: 'Llave fÃ­sica YubiKey â†’ el mÃ©todo mÃ¡s seguro disponible hoy' },
      { bad: false, text: 'Activa 2FA en: Gmail, Instagram, banco online, GitHub, WhatsApp' }
    ],
    voice: 'AutenticaciÃ³n de dos factores. Usa apps autenticadoras en lugar de SMS para evitar ataques de clonaciÃ³n de SIM.'
  },
  {
    icon: 'ðŸŽ£',
    title: 'DetecciÃ³n de Phishing',
    desc: 'El phishing suplanta identidades de empresas o personas de confianza para robar tus datos. Aprende a identificarlo antes de hacer clic.',
    tag: 'PHISHING',
    examples: [
      { bad: true,  text: '"Tu cuenta fue SUSPENDIDA, verifica ahora: http://banco-alerta.xyz" â†’ URL falsa + urgencia' },
      { bad: true,  text: 'Correo de soporte@paypa1.com (con el nÃºmero 1) â†’ dominio falso' },
      { bad: false, text: 'Verifica siempre el remitente completo, no solo el nombre visible' },
      { bad: false, text: 'Ante dudas, entra directamente al sitio oficial escribiendo la URL a mano' }
    ],
    voice: 'DetecciÃ³n de phishing. DesconfÃ­a siempre de la urgencia y verifica el remitente real del correo antes de hacer clic en cualquier enlace.'
  },
  {
    icon: 'ðŸ“¶',
    title: 'Wi-Fi PÃºblico Seguro',
    desc: 'Las redes pÃºblicas (cafeterÃ­as, aeropuertos, centros comerciales) no estÃ¡n cifradas. Un atacante en la misma red puede interceptar tu trÃ¡fico.',
    tag: 'WI-FI',
    examples: [
      { bad: true,  text: 'Conectarse al Wi-Fi "CafeteriaLibre" y entrar al banco sin VPN' },
      { bad: true,  text: '"Airport_Free_WiFi" puede ser un punto de acceso falso (Evil Twin Attack)' },
      { bad: false, text: 'Activa tu VPN antes de conectarte a cualquier red pÃºblica' },
      { bad: false, text: 'Usa datos mÃ³viles para transacciones bancarias o trabajo sensible' }
    ],
    voice: 'Wi-Fi pÃºblico. Activa siempre una VPN antes de conectarte a redes pÃºblicas. Nunca hagas operaciones bancarias sin VPN activa.'
  },
  {
    icon: 'ðŸ”„',
    title: 'Parcheo de Zero-Days',
    desc: 'Los Zero-Days son vulnerabilidades explotadas antes de que exista un parche. Mantener el software actualizado reduce drÃ¡sticamente la superficie de ataque.',
    tag: 'ACTUALIZACIONES',
    examples: [
      { bad: true,  text: 'Windows sin actualizar desde hace 6 meses â†’ expuesto a EternalBlue (WannaCry)' },
      { bad: true,  text: 'Ignorar la actualizaciÃ³n del router â†’ acceso remoto sin autorizaciÃ³n' },
      { bad: false, text: 'Activa actualizaciones automÃ¡ticas en tu OS, navegador y apps' },
      { bad: false, text: 'Revisa CVE mitre.org para conocer vulnerabilidades recientes de tus apps' }
    ],
    voice: 'Parcheo de Zero-Days. MantÃ©n siempre actualizados tu sistema operativo, navegador y aplicaciones. Las actualizaciones corrigen vulnerabilidades crÃ­ticas.'
  },
  {
    icon: 'ðŸ’¾',
    title: 'Copias de Seguridad',
    desc: 'Un backup correcto es tu mejor defensa ante ransomware, fallos de hardware o borrado accidental. Sigue la regla 3-2-1.',
    tag: 'BACKUPS',
    examples: [
      { bad: false, text: 'Regla 3-2-1: 3 copias, en 2 soportes distintos, 1 fuera de casa/oficina' },
      { bad: false, text: 'Google Drive / OneDrive para documentos de trabajo (nube automÃ¡tica)' },
      { bad: false, text: 'Disco duro externo cifrado con VeraCrypt para datos sensibles' },
      { bad: true,  text: 'Backup conectado siempre al PC â†’ el ransomware tambiÃ©n lo cifra' }
    ],
    voice: 'Copias de seguridad. Aplica la regla 3-2-1: tres copias en dos soportes distintos, con una copia fuera de casa. Un backup offline resiste el ransomware.'
  },
  {
    icon: 'ðŸ”’',
    title: 'Cifrado de Dispositivos',
    desc: 'Cifrar tu disco duro o mÃ³vil garantiza que nadie pueda acceder a tus datos si te roban el dispositivo, aunque lo conecten a otro equipo.',
    tag: 'CIFRADO',
    examples: [
      { bad: false, text: 'Windows: activa BitLocker (Panel de Control â†’ Cifrado de unidad)' },
      { bad: false, text: 'Mac: activa FileVault (Preferencias â†’ Seguridad â†’ FileVault)' },
      { bad: false, text: 'Android / iOS: el cifrado estÃ¡ activo por defecto con pantalla de bloqueo activada' },
      { bad: true,  text: 'PC sin cifrar robado â†’ los datos son accesibles conectando el disco a otro equipo' }
    ],
    voice: 'Cifrado de dispositivos. Activa BitLocker en Windows o FileVault en Mac para proteger tus datos ante robo fÃ­sico.'
  },
  {
    icon: 'ðŸ•µï¸',
    title: 'Privacidad en Redes Sociales',
    desc: 'La sobreexposiciÃ³n en redes sociales facilita ataques de ingenierÃ­a social, spear-phishing y robo de identidad.',
    tag: 'PRIVACIDAD',
    examples: [
      { bad: true,  text: 'Publicar foto del pasaporte, ticket de viaje o tarjeta de crÃ©dito â†’ robo de identidad directo' },
      { bad: true,  text: 'Perfil pÃºblico con fecha de nacimiento, telÃ©fono y ciudad â†’ datos para hackear cuentas' },
      { bad: false, text: 'Configura tus perfiles como privados y revisa quiÃ©n te sigue' },
      { bad: false, text: 'Usa correos alias (SimpleLogin, AnonAddy) para registros en webs de terceros' }
    ],
    voice: 'Privacidad en redes sociales. No publiques informaciÃ³n personal sensible. Configura tus perfiles como privados y usa alias de correo para registros.'
  }
];

function renderTips() {
  const list = $('#tipList');
  if (!list) return;
  list.innerHTML = TIPS.map((t, k) => `
    <li data-k="${k}">
      <span class="ic">${t.icon}</span>
      <div class="tx">
        <b>${t.title}</b>
        <span>${t.desc.substring(0, 52)}â€¦</span>
      </div>
      <span class="arrow-tag">${t.tag}</span>
    </li>
  `).join('');

  $$('#tipList li').forEach(li => {
    li.onclick = () => {
      const item = TIPS[+li.dataset.k];
      const examplesHtml = item.examples.map(ex => `
        <div style="display:flex; gap:10px; align-items:flex-start; padding:8px 10px; border-radius:8px; margin-bottom:6px;
          background:${ex.bad ? 'rgba(255,42,109,0.1)' : 'rgba(57,255,122,0.1)'};
          border-left:3px solid ${ex.bad ? 'var(--danger)' : 'var(--accent)'}">
          <span style="font-size:15px; flex-shrink:0">${ex.bad ? 'âŒ' : 'âœ…'}</span>
          <span style="font-size:12px; color:var(--text-muted); line-height:1.4">${ex.text}</span>
        </div>
      `).join('');

      sheet(`${item.icon} ${item.title}`, `
        <div class="threat-modal-content">
          <div class="threat-info-box" style="margin-bottom:14px">
            <div class="box-badge">${item.tag}</div>
            <p style="font-size:13px; line-height:1.5; color:var(--text-muted)">${item.desc}</p>
          </div>
          <div style="margin-bottom:14px">
            <b style="font-size:12px; color:var(--primary); text-transform:uppercase; letter-spacing:1px">âš¡ Ejemplos PrÃ¡cticos</b>
            <div style="margin-top:8px">${examplesHtml}</div>
          </div>
          <div class="modal-actions-row">
            <button class="btn" id="tipVoiceBtn">ðŸ”Š Escuchar a Jarvis</button>
            <button class="btn alt" onclick="closeSheet()">Cerrar</button>
          </div>
        </div>
      `);
      say(item.voice);
      $('#tipVoiceBtn').onclick = () => say(item.voice);
    };
  });
}

// Ciber-Quiz Gamificado por Niveles
const QUIZ_LEVELS = {
  basico: {
    label: 'ðŸŸ¢ BÃ¡sico',
    color: '#39ff7a',
    desc: 'Conceptos esenciales de ciberseguridad para principiantes.',
    questions: [
      {
        q: 'Recibes un SMS urgente del banco pidiendo verificar tu clave. Â¿QuÃ© haces?',
        opts: ['Hago clic en el enlace', 'Entro por la app oficial del banco', 'ReenvÃ­o el mensaje a mis contactos'],
        ans: 1,
        exp: 'Nunca abras enlaces de mensajes urgentes. Siempre usa la app oficial o llama al banco directamente.'
      },
      {
        q: 'Â¿CuÃ¡l de estas contraseÃ±as es la mÃ¡s segura?',
        opts: ['123456', 'MiPerro2020', 'Xk#9!mQ@rL2'],
        ans: 2,
        exp: 'Una contraseÃ±a segura combina mayÃºsculas, minÃºsculas, nÃºmeros y sÃ­mbolos especiales.'
      },
      {
        q: 'Â¿QuÃ© significa HTTPS en una direcciÃ³n web?',
        opts: ['El sitio es famoso', 'La conexiÃ³n estÃ¡ cifrada y es mÃ¡s segura', 'El sitio tiene publicidad'],
        ans: 1,
        exp: 'HTTPS cifra la comunicaciÃ³n entre tu navegador y el servidor, protegiendo tus datos.'
      },
      {
        q: 'Â¿QuÃ© es el phishing?',
        opts: ['Un tipo de antivirus', 'Un ataque que suplanta identidades para robar datos', 'Un protocolo de red'],
        ans: 1,
        exp: 'El phishing engaÃ±a a las vÃ­ctimas haciÃ©ndose pasar por entidades confiables para robar informaciÃ³n.'
      },
      {
        q: 'Usas la misma contraseÃ±a en todos tus servicios. Â¿Esto es?',
        opts: ['PrÃ¡ctico y seguro', 'Muy peligroso: si roban una, todas quedan expuestas', 'Normal y aceptado'],
        ans: 1,
        exp: 'Reutilizar contraseÃ±as es una vulnerabilidad crÃ­tica. Usa un gestor de contraseÃ±as.'
      },
      {
        q: 'Â¿QuÃ© debes hacer si encuentras un USB en la calle?',
        opts: ['Conectarlo para ver quÃ© contiene', 'No conectarlo: puede contener malware', 'DÃ¡rselo a un compaÃ±ero'],
        ans: 1,
        exp: 'Los USB abandonados son un vector clÃ¡sico de ataque. Pueden ejecutar cÃ³digo malicioso al conectarse.'
      },
      {
        q: 'Â¿CuÃ¡l es la mejor prÃ¡ctica para las actualizaciones de software?',
        opts: ['Ignorarlas para no perder tiempo', 'Instalarlas cuando puedas, no son urgentes', 'Instalarlas cuanto antes: corrigen vulnerabilidades'],
        ans: 2,
        exp: 'Las actualizaciones parchean vulnerabilidades conocidas que los atacantes explotan activamente.'
      },
      {
        q: 'Â¿QuÃ© es un antivirus?',
        opts: ['Un programa que detecta y elimina malware', 'Una app de limpieza de archivos', 'Un firewall de red'],
        ans: 0,
        exp: 'Un antivirus monitorea, detecta y elimina software malicioso de tu dispositivo.'
      },
      {
        q: 'Recibes un email de un desconocido con un archivo adjunto. Â¿QuÃ© haces?',
        opts: ['Abro el adjunto para ver de quÃ© trata', 'Lo elimino sin abrirlo', 'Lo reenvÃ­o a mis contactos'],
        ans: 1,
        exp: 'Los adjuntos de desconocidos pueden contener ransomware, troyanos u otro malware peligroso.'
      },
      {
        q: 'Â¿QuÃ© es la autenticaciÃ³n de dos factores (2FA)?',
        opts: ['Usar dos contraseÃ±as distintas', 'Verificar tu identidad con un segundo mÃ©todo ademÃ¡s de la contraseÃ±a', 'Tener dos cuentas de correo'],
        ans: 1,
        exp: '2FA aÃ±ade una capa extra de seguridad: aunque roben tu contraseÃ±a, necesitan el segundo factor.'
      }
    ]
  },
  intermedio: {
    label: 'ðŸŸ¡ Intermedio',
    color: '#ffb43b',
    desc: 'Vectores de ataque, protocolos y defensa tÃ¡ctica.',
    questions: [
      {
        q: 'Â¿QuÃ© tipo de ataque intercepta la comunicaciÃ³n entre dos partes sin que lo sepan?',
        opts: ['DDoS', 'Man-in-the-Middle (MitM)', 'SQL Injection'],
        ans: 1,
        exp: 'Un ataque MitM intercepta y puede modificar la comunicaciÃ³n entre dos partes en tiempo real.'
      },
      {
        q: 'Â¿CuÃ¡l mÃ©todo de 2FA es el mÃ¡s seguro frente a un ataque de SIM-Swapping?',
        opts: ['CÃ³digo por SMS', 'Llamada telefÃ³nica', 'App autenticadora o llave fÃ­sica FIDO2'],
        ans: 2,
        exp: 'Las apps autenticadoras y llaves fÃ­sicas no dependen de la lÃ­nea celular, evitando el SIM-Swapping.'
      },
      {
        q: 'Un atacante inyecta cÃ³digo SQL en un formulario web. Â¿CuÃ¡l es la mejor defensa?',
        opts: ['Usar HTTPS', 'Validar y sanitizar todas las entradas del usuario', 'Cambiar el puerto del servidor'],
        ans: 1,
        exp: 'La validaciÃ³n de entradas y el uso de consultas parametrizadas son las defensas clave contra SQL Injection.'
      },
      {
        q: 'Â¿QuÃ© es un ataque de fuerza bruta?',
        opts: ['Un ataque fÃ­sico al servidor', 'Probar millones de contraseÃ±as hasta dar con la correcta', 'Infectar la red con ransomware'],
        ans: 1,
        exp: 'Los ataques de fuerza bruta prueban combinaciones masivas de credenciales. La 2FA y lÃ­mites de intentos los mitigan.'
      },
      {
        q: 'Â¿QuÃ© es el cifrado de extremo a extremo (E2EE)?',
        opts: ['Cifrar solo el disco duro', 'Solo el emisor y receptor pueden leer los mensajes', 'Cifrar el correo pero no los archivos'],
        ans: 1,
        exp: 'El E2EE garantiza que ni el proveedor del servicio puede leer el contenido de los mensajes.'
      },
      {
        q: 'Â¿CuÃ¡l es el puerto predeterminado de HTTPS?',
        opts: ['80', '443', '8080'],
        ans: 1,
        exp: 'El puerto 443 es el estÃ¡ndar para HTTPS (TLS/SSL). El 80 es HTTP sin cifrar.'
      },
      {
        q: 'Â¿QuÃ© es un CVE?',
        opts: ['Un tipo de virus informÃ¡tico', 'Identificador Ãºnico para vulnerabilidades pÃºblicamente conocidas', 'Un certificado de seguridad web'],
        ans: 1,
        exp: 'CVE (Common Vulnerabilities and Exposures) es un sistema estÃ¡ndar para identificar vulnerabilidades de seguridad.'
      },
      {
        q: 'Â¿QuÃ© hace un firewall de capa de aplicaciÃ³n (WAF)?',
        opts: ['Bloquea el trÃ¡fico de red a nivel de puertos', 'Filtra y monitorea trÃ¡fico HTTP/S analizando el contenido', 'Cifra las comunicaciones de la red'],
        ans: 1,
        exp: 'Un WAF inspecciona el contenido HTTP para bloquear ataques como XSS, SQLi y CSRF.'
      },
      {
        q: 'Encuentras que tu red WiFi usa cifrado WEP. Â¿CuÃ¡l es el riesgo?',
        opts: ['Ninguno, WEP es moderno', 'WEP es obsoleto y se crackea en minutos', 'Solo afecta velocidad de conexiÃ³n'],
        ans: 1,
        exp: 'WEP tiene vulnerabilidades crÃ­ticas. Debes migrar a WPA3 o mÃ­nimo WPA2-AES.'
      },
      {
        q: 'Â¿QuÃ© es un certificado digital SSL/TLS?',
        opts: ['Un programa antivirus', 'Documento que autentica la identidad de un sitio web y cifra la conexiÃ³n', 'Una contraseÃ±a del servidor'],
        ans: 1,
        exp: 'Los certificados SSL/TLS verifican que el servidor es quien dice ser y establecen una conexiÃ³n cifrada.'
      }
    ]
  },
  avanzado: {
    label: 'ðŸ”´ Avanzado',
    color: '#ff2a6d',
    desc: 'Exploits, forense digital, APT y defensa en profundidad.',
    questions: [
      {
        q: 'Â¿QuÃ© tÃ©cnica usa un atacante APT para mantener acceso persistente sin ser detectado?',
        opts: ['Spam masivo de correos', 'ImplantaciÃ³n de rootkits y backdoors a nivel kernel', 'Ataques DDoS volumÃ©tricos'],
        ans: 1,
        exp: 'Los APTs utilizan rootkits de kernel y backdoors cifradas para mantener acceso silencioso por meses o aÃ±os.'
      },
      {
        q: 'Â¿QuÃ© describe mejor un ataque de "Zero-Day"?',
        opts: ['Un ataque que ocurre a medianoche', 'ExplotaciÃ³n de una vulnerabilidad desconocida para el proveedor y sin parche disponible', 'Un virus que borra datos al instalar'],
        ans: 1,
        exp: 'Un Zero-Day explota fallos desconocidos. Entre CVE publicado y parche aplicado existe una ventana crÃ­tica de exposiciÃ³n.'
      },
      {
        q: 'Â¿CuÃ¡l es la diferencia entre un IDS y un IPS?',
        opts: ['No hay diferencia, son sinÃ³nimos', 'El IDS solo detecta; el IPS detecta y bloquea activamente', 'El IPS es solo para redes WiFi'],
        ans: 1,
        exp: 'IDS (Intrusion Detection System) alerta. IPS (Intrusion Prevention System) ademÃ¡s bloquea el trÃ¡fico malicioso automÃ¡ticamente.'
      },
      {
        q: 'En forense digital, Â¿quÃ© es la cadena de custodia?',
        opts: ['Una red de cibercriminales', 'Registro documentado de quiÃ©n accede a la evidencia digital y cuÃ¡ndo', 'El historial del navegador del atacante'],
        ans: 1,
        exp: 'La cadena de custodia garantiza la integridad de la evidencia digital para que sea admisible en procesos legales.'
      },
      {
        q: 'Â¿QuÃ© es un ataque de "Pass-the-Hash" en entornos Windows?',
        opts: ['Enviar spam con archivos hash', 'Usar el hash NTLM de una contraseÃ±a para autenticarse sin conocer la contraseÃ±a real', 'Crackear contraseÃ±as con rainbow tables'],
        ans: 1,
        exp: 'Pass-the-Hash reutiliza el hash NTLM capturado para autenticarse lateralmente en la red sin necesitar la contraseÃ±a en texto claro.'
      },
      {
        q: 'Â¿QuÃ© es el "lateral movement" en un ciberataque?',
        opts: ['Atacar desde distintos paÃ­ses simultÃ¡neamente', 'Moverse de sistema en sistema dentro de la red comprometida para escalar privilegios', 'Actualizar el malware durante el ataque'],
        ans: 1,
        exp: 'El movimiento lateral permite al atacante expandirse dentro de la red comprometida hacia sistemas de mayor valor.'
      },
      {
        q: 'Â¿QuÃ© protocolo es mÃ¡s vulnerable a ataques de intercepciÃ³n si no estÃ¡ cifrado?',
        opts: ['HTTPS', 'SSH', 'Telnet'],
        ans: 2,
        exp: 'Telnet transmite datos en texto plano, incluyendo credenciales. Debe reemplazarse siempre por SSH.'
      },
      {
        q: 'Â¿QuÃ© es el "OSINT" en ciberseguridad ofensiva?',
        opts: ['Un tipo de malware avanzado', 'RecopilaciÃ³n de inteligencia desde fuentes pÃºblicas para reconocimiento del objetivo', 'Un protocolo de cifrado gubernamental'],
        ans: 1,
        exp: 'OSINT (Open Source Intelligence) reÃºne informaciÃ³n pÃºblica sobre el objetivo: redes sociales, DNS, WHOIS, etc.'
      },
      {
        q: 'Â¿CuÃ¡l ataque busca saturar el ancho de banda con trÃ¡fico SYN/UDP masivo?',
        opts: ['SQL Injection', 'Cross-Site Scripting (XSS)', 'DDoS VolumÃ©trico'],
        ans: 2,
        exp: 'Los DDoS volumÃ©tricos inundan la red con paquetes SYN/UDP para agotar el ancho de banda y tumbar servicios.'
      },
      {
        q: 'Â¿QuÃ© framework estÃ¡ndar se usa para mapear tÃ¡cticas y tÃ©cnicas de atacantes reales?',
        opts: ['ISO 27001', 'MITRE ATT&CK', 'OWASP Top 10'],
        ans: 1,
        exp: 'MITRE ATT&CK es una base de conocimiento global con tÃ¡cticas, tÃ©cnicas y procedimientos (TTPs) de actores de amenaza reales.'
      }
    ]
  }
};

function startQuiz() {
  initAudio();
  say('Selecciona el nivel del test de ciberseguridad.');
  sheet('ðŸŽ® DESAFÃO CIBER-DEFENSOR', `
    <p style="text-align:center; color:var(--text-muted); font-size:13px; margin-bottom:16px">Elige tu nivel de dificultad. Cada nivel tiene 10 preguntas.</p>
    <div style="display:flex; flex-direction:column; gap:10px">
      <button class="btn quiz-level-btn" data-level="basico" style="border-color:#39ff7a; background:rgba(57,255,122,0.1); text-align:left; padding:14px">
        <span style="font-size:18px">ðŸŸ¢</span>
        <div style="display:inline-block; margin-left:10px">
          <b style="color:#39ff7a; font-size:14px">BÃSICO</b>
          <p style="margin:2px 0 0; font-size:12px; color:var(--text-muted)">Conceptos esenciales de ciberseguridad</p>
        </div>
      </button>
      <button class="btn quiz-level-btn" data-level="intermedio" style="border-color:#ffb43b; background:rgba(255,180,59,0.1); text-align:left; padding:14px">
        <span style="font-size:18px">ðŸŸ¡</span>
        <div style="display:inline-block; margin-left:10px">
          <b style="color:#ffb43b; font-size:14px">INTERMEDIO</b>
          <p style="margin:2px 0 0; font-size:12px; color:var(--text-muted)">Vectores de ataque, protocolos y defensa tÃ¡ctica</p>
        </div>
      </button>
      <button class="btn quiz-level-btn" data-level="avanzado" style="border-color:#ff2a6d; background:rgba(255,42,109,0.1); text-align:left; padding:14px">
        <span style="font-size:18px">ðŸ”´</span>
        <div style="display:inline-block; margin-left:10px">
          <b style="color:#ff2a6d; font-size:14px">AVANZADO</b>
          <p style="margin:2px 0 0; font-size:12px; color:var(--text-muted)">Exploits, forense digital, APT y MITRE ATT&CK</p>
        </div>
      </button>
    </div>
  `);

  $$('.quiz-level-btn').forEach(btn => {
    btn.onclick = () => {
      const level = btn.dataset.level;
      runQuizLevel(level);
    };
  });
}

function runQuizLevel(levelKey) {
  const level = QUIZ_LEVELS[levelKey];
  const questions = level.questions;
  initAudio();
  say(`Nivel ${levelKey}. ${questions.length} preguntas. Â¡Comienza!`);
  let curQ = 0, scoreQuiz = 0;

  function renderQ() {
    const q = questions[curQ];
    const progress = Math.round(((curQ) / questions.length) * 100);
    sheet(`${level.label} Â· Pregunta ${curQ + 1}/${questions.length}`, `
      <div style="margin-bottom:10px">
        <div style="background:rgba(255,255,255,0.08); border-radius:6px; height:5px; overflow:hidden">
          <div style="height:100%; width:${progress}%; background:${level.color}; border-radius:6px; transition:width 0.4s"></div>
        </div>
        <span style="font-size:11px; color:var(--text-muted)">${progress}% completado Â· ${scoreQuiz} correctas</span>
      </div>
      <p style="font-size:14px; color:#fff; font-weight:600; line-height:1.4; margin-bottom:14px">${q.q}</p>
      ${q.opts.map((opt, i) => `
        <button class="btn alt opt-btn" data-idx="${i}" style="margin-bottom:8px; text-align:left; width:100%; border-color:rgba(255,255,255,0.15)">${i + 1}. ${opt}</button>
      `).join('')}
    `);

    $$('.opt-btn').forEach(btn => {
      btn.onclick = () => {
        const chosen = +btn.dataset.idx;
        $$('.opt-btn').forEach(b => b.disabled = true);
        if (chosen === q.ans) {
          scoreQuiz++;
          SFX.success();
          btn.style.borderColor = '#39ff7a';
          btn.style.background = 'rgba(57,255,122,0.2)';
          btn.innerHTML = 'âœ… ' + btn.innerHTML;
          say(q.exp);
        } else {
          SFX.alarm();
          btn.style.borderColor = '#ff2a6d';
          btn.style.background = 'rgba(255,42,109,0.2)';
          btn.innerHTML = 'âŒ ' + btn.innerHTML;
          // highlight correct
          const correctBtn = $$('.opt-btn')[q.ans];
          if (correctBtn) {
            correctBtn.style.borderColor = '#39ff7a';
            correctBtn.style.background = 'rgba(57,255,122,0.15)';
          }
          say('Incorrecto. ' + q.exp);
        }
        setTimeout(() => {
          curQ++;
          if (curQ < questions.length) {
            renderQ();
          } else {
            showQuizResult(scoreQuiz, questions.length, level);
          }
        }, 1300);
      };
    });
  }
  renderQ();
}

$('#startQuizBtn').onclick = startQuiz;

function showQuizResult(score, total, level) {
  const pct = Math.round((score / total) * 100);
  const isPerfect = score === total;
  const rankMap = [
    { min: 90, rank: 'ðŸ† Ciber-Defensor Legendario', color: '#ffd700' },
    { min: 70, rank: 'ðŸ¥‡ Experto en Seguridad', color: '#39ff7a' },
    { min: 50, rank: 'ðŸ¥ˆ Analista TÃ¡ctico', color: '#00f0ff' },
    { min: 30, rank: 'ðŸ¥‰ Aprendiz Ciber', color: '#ffb43b' },
    { min: 0,  rank: 'ðŸ“š Novato â€” Â¡Sigue Aprendiendo!', color: '#ff2a6d' }
  ];
  const rankData = rankMap.find(r => pct >= r.min);
  const emoji = isPerfect ? 'ðŸŽ‰' : pct >= 70 ? 'ðŸ’ª' : 'ðŸ“–';

  sheet(`ðŸ† Resultado â€” ${level.label}`, `
    <div style="text-align:center; padding:10px 0">
      <div style="font-size:48px; margin-bottom:8px">${emoji}</div>
      <p style="font-size:28px; font-weight:800; color:${rankData.color}; margin:0">${score} / ${total}</p>
      <p style="font-size:13px; color:var(--text-muted); margin:4px 0 12px">Aciertos en nivel ${level.label}</p>
      <div style="background:rgba(255,255,255,0.07); border-radius:10px; height:10px; overflow:hidden; margin:0 10px 12px">
        <div style="height:100%; width:${pct}%; background:${rankData.color}; border-radius:10px; transition:width 0.6s"></div>
      </div>
      <b style="color:${rankData.color}; font-size:15px">${rankData.rank}</b>
      <p style="font-size:12px; color:var(--text-muted); margin:10px 0 16px">
        ${isPerfect ? 'Â¡Perfecto! Has dominado este nivel. Intenta el siguiente reto.' : pct >= 70 ? 'Excelente desempeÃ±o. Revisa las preguntas falladas en Academia.' : 'Â¡Sigue practicando! La ciberseguridad se aprende con repeticiÃ³n.'}
      </p>
      <div style="display:flex; gap:8px; justify-content:center">
        <button class="btn" onclick="startQuiz()">ðŸ”„ Otro Nivel</button>
        <button class="btn alt" onclick="closeSheet()">Cerrar</button>
      </div>
    </div>
  `);
  if (isPerfect) {
    SFX.success();
    say(`Â¡Puntaje perfecto en nivel ${level.label}! ${score} de ${total}. Rango: ${rankData.rank.replace(/[^\w\s]/g, '')}.`);
  } else {
    say(`Test completado. ${score} de ${total} aciertos. ${rankData.rank.replace(/[^\w\s]/g, '')}.`);
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

// A. EscÃ¡ner IA de Phishing & SMS
function linkScannerSheet() {
  say('EscÃ¡ner de Phishing y SMS abierto.');
  sheet('ðŸ” EscÃ¡ner IA de Phishing & SMS', `
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

    if (lower.includes('http://')) { risk += 30; issues.push('ConexiÃ³n HTTP no cifrada.'); }
    if (/\d+\.\d+\.\d+\.\d+/.test(txt)) { risk += 35; issues.push('Apunta a una direcciÃ³n IP directa.'); }
    if (lower.includes('urgente') || lower.includes('inmediato') || lower.includes('suspend') || lower.includes('bloqueo')) {
      risk += 25; issues.push('PatrÃ³n de urgencia psicolÃ³gica.');
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
    say(`AnÃ¡lisis: ${tag}. Riesgo ${risk} sobre 100.`);
  };
}

// B. BÃ³veda & EntropÃ­a CuÃ¡ntica de Claves
function passVaultSheet() {
  say('BÃ³veda de contraseÃ±as.');
  sheet('ðŸ” BÃ³veda & EntropÃ­a CuÃ¡ntica', `
    <p>Mide la fuerza de tu clave o genera una militar.</p>
    <input id="pwdIn" placeholder="Escribe tu clave" type="text" autocomplete="off">
    <div class="barwrap-cyber"><div id="pwdBar" class="bar-fill"></div></div>
    <div id="pwdMeta" style="font-size:12px; margin-bottom:10px; color:var(--text-muted)">Escribe para calcular fuerza...</div>
    <button class="btn" id="btnGenPass">âš¡ Generar Clave Militar</button>
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
    const timeCrack = score > 80 ? '3.8 mil millones de aÃ±os' : score > 50 ? '4 meses' : '3 segundos';
    const col = score > 80 ? 'var(--accent)' : score > 50 ? 'var(--warn)' : 'var(--danger)';
    bar.style.background = col;

    $('#pwdMeta').innerHTML = `Fuerza: <b style="color:${col}">${score}%</b> Â· Tiempo de hackeo: <b style="color:#fff">${timeCrack}</b>`;
  };

  $('#pwdIn').oninput = analyzePass;
  $('#btnGenPass').onclick = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?_-';
    const rand = new Uint32Array(24);
    crypto.getRandomValues(rand);
    $('#pwdIn').value = [...rand].map(n => chars[n % chars.length]).join('');
    analyzePass();
    SFX.success();
    say('ContraseÃ±a militar de 24 caracteres generada.');
  };
  $('#btnCopyPass').onclick = () => {
    navigator.clipboard.writeText($('#pwdIn').value);
    notifyIsland('Clave Copiada', 'ðŸ“‹');
    SFX.beep(800, 'sine', 0.05);
    say('Copiada al portapapeles.');
  };
}

// C. Dark Web Breach Simulator
function darkWebSheet() {
  say('Radar de filtraciones Dark Web.');
  sheet('ðŸ•µï¸ Radar de Filtraciones Dark Web', `
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
            <b style="color:var(--danger)">âš ï¸ FiltraciÃ³n HistÃ³rica Detectada</b>
            <p style="font-size:11px; margin:2px 0 0; color:var(--text-muted)">Datos expuestos: ContraseÃ±as cifradas y correos.</p>
          </div>
          <p style="font-size:11px; color:var(--accent)">ðŸ’¡ RecomendaciÃ³n: Activa 2FA y renueva tus claves.</p>
        </div>
      `;
      SFX.alarm();
      say('Se detectaron filtraciones antiguas asociadas a este correo.');
    }, 600);
  };
}

// D. TelemetrÃ­a & EstadÃ­sticas
function statsSheet() {
  say(`TelemetrÃ­a cuÃ¡ntica. ${S.blocked} ataques bloqueados. Selecciona el tipo de grÃ¡fico.`);

  // Build stats data â€” take top 8 by count for readability
  const allCounts = THREAT_TYPES.map(k => ({
    name: k.n, color: k.col,
    count: LOG.filter(l => l.k && l.k.n === k.n).length
  })).sort((a, b) => b.count - a.count);
  const typeCounts = allCounts.slice(0, 8);
  const totalAttacks = allCounts.reduce((s, t) => s + t.count, 0) || 1;

  // Show all for pie â€” use display counts or 1-based if all zero
  const pieData = allCounts.some(t => t.count > 0)
    ? allCounts : allCounts.map((t, i) => ({ ...t, count: i + 1 }));
  const pieTotal = pieData.reduce((s, t) => s + t.count, 0);

  // Time-series for line chart
  const now = Date.now();
  const SLOTS = 10;
  const slotMs = 60000;
  const hasTs = LOG.some(l => l.ts);
  const lineData = hasTs
    ? Array.from({ length: SLOTS }, (_, i) => {
        const slotEnd = now - (SLOTS - 1 - i) * slotMs;
        return LOG.filter(l => l.ts && l.ts >= slotEnd - slotMs && l.ts < slotEnd).length;
      })
    : Array.from({ length: SLOTS }, (_, i) =>
        Math.max(0, Math.round(Math.sin(i * 0.8 + 0.5) * 3 + S.blocked / SLOTS + (i % 3)))
      );

  sheet('ðŸ“Š TelemetrÃ­a & GrÃ¡ficos CuÃ¡nticos', `
    <!-- Tab selector -->
    <div style="display:flex; gap:4px; background:rgba(255,255,255,0.05); border-radius:10px; padding:3px; margin-bottom:12px">
      <button class="chart-tab-btn" data-chart="bar"
        style="flex:1; padding:7px 0; border-radius:8px; font-size:11px; font-weight:700; border:none; cursor:pointer; background:var(--accent); color:#000; letter-spacing:.5px">
        â–Œâ–Œ BARRAS
      </button>
      <button class="chart-tab-btn" data-chart="pie"
        style="flex:1; padding:7px 0; border-radius:8px; font-size:11px; font-weight:700; border:none; cursor:pointer; background:transparent; color:var(--text-muted); letter-spacing:.5px">
        â—‰ PASTEL
      </button>
      <button class="chart-tab-btn" data-chart="line"
        style="flex:1; padding:7px 0; border-radius:8px; font-size:11px; font-weight:700; border:none; cursor:pointer; background:transparent; color:var(--text-muted); letter-spacing:.5px">
        âˆ¿ LÃNEA
      </button>
    </div>

    <!-- KPI pills -->
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:12px">
      <div style="background:rgba(0,240,255,0.08); border:1px solid rgba(0,240,255,0.3); border-radius:10px; padding:8px 4px; text-align:center">
        <div style="font-size:20px; font-weight:800; color:#00f0ff; line-height:1">${S.blocked}</div>
        <div style="font-size:9px; color:rgba(255,255,255,0.4); margin-top:2px; letter-spacing:.5px">BLOQUEADOS</div>
      </div>
      <div style="background:rgba(57,255,122,0.08); border:1px solid rgba(57,255,122,0.3); border-radius:10px; padding:8px 4px; text-align:center">
        <div style="font-size:20px; font-weight:800; color:#39ff7a; line-height:1">${S.score}</div>
        <div style="font-size:9px; color:rgba(255,255,255,0.4); margin-top:2px; letter-spacing:.5px">SCORE</div>
      </div>
      <div style="background:rgba(255,180,59,0.08); border:1px solid rgba(255,180,59,0.3); border-radius:10px; padding:8px 4px; text-align:center">
        <div style="font-size:20px; font-weight:800; color:#ffb43b; line-height:1">${THREAT_TYPES.length}</div>
        <div style="font-size:9px; color:rgba(255,255,255,0.4); margin-top:2px; letter-spacing:.5px">VECTORES</div>
      </div>
    </div>

    <canvas id="statsCanvas" style="width:100%; border-radius:12px; background:rgba(0,0,0,0.25); display:block"></canvas>
    <div id="chartLegend" style="margin-top:10px"></div>
    <button class="btn alt" onclick="closeSheet()" style="margin-top:14px; width:100%">Cerrar</button>
  `);

  const canvas = document.getElementById('statsCanvas');
  const ctx = canvas.getContext('2d');

  function setSize(h) {
    const w = canvas.parentElement.offsetWidth - 32;
    canvas.width = w * (window.devicePixelRatio || 1);
    canvas.height = h * (window.devicePixelRatio || 1);
    canvas.style.height = h + 'px';
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    return { W: w, H: h };
  }

  /* â”€â”€ HORIZONTAL BAR CHART â”€â”€ */
  function drawBarChart() {
    const { W, H } = setSize(typeCounts.length * 30 + 20);
    ctx.clearRect(0, 0, W, H);
    const labelW = 100, padR = 36, padT = 8, padB = 8;
    const chartW = W - labelW - padR;
    const maxVal = Math.max(...typeCounts.map(t => t.count), 1);
    const rowH = (H - padT - padB) / typeCounts.length;

    typeCounts.forEach((t, i) => {
      const y = padT + i * rowH;
      const barH = rowH * 0.52;
      const bY = y + (rowH - barH) / 2;
      const barLen = (t.count / maxVal) * chartW;

      // Row bg on hover (subtle alternating)
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(0, y, W, rowH);
      }

      // Name label
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const shortName = t.name.length > 14 ? t.name.slice(0, 13) + 'â€¦' : t.name;
      ctx.fillText(shortName, labelW - 8, y + rowH / 2);

      // Track (background rail)
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.roundRect(labelW, bY, chartW, barH, 4);
      ctx.fill();

      // Bar fill with gradient
      if (barLen > 0) {
        const grd = ctx.createLinearGradient(labelW, 0, labelW + barLen, 0);
        grd.addColorStop(0, t.color);
        grd.addColorStop(1, t.color + 'aa');
        ctx.fillStyle = grd;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(labelW, bY, Math.max(barLen, 4), barH, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Count badge at end
      ctx.fillStyle = t.count > 0 ? '#fff' : 'rgba(255,255,255,0.3)';
      ctx.font = `bold 11px "JetBrains Mono", monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(t.count, labelW + barLen + 6, y + rowH / 2);
    });

    document.getElementById('chartLegend').innerHTML = `
      <p style="font-size:10px; color:rgba(255,255,255,0.35); text-align:center; margin:0">
        Top ${typeCounts.length} vectores Â· Total ${totalAttacks} ataques interceptados
      </p>`;
  }

  /* â”€â”€ DONUT PIE CHART â”€â”€ */
  function drawPieChart() {
    const { W, H } = setSize(200);
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 16;
    let startAngle = -Math.PI / 2;

    pieData.forEach(t => {
      const slice = (t.count / pieTotal) * 2 * Math.PI;
      const mid = startAngle + slice / 2;
      // Slight explode on hover feel
      const ex = Math.cos(mid) * 2, ey = Math.sin(mid) * 2;

      ctx.shadowColor = t.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.moveTo(cx + ex, cy + ey);
      ctx.arc(cx + ex, cy + ey, R, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Thin separator
      ctx.strokeStyle = 'rgba(8,8,20,0.9)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      startAngle += slice;
    });

    // Donut hole
    ctx.fillStyle = '#080814';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.5, 0, 2 * Math.PI);
    ctx.fill();

    // Center text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00f0ff';
    ctx.font = `bold 18px "JetBrains Mono", monospace`;
    ctx.fillText(S.blocked, cx, cy - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `9px "JetBrains Mono", monospace`;
    ctx.fillText('TOTAL', cx, cy + 10);

    // HTML legend â€” 2 column grid below
    const legendItems = pieData.map(t => {
      const pct = Math.round((t.count / pieTotal) * 100);
      return `<div style="display:flex; align-items:center; gap:5px; font-size:10px; color:rgba(255,255,255,0.6)">
        <span style="width:8px; height:8px; border-radius:2px; background:${t.color}; flex-shrink:0; box-shadow:0 0 5px ${t.color}"></span>
        <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${t.name}</span>
        <b style="color:#fff; margin-left:auto">${pct}%</b>
      </div>`;
    }).join('');

    document.getElementById('chartLegend').innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; margin-top:4px">
        ${legendItems}
      </div>`;
  }

  /* â”€â”€ SMOOTH LINE CHART â”€â”€ */
  function drawLineChart() {
    const { W, H } = setSize(180);
    ctx.clearRect(0, 0, W, H);
    const pad = { l: 26, r: 12, t: 18, b: 28 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    const maxVal = Math.max(...lineData, 1);

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + chartH - (i / 4) * chartH;
      ctx.strokeStyle = i === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.setLineDash(i === 0 ? [] : [4, 4]);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.setLineDash([]);
      if (i > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round((i / 4) * maxVal), pad.l - 4, y);
      }
    }

    // Calculate points
    const pts = lineData.map((v, i) => ({
      x: pad.l + (i / (SLOTS - 1)) * chartW,
      y: pad.t + chartH - (v / maxVal) * chartH
    }));

    // Smooth bezier helper
    function bezierPath(points) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const cp1x = (points[i - 1].x + points[i].x) / 2;
        const cp1y = points[i - 1].y;
        const cp2x = cp1x;
        const cp2y = points[i].y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
      }
    }

    // Gradient area fill
    const areaGrad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
    areaGrad.addColorStop(0, 'rgba(0,240,255,0.28)');
    areaGrad.addColorStop(1, 'rgba(0,240,255,0.0)');
    ctx.fillStyle = areaGrad;
    bezierPath(pts);
    ctx.lineTo(pts[pts.length - 1].x, pad.t + chartH);
    ctx.lineTo(pts[0].x, pad.t + chartH);
    ctx.closePath();
    ctx.fill();

    // Stroke line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineJoin = 'round';
    bezierPath(pts);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dots
    pts.forEach((p, i) => {
      // Outer glow ring
      ctx.fillStyle = 'rgba(0,240,255,0.2)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      // Inner dot
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Value label above peak dots
      if (lineData[i] > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(lineData[i], p.x, p.y - 8);
      }

      // X-axis time label
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '8px monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(`-${SLOTS - i}m`, p.x, pad.t + chartH + 6);
    });

    document.getElementById('chartLegend').innerHTML = `
      <p style="font-size:10px; color:rgba(255,255,255,0.35); text-align:center; margin:0">
        Frecuencia de ataques Â· Ãºltimos ${SLOTS} minutos Â· ${S.blocked} bloqueados en total
      </p>`;
  }

  function drawChart(type) {
    if (type === 'bar') drawBarChart();
    else if (type === 'pie') drawPieChart();
    else if (type === 'line') drawLineChart();

    document.querySelectorAll('.chart-tab-btn').forEach(b => {
      const active = b.dataset.chart === type;
      b.style.background = active ? 'var(--accent)' : 'transparent';
      b.style.color = active ? '#000' : 'var(--text-muted)';
      b.style.fontWeight = active ? '800' : '600';
    });
  }

  document.querySelectorAll('.chart-tab-btn').forEach(btn => {
    btn.onclick = () => drawChart(btn.dataset.chart);
  });

  drawChart('bar');
}

// E. Informe Forense
function reportSheet() {
  say('Generando informe de seguridad.');
  const when = new Date().toLocaleString('es-PE');
  const safeCount = D.filter(d => d.r === 0).length;
  const reportText = `================================================
INFORME FORENSE DE CIBERSEGURIDAD â€“ CIBERESCUDO 2.0
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

  sheet('ðŸ“‘ Informe Forense', `
    <p><b>Operador:</b> ${S.name} Â· <b>Score:</b> ${S.score}%<br><b>Ataques Bloqueados:</b> ${S.blocked}</p>
    <button class="btn" id="btnDlReport">ðŸ“¥ Descargar Archivo (.txt)</button>
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
    notifyIsland('Informe Descargado', 'ðŸ“„');
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
  $('#vpnTx').textContent = S.vpn ? 'Activa Â· TÃºnel AES-256' : 'Desactivada Â· IP Expuesta';
  $('#vpnPillText').textContent = S.vpn ? 'VPN On' : 'VPN Off';
  calcScore();
  SFX.beep(S.vpn ? 800 : 400, 'sine', 0.08);
  say(S.vpn ? 'VPN cuÃ¡ntica activada.' : 'VPN desactivada.');
  notifyIsland(S.vpn ? 'VPN Conectada' : 'VPN Desconectada', 'ðŸŒ');
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
  say(S.auto ? 'TrÃ¡fico automÃ¡tico activado.' : 'TrÃ¡fico en pausa.');
};

// Themes con locuciÃ³n
const THEME_NAMES = {
  'cyber': 'Cian',
  'neon': 'Violeta',
  'matrix': 'Matrix',
  'solar': 'Ãmbar',
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
    say('Â¡Protocolo Lockdown activado! Red aislada.');
    notifyIsland('EMERGENCIA LOCKDOWN', 'ðŸš¨', 4000);
  } else {
    SFX.success();
    say('Lockdown desactivado.');
    notifyIsland('Lockdown Desactivado', 'ðŸ›¡ï¸');
  }
};

// DiagnÃ³stico General
function showStatusDiagnostic() {
  sheet('ðŸ›¡ï¸ DiagnÃ³stico de Seguridad', `
    <p><b>Operador:</b> ${S.name} (${S.role})<br>
    <b>Nivel de Blindaje:</b> ${S.score}%<br>
    <b>Ataques Bloqueados:</b> ${S.blocked}<br>
    <b>VPN:</b> ${S.vpn ? 'Protegida' : 'Inactiva'}</p>
    <button class="btn" onclick="scanDevices(); closeSheet()">Escanear Red</button>
    <button class="btn alt" onclick="closeSheet()">Cerrar</button>
  `);
  say(`DiagnÃ³stico: Blindaje al ${S.score} por ciento. ${S.blocked} ataques bloqueados.`);
}
$('#scoreWrapBtn').onclick = showStatusDiagnostic;

// ==========================================================================
// 14. CHAT IA & PROCESAMIENTO DE COMANDOS
// ==========================================================================
const KB = [
  [/phishing|estafa|sms falso/, 'El phishing usa mensajes falsos para robar tus claves. Nunca abras enlaces urgentes.'],
  [/ransomware|secuestro|cifrado/, 'El ransomware cifra tus archivos. MantÃ©n siempre copias de seguridad desconectadas.'],
  [/ddos|denegaci/, 'Un DDoS satura los servidores con trÃ¡fico basura para tirar el servicio.'],
  [/fuerza bruta|diccionario/, 'La fuerza bruta prueba miles de contraseÃ±as. Usa claves largas de 16 caracteres.'],
  [/sql|inyecci[oÃ³]n sql|sqli/, 'La inyecciÃ³n SQL busca insertar comandos maliciosos en formularios para robar o destruir bases de datos.'],
  [/zero-?day|dia cero|cero d[iÃ­]as/, 'Un Zero-Day es una vulnerabilidad desconocida y sin parche de seguridad disponible que los atacantes explotan.'],
  [/mitm|man-in-the-middle|hombre en el medio/, 'El ataque Man-in-the-Middle intercepta paquetes de red en redes pÃºblicas no seguras.'],
  [/spyware|keylogger|esp[iÃ­]a/, 'El spyware graba tus teclas y pantallas para recopilar contraseÃ±as y datos bancarios.'],
  [/cryptojack|miner[iÃ­]a|cripto/, 'El cryptojacking secuestra tu CPU y GPU para minar criptomonedas en secreto.'],
  [/xss|cross-site/, 'XSS inyecta scripts en sitios confiables para robar cookies de sesiÃ³n de los navegadores.'],
  [/dns|spoofing/, 'El spoofing de DNS falsea la resoluciÃ³n de nombres para llevarte a pÃ¡ginas clonadas idÃ©nticas.'],
  [/vpn|t[uÃº]nel/, 'Una VPN cifra tu conexiÃ³n para proteger tu privacidad en redes pÃºblicas.'],
  [/jarvis|qui[eÃ©]n eres/, 'Soy Jarvis 2.0, tu copiloto de ciberseguridad. Te ayudo a monitorear y proteger tus dispositivos.']
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
    $('#bubble').textContent = `Â«${transcript}Â»`;
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
    CHAT_LOG.push({ sender: 'jarvis', text: `Hola, ${S.name}. Â¿QuÃ© duda de ciberseguridad tienes?` });
  }

  const renderMsgs = () => {
    const stream = $('#chatStream');
    if (!stream) return;
    stream.innerHTML = CHAT_LOG.map(m => `
      <div class="chat-msg ${m.sender}">${m.text}</div>
    `).join('');
    stream.scrollTop = stream.scrollHeight;
  };

  sheet('ðŸ¤– Chat con Jarvis AI', `
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
    const reply = match ? match[1] : `Revisa tus contraseÃ±as y mantÃ©n tus dispositivos actualizados.`;
    
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
