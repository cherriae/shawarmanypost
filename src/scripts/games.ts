type Dir = 'across' | 'down';
const el = (t: string, c = '', x = '') => { const e = document.createElement(t); e.className = c; e.textContent = x; return e; };
const btn = (x: string, f: () => void, c = '') => { const b = el('button', 'btn ' + c, x) as HTMLButtonElement; b.type = 'button'; b.onclick = f; b.dataset.k = x; return b; };
const shuffle = <T>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const paint = (root: HTMLElement, build: () => HTMLElement[], key?: string) => {
  const k = key ?? (document.activeElement as HTMLElement | null)?.dataset?.k ?? '';
  root.replaceChildren(...build());
  const t = root.querySelector(`[data-k="${CSS.escape(k)}"]`) as HTMLButtonElement | null;
  (t && !t.disabled ? t : (root.querySelector('button:not(:disabled)') as HTMLElement | null))?.focus();
};
const live = (root: HTMLElement) => { const p = el('p', 'status'); p.setAttribute('aria-live', 'polite'); root.after(p); return p; };

function crossfloor(root: HTMLElement, d: any) {
  const g: string[] = d.grid, N = g.length;
  const W = (r: number, c: number) => !!g[r]?.[c] && g[r][c] !== '#';
  const V = { across: [0, 1], down: [1, 0] } as const;
  function begin(r: number, c: number, dr: Dir) { const [a, b] = V[dr]; while (W(r - a, c - b)) { r -= a; c -= b; } return [r, c]; }
  function run(r: number, c: number, dr: Dir) { const [a, b] = V[dr]; let [y, x] = begin(r, c, dr); const o: number[][] = []; while (W(y, x)) { o.push([y, x]); y += a; x += b; } return o; }
  const nums: Record<string, number> = {}; let k = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (W(r, c) && ((!W(r, c - 1) && W(r, c + 1)) || (!W(r - 1, c) && W(r + 1, c)))) nums[r + ',' + c] = ++k;
  const entries: { dir: Dir; cells: number[][] }[] = [];
  for (const dr of ['across', 'down'] as Dir[]) for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const s = run(r, c, dr); if (W(r, c) && s.length > 1 && s[0][0] === r && s[0][1] === c) entries.push({ dir: dr, cells: s }); }
  let dir: Dir = entries[0].dir, cr = entries[0].cells[0][0], cc = entries[0].cells[0][1];
  const inp: Record<string, HTMLInputElement> = {}, bar = el('p', 'clue'), msg = el('p', 'status');
  msg.setAttribute('aria-live', 'polite');
  const say = (t: string) => (msg.textContent = t);
  const put = (i: HTMLInputElement, v: string) => { i.value = v; i.dataset.v = v; i.classList.remove('wrong'); i.removeAttribute('aria-invalid'); };
  const done = () => Object.entries(inp).every(([key, i]) => { const [y, x] = key.split(',').map(Number); return i.value === g[y][x]; });
  function show() {
    const cur = run(cr, cc, dir).map(([y, x]) => y + ',' + x);
    for (const key in inp) { const p = inp[key].parentElement!; p.classList.toggle('hl', cur.includes(key)); p.classList.toggle('cur', key === cr + ',' + cc); }
    const [y, x] = begin(cr, cc, dir), n = nums[y + ',' + x];
    bar.textContent = `${n} ${dir === 'across' ? 'Across' : 'Down'}: ${d.clues[dir][n] ?? ''}`;
  }
  function sel(r: number, c: number, toggle = false) {
    const o: Dir = dir === 'across' ? 'down' : 'across';
    if (r === cr && c === cc && toggle) { if (run(r, c, o).length > 1) dir = o; }
    else if (run(r, c, dir).length < 2) dir = o;
    cr = r; cc = c; show(); inp[r + ',' + c].focus();
  }
  function step(dl: number) { const cs = run(cr, cc, dir); const i = cs.findIndex(([y, x]) => y === cr && x === cc) + dl; if (cs[i]) sel(cs[i][0], cs[i][1]); }
  const grid = el('div', 'xgrid'); grid.style.setProperty('--n', String(N));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (!W(r, c)) { grid.append(el('div', 'blk')); continue; }
    const cell = el('div', 'cell'), i = el('input') as HTMLInputElement;
    if (nums[r + ',' + c]) cell.append(el('span', 'num', String(nums[r + ',' + c])));
    i.maxLength = 2; i.autocapitalize = 'characters'; i.autocomplete = 'off'; i.spellcheck = false; i.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}`);
    let was = false;
    i.addEventListener('pointerdown', () => { was = r === cr && c === cc; });
    i.addEventListener('focus', () => { if (r !== cr || c !== cc) sel(r, c); });
    i.addEventListener('click', () => { if (was) sel(r, c, true); was = false; });
    i.addEventListener('input', () => {
      const ch = i.value.slice(-1).toUpperCase();
      if (/^[A-Z]$/.test(ch)) { put(i, ch); step(1); say(done() ? 'Solved. Nicely done.' : ''); } else put(i, i.dataset.v ?? '');
    });
    i.addEventListener('keydown', (e) => {
      const m: Record<string, number[]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
      if (m[e.key]) {
        e.preventDefault(); const [a, b] = m[e.key]; let y = r + a, x = c + b;
        while (y >= 0 && x >= 0 && y < N && x < N && !W(y, x)) { y += a; x += b; }
        if (W(y, x)) { dir = a ? 'down' : 'across'; sel(y, x); }
      } else if (e.key === 'Backspace') { e.preventDefault(); if (i.value) put(i, ''); else { step(-1); put(inp[cr + ',' + cc], ''); } }
      else if (e.key === 'Enter') { e.preventDefault(); sel(r, c, true); }
      else if (e.key === 'Tab') {
        const idx = entries.findIndex((en) => en.dir === dir && en.cells.some(([y, x]) => y === cr && x === cc));
        const nx = idx + (e.shiftKey ? -1 : 1);
        if (entries[nx]) { e.preventDefault(); dir = entries[nx].dir; sel(entries[nx].cells[0][0], entries[nx].cells[0][1]); }
      }
    });
    inp[r + ',' + c] = i; cell.append(i); grid.append(cell);
  }
  const clues = el('div', 'clues');
  for (const dr of ['across', 'down'] as Dir[]) { const ol = el('ol'); for (const [n, t] of Object.entries(d.clues[dr])) ol.append(el('li', '', `${n}. ${t}`)); clues.append(el('h3', '', dr === 'across' ? 'Across' : 'Down'), ol); }
  const fill = (cells: number[][]) => cells.forEach(([y, x]) => put(inp[y + ',' + x], g[y][x]));
  const tools = el('div', 'tools');
  tools.append(
    btn('Check', () => { let n = 0; for (const key in inp) { const [y, x] = key.split(',').map(Number), v = inp[key].value, bad = !!v && v !== g[y][x]; inp[key].classList.toggle('wrong', bad); bad ? inp[key].setAttribute('aria-invalid', 'true') : inp[key].removeAttribute('aria-invalid'); n += +bad; } say(n ? `${n} letter${n > 1 ? 's are' : ' is'} wrong.` : 'No wrong letters so far.'); }),
    btn('Reveal word', () => { fill(run(cr, cc, dir)); say(done() ? 'Puzzle revealed.' : ''); }),
    btn('Reveal puzzle', () => { fill(entries.flatMap((e) => e.cells)); say('Puzzle revealed.'); }),
    btn('Restart', () => { Object.values(inp).forEach((i) => put(i, '')); say(''); dir = entries[0].dir; sel(entries[0].cells[0][0], entries[0].cells[0][1]); }),
  );
  const wrap = el('div', 'xwrap'), left = el('div'); left.append(bar, grid); wrap.append(left, clues);
  root.replaceChildren(wrap, tools, msg); show();
}

function caucus(root: HTMLElement, d: any) {
  const G: { name: string; words: string[] }[] = d.groups, out = live(root);
  let rem: string[] = [], sel: string[] = [], solved: typeof G = [], tried = new Set<string>(), left = 4, msg = '';
  const start = () => { rem = shuffle(G.flatMap((g) => g.words)); sel = []; solved = []; tried = new Set(); left = 4; msg = ''; };
  const submit = () => {
    if (sel.length !== 4 || !left) return;
    const key = [...sel].sort().join('|');
    if (tried.has(key)) { msg = 'Already tried that one.'; return; }
    const hit = G.find((g) => g.words.every((w) => sel.includes(w)));
    if (hit) { solved.push(hit); rem = rem.filter((w) => !hit.words.includes(w)); sel = []; msg = solved.length === 4 ? 'All four caucuses found.' : `Caucus found: ${hit.name}.`; return; }
    tried.add(key); left--; msg = G.some((g) => g.words.filter((w) => sel.includes(w)).length === 3) ? 'One away…' : 'Not a caucus.';
    if (!left) { solved.push(...G.filter((g) => !solved.includes(g))); rem = []; sel = []; msg = 'Out of mistakes. Here are the caucuses.'; }
  };
  const draw = (key?: string) => { out.textContent = msg; paint(root, () => {
    const o: HTMLElement[] = [];
    for (const g of solved) { const r = el('div', 'solved'); r.append(el('strong', '', g.name), el('span', '', g.words.join(', '))); o.push(r); }
    const t = el('div', 'tiles4');
    for (const w of rem) { const b = el('button', 'tile', w) as HTMLButtonElement; b.type = 'button'; b.dataset.k = w; b.setAttribute('aria-pressed', String(sel.includes(w))); b.onclick = () => { sel = sel.includes(w) ? sel.filter((x) => x !== w) : sel.length < 4 ? [...sel, w] : sel; draw(); }; t.append(b); }
    const sub = btn('Submit', () => { submit(); draw(); }, 'pri') as HTMLButtonElement; sub.disabled = sel.length !== 4 || !left;
    const tools = el('div', 'tools'); tools.append(btn('Shuffle', () => { rem = shuffle(rem); draw(); }), btn('Deselect all', () => { sel = []; draw(); }), sub, btn('Restart', () => { start(); draw('Shuffle'); }));
    return [...o, t, el('p', 'meta', `Mistakes left: ${left} ${'●'.repeat(left)}${'○'.repeat(4 - left)}`), tools];
  }, key); };
  start(); draw('none');
}

function quiz(root: HTMLElement, d: any) {
  const Q: any[] = d.questions, out = live(root);
  let i = 0, pick: number | null = null, picks: (number | null)[] = [];
  const draw = (key?: string) => paint(root, () => {
    if (i >= Q.length) {
      const s = Q.filter((q, j) => picks[j] === q.answer).length, n = Q.length;
      const band = s === n ? 'Perfect roll call.' : s >= (2 * n) / 3 ? 'Strong showing.' : s >= n / 3 ? 'Good start. Try another round.' : 'Every expert started somewhere.';
      const h = el('h2', 'q', `${s} of ${n}`); h.tabIndex = -1; h.dataset.k = 'q'; out.textContent = `${s} of ${n}. ${band}`;
      const ol = el('ol', 'review'); Q.forEach((q, j) => ol.append(el('li', '', `${q.q} You: ${picks[j] == null ? '—' : q.choices[picks[j]!]}. Answer: ${q.choices[q.answer]}.`)));
      return [h, el('p', '', band), ol, btn('Restart', () => { i = 0; pick = null; picks = []; draw('q'); }, 'pri')];
    }
    const q = Q[i], h = el('h2', 'q', q.q); h.tabIndex = -1; h.dataset.k = 'q';
    const o: HTMLElement[] = [el('p', 'meta', `Question ${i + 1} of ${Q.length}`), h];
    q.choices.forEach((c: string, j: number) => {
      const b = el('button', 'choice', c) as HTMLButtonElement; b.type = 'button';
      if (pick === null) b.onclick = () => { pick = j; picks[i] = j; draw('next'); };
      else { b.disabled = true; b.classList.toggle('ok', j === q.answer); b.classList.toggle('bad', j === pick && j !== q.answer); if (j === q.answer) b.append(el('span', 'tag', '✓ Correct answer')); else if (j === pick) b.append(el('span', 'tag', '✗ Your answer')); }
      o.push(b);
    });
    if (pick !== null) {
      out.textContent = (pick === q.answer ? 'Correct. ' : `Not quite. The answer is ${q.choices[q.answer]}. `) + q.why;
      o.push(el('p', 'why', out.textContent), btn(i === Q.length - 1 ? 'See your score' : 'Next question', () => { i++; pick = null; draw('q'); }, 'pri'));
      (o[o.length - 1] as HTMLElement).dataset.k = 'next';
    } else out.textContent = '';
    return o;
  }, key);
  draw('q');
}

const run: Record<string, (r: HTMLElement, d: any) => void> = { crossfloor, caucus, 'roll-call': quiz };
document.querySelectorAll<HTMLElement>('[data-game]').forEach((r) => run[r.dataset.game!](r, JSON.parse(r.dataset.puzzle!)));
