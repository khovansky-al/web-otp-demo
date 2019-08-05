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
let stepWindow = 30 * 1000;
let activeButton = document.querySelector('button[data-mode=hotp]');
let counterRaf = null;

const toggleCounterClock = () => {
  if (counterRaf) {
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

const updateTOTPCounter = () => {
  if (mode === 'hotp') return;

  timeStep = getTOTPCounter();
  if (Date.now() - timeStep * stepWindow < 30) {
    return requestAnimationFrame(updateTOTPCounter);
  }

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

const switchMode = e => {
  e.preventDefault();

  const newMode = e.target.dataset.mode;
  mode = newMode;
  console.log(mode);

  updateActiveButton(mode);

  if (mode === 'totp') {
    timeStep = getTOTPCounter();
    window['counter-val'].value = timeStep;
  }

  toggleCounterClock();
}

function setupGenerator() {
  const secretInput = window['secret-val'];
  const counterInput = window['counter-val'];

  secretInput.addEventListener('input', recalculateAndDraw);
  counterInput.addEventListener('input', recalculateAndDraw);

  secretInput.value = '12345678901234567890';
  counterInput.value = '0';
  recalculateAndDraw();
}

function setupButton(button) {
  button.addEventListener('click', switchMode);
}

function setupButtons() {
  const buttons = document.querySelectorAll('.mode-selector > button');
  buttons.forEach(button => setupButton(button));
}

document.addEventListener('DOMContentLoaded', () => {
  setupGenerator();
  setupButtons();
});
