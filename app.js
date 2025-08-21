// Theme toggle & remember
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme) root.setAttribute('data-theme', savedTheme);
themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// Support badge
const supportBadge = document.getElementById('supportBadge');
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  supportBadge.textContent = 'Supported';
  supportBadge.style.color = 'var(--accent-2)';
} else {
  supportBadge.textContent = 'Not supported';
  supportBadge.style.color = 'var(--danger)';
}

// Toast
const toastEl = document.getElementById('toast');
let toastTimeout;
function showToast(kind, message, opts={}) {
  clearTimeout(toastTimeout);
  toastEl.innerHTML = ''; // clear previous
  const card = document.createElement('div');
  card.className = 'card';
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox','0 0 24 24');
  icon.classList.add('icon');
  icon.innerHTML = kind === 'error'
    ? '<path class="danger" d="M11 15h2v2h-2v-2Zm0-8h2v6h-2V7Zm1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" />'
    : '<path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm-1 15-5-5 1.41-1.41L11 14.17l5.59-5.59L18 10Z"/>';
  const span = document.createElement('span');
  span.className = 'msg';
  span.textContent = message;
  const close = document.createElement('button');
  close.className = 'close';
  close.textContent = '✕';
  close.addEventListener('click', () => toastEl.innerHTML='');
  card.append(icon, span, close);
  toastEl.append(card);
  toastTimeout = setTimeout(() => { toastEl.innerHTML=''; }, opts.timeout ?? 3500);
}

// Mic / speech
const mic = document.getElementById('mic');
const transcriptEl = document.getElementById('transcript');

let recognition = null;
let isRecording = false;
let currentDir = 'rtl'; // default Persian
if (SR) {
  recognition = new SR();
  recognition.lang = 'fa-IR';
  recognition.interimResults = true;
  recognition.continuous = false; // stop automatically on pause/silence
  recognition.addEventListener('result', (e) => {
    const results = Array.from(e.results);
    const last = results[results.length-1];
    const text = results.map(r => r[0].transcript).join(' ');
    transcriptEl.dir = recognition.lang === 'en-US' ? 'ltr' : 'rtl';
    transcriptEl.textContent = text;
    if (last.isFinal) {
      // auto stop handled by 'end'
    }
  });
  recognition.addEventListener('end', () => {
    // Auto-stop UI when speech pauses / ends
    setRecording(false);
  });
  recognition.addEventListener('error', (e) => {
    setRecording(false);
    showToast('error', 'خطا در تشخیص گفتار: ' + e.error);
  });
} else {
  showToast('error', 'مرورگر از Web Speech پشتیبانی نمی‌کند.');
}

// Toggle recording on mic click
mic.addEventListener('click', async () => {
  if (!recognition) return;
  if (isRecording) {
    recognition.stop();
    setRecording(false);
  } else {
    try {
      transcriptEl.textContent = '';
      await startRecognition();
      setRecording(true);
    } catch (err) {
      setRecording(false);
      showToast('error', 'اجازه میکروفون رد شد یا مشکلی رخ داد.');
    }
  }
});

async function startRecognition() {
  // Switch to EN automatically if user typed "en:" in transcript (optional UX could be added)
  recognition.start();
}

function setRecording(state) {
  isRecording = state;
  mic.classList.toggle('recording', state);
  mic.querySelector('.micLabel').textContent = state ? 'listening…' : 'tap to speak';
  // Change icon to a solid circle for recording?
  const icon = mic.querySelector('.icon');
  icon.innerHTML = state
    ? '<path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2Zm-5 7a7 7 0 0 0 7-7h-2a5 5 0 1 1-10 0H5a7 7 0 0 0 7 7Zm-1 2h2v2h-2v-2Z"/>'
    : '<path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2Zm-5 7a7 7 0 0 0 7-7h-2a5 5 0 1 1-10 0H5a7 7 0 0 0 7 7Zm-1 2h2v2h-2v-2Z"/>';
}

// Optional: service worker registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
