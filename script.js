/* script.js - main logic for Blink × BM generator
   - relies on dataset.js to provide templates and fragment pools
   - uses localStorage to pass generated lyrics between pages
   - provides TTS speak, karaoke highlight, PDF export, backing synth
*/

/* ========== Utility ========== */
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randRange(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function isHangul(text){ return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text); }

/* Replace placeholders in template with random fragments */
function fillTemplate(template, memberPool){
  return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
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

/* Build a song with structure */
function buildSong(options){
  const { mode, lang, mood, extras } = options;
  let memberPool = [...ALL_MEMBERS];
  if(mode === 'blackpink') memberPool = [...MEMBERS_BP];
  else if(mode === 'babymonster') memberPool = [...MEMBERS_BM];
  else if(mode === 'solo') {
    // solo selection handled earlier; if not set, pick random
    if(options.solo) memberPool = [options.solo];
    else memberPool = [ pick(ALL_MEMBERS) ];
  } else if(mode === 'subunit') {
    if(options.subunit && options.subunit.length>0) memberPool = options.subunit;
    else memberPool = shuffle([...ALL_MEMBERS]).slice(0,3);
  }

  // Decide language distribution per line
  function chooseLangLine(){
    if(lang === 'en') return 'en';
    if(lang === 'ko') return 'kr';
    // mixed: 60% mixed/50-50, but we randomize per line
    let r = Math.random();
    if(r < 0.4) return 'en';
    if(r < 0.8) return 'kr';
    return 'mix';
  }

  // helper to choose template list by locale
  function chooseTemplate(section, loc){
    if(loc === 'en') return TEMPLATES[section + '_en'] || [];
    if(loc === 'kr') return TEMPLATES[section + '_kr'] || [];
    // mixed or mix
    // 50% chance to pick mixed templates if available
    if(MIXED_TEMPLATES[section + '_mix'] && Math.random() < 0.45){
      return MIXED_TEMPLATES[section + '_mix'];
    }
    // otherwise pick either en or kr pool randomly
    return (Math.random()>0.5 ? (TEMPLATES[section + '_en']||[]) : (TEMPLATES[section + '_kr']||[]));
  }

  // Build structured song parts
  const sectionsOrder = ['intro','verse','pre','chorus','verse','rap','bridge','chorus','outro'];
  let song = { meta:{ title: `${pick(["Neon","Midnight","Starlight","Moonlight","Forever"])} ${pick(["Dream","Fever","Blaze","Run","Heart"])}`, mood }, lines: [] };

  // Build lines for each structural section with variable counts to reach ~3-4 minutes (40-60 lines)
  sectionsOrder.forEach((sec,i) => {
    let count = 4 + randRange(0,3); // base lines per section
    if(sec === 'chorus') count = 6 + randRange(0,3);
    if(sec === 'rap') count = extras.rap ? (6 + randRange(0,3)) : 0;
    if(sec === 'intro') count = 2 + randRange(0,2);
    if(sec === 'outro' && !extras.outro) count = 2;

    for(let k=0;k<count;k++){
      // skip rap section if not requested
      if(sec === 'rap' && !extras.rap) break;

      const chosenLang = chooseLangLine();
      const pool = chooseTemplate(sec, chosenLang==='mix' ? (Math.random()>0.5?'en':'kr') : chosenLang);
      // safety: if pool empty use chorus
      const templ = pool.length ? pick(pool) : (pick(TEMPLATES['chorus_en']) || "We shine tonight");
      const text = fillTemplate(templ, memberPool);
      // construct a line object: display label includes member name
      const member = pick(memberPool);
      const lineObj = { section: sec, member, text };
      song.lines.push(lineObj);
    }
  });

  // Ensure chorus repeat if short:
  if(song.lines.length < 36){
    // add a repeated chorus
    for(let i=0;i<6;i++){
      const templ = pick(TEMPLATES['chorus_en']);
      song.lines.push({ section:'chorus', member: pick(memberPool), text: fillTemplate(templ, memberPool) });
    }
  }

  // Generate final formatted text for preview / PDF
  let formatted = `Title: ${song.meta.title}\nMood: ${song.meta.mood}\n\n`;
  let currentSection = '';
  song.lines.forEach((ln,i) => {
    if(ln.section !== currentSection){
      formatted += `\n[${ln.section.toUpperCase()}]\n`;
      currentSection = ln.section;
    }
    formatted += `${ln.member}: ${ln.text}\n`;
  });

  return { song, formatted };
}

/* simple shuffle */
function shuffle(arr){ return arr.sort(()=>0.5 - Math.random()); }

/* ========== UI wiring (index.html) ========== */
document.addEventListener('DOMContentLoaded', () => {
  // DOM references
  const modeSelect = document.getElementById('modeSelect');
  const soloBox = document.getElementById('soloBox');
  const subunitBox = document.getElementById('subunitBox');
  const soloSelect = document.getElementById('soloSelect');
  const subunitList = document.getElementById('subunitList');
  const themePicker = document.getElementById('themePicker');
  const themePicker2 = document.getElementById('themePicker2');
  const themePicker3 = document.getElementById('themePicker3');
  const themePicker4 = document.getElementById('themePicker4');

  // fill solo options and subunit checkboxes
  const allMembers = [...ALL_MEMBERS];
  if(soloSelect){
    allMembers.forEach(m => {
      const o = document.createElement('option'); o.value = m; o.textContent = m;
      soloSelect.appendChild(o);
    });
  }
  if(subunitList){
    allMembers.forEach(m => {
      const lab = document.createElement('label');
      const chk = document.createElement('input'); chk.type='checkbox'; chk.value = m; chk.name = 'subunit';
      lab.appendChild(chk); lab.appendChild(document.createTextNode(" "+m));
      subunitList.appendChild(lab);
    });
  }

  // show/hide solo & subunit boxes
  if(modeSelect){
    modeSelect.addEventListener('change', () => {
      const v = modeSelect.value;
      soloBox.classList.toggle('hidden', v !== 'solo');
      subunitBox.classList.toggle('hidden', v !== 'subunit');
    });
  }

  // theme picker - sync across pages (persist)
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t === 'neon' ? 'neon' : 'cute');
    localStorage.setItem('kpop_theme', t);
    // sync pickers
    [themePicker, themePicker2, themePicker3, themePicker4].forEach(s => { if(s) s.value = t; });
  }
  const savedTheme = localStorage.getItem('kpop_theme') || 'cute';
  applyTheme(savedTheme);
  [themePicker, themePicker2, themePicker3, themePicker4].forEach(s => {
    if(!s) return;
    s.addEventListener('change', () => applyTheme(s.value));
  });

  // handle home brand clicks to go to index
  document.querySelectorAll('#homeBtn,#homeBtn2,#homeBtn3,#homeBtn4').forEach(el=>{
    if(el) el.addEventListener('click', ()=> location.href = 'index.html');
  });

  // generate button
  const genBtn = document.getElementById('generateBtn');
  const previewBox = document.getElementById('previewBox');
  const status = document.getElementById('status');

  if(genBtn){
    genBtn.addEventListener('click', () => {
      const mode = modeSelect.value;
      const lang = document.getElementById('langMode').value;
      const mood = document.getElementById('moodMode').value;
      const extras = {
        rap: document.getElementById('extraRap').checked,
        bridge: document.getElementById('extraBridge').checked,
        outro: document.getElementById('extraOutro').checked
      };
      const autoBacking = document.getElementById('backingPad').checked;

      // subunit members collection
      let subunit = null;
      if(mode === 'subunit'){
        subunit = Array.from(document.querySelectorAll('input[name="subunit"]:checked')).map(c=>c.value);
        if(subunit.length < 1) {
          status.textContent = "Choose 1–3 members for custom sub-unit; leaving blank will choose 3 randomly.";
        }
      }
      let solo = null;
      if(mode === 'solo') solo = soloSelect.value || null;

      // build
      status.textContent = "Generating song... ✨";
      setTimeout(()=>{ // small delay to keep UI responsive
        const result = buildSong({ mode, lang, mood, extras, subunit, solo });
        // save to localStorage for lyrics page and preview
        localStorage.setItem('last_song', JSON.stringify(result));
        previewBox.textContent = result.formatted;
        status.textContent = "Generated — preview shown. Open Lyrics page to play or export.";
        // auto-play a short preview if button selected
      }, 180);
    });
  }

  // Quick Preview plays TTS of preview content (short)
  const quickPreview = document.getElementById('quickPreview');
  if(quickPreview){
    quickPreview.addEventListener('click', ()=>{
      const last = JSON.parse(localStorage.getItem('last_song') || 'null');
      if(!last){ alert("Generate a song first."); return; }
      speakSong(last.song, {preview:true});
    });
  }

  // Export PDF from index preview (also available on lyrics page)
  const exportBtn = document.getElementById('exportBtn');
  if(exportBtn){
    exportBtn.addEventListener('click', ()=>{
      const last = JSON.parse(localStorage.getItem('last_song') || 'null');
      if(!last){ alert("Generate a song first."); return; }
      // build a temp DOM to export
      const el = document.createElement('div');
      el.style.padding = "24px"; el.style.fontFamily = "Poppins, Noto Sans KR, sans-serif";
      const header = document.createElement('h2'); header.textContent = `${last.song.meta.title} — ${last.song.meta.mood}`; header.style.color = "var(--accent)";
      el.appendChild(header);
      const pre = document.createElement('pre'); pre.style.whiteSpace="pre-wrap"; pre.style.fontSize="14px"; pre.textContent = last.formatted;
      el.appendChild(pre);
      const opt = { margin:10, filename: `${last.song.meta.title.replace(/\s+/g,'_')}.pdf`, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} };
      html2pdf().set(opt).from(el).save();
    });
  }
});

/* ========== Lyrics page interactions ========== */
document.addEventListener('DOMContentLoaded', () => {
  // populate members page
  const bpList = document.getElementById('bpList');
  const bmList = document.getElementById('bmList');
  if(bpList){
    MEMBERS_BP.forEach(m=>{
      const d = document.createElement('div'); d.className='member-card'; d.textContent = m; bpList.appendChild(d);
    });
  }
  if(bmList){
    MEMBERS_BM.forEach(m=>{
      const d = document.createElement('div'); d.className='member-card'; d.textContent = m; bmList.appendChild(d);
    });
  }

  // lyrics page: render last_song if present
  const lyricsRender = document.getElementById('lyricsRender');
  const songMeta = document.getElementById('songMeta');
  if(lyricsRender){
    const raw = JSON.parse(localStorage.getItem('last_song') || 'null');
    if(!raw){ lyricsRender.innerText = "No song generated yet. Go to Generate page."; return; }
    const song = raw.song;
    songMeta.textContent = `Title: ${song.meta.title}  •  Mood: ${song.meta.mood}`;
    // render lines with span .line and data-index
    lyricsRender.innerHTML = '';
    song.lines.forEach((ln,i)=>{
      const el = document.createElement('div'); el.className='line'; el.dataset.index = i;
      el.innerHTML = `<strong style="color:var(--accent)">${ln.member}</strong>: ${ln.text}`;
      lyricsRender.appendChild(el);
    });

    // saved songs list
    const savedSongsDiv = document.getElementById('savedSongs');
    if(savedSongsDiv){
      const saved = JSON.parse(localStorage.getItem('saved_songs')||'[]');
      if(saved.length === 0) savedSongsDiv.innerHTML = "<div class='card'>No saved songs yet.</div>";
      else savedSongsDiv.innerHTML = saved.map(s => `<div class="card"><strong>${s.title}</strong> <div style="color:var(--muted)">${s.date}</div><pre style="white-space:pre-wrap">${s.formatted}</pre></div>`).join('');
    }
  }

  // TTS controls
  const playAll = document.getElementById('playAll');
  const stopAll = document.getElementById('stopAll');
  const toggleBacking = document.getElementById('toggleBacking');
  const exportPdf = document.getElementById('exportPdf');
  const saveSong = document.getElementById('saveSong');

  let synth = window.speechSynthesis;
  let utterQueue = [];
  let currentIndex = 0;

  // backing synth (simple pad loop)
  let audioCtx = null;
  let backingOsc = null;
  let backingGain = null;
  function startBacking(){
    if(audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    backingOsc = audioCtx.createOscillator(); backingGain = audioCtx.createGain();
    backingOsc.type = 'sawtooth';
    backingOsc.frequency.value = 110;
    backingGain.gain.value = 0.0001;
    backingOsc.connect(backingGain); backingGain.connect(audioCtx.destination);
    backingOsc.start();
    // fade in
    backingGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.5);
  }
  function stopBacking(){
    if(!audioCtx) return;
    backingGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    setTimeout(()=>{ try{ audioCtx.close(); }catch(e){} audioCtx = null; backingOsc=null; backingGain=null; }, 700);
  }

  // speaking logic
  async function speakSong(songObj, opts={ preview:false }){
    if(!songObj) {
      const raw = JSON.parse(localStorage.getItem('last_song') || 'null');
      if(!raw) { alert("No song to play."); return; }
      songObj = raw.song;
    } else {
      // if passed object, use it
    }

    // flatten lines
    const lines = songObj.lines;
    // build utterances
    utterQueue = [];
    lines.forEach((ln, idx) => {
      const txt = `${ln.member}: ${ln.text}`;
      const u = new SpeechSynthesisUtterance(txt);
      // pick voice based on Hangul presence
      if(isHangul(ln.text)) { u.lang = "ko-KR"; }
      else { u.lang = "en-US"; }
      u.rate = 0.95 + (Math.random()*0.12);
      u.pitch = 0.98 + (Math.random()*0.12);
      u.onstart = ()=> highlightLine(idx);
      u.onend = ()=> unhighlightLine(idx);
      utterQueue.push(u);
    });

    if(opts.preview){
      // play first 6 utterances for quick preview
      utterQueue = utterQueue.slice(0, Math.min(6, utterQueue.length));
    }

    // chain speak
    if(utterQueue.length === 0) return;
    currentIndex = 0;
    const speakNext = () => {
      if(currentIndex >= utterQueue.length) { stopBacking(); return; }
      const u = utterQueue[currentIndex];
      synth.speak(u);
      u.onend = () => { currentIndex++; setTimeout(speakNext, 200); };
    };
    // start backing if enabled
    const bbtn = document.getElementById('toggleBacking');
    if(bbtn && bbtn.dataset.playing === "true") startBacking();
    speakNext();
  }

  function highlightLine(i){
    const l = document.querySelector(`.line[data-index="${i}"]`);
    if(l) l.classList.add('speaking');
    // scroll into view
    if(l) l.scrollIntoView({behavior:'smooth', block:'center'});
  }
  function unhighlightLine(i){
    const l = document.querySelector(`.line[data-index="${i}"]`);
    if(l) l.classList.remove('speaking');
  }

  if(playAll) playAll.addEventListener('click', async ()=>{
    const raw = JSON.parse(localStorage.getItem('last_song') || 'null');
    if(!raw){ alert("Generate a song first on the Generate page."); return; }
    // start backing if toggle is on
    const bbtn = document.getElementById('toggleBacking');
    if(bbtn && bbtn.dataset.playing === "true") startBacking();
    speakSong(raw.song, { preview:false });
  });

  if(stopAll) stopAll.addEventListener('click', ()=>{
    synth.cancel();
    stopBacking();
    // remove any highlights
    document.querySelectorAll('.line.speaking').forEach(n => n.classList.remove('speaking'));
  });

  if(toggleBacking) {
    toggleBacking.dataset.playing = "false";
    toggleBacking.addEventListener('click', ()=>{
      const current = toggleBacking.dataset.playing === "true";
      toggleBacking.dataset.playing = (!current).toString();
      toggleBacking.textContent = current ? "🎹 Toggle Backing" : "🎹 Backing: ON";
      if(current) stopBacking(); else startBacking();
    });
  }

  // export PDF
  if(exportPdf){
    exportPdf.addEventListener('click', ()=>{
      const raw = JSON.parse(localStorage.getItem('last_song') || 'null');
      if(!raw){ alert("Generate a song first."); return; }
      const el = document.createElement('div'); el.style.padding = "24px";
      const h = document.createElement('h2'); h.textContent = `${raw.song.meta.title} — ${raw.song.meta.mood}`; h.style.color = 'var(--accent)'; h.style.fontFamily = 'Poppins, Noto Sans KR';
      el.appendChild(h);
      const pre = document.createElement('pre'); pre.style.whiteSpace='pre-wrap'; pre.style.fontFamily = 'Noto Sans KR, Poppins'; pre.textContent = raw.formatted;
      el.appendChild(pre);
      const opt = { margin:10, filename: `${raw.song.meta.title.replace(/\s+/g,'_')}.pdf`, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} };
      html2pdf().set(opt).from(el).save();
    });
  }

  // save song
  if(saveSong){
    saveSong.addEventListener('click', ()=>{
      const raw = JSON.parse(localStorage.getItem('last_song') || 'null');
      if(!raw){ alert("Generate a song first."); return; }
      const saved = JSON.parse(localStorage.getItem('saved_songs') || '[]');
      saved.unshift({ title: raw.song.meta.title, date: new Date().toLocaleString(), formatted: raw.formatted });
      localStorage.setItem('saved_songs', JSON.stringify(saved.slice(0,80)));
      alert('Saved to local gallery.');
      // refresh saved list
      const savedSongsDiv = document.getElementById('savedSongs');
      if(savedSongsDiv) savedSongsDiv.innerHTML = saved.map(s => `<div class="card"><strong>${s.title}</strong> <div style="color:var(--muted)">${s.date}</div><pre style="white-space:pre-wrap">${s.formatted}</pre></div>`).join('');
    });
  }
});
