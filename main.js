async function generateKey(secret, counter) {
  const Crypto = window.crypto.subtle;
  const encoder = new TextEncoder('utf-8');
  const secretBytes = encoder.encode(secret);
  const counterArray = padCounter(counter);

  const key = await Crypto.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  const HS = await Crypto.sign('HMAC', key, counterArray);

  return HS;
}

function padCounter(counter) {
  const buffer = new ArrayBuffer(8);
  const bView = new DataView(buffer);

  const byteString = '0'.repeat(64); // 8 bytes
  const bCounter = (byteString + counter.toString(2)).slice(-64);

  for (let byte = 0; byte < 64; byte += 8) {
    const byteValue = parseInt(bCounter.slice(byte, byte + 8), 2);
    bView.setUint8(byte / 8, byteValue);
  }

  return buffer;
}

function DT(HS) {
  const offset = HS[19] & 0b1111;
  const P = ((HS[offset] & 0x7f) << 24) | (HS[offset + 1] << 16) | (HS[offset + 2] << 8) | HS[offset + 3]
  const pString = P.toString(2);

  return pString;
}

function truncate(uKey) {
  const Sbits = DT(uKey);
  const Snum = parseInt(Sbits, 2);

  return Snum;
}

async function generateHOTP(secret, counter) {
  const key = await generateKey(secret, counter);
  const uKey = new Uint8Array(key);

  const Snum = truncate(uKey);
  const padded = ('000000' + (Snum % (10 ** 6))).slice(-6);

  return padded;
}

let mode = 'hotp';
let activeButton = document.querySelector('button[data-mode=hotp]');

let stepWindow = 30 * 1000;
let counterRaf = null;
let lastTimeStep = 0;

let stream;
let streamRunning = false;

const toggleCounterClock = () => {
  if (counterRaf) {
    const timer = document.querySelector('.timer');
    timer.innerHTML = '';

    cancelAnimationFrame(counterRaf);
    counterRaf = null;
    return;
  }

  counterRaf = requestAnimationFrame(updateTOTPCounter);
}

const getTOTPCounter = () => {
  const time = Date.now();
  return Math.floor(time / stepWindow);
}

const recalculateAndDraw = async () => {
  const secret = window['secret-val'].value;
  const counter = window['counter-val'].value;
  if (!secret || !counter) return;

  const result = document.querySelector('.result');

  const HOTP = await generateHOTP(secret, parseInt(counter, 10));
  result.innerHTML = HOTP;
}

const updateTimer = time => {
  const timer = document.querySelector('.timer');
  timer.innerHTML = ('00' + time).slice(-2);
}

const updateTOTPCounter = () => {
  if (mode === 'hotp') return;

  const timeSinceStep = Date.now() - lastTimeStep * stepWindow;
  const timeLeft = Math.ceil((stepWindow - timeSinceStep) / 1000);

  updateTimer(timeLeft);

  if (timeLeft > 0) {
    return requestAnimationFrame(updateTOTPCounter);
  }

  timeStep = getTOTPCounter();
  lastTimeStep = timeStep;
  window['counter-val'].value = timeStep;
  recalculateAndDraw();
  requestAnimationFrame(updateTOTPCounter);
}

const updateActiveButton = mode => {
  const buttonToActivate = document.querySelector(`button[data-mode=${mode}]`);

  activeButton.classList.remove('active');
  activeButton = buttonToActivate;
  activeButton.classList.add('active');
}

const onModeSwitch = e => {
  e.preventDefault();

  const newMode = e.target.dataset.mode;
  switchMode(newMode);
}

const switchMode = newMode => {
  mode = newMode;

  updateActiveButton(mode);

  if (mode === 'totp') {
    timeStep = getTOTPCounter();
    window['counter-val'].value = timeStep;
    recalculateAndDraw();
  }

  toggleCounterClock();
}

const setupFromQR = data => {
  const url = new URL(data);
  const [scheme] = url.pathname.slice(2).split('/');
  const params = new URLSearchParams(url.search);

  const secret = params.get('secret');
  let counter;

  if (scheme === 'hotp') {
    counter = params.get('counter');
  } else {
    stepWindow = parseInt(params.get('period'), 10) * 1000;
    counter = getTOTPCounter();
  }

  switchMode(scheme);
  setupGenerator(secret, counter);
}

const searchQR = imageData => {
  const code = jsQR(imageData.data, imageData.width, imageData.height);

  if (code) {
    stopStream();
    setupFromQR(code.data);
  }
}

const startStream = () => {
  stream = new StreamDisplay(searchQR);
  stream.startCapture();
  streamRunning = true;
}

const stopStream = () => {
  stream.stopCapture();
  stream = null;
  streamRunning = false;
}

const onScanQr = e => {
  e.preventDefault();

  if (!streamRunning) {
    startStream();
  } else {
    stopStream();
  }
}

function setupGenerator(secret, counter) {
  const secretInput = window['secret-val'];
  const counterInput = window['counter-val'];

  secretInput.addEventListener('input', recalculateAndDraw);
  counterInput.addEventListener('input', recalculateAndDraw);

  secretInput.value = secret;
  counterInput.value = counter;
  recalculateAndDraw();
}

function setupModeButton(button) {
  button.addEventListener('click', onModeSwitch);
}

function setupButtons() {
  const modeButtons = document.querySelectorAll('.mode-selector > button');
  const qrButton = document.querySelector('.qr-scan');

  modeButtons.forEach(button => setupModeButton(button));
  qrButton.addEventListener('click', onScanQr);
}

document.addEventListener('DOMContentLoaded', () => {
  setupGenerator('12345678901234567890', '0');
  setupButtons();
});
