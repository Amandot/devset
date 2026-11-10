const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const hasGSAP = typeof gsap !== 'undefined';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==================== THEME SWITCHER ==================== */
const themeToggle = $('#themeToggle');
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.logo-img').forEach(image => {
    image.src = t === 'dark' ? 'white_logo.png' : 'logo.png';
  });
  localStorage.setItem('devset-theme', t);
  if (hasGSAP && !reducedMotion && themeToggle) {
    gsap.fromTo(themeToggle, { rotate: -40, scale: 0.88 }, { rotate: 0, scale: 1, duration: 0.35, ease: 'back.out(2)' });
  }
}
const savedTheme = localStorage.getItem('devset-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
setTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(cur === 'dark' ? 'light' : 'dark');
  });
}

/* ==================== TOAST ==================== */
function toast(t) {
  const e = $('#toast');
  if (!e) return;
  e.textContent = t;
  if (hasGSAP && !reducedMotion) {
    gsap.killTweensOf(e);
    gsap.set(e, { display: 'flex', opacity: 0, y: 30, scale: 0.92 });
    gsap.to(e, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.8)' });
    gsap.to(e, {
      opacity: 0,
      y: 20,
      scale: 0.95,
      duration: 0.3,
      ease: 'power2.in',
      delay: 1.6,
      onComplete: () => gsap.set(e, { display: 'none' })
    });
  } else {
    e.classList.add('show');
    setTimeout(() => e.classList.remove('show'), 1500);
  }
}

/* ==================== COPY BUTTONS ==================== */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  if (hasGSAP && !reducedMotion) {
    gsap.fromTo(b, { scale: 0.94 }, { scale: 1, duration: 0.22, ease: 'back.out(2)' });
  }
  (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy) : Promise.reject())
    .then(() => toast('Copied: ' + b.dataset.copy))
    .catch(() => toast('Press Ctrl+C to copy'));
});

/* ==================== HERO TERMINAL TYPING ==================== */
const heroLines = [
  '$ git clone https://github.com/example/fullstack-app.git',
  '$ cd fullstack-app',
  '$ npx devset',
  '<span class="g">✓</span> React detected (framework)',
  '<span class="g">✓</span> Django detected (framework)',
  'PROJECT TYPE: <b class="m">FULLSTACK</b>',
  '? Proceed with setup? (Y/n) <span class="y">y</span>',
  '<span class="g">✔</span> Create Python virtual environment',
  '<span class="g">✔</span> Install backend dependencies (pip)',
  '<span class="g">✔</span> Install frontend dependencies (npm)',
  '<span class="g">SETUP COMPLETE</span>',
  '$ npm run dev:all',
  '<span class="m">[FRONTEND]</span> Ready at http://localhost:5173',
  '<span class="m">[BACKEND]</span> Ready at http://localhost:8000'
];

(async () => {
  const p = $('#heroTerm');
  if (!p) return;
  if (reducedMotion) {
    p.innerHTML = heroLines.join('\n');
    return;
  }
  for (const l of heroLines) {
    const lineEl = document.createElement('div');
    lineEl.innerHTML = l;
    p.appendChild(lineEl);
    if (hasGSAP) {
      gsap.fromTo(lineEl, { opacity: 0, y: 3 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power1.out' });
    }
    await sleep(l.startsWith('$') ? 650 : 340);
  }
})();

/* ==================== CHORES CHECKLIST ==================== */
const chores = [
  ['Work out which languages and frameworks are used', 5],
  ['Find the nested frontend and backend folders', 5],
  ['Pick the right package manager', 5],
  ['Create and activate a Python virtual environment', 10],
  ['Spot missing environment variables', 10],
  ['Open a terminal for each service', 5]
];

const choresEl = $('#chores');
if (choresEl) {
  choresEl.innerHTML = chores
    .map((c, i) => `<label><input type="checkbox" data-m="${c[1]}"> <span>${c[0]} <b>(${c[1]} min)</b></span></label>`)
    .join('');

  const savedObj = { val: 0 };
  choresEl.addEventListener('change', () => {
    let t = 0;
    document.querySelectorAll('#chores input:checked').forEach(i => (t += +i.dataset.m));
    if (hasGSAP && !reducedMotion) {
      gsap.to(savedObj, {
        val: t,
        duration: 0.45,
        ease: 'power2.out',
        onUpdate: () => {
          $('#saved').textContent = Math.round(savedObj.val) + ' min';
        }
      });
      gsap.fromTo('#saved', { scale: 1.25 }, { scale: 1, duration: 0.35, ease: 'back.out(2.5)' });
    } else {
      $('#saved').textContent = t + ' min';
    }
  });
}

/* ==================== PIPELINE STAGES ==================== */
const stages = [
  ['Scan', 'Crawls your folders safely.', ['Skips node_modules, .venv, .git, dist and binaries', 'Stops at depth 6 or 10,000 files', 'Never follows symlinks', 'Finds nested apps like frontend/ and backend/ and monorepo files (turbo.json, pnpm-workspace.yaml)'], 'src/scanner/'],
  ['Detect', 'Scores clues to find languages, frameworks, package managers, databases, Docker and .env files.', ['Files, dependencies and code imports each add points', 'Confirmed above the threshold, possible above the minimum', 'Multiple lockfiles raise a conflict warning'], 'src/detectors/'],
  ['Analyze', 'Decides what kind of project this is.', ['Frontend, backend, fullstack, monorepo, library or microservice', 'Checks whether .venv and dependencies already exist', 'Works out how each service starts (npm run dev, manage.py runserver, uvicorn)'], 'src/analyzers/'],
  ['Plan', 'Builds an ordered list of steps from what is actually missing.', ['Check runtimes (Node, Python, Java)', 'Copy .env.example to .env only if .env is missing', 'Create .venv only if absent, install only if needed', 'If nothing is missing the plan is empty: "already configured"'], 'src/core/plan-generator.ts'],
  ['Confirm', 'Shows you the plan and asks before changing anything.', ['Press Y to continue, or use --yes to skip the prompt', '--dry-run prints the steps and changes nothing'], 'src/cli/commands/setup.ts'],
  ['Execute', 'Runs each step with the right installer.', ['npm, yarn, pnpm or bun with frozen lockfiles', 'pip installs inside the .venv, never into system Python', 'Stops on the first failed required step'], 'src/installers/, execution-engine.ts'],
  ['Run', 'Starts every service together with colored logs.', ['Prefixes like [FRONTEND] and [BACKEND]', 'Detects and prints the local URL', 'Ctrl+C stops all child processes'], 'devset run, src/runner/']
];

const pipeEl = $('#pipe');
if (pipeEl) {
  pipeEl.innerHTML = stages
    .map((s, i) => `<button role="tab" aria-selected="${i == 0}" data-i="${i}">${i + 1}. ${s[0]}</button>`)
    .join('');

  function showStage(i) {
    document.querySelectorAll('#pipe button').forEach(b => b.setAttribute('aria-selected', b.dataset.i == i));
    const s = stages[i];
    const detail = $('#pipeDetail');
    if (!detail) return;
    const newHTML = `<div><h3>${s[0]}</h3><p>${s[1]}</p><span class="badge">${s[3]}</span></div><div><b>What happens</b><ul>${s[2].map(x => `<li>${x}</li>`).join('')}</ul></div>`;

    if (hasGSAP && !reducedMotion && detail.children.length > 0) {
      gsap.to(detail, {
        opacity: 0.4,
        duration: 0.1,
        onComplete: () => {
          detail.innerHTML = newHTML;
          gsap.fromTo(detail.children, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' });
          gsap.to(detail, { opacity: 1, duration: 0.15 });
        }
      });
    } else {
      detail.innerHTML = newHTML;
    }
  }

  pipeEl.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) showStage(+b.dataset.i);
  });
  showStage(0);
}

/* ==================== SIMULATOR ==================== */
const P = {
  full: {
    name: 'fullstack-app',
    type: 'FULLSTACK',
    example: true,
    comps: [
      { n: 'frontend', lang: 'TypeScript', fw: 'Vite', pm: 'npm', rt: 'Node.js', cmd: 'npm install' },
      { n: 'backend', lang: 'Python', fw: 'Django', pm: 'pip', rt: 'Python', py: 1, cmd: 'python -m pip install -r requirements.txt' }
    ],
    svc: ['[FRONTEND] npm run dev → http://localhost:5173', '[BACKEND] python manage.py runserver → http://localhost:8000']
  },
  next: {
    name: 'shop-web',
    type: 'FRONTEND',
    example: true,
    comps: [{ n: 'shop-web', lang: 'TypeScript', fw: 'Next.js', pm: 'pnpm', rt: 'Node.js', cmd: 'pnpm install --frozen-lockfile' }],
    svc: ['[SHOP-WEB] npm run dev → http://localhost:3000']
  },
  dj: {
    name: 'api',
    type: 'BACKEND',
    example: true,
    comps: [{ n: 'api', lang: 'Python', fw: 'Django', pm: 'pip', rt: 'Python', py: 1, cmd: 'python -m pip install -r requirements.txt' }],
    svc: ['[API] python manage.py runserver → http://localhost:8000']
  }
};

const out = $('#out');
let busy = false, token = 0;
const print = h => {
  if (!out) return;
  out.innerHTML += h + '\n';
  out.scrollTop = out.scrollHeight;
};

function buildPlan(p, s) {
  const st = [];
  [...new Set(p.comps.map(c => c.rt))].forEach(r => st.push({ t: `Verify ${r} runtime installation`, k: 'rt' }));
  const act = [];
  if (p.example && !s.env) act.push({ t: 'Create .env configuration (copy from .env.example)' });
  p.comps.forEach(c => {
    if (c.py && !s.venv) act.push({ t: `Create Python virtual environment (.venv) for ${c.n}`, c: 'python -m venv .venv', d: c.n });
  });
  p.comps.forEach(c => {
    if (!s.deps) act.push({ t: `Install ${c.n} dependencies (${c.pm})`, c: c.cmd, d: c.n });
  });
  if (!act.length) return [];
  return [...st, ...act, { t: 'Validate environment and dependency setup' }];
}

function showAsk() {
  const ask = $('#ask');
  if (!ask) return;
  ask.hidden = false;
  if (hasGSAP && !reducedMotion) {
    gsap.fromTo(ask, { opacity: 0, y: 10, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.6)' });
  }
}

async function run() {
  if (busy || !out) return;
  busy = true;
  const my = ++token;
  $('#run').disabled = true;
  $('#ask').hidden = true;
  out.innerHTML = '';
  const p = P[$('#proj').value],
    s = { env: $('#hasEnv').checked, venv: $('#hasVenv').checked, deps: $('#hasDeps').checked },
    dry = $('#dry').checked;
  print(`<span class="d">$ devset${dry ? ' --dry-run' : ''}</span>`);
  print('Scanning project...');
  await sleep(450);
  print(`<span class="g">✓</span> ${p.comps[0].lang} detected (language)`);
  for (const c of p.comps) {
    print(`<span class="g">✓</span> ${c.fw} detected (framework)`);
    print(`<span class="g">✓</span> ${c.pm} detected (package-manager)`);
  }
  await sleep(450);
  print(`\nPROJECT TYPE: <b class="m">${p.type}</b>`);
  p.comps.forEach(c => print(`\n<b class="m">${c.n.toUpperCase()}</b>\n  Framework: ${c.fw}\n  Language: ${c.lang}\n  Package Manager: ${c.pm}`));
  print(`\n<span class="y">ENVIRONMENT</span>\n  Example: .env.example\n  Status: ${s.env ? '<span class="g">.env file present</span>' : '<span class="y">.env file missing (template available)</span>'}`);
  await sleep(450);
  const plan = buildPlan(p, s);
  if (!plan.length) {
    print('\n<span class="g">✓ No setup changes required. Project is already configured!</span>');
    print('\nConfigured services:');
    p.svc.forEach(x => print('  • ' + x));
    print('\nStart everything with: <b class="g">devset run</b>');
    return done();
  }
  print('\n<b>SETUP PLAN</b>');
  plan.forEach((x, i) => print(`  ${i + 1}. ${x.t}` + (x.c ? `\n     <span class="d">Command: ${x.c} (in ${x.d})</span>` : '')));
  window._plan = plan;
  window._p = p;
  window._dry = dry;
  if (dry) {
    print('\n<span class="y">[DRY-RUN MODE ACTIVE]</span>');
    return exec(my);
  }
  print('\n? Proceed with setup and dependency installation? (Y/n)');
  showAsk();
}

async function exec(my) {
  const plan = window._plan;
  print('');
  for (let i = 0; i < plan.length; i++) {
    if (my !== token) return;
    print(`<span class="d">⠋ [Step ${i + 1}/${plan.length}] ${plan[i].t}</span>`);
    await sleep(plan[i].c ? 800 : 400);
    print(`<span class="g">✔</span> [Step ${i + 1}/${plan.length}] ${plan[i].t}${window._dry ? ' <span class="y">[dry-run]</span>' : ''}`);
  }
  print(window._dry ? '\n<span class="g">Dry run finished. No files were changed.</span>' : '\n<span class="g">SETUP COMPLETE: your development environment is ready!</span>');
  if (!window._dry) {
    print('\nConfigured services:');
    window._p.svc.forEach(x => print('  • ' + x));
    print('\nStart everything with: <b class="g">devset run</b> or <b class="g">npm run dev:all</b>');
  }
  done();
}

function done() {
  busy = false;
  if ($('#run')) $('#run').disabled = false;
}

if ($('#run')) $('#run').onclick = run;
if ($('#yes')) $('#yes').onclick = () => {
  $('#ask').hidden = true;
  print('<span class="y">y</span>');
  exec(token);
};
if ($('#no')) $('#no').onclick = () => {
  $('#ask').hidden = true;
  print('<span class="y">n</span>\nSetup aborted by user.');
  done();
};
if ($('#reset')) $('#reset').onclick = () => {
  token++;
  out.textContent = 'Press "Run devset" to start.';
  $('#ask').hidden = true;
  done();
};

/* ==================== DETECTION PLAYGROUND ==================== */
const sig = [
  ['package.json', { JavaScript: 15, npm: 10 }],
  ['tsconfig.json', { TypeScript: 20 }],
  ['*.tsx files', { TypeScript: 12, React: 8 }],
  ['react in dependencies', { React: 25 }],
  ['vite.config.ts', { Vite: 25 }],
  ['package-lock.json', { npm: 30 }],
  ['requirements.txt', { Python: 15, pip: 25 }],
  ['manage.py', { Django: 25 }],
  ['"django" in requirements.txt', { Django: 20 }]
];

const tech = {
  JavaScript: [15, 8],
  TypeScript: [15, 8],
  React: [15, 8],
  Vite: [15, 8],
  npm: [15, 8],
  Python: [15, 8],
  pip: [15, 8],
  Django: [20, 10]
};

const sigContainer = $('#signals');
if (sigContainer) {
  sigContainer.innerHTML =
    '<b>Files and clues found</b>' +
    sig.map((s, i) => `<label class="chk"><input type="checkbox" data-i="${i}"> <span>${s[0]}</span></label>`).join('');

  let barsInitialized = false;
  function bars() {
    const sc = {};
    Object.keys(tech).forEach(k => (sc[k] = 0));
    document.querySelectorAll('#signals input:checked').forEach(i => {
      const w = sig[i.dataset.i][1];
      for (const k in w) sc[k] += w[k];
    });

    const M = 40;
    const barsContainer = $('#bars');
    if (!barsContainer) return;

    if (!barsInitialized) {
      barsContainer.innerHTML = Object.entries(tech)
        .map(([k, [th, mn]]) => {
          const v = sc[k];
          const st = v >= th ? ['CONFIRMED', 'ok'] : v >= mn ? ['POSSIBLE', 'pos'] : ['not detected', ''];
          return `<div class="bar" data-k="${k}">
            <div class="top"><span>${k}</span><span class="bar-score">${v} pts · ${st[0]}</span></div>
            <div class="track">
              <div class="fill ${st[1]}" style="width:${Math.min(100, (v / M) * 100)}%"></div>
              <span class="mark" style="left:${(mn / M) * 100}%"></span>
              <span class="mark" style="left:${(th / M) * 100}%"></span>
            </div>
          </div>`;
        })
        .join('');
      barsInitialized = true;
      return;
    }

    Object.entries(tech).forEach(([k, [th, mn]]) => {
      const v = sc[k];
      const st = v >= th ? ['CONFIRMED', 'ok'] : v >= mn ? ['POSSIBLE', 'pos'] : ['not detected', ''];
      const barEl = barsContainer.querySelector(`.bar[data-k="${k}"]`);
      if (!barEl) return;

      const scoreEl = barEl.querySelector('.bar-score');
      if (scoreEl) scoreEl.textContent = `${v} pts · ${st[0]}`;

      const fillEl = barEl.querySelector('.fill');
      if (fillEl) {
        fillEl.className = `fill ${st[1]}`;
        const targetWidth = Math.min(100, (v / M) * 100) + '%';
        if (hasGSAP && !reducedMotion) {
          gsap.to(fillEl, { width: targetWidth, duration: 0.4, ease: 'power2.out' });
        } else {
          fillEl.style.width = targetWidth;
        }
      }
    });
  }

  sigContainer.addEventListener('change', bars);
  bars();
}

/* ==================== LOCKFILES ==================== */
const locks = [
  ['package-lock.json', 'npm', 'npm ci', 'npm install'],
  ['pnpm-lock.yaml', 'pnpm', 'pnpm install --frozen-lockfile', 'pnpm install'],
  ['yarn.lock', 'yarn', 'yarn install --frozen-lockfile', 'yarn install'],
  ['bun.lock', 'bun', 'bun install --frozen-lockfile', 'bun install']
];

const lockBox = $('#lockBox');
if (lockBox) {
  lockBox.innerHTML =
    '<b>Lockfiles in this folder</b>' +
    locks.map((l, i) => `<label class="chk"><input type="checkbox" data-i="${i}"> <span>${l[0]}</span></label>`).join('');

  function lockRes() {
    const f = [...document.querySelectorAll('#lockBox input:checked')].map(i => locks[i.dataset.i]);
    let h;
    if (!f.length) {
      h = '<h3>No lockfile</h3><p>DevSet falls back to <code>npm install</code>, which can pick newer versions than your teammates have.</p>';
    } else {
      h = `<h3>Install command</h3><div class="cmd"><code>${f[0][2]}</code><button class="btn" data-copy="${f[0][2]}">Copy</button></div><p>Chosen because <b>${f[0][0]}</b> is present.</p>`;
      if (f.length > 1) {
        h += `<p class="res"><span class="badge" style="background:var(--bad);color:#fff">Conflict</span> ${f.map(x => x[1]).join(' and ')} lockfiles found together. Keep one package manager and delete the other lockfile.</p>`;
      }
    }

    const resEl = $('#lockRes');
    if (!resEl) return;
    resEl.innerHTML = h;
  }

  lockBox.addEventListener('change', lockRes);
  lockRes();
}

/* ==================== COMMANDS ==================== */
const cm = [
  ['devset', 'Scan the project, show a plan, and set up after you approve.', 'npx devset', ['devset [directory]']],
  ['analyze', 'Scan and report languages, frameworks and manifests. Installs nothing.', 'devset analyze', ['devset analyze ./my-app', 'devset analyze --json']],
  ['setup', 'Run the setup directly.', 'devset setup', ['devset setup --dry-run', 'devset setup --yes']],
  ['doctor', 'Check Node, Python, package managers, Java, Docker and Git on your machine.', 'devset doctor', ['devset doctor --json']],
  ['run', 'Start all services together with colored logs. Ctrl+C stops everything.', 'devset run', ['npm run dev:all']],
  ['clean', 'Remove the .venv folders and devset.config.json that DevSet made, after you confirm.', 'devset clean', ['devset clean --yes']]
];

const tabsEl = $('#tabs');
if (tabsEl) {
  tabsEl.innerHTML = cm.map((c, i) => `<button role="tab" aria-selected="${i == 0}" data-i="${i}">${c[0]}</button>`).join('');

  function tab(i) {
    document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.i == i));
    const c = cm[i];
    const body = $('#cmdBody');
    if (!body) return;
    const newHTML = `<p>${c[1]}</p>` + [c[2], ...c[3]].map(x => `<div class="cmd"><code>${x}</code><button class="btn" data-copy="${x}">Copy</button></div>`).join('');

    if (hasGSAP && !reducedMotion && body.children.length > 0) {
      gsap.to(body, {
        opacity: 0.4,
        duration: 0.1,
        onComplete: () => {
          body.innerHTML = newHTML;
          gsap.fromTo(body.children, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out' });
          gsap.to(body, { opacity: 1, duration: 0.15 });
        }
      });
    } else {
      body.innerHTML = newHTML;
    }
  }

  tabsEl.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) tab(+b.dataset.i);
  });
  tab(0);
}

/* ==================== OPTIONS & SAFETY ==================== */
const optsEl = $('#opts');
if (optsEl) {
  optsEl.innerHTML = [
    ['--dry-run', 'Preview the plan. Nothing changes.'],
    ['--verbose', 'Show live output from every command.'],
    ['-y, --yes', 'Skip the confirmation question.'],
    ['--json', 'Print raw JSON (analyze, doctor).']
  ]
    .map(o => `<div><code>${o[0]}</code><p>${o[1]}</p></div>`)
    .join('');
}

const safetyEl = $('#safety');
if (safetyEl) {
  safetyEl.innerHTML = [
    ['Works offline', 'Analysis uses no AI and no network calls. Only package installs talk to npm or PyPI.'],
    ['Secrets stay hidden', 'DevSet reads only the names in .env files, never the values. It never overwrites an existing .env.'],
    ['No shell tricks', 'Commands run as argument lists, so file contents cannot inject commands.'],
    ['Safe scanning', 'Depth and file limits, no symlink following, and path checks against the project root.'],
    ['Isolated Python', 'Packages go into .venv, not your system Python. An existing .venv or venv is reused.'],
    ['You stay in control', 'Nothing changes until you confirm. Clean only removes files DevSet made.']
  ]
    .map(s => `<div><b>${s[0]}</b>${s[1]}</div>`)
    .join('');
}

/* ==================== SMOOTH ANCHOR SCROLLING ==================== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const navHeight = document.querySelector('.nav')?.offsetHeight || 70;
    const targetY = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  });
});

/* ==================== BUTTON HOVER POLISH ==================== */
if (hasGSAP && !reducedMotion) {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, { scale: 1.03, duration: 0.18, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' });
    });
  });
}
