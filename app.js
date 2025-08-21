// Echo Talk - Pure JS
let recognition = null;
let recognizing = false;
let autosilenceEnabled = false;
let silenceTimer = null;
let currentLang = 'fa-IR';
let installPromptEvent = null;

// Audio level visual with WebAudio (optional nice halo)
let audioCtx, analyser, micSource;
const halo = document.getElementById('micHalo');

function updateHaloLevel(level){
  const scale = 0.9 + Math.min(level, 1) * 0.3;
  halo.style.transform = `scale(${scale})`;
  halo.style.opacity = 0.15 + Math.min(level, 1) * 0.85;
}

async function setupAudioMeter(){
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micSource = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    micSource.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(dataArray);
      // Simple RMS
      let sum = 0;
      for(let i=0;i<dataArray.length;i++){
        const v = (dataArray[i]-128)/128;
        sum += v*v;
      }
      const rms = Math.sqrt(sum / dataArray.length); // 0..1
      updateHaloLevel(rms * 2.2);
      requestAnimationFrame(tick);
    };
    tick();
  }catch(e){
    console.warn('Microphone meter disabled:', e);
  }
}

function initSpeech(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    setListenState('مرورگر شما از Web Speech API پشتیبانی نمی‌کند.');
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = currentLang;
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    recognizing = true;
    document.getElementById('micBtn').classList.add('recording');
    setListenState('در حال شنیدن…');
    halo.style.opacity = .85;
  };

  recognition.onerror = (e) => {
    console.error('rec error', e);
    setListenState('خطا در ضبط: ' + e.error);
    stopRecording();
  };

  recognition.onend = () => {
    recognizing = false;
    document.getElementById('micBtn').classList.remove('recording');
    if(!autosilenceEnabled){
      setListenState('متوقف شد.');
    }else{
      // if autosilence, show idle
      setListenState('آماده ضبط');
    }
    halo.style.opacity = .0;
    clearTimeout(silenceTimer);
  };

  recognition.onresult = (e) => {
    let interim = '';
    let finalText = '';
    for(let i = e.resultIndex; i < e.results.length; i++){
      const transcript = e.results[i][0].transcript;
      if(e.results[i].isFinal){
        finalText += transcript + ' ';
      }else{
        interim += transcript;
      }
    }
    const full = (document.getElementById('transcript').innerText || '').trim();
    const preview = (full + ' ' + finalText + ' ' + interim).trim();
    if(preview){
      showOutput(preview);
    }

    // Reset silence timer on any result if autosilence
    if(autosilenceEnabled){
      resetSilenceTimer();
    }
  };
}

function startRecording(){
  if(!recognition){
    initSpeech();
    if(!recognition) return;
  }
  recognition.lang = currentLang;
  try{
    recognition.start();
  }catch(e){
    // Safari may throw if already started
    console.warn(e);
  }
  setupAudioMeter();
  if(autosilenceEnabled){
    resetSilenceTimer();
  }
}

function stopRecording(){
  if(recognizing && recognition){
    recognition.stop();
  }
  if(audioCtx){
    audioCtx.close().catch(()=>{});
    audioCtx = null;
  }
}

function resetSilenceTimer(){
  clearTimeout(silenceTimer);
  // 3.5 seconds of silence then stop
  silenceTimer = setTimeout(()=>{
    stopRecording();
    setListenState('به دلیل سکوت، ضبط متوقف شد.');
  }, 3500);
}

function setListenState(text){
  document.getElementById('listenState').textContent = text || '';
}

function showOutput(text){
  const section = document.getElementById('outputSection');
  section.classList.remove('hidden');
  const t = document.getElementById('transcript');
  t.innerText = text;
}

// ---- UI wiring ----
document.getElementById('micBtn').addEventListener('click', ()=>{
  if(recognizing){
    stopRecording();
  }else{
    autosilenceEnabled = document.getElementById('autoStopToggle').checked;
    startRecording();
  }
});

document.getElementById('autoStopToggle').addEventListener('change', (e)=>{
  autosilenceEnabled = e.target.checked;
});

document.getElementById('langFa').addEventListener('click', (e)=>{
  currentLang = 'fa-IR';
  document.getElementById('langFa').classList.add('active');
  document.getElementById('langEn').classList.remove('active');
  setListenState('زبان: فارسی');
});
document.getElementById('langEn').addEventListener('click', (e)=>{
  currentLang = 'en-US';
  document.getElementById('langEn').classList.add('active');
  document.getElementById('langFa').classList.remove('active');
  setListenState('Language: English');
});

// Edit & Copy
document.getElementById('editBtn').addEventListener('click', ()=>{
  const t = document.getElementById('transcript');
  const editable = t.getAttribute('contenteditable') === 'true';
  t.setAttribute('contenteditable', !editable);
  if(!editable){ t.focus(); }
});

document.getElementById('copyBtn').addEventListener('click', async ()=>{
  const t = document.getElementById('transcript').innerText;
  try{
    await navigator.clipboard.writeText(t);
    setListenState('کپی شد ✅');
  }catch{
    setListenState('اجازه کپی داده نشد');
  }
});

// Theme FAB
const fab = document.getElementById('themeFab');
fab.addEventListener('click', ()=>{
  const body = document.body;
  const toLight = body.classList.contains('dark');
  body.classList.toggle('dark', !toLight);
  body.classList.toggle('light', toLight);

  // Swap icons with animation
  const sun = fab.querySelector('.sun');
  const moon = fab.querySelector('.moon');
  if(toLight){
    // show sun for light
    sun.classList.remove('hidden');
    moon.classList.add('hidden');
  }else{
    sun.classList.add('hidden');
    moon.classList.remove('hidden');
  }

  // playful spin
  fab.animate([
    { transform: 'rotate(0deg) scale(1)' },
    { transform: 'rotate(180deg) scale(1.1)' },
    { transform: 'rotate(360deg) scale(1)' }
  ], { duration: 450, easing: 'ease-out' });
});

// Help modal
const helpModal = document.getElementById('helpModal');
document.getElementById('helpBtn').addEventListener('click', ()=> helpModal.showModal());
document.getElementById('closeHelp').addEventListener('click', ()=> helpModal.close());

// PWA install
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  installPromptEvent = e;
  const btn = document.getElementById('installBtn');
  btn.disabled = false;
});
document.getElementById('installBtn').addEventListener('click', async ()=>{
  if(installPromptEvent){
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    setListenState(outcome === 'accepted' ? 'نصب انجام شد' : 'نصب لغو شد');
  }
});

// Service Worker
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(console.warn);
  });
}

// Initial text
setListenState('آماده ضبط');
