/* script.js - app logic for all pages (generator, lyrics, members, about)
   - robust element checks (works if page lacks some elements)
   - consistent theme handling across pages
   - generation -> localStorage('last_song')
   - lyrics page loads last_song and provides TTS + karaoke highlight + save + export
*/

/* ---------------- utilities ---------------- */
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function isHangul(s){ return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(s); }
function safeQuery(id){ return document.getElementById(id) || null; }

/* simple template fill */
function fillTemplate(tpl, memberPool){
  return tpl.replace(/\$\{([^}]+)\}/g, (_, key) => {
    switch(key){
      case 'color': return pick(COLORS);
      case 'place': return pick(PLACES);
      case 'emotion': return pick(EMOTIONS);
      case 'time': return pick(TIMES);
      case 'adlib': return Math.random()>0.5 ? pick(ADLIB_EN) : pick(ADLIB_KR);
      case 'subject': return Math.random()>0.5 ? pick(SUBJECTS_EN) : pick(SUBJECTS_KR);
      case 'verb': return Math.random()>0.5 ? pick(VERBS_EN) : pick(VERBS_KR);
      case 'object': return Math.random()>0.5 ? pick(OBJECTS_EN) : pick(OBJECTS_KR);
      case 'member': return pick(memberPool);
      default: return '';
    }
  });
}

/* build structured song */
function buildSong(options){
  const mode = options.mode || 'both';
  const lang = options.lang || 'mix';
  const mood = options.mood || 'hype';
  const extras = options.extras || { rap:true, bridge:true, outro:false };

  // decide memberPool
  let memberPool = [...ALL_MEMBERS];
  if(mode === 'blackpink') memberPool = [...MEMBERS_BP];
  else if(mode === 'babymonster') memberPool = [...MEMBERS_BM];
  else if(mode === 'solo'){
    memberPool = options.solo ? [options.solo] : [pick(ALL_MEMBERS)];
  } else if(mode === 'subunit'){
    memberPool = (options.subunit && options.subunit.length>0) ? options.subunit : shuffle(ALL_MEMBERS).slice(0,3);
  }

  // helper choose template pool
  function choosePool(sec){
    if(lang === 'en') return TEMPLATES[sec + '_en'] || [];
    if(lang === 'ko') return TEMPLATES[sec + '_kr'] || [];
    // mix: occasionally pick MIXED template
    if(Math.random() < 0.16 && MIXED_TEMPLATES[sec + '_mix']) return MIXED_TEMPLATES[sec + '_mix'];
    // otherwise pick random en or kr pool
    return (Math.random() > 0.5 ? (TEMPLATES[sec + '_en']||[]) : (TEMPLATES[sec + '_kr']||[]));
  }

  const sections = [
    {id:'intro', base:2 + rand(0,2)},
    {id:'verse', base:4 + rand(0,2)},
    {id:'pre', base:3 + rand(0,1)},
    {id:'chorus', base:5 + rand(0,2)},
    {id:'verse', base:4 + rand(0,2)},
    {id:'rap', base: extras.rap ? 5 + rand(0,2) : 0},
    {id:'bridge', base: extras.bridge ? 3 + rand(0,1) : 0},
    {id:'chorus', base:5 + rand(0,2)},
    {id:'outro', base: extras.outro ? 3 + rand(0,2) : 2}
  ];

  const song = { meta:{ title: `${pick(["Neon","Midnight","Starlight","Moonlight","Forever"])} ${pick(["Dream","Fever","Blaze","Run","Heart"])}`, mood }, lines: [] };

  sections.forEach(secObj => {
    const sec = secObj.id;
    const count = secObj.base;
    for(let i=0;i<count;i++){
      if(sec === 'rap' && !extras.rap) continue;
      const pool = choosePool(sec);
      const tpl = pool.length ? pick(pool) : "We shine tonight";
      const text = fillTemplate(tpl, memberPool);
      const member = pick(memberPool);
      song.lines.push({ section: sec, member, text });
    }
  });

  // ensure decent length
  if(song.lines.length < 30){
    for(let i=0;i<8;i++){
      const pool = choosePool('chorus');
      const tpl = pool.length ? pick(pool) : "We shine tonight";
      song.lines.push({ section:'chorus', member: pick(memberPool), text: fillTemplate(tpl, memberPool) });
    }
  }

  // formatted text
  let formatted = `Title: ${song.meta.title}\nMood: ${song.meta.mood}\n\n`;
  let curSection = '';
  song.lines.forEach(ln => {
    if(ln.section !== curSection){
      formatted += `\n[${ln.section.toUpperCase()}]\n`;
      curSection = ln.section;
    }
    formatted += `${ln.member}: ${ln.text}\n`;
  });

  return { song, formatted };
}

/* small shuffle */
function shuffle(arr){ return arr.sort(()=>0.5 - Math.random()); }

/* ---------------- theme / header wiring (applies to all pages) ---------------- */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme === 'neon' ? 'neon' : 'cute');
  localStorage.setItem('kpop_theme', theme);
  document.querySelectorAll('.themePicker').forEach(s => { if(s) s.value = theme; });
}
function initThemePickers(){
  const saved = localStorage.getItem('kpop_theme') || 'cute';
  applyTheme(saved);
  document.querySelectorAll('.themePicker').forEach(s => {
    if(!s) return;
    s.value = saved;
    s.addEventListener('change', () => applyTheme(s.value));
  });
}

/* ---------------- page-specific init ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  initThemePickers();
  initHeader();
  initGeneratorPage();
  initLyricsPage();
  initMembersPage();
  initAboutPage();
});

/* header home button behavior */
function initHeader(){
  document.querySelectorAll('#brandHome,#brandHome2,#brandHome3,#brandHome4,#brandHomeL,#brandHomeM,#brandHomeA,#brandHome').forEach(el=>{
    if(el) el.addEventListener('click', ()=> location.href='index.html');
  });
  // set active nav link (simple)
  document.querySelectorAll('.navlinks a').forEach(a => {
    try{
      if(a.href === location.href || (location.pathname.endsWith('index.html') && a.getAttribute('href') === 'index.html')){
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    }catch(e){}
  });
}

/* ---------------- Generator page wiring ---------------- */
function initGeneratorPage(){
  const modeSelect = safeQuery('modeSelect');
  if(!modeSelect) return; // not on generator page

  const soloBox = safeQuery('soloBox');
  const subunitBox = safeQuery('subunitBox');
  const soloSelect = safeQuery('soloSelect');
  const subunitList = safeQuery('subunitList');
  const generateBtn = safeQuery('generateBtn');
  const previewBtn = safeQuery('previewBtn');
  const exportBtn = safeQuery('exportBtn');
  const previewBox = safeQuery('previewBox');
  const status = safeQuery('status');

  // populate solo and subunit lists
  if(soloSelect){
    ALL_MEMBERS.forEach(m => { const o = document.createElement('option'); o.value=m; o.textContent=m; soloSelect.appendChild(o);});
  }
  if(subunitList){
    ALL_MEMBERS.forEach(m => {
      const lab = document.createElement('label'); lab.style.marginRight='8px';
      const chk = document.createElement('input'); chk.type='checkbox'; chk.name='subunit'; chk.value=m;
      lab.appendChild(chk); lab.appendChild(document.createTextNode(' '+m));
      subunitList.appendChild(lab);
    });
  }

  // show/hide solo / subunit
  modeSelect.addEventListener('change', ()=>{
    const v = modeSelect.value;
    if(soloBox) soloBox.classList.toggle('hidden', v !== 'solo');
    if(subunitBox) subunitBox.classList.toggle('hidden', v !== 'subunit');
  });

  generateBtn.addEventListener('click', ()=>{
    // gather options
    const mode = modeSelect.value;
    const lang = document.getElementById('langMode').value;
    const mood = document.getElementById('moodMode').value;
    const extras = { rap: document.getElementById('extraRap').checked, bridge: document.getElementById('extraBridge').checked, outro: document.getElementById('extraOutro').checked };

    let subunit = null;
    if(mode === 'subunit'){
      subunit = Array.from(document.querySelectorAll('input[name="subunit"]:checked')).map(c=>c.value);
      if(subunit.length === 0) subunit = null;
    }
    let solo = null;
    if(mode === 'solo') solo = (soloSelect && soloSelect.value) ? soloSelect.value : null;

    status.textContent = "Generating song...";
    setTimeout(()=> {
      const result = buildSong({ mode, lang, mood, extras, subunit, solo });
      localStorage.setItem('last_song', JSON.stringify(result));
      previewBox.textContent = result.formatted;
      status.textContent = "Generated. Opening Lyrics page...";
      // open lyrics page
      setTimeout(()=> location.href = 'lyrics.html', 450);
    }, 120);
  });

  previewBtn.addEventListener('click', ()=>{
    // quick preview (play small bit)
    const tempMode = modeSelect.value;
    const lang = document.getElementById('langMode').value;
    const mood = document.getElementById('moodMode').value;
    const extras = { rap: document.getElementById('extraRap').checked, bridge: false, outro:false };
    const result = buildSong({ mode: tempMode, lang, mood, extras });
    // show preview but don't navigate
    previewBox.textContent = result.formatted;
    // short TTS preview
    speakSong(result.song, { preview:true });
  });

  exportBtn.addEventListener('click', ()=>{
    const raw = JSON.parse(localStorage.getItem('last_song') || 'null');
    if(!raw){ alert('Generate a song first.'); return; }
    const el = document.createElement('div'); el.style.padding='18px';
    const h = document.createElement('h2'); h.textContent = `${raw.song.meta.title} — ${raw.song.meta.mood}`; h.style.color='var(--accent)';
    el.appendChild(h);
    const pre = document.createElement('pre'); pre.style.whiteSpace='pre-wrap'; pre.textContent = raw.formatted;
    el.appendChild(pre);
    html2pdf().set({margin:10, filename: `${raw.song.meta.title.replace(/\s+/g,'_')}.pdf`, jsPDF:{unit:'mm',format:'a4'}}).from(el).save();
  });
}

/* ---------------- Lyrics page wiring ---------------- */
function initLyricsPage(){
  const lyricsRender = safeQuery('lyricsRender');
  if(!lyricsRender) return; // not on lyrics page

  const songMeta = safeQuery('songMeta');
  const playAll = safeQuery('playAll');
  const stopAll = safeQuery('stopAll');
  const toggleBackingBtn = safeQuery('toggleBacking');
  const exportPdf = safeQuery('exportPdf');
  const saveSong = safeQuery('saveSong');
  const savedSongsDiv = safeQuery('savedSongs');

  // load last_song
  const last = JSON.parse(localStorage.getItem('last_song') || 'null');
  if(!last){
    lyricsRender.textContent = "No song generated yet. Go to Generate page.";
    if(songMeta) songMeta.textContent = "No song generated.";
    return;
  }
  const song = last.song;
  if(songMeta) songMeta.textContent = `Title: ${song.meta.title}  •  Mood: ${song.meta.mood}`;

  // render lines
  lyricsRender.innerHTML = '';
  song.lines.forEach((ln, i) => {
    const d = document.createElement('div');
    d.className = 'line';
    d.dataset.index = i;
    d.innerHTML = `<strong style="color:var(--accent)">${ln.member}</strong>: ${ln.text}`;
    lyricsRender.appendChild(d);
  });

  // load saved songs
  function refreshSaved(){
    const saved = JSON.parse(localStorage.getItem('saved_songs') || '[]');
    if(!savedSongsDiv) return;
    if(saved.length === 0) savedSongsDiv.innerHTML = "<div class='card'>No saved songs.</div>";
    else savedSongsDiv.innerHTML = saved.map(s => `<div class="card"><strong>${s.title}</strong> <div style="color:var(--muted)">${s.date}</div><pre style="white-space:pre-wrap">${s.formatted}</pre></div>`).join('');
  }
  refreshSaved();

  // Backing synth
  let audioCtx = null, pad = null, padGain = null;
  function startBacking(){
    if(audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    pad = audioCtx.createOscillator();
    pad.type = 'sawtooth';
    pad.frequency.value = 110;
    padGain = audioCtx.createGain();
    padGain.gain.value = 0.0001;
    pad.connect(padGain); padGain.connect(audioCtx.destination);
    pad.start();
    padGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.6);
  }
  function stopBacking(){
    if(!audioCtx) return;
    padGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    setTimeout(()=>{ try{ audioCtx.close(); }catch(e){} audioCtx = null; pad=null; padGain=null; }, 600);
  }

  // play / stop
  const synth = window.speechSynthesis;
  let utterQueue = [];
  let playing = false;
  let currentIdx = 0;

  function clearHighlights(){ document.querySelectorAll('.line.speaking').forEach(n=>n.classList.remove('speaking')); }

  function speakSong(songObj, opts={ preview:false }){
    if(!songObj) return;
    const lines = songObj.lines;
    const max = opts.preview ? Math.min(6, lines.length) : lines.length;
    utterQueue = [];
    for(let i=0;i<max;i++){
      const ln = lines[i];
      const txt = `${ln.member}: ${ln.text}`;
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = isHangul(ln.text) ? 'ko-KR' : 'en-US';
      u.rate = 0.96 + Math.random()*0.08;
      u.pitch = 0.98 + Math.random()*0.06;
      // attach index for highlight
      u._index = i;
      u.onstart = ()=> {
        clearHighlights();
        const el = document.querySelector(`.line[data-index="${u._index}"]`);
        if(el) el.classList.add('speaking');
        if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
      };
      u.onend = ()=> {
        const el = document.querySelector(`.line[data-index="${u._index}"]`);
        if(el) el.classList.remove('speaking');
      };
      utterQueue.push(u);
    }
    if(utterQueue.length === 0) return;
    playing = true;
    currentIdx = 0;
    // start backing if toggle says ON
    if(toggleBackingBtn && toggleBackingBtn.dataset.playing === "true") startBacking();
    function next(){
      if(currentIdx >= utterQueue.length){ playing=false; stopBacking(); return;}
      const u = utterQueue[currentIdx];
      synth.speak(u);
      u.onend = () => { currentIdx++; setTimeout(next, 220); };
    }
    next();
  }

  if(playAll) playAll.addEventListener('click', ()=>{
    const raw = JSON.parse(localStorage.getItem('last_song') || 'null');
    if(!raw) { alert('Generate a song first.'); return; }
    speakSong(raw.song, { preview:false });
  });

  if(stopAll) stopAll.addEventListener('click', ()=>{
    synth.cancel(); stopBacking(); clearHighlights(); playing=false;
  });

  if(toggleBackingBtn){
    toggleBackingBtn.dataset.playing = 'false';
    toggleBackingBtn.addEventListener('click', ()=>{
      const now = toggleBackingBtn.dataset.playing === 'true';
      toggleBackingBtn.dataset.playing = (!now).toString();
      toggleBackingBtn.textContent = now ? '🎹 Backing: OFF' : '🎹 Backing: ON';
      if(!now) startBacking(); else stopBacking();
    });
  }

  if(exportPdf){
    exportPdf.addEventListener('click', ()=>{
      const raw = JSON.parse(localStorage.getItem('last_song') || 'null');
      if(!raw){ alert('Generate a song first.'); return; }
      const el = document.createElement('div'); el.style.padding='18px';
      const h = document.createElement('h2'); h.textContent = `${raw.song.meta.title} — ${raw.song.meta.mood}`; h.style.color='var(--accent)';
      el.appendChild(h);
      const pre = document.createElement('pre'); pre.style.whiteSpace='pre-wrap'; pre.style.fontFamily='Noto Sans KR, Poppins'; pre.textContent = raw.formatted;
      el.appendChild(pre);
      html2pdf().set({margin:10, filename: `${raw.song.meta.title.replace(/\s+/g,'_')}.pdf`, jsPDF:{unit:'mm',format:'a4'}}).from(el).save();
    });
  }

  if(saveSong){
    saveSong.addEventListener('click', ()=>{
      const raw = JSON.parse(localStorage.getItem('last_song') || 'null');
      if(!raw){ alert('Generate a song first.'); return; }
      const saved = JSON.parse(localStorage.getItem('saved_songs') || '[]');
      saved.unshift({ title: raw.song.meta.title, date: new Date().toLocaleString(), formatted: raw.formatted });
      localStorage.setItem('saved_songs', JSON.stringify(saved.slice(0,80)));
      alert('Saved to local gallery.');
      // refresh saved list
      if(savedSongsDiv) {
        savedSongsDiv.innerHTML = saved.map(s => `<div class="card"><strong>${s.title}</strong> <div style="color:var(--muted)">${s.date}</div><pre style="white-space:pre-wrap">${s.formatted}</pre></div>`).join('');
      }
    });
  }
}

/* ---------------- Members page wiring ---------------- */
function initMembersPage(){
  const bpList = safeQuery('bpList');
  const bmList = safeQuery('bmList');
  if(bpList){
    MEMBERS_BP.forEach(m => {
      const d = document.createElement('div'); d.className='member-card'; d.textContent = m;
      bpList.appendChild(d);
    });
  }
  if(bmList){
    MEMBERS_BM.forEach(m => {
      const d = document.createElement('div'); d.className='member-card'; d.textContent = m;
      bmList.appendChild(d);
    });
  }
}

/* ---------------- About page wiring ---------------- */
function initAboutPage(){ /* placeholder */ }

/* ------------- small TTS helper for quick previews -------------- */
function speakSong(songObj, opts={ preview:false }){
  if(!songObj) {
    const raw = JSON.parse(localStorage.getItem('last_song') || 'null');
    if(!raw) return;
    songObj = raw.song;
  }
  const synth = window.speechSynthesis;
  const lines = songObj.lines.slice(0, opts.preview ? 6 : songObj.lines.length);
  lines.forEach((ln,i)=>{
    const u = new SpeechSynthesisUtterance(`${ln.member}: ${ln.text}`);
    u.lang = isHangul(ln.text) ? 'ko-KR' : 'en-US';
    u.rate = 0.96 + Math.random()*0.08;
    synth.speak(u);
  });
}

/* tiny shuffle util used earlier */
function shuffle(arr){ return arr.sort(()=>0.5 - Math.random()); }
