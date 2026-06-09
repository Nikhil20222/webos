// ── STATE ──
let windows = {};
let zCounter = 10;
let activeWin = null;

// ── APPS CONFIG ──
const apps = {
  terminal: { title:'Terminal', icon:'🖥️', w:600, h:400, build: buildTerminal },
  files:    { title:'File Manager', icon:'📁', w:580, h:420, build: buildFiles },
  editor:   { title:'Text Editor', icon:'📝', w:560, h:420, build: buildEditor },
  browser:  { title:'Browser', icon:'🌐', w:640, h:440, build: buildBrowser },
  music:    { title:'Music Player', icon:'🎵', w:320, h:440, build: buildMusic },
  calc:     { title:'Calculator', icon:'🔢', w:300, h:420, build: buildCalc },
  settings: { title:'Settings', icon:'⚙️', w:480, h:400, build: buildSettings },
  about:    { title:'About NikhilOS', icon:'💻', w:440, h:400, build: buildAbout },
};

// ── OPEN / CLOSE WINDOW ──
function openApp(id) {
  if (windows[id]) {
    if (windows[id].minimized) {
      windows[id].minimized = false;
      windows[id].el.classList.remove('minimized');
    }
    focusWindow(id);
    return;
  }
  const app = apps[id];
  const el = document.createElement('div');
  el.className = 'window';
  el.id = 'win-' + id;
  const desktop = document.getElementById('desktop');
  const dx = desktop.clientWidth, dy = desktop.clientHeight;
  const left = Math.random() * Math.max(0, dx - app.w - 60) + 30;
  const top  = Math.random() * Math.max(0, dy - app.h - 60) + 20;
  el.style.cssText = `width:${app.w}px;height:${app.h}px;left:${left}px;top:${top}px;z-index:${++zCounter}`;

  el.innerHTML = `
    <div class="window-header" data-winid="${id}">
      <div class="window-controls">
        <button class="wc-btn wc-close" onclick="closeWindow('${id}')"></button>
        <button class="wc-btn wc-min"   onclick="minimizeWindow('${id}')"></button>
        <button class="wc-btn wc-max"   onclick="toggleMaximize('${id}')"></button>
      </div>
      <div class="window-title">${app.icon} ${app.title}</div>
    </div>
    <div class="window-body" id="body-${id}"></div>
    <div class="window-resize" data-winid="${id}"></div>
  `;

  desktop.appendChild(el);
  windows[id] = { el, minimized: false, maximized: false, origRect: null };
  app.build(document.getElementById('body-' + id));

  makeDraggable(el.querySelector('.window-header'), el);
  makeResizable(el.querySelector('.window-resize'), el);
  el.addEventListener('mousedown', () => focusWindow(id));
  focusWindow(id);
  updateTaskbar();
}

function closeWindow(id) {
  if (!windows[id]) return;
  windows[id].el.remove();
  delete windows[id];
  updateTaskbar();
}

function minimizeWindow(id) {
  if (!windows[id]) return;
  windows[id].minimized = true;
  windows[id].el.classList.add('minimized');
  updateTaskbar();
}

function toggleMaximize(id) {
  if (!windows[id]) return;
  const w = windows[id];
  const el = w.el;
  const desktop = document.getElementById('desktop');
  if (!w.maximized) {
    w.origRect = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height };
    el.style.left = '0'; el.style.top = '0';
    el.style.width = desktop.clientWidth + 'px';
    el.style.height = desktop.clientHeight + 'px';
    w.maximized = true;
  } else {
    Object.assign(el.style, w.origRect);
    w.maximized = false;
  }
}

function focusWindow(id) {
  if (activeWin && windows[activeWin]) windows[activeWin].el.classList.remove('focused');
  activeWin = id;
  if (windows[id]) { windows[id].el.style.zIndex = ++zCounter; windows[id].el.classList.add('focused'); }
  updateTaskbar();
}

// ── TASKBAR ──
function updateTaskbar() {
  const bar = document.getElementById('taskbar-apps');
  bar.innerHTML = '';
  for (const [id, w] of Object.entries(windows)) {
    const app = apps[id];
    const btn = document.createElement('div');
    btn.className = 'tb-app' + (id === activeWin && !w.minimized ? ' active' : '');
    btn.innerHTML = `<span class="tb-icon">${app.icon}</span>${app.title}`;
    btn.onclick = () => {
      if (w.minimized) { w.minimized = false; w.el.classList.remove('minimized'); focusWindow(id); }
      else if (id === activeWin) minimizeWindow(id);
      else focusWindow(id);
    };
    bar.appendChild(btn);
  }
}

// ── DRAG ──
function makeDraggable(handle, win) {
  let ox, oy, dragging = false;
  handle.addEventListener('mousedown', e => {
    if (e.target.classList.contains('wc-btn')) return;
    dragging = true; ox = e.clientX - win.offsetLeft; oy = e.clientY - win.offsetTop;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const desktop = document.getElementById('desktop');
    let nx = e.clientX - ox, ny = e.clientY - oy;
    nx = Math.max(0, Math.min(nx, desktop.clientWidth - win.offsetWidth));
    ny = Math.max(0, Math.min(ny, desktop.clientHeight - win.offsetHeight));
    win.style.left = nx + 'px'; win.style.top = ny + 'px';
  });
  document.addEventListener('mouseup', () => dragging = false);
}

// ── RESIZE ──
function makeResizable(handle, win) {
  let dragging = false, ox, oy, ow, oh;
  handle.addEventListener('mousedown', e => {
    dragging = true; ox = e.clientX; oy = e.clientY;
    ow = win.offsetWidth; oh = win.offsetHeight;
    e.preventDefault(); e.stopPropagation();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const nw = Math.max(280, ow + e.clientX - ox);
    const nh = Math.max(180, oh + e.clientY - oy);
    win.style.width = nw + 'px'; win.style.height = nh + 'px';
  });
  document.addEventListener('mouseup', () => dragging = false);
}

// ── CLOCK ──
function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const d = now.toLocaleDateString([], {month:'short',day:'numeric'});
  document.getElementById('clock').innerHTML = `${t}<br><span style="font-size:10px">${d}</span>`;
}
setInterval(updateClock, 1000); updateClock();

// ── START MENU ──
function toggleStartMenu() {
  document.getElementById('start-menu').classList.toggle('open');
}
function closeStartMenu() { document.getElementById('start-menu').classList.remove('open'); }
function filterStartMenu(q) {
  const items = document.querySelectorAll('#sm-apps .sm-item');
  items.forEach(i => i.style.display = i.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none');
}

// ── CONTEXT MENU ──
document.getElementById('desktop').addEventListener('contextmenu', e => {
  e.preventDefault();
  const m = document.getElementById('ctx-menu');
  m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 'px';
  m.classList.add('open');
});
document.addEventListener('click', e => {
  if (!e.target.closest('#ctx-menu')) closeCtx();
  if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) closeStartMenu();
});
function closeCtx() { document.getElementById('ctx-menu').classList.remove('open'); }
function refreshDesktop() { showNotif('Desktop','Desktop refreshed','success'); }

// ── NOTIFICATIONS ──
function showNotif(title, body, type='') {
  const area = document.getElementById('notif-area');
  const n = document.createElement('div');
  n.className = 'notif ' + type;
  n.innerHTML = `<div class="notif-title">${title}</div><div class="notif-body">${body}</div>`;
  area.appendChild(n);
  setTimeout(() => n.remove(), 4200);
}

// ── APP BUILDERS ──

// TERMINAL
function buildTerminal(body) {
  body.style.display = 'flex'; body.style.flexDirection = 'column';
  const history = [
    {type:'out', text:'NikhilOS Terminal v1.0 — type <span style="color:#06b6d4">help</span> for commands'},
    {type:'out', text:'────────────────────────────────────────'},
  ];
  const commands = {
    help: () => ['Available commands: <span style="color:#06b6d4">ls, pwd, whoami, date, echo, clear, calc, neofetch</span>'],
    ls:   () => ['📁 Documents  📁 Downloads  📁 Music  📝 notes.txt  🖼️ wallpaper.png'],
    pwd:  () => ['/home/nikhil'],
    whoami: () => ['nikhil'],
    date: () => [new Date().toString()],
    clear: () => { history.length = 0; return []; },
    neofetch: () => [
      '<span style="color:#7c3aed">  ███████╗</span>  <b>nikhil@NikhilOS</b>',
      '<span style="color:#7c3aed">  ██╔════╝</span>  OS: NikhilOS 1.0',
      '<span style="color:#06b6d4">  ███████╗</span>  Kernel: WebOS-v1',
      '<span style="color:#06b6d4">  ╚════██║</span>  Shell: NikhilSH',
      '<span style="color:#10b981">  ███████║</span>  DE: NikhilDE',
      '<span style="color:#10b981">  ╚══════╝</span>  Theme: Dark Purple',
    ],
  };

  function render() {
    const div = body.querySelector('.terminal-body');
    div.innerHTML = history.map(l => {
      if (l.type === 'cmd') return `<div class="terminal-line"><span class="prompt">nikhil@os:~$</span> <span class="cmd">${l.text}</span></div>`;
      if (l.type === 'err') return `<div class="terminal-line"><span class="err">${l.text}</span></div>`;
      return `<div class="terminal-line out">${l.text}</div>`;
    }).join('');
    div.scrollTop = div.scrollHeight;
  }

  body.innerHTML = `
    <div class="terminal-body"></div>
    <div class="terminal-input-row">
      <span class="prompt">nikhil@os:~$</span>
      <input id="term-input" type="text" autocomplete="off" placeholder="type a command..." />
    </div>`;

  const input = body.querySelector('#term-input');
  input.style.userSelect = 'text';
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value.trim(); if (!val) return;
      history.push({type:'cmd', text: val});
      const parts = val.split(' ');
      const cmd = parts[0].toLowerCase();
      if (cmd === 'echo') history.push({type:'out', text: parts.slice(1).join(' ') || ''});
      else if (commands[cmd]) commands[cmd]().forEach(l => history.push({type:'out', text: l}));
      else history.push({type:'err', text:`command not found: ${cmd}`});
      input.value = '';
      render();
    }
  });
  render();
  setTimeout(() => input.focus(), 100);
}

// FILE MANAGER
function buildFiles(body) {
  const files = [
    {name:'Documents', icon:'📁'}, {name:'Downloads', icon:'📁'},
    {name:'Music', icon:'📁'}, {name:'Pictures', icon:'📁'},
    {name:'notes.txt', icon:'📝'}, {name:'wallpaper.png', icon:'🖼️'},
    {name:'resume.pdf', icon:'📄'}, {name:'project.zip', icon:'🗜️'},
    {name:'main.js', icon:'📜'}, {name:'style.css', icon:'🎨'},
    {name:'index.html', icon:'🌐'}, {name:'data.json', icon:'📊'},
  ];
  body.innerHTML = `
    <div class="fm-toolbar">
      <button class="browser-nav" title="Back">‹</button>
      <button class="browser-nav" title="Forward">›</button>
      <button class="browser-nav" title="Up">⬆</button>
      <div class="fm-path">/home/nikhil</div>
    </div>
    <div class="fm-grid">
      ${files.map(f => `<div class="fm-item" ondblclick="showNotif('Files','Opening ${f.name}...')">
        <div class="fi-icon">${f.icon}</div><span>${f.name}</span></div>`).join('')}
    </div>`;
}

// TEXT EDITOR
function buildEditor(body) {
  body.style.display = 'flex'; body.style.flexDirection = 'column';
  body.innerHTML = `
    <div class="editor-toolbar">
      <button class="ed-btn" onclick="showNotif('Editor','File saved!','success')">💾 Save</button>
      <button class="ed-btn" onclick="showNotif('Editor','File opened!')">📂 Open</button>
      <button class="ed-btn" onclick="document.execCommand('bold')"><b>B</b></button>
      <button class="ed-btn" onclick="document.execCommand('italic')"><i>I</i></button>
      <button class="ed-btn" onclick="document.execCommand('underline')"><u>U</u></button>
      <button class="ed-btn" onclick="document.execCommand('selectAll')">Select All</button>
    </div>
    <textarea id="editor-area" class="editor-area" style="flex:1;background:#0a0e14;border:none;outline:none;color:#e6edf3;padding:16px;font-family:'Space Mono',monospace;font-size:13px;line-height:1.7;resize:none;user-select:text;" placeholder="Start typing your notes here...

NikhilOS Text Editor — Ctrl+A to select all, Ctrl+S to save (use save button)"></textarea>`;
}

// BROWSER
function buildBrowser(body) {
  body.style.display = 'flex'; body.style.flexDirection = 'column';
  body.innerHTML = `
    <div class="browser-bar">
      <button class="browser-nav">‹</button>
      <button class="browser-nav">›</button>
      <button class="browser-nav">⟳</button>
      <input class="browser-url" value="nikhilos://newtab" type="text" style="user-select:text" />
      <button class="browser-nav" onclick="showNotif('Browser','Navigating...')">↵</button>
    </div>
    <div class="browser-frame">
      <div class="browser-logo">🌐</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:4px">NikhilOS Browser</div>
      <div style="color:#8b949e;font-size:13px;margin-bottom:16px">New Tab</div>
      <div class="browser-links">
        <div class="b-link" onclick="showNotif('Browser','Opening Google...')">Google</div>
        <div class="b-link" onclick="showNotif('Browser','Opening GitHub...')">GitHub</div>
        <div class="b-link" onclick="showNotif('Browser','Opening YouTube...')">YouTube</div>
        <div class="b-link" onclick="showNotif('Browser','Opening Reddit...')">Reddit</div>
        <div class="b-link" onclick="showNotif('Browser','Opening Twitter...')">Twitter</div>
        <div class="b-link" onclick="showNotif('Browser','Opening Hack Club...')">Hack Club</div>
      </div>
    </div>`;
}

// MUSIC PLAYER
function buildMusic(body) {
  const tracks = [
    {name:'Blinding Lights',artist:'The Weeknd',emoji:'🎸'},
    {name:'Levitating',artist:'Dua Lipa',emoji:'🚀'},
    {name:'Sunflower',artist:'Post Malone',emoji:'🌻'},
    {name:'Peaches',artist:'Justin Bieber',emoji:'🍑'},
  ];
  let curr = 0, playing = false, prog = 0;
  let interval;

  function render() {
    const t = tracks[curr];
    body.innerHTML = `
      <div class="music-body">
        <div class="album-art ${playing ? 'spinning' : ''}">${t.emoji}</div>
        <div class="track-info">
          <div class="track-name">${t.name}</div>
          <div class="track-artist">${t.artist}</div>
        </div>
        <div style="width:100%">
          <div class="progress-bar" onclick="seekMusic(event,this)">
            <div class="progress-fill" style="width:${prog}%"></div>
          </div>
          <div class="time-row"><span>${fmtTime(prog*200/100)}</span><span>3:20</span></div>
        </div>
        <div class="player-controls">
          <button class="ctrl-btn" onclick="prevTrack()">⏮</button>
          <button class="ctrl-btn play" onclick="togglePlay()">${playing?'⏸':'▶'}</button>
          <button class="ctrl-btn" onclick="nextTrack()">⏭</button>
        </div>
        <div style="font-size:11px;color:#8b949e">🔀 Shuffle &nbsp; 🔁 Repeat</div>
      </div>`;
  }

  function fmtTime(s) { const m=Math.floor(s/60); const sec=Math.floor(s%60); return `${m}:${sec<10?'0':''}${sec}`; }

  window._music_play = () => {
    playing = true;
    interval = setInterval(() => { prog = Math.min(100, prog + 0.1); if (prog >= 100) { nextTrack(); } render(); }, 100);
  };
  window._music_pause = () => { playing = false; clearInterval(interval); };
  window.togglePlay = () => { if (playing) window._music_pause(); else window._music_play(); render(); };
  window.nextTrack = () => { curr = (curr+1)%tracks.length; prog = 0; if (playing) { clearInterval(interval); window._music_play(); } render(); };
  window.prevTrack = () => { curr = (curr-1+tracks.length)%tracks.length; prog = 0; render(); };
  window.seekMusic = (e, el) => { const r = el.getBoundingClientRect(); prog = ((e.clientX - r.left)/r.width)*100; render(); };
  render();
}

// CALCULATOR
function buildCalc(body) {
  let expr = '', val = '0';
  function update() {
    body.querySelector('.calc-expr').textContent = expr;
    body.querySelector('.calc-val').textContent = val;
  }
  function press(v) {
    if (v === 'C') { expr = ''; val = '0'; }
    else if (v === '⌫') { val = val.length > 1 ? val.slice(0,-1) : '0'; expr = expr.slice(0,-1); }
    else if (v === '=') {
      try {
        expr += val;
        val = String(eval(expr.replace(/×/g,'*').replace(/÷/g,'/')));
        expr = '';
      } catch { val = 'Error'; expr = ''; }
    } else if (['+','-','×','÷','%'].includes(v)) {
      expr += val + v; val = '0';
    } else if (v === '.') {
      if (!val.includes('.')) val += '.';
    } else {
      val = val === '0' ? v : val + v;
    }
    update();
  }
  body.innerHTML = `
    <div class="calc-body" style="display:flex;flex-direction:column;height:100%">
      <div class="calc-display">
        <div class="calc-expr"></div>
        <div class="calc-val">0</div>
      </div>
      <div class="calc-grid">
        ${['C','⌫','%','÷','7','8','9','×','4','5','6','-','1','2','3','+','0','.','=','=']
          .map((b,i) => `<button class="calc-btn ${['C','⌫'].includes(b)?'clr':['÷','×','-','+','%'].includes(b)?'op':b==='='?'eq':''}" 
          style="${b==='='&&i===18?'grid-column:span 2':''}" onclick="(${press.toString()})(this.dataset.v)" data-v="${b}">${b}</button>`).join('')}
      </div>
    </div>`;

  const btns = body.querySelectorAll('.calc-btn');
  btns.forEach(b => { b.onclick = () => press(b.dataset.v); });
}


function buildSettings(body) {
  body.innerHTML = `
    <div class="settings-body">
      <div class="setting-group">
        <h3>Appearance</h3>
        <div class="setting-row">
          <span>Dark Mode</span>
          <div class="toggle on" onclick="this.classList.toggle('on');showNotif('Settings','Theme changed!','success')"></div>
        </div>
        <div class="setting-row">
          <span>Accent Color</span>
          <div class="color-swatches">
            <div class="swatch selected" style="background:#7c3aed" onclick="this.closest('.color-swatches').querySelectorAll('.swatch').forEach(s=>s.classList.remove('selected'));this.classList.add('selected');showNotif('Settings','Accent changed!')"></div>
            <div class="swatch" style="background:#06b6d4" onclick="this.closest('.color-swatches').querySelectorAll('.swatch').forEach(s=>s.classList.remove('selected'));this.classList.add('selected');showNotif('Settings','Accent changed!')"></div>
            <div class="swatch" style="background:#10b981" onclick="this.closest('.color-swatches').querySelectorAll('.swatch').forEach(s=>s.classList.remove('selected'));this.classList.add('selected');showNotif('Settings','Accent changed!')"></div>
            <div class="swatch" style="background:#ef4444" onclick="this.closest('.color-swatches').querySelectorAll('.swatch').forEach(s=>s.classList.remove('selected'));this.classList.add('selected');showNotif('Settings','Accent changed!')"></div>
            <div class="swatch" style="background:#f59e0b" onclick="this.closest('.color-swatches').querySelectorAll('.swatch').forEach(s=>s.classList.remove('selected'));this.classList.add('selected');showNotif('Settings','Accent changed!')"></div>
          </div>
        </div>
        <div class="setting-row">
          <span>Animations</span>
          <div class="toggle on" onclick="this.classList.toggle('on')"></div>
        </div>
      </div>
      <div class="setting-group">
        <h3>System</h3>
        <div class="setting-row">
          <span>Notifications</span>
          <div class="toggle on" onclick="this.classList.toggle('on')"></div>
        </div>
        <div class="setting-row">
          <span>Auto-updates</span>
          <div class="toggle" onclick="this.classList.toggle('on')"></div>
        </div>
        <div class="setting-row">
          <span>Version</span>
          <span style="font-family:'Space Mono',monospace;font-size:12px;color:#8b949e">NikhilOS 1.0.0</span>
        </div>
      </div>
      <div class="setting-group">
        <h3>Network</h3>
        <div class="setting-row">
          <span>Wi-Fi</span>
          <div class="toggle on" onclick="this.classList.toggle('on')"></div>
        </div>
        <div class="setting-row">
          <span>Bluetooth</span>
          <div class="toggle" onclick="this.classList.toggle('on')"></div>
        </div>
      </div>
    </div>`;
}


function buildAbout(body) {
  body.innerHTML = `
    <div class="about-body">
      <div class="about-logo">💻</div>
      <div class="about-name">NikhilOS</div>
      <div class="about-ver">Version 1.0.0 · WebOS Edition</div>
      <p style="font-size:13px;color:#8b949e;line-height:1.7">A custom web-based operating system built for Hack Club's StarDance WebOS 1 mission. Draggable windows, custom apps, and good vibes only. 🚀</p>
      <div class="about-specs">
        <div class="spec-card"><div class="spec-label">Platform</div><div class="spec-val">Web Browser</div></div>
        <div class="spec-card"><div class="spec-label">Kernel</div><div class="spec-val">WebOS-v1</div></div>
        <div class="spec-card"><div class="spec-label">Shell</div><div class="spec-val">NikhilSH</div></div>
        <div class="spec-card"><div class="spec-label">UI</div><div class="spec-val">NikhilDE 1.0</div></div>
        <div class="spec-card"><div class="spec-label">Memory</div><div class="spec-val">Unlimited ∞</div></div>
        <div class="spec-card"><div class="spec-label">Theme</div><div class="spec-val">Dark Purple</div></div>
      </div>
    </div>`;
}


showNotif('Welcome!', 'NikhilOS booted successfully 🚀', 'success');
setTimeout(() => showNotif('Tip', 'Double-click icons or right-click desktop to open apps!'), 1500);