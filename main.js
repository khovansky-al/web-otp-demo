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

  const hexKey = Array.prototype.map.call(uKey, x => ('00'+x.toString(16)).slice(-2)).join("")
  // console.log(`Intermediate HMAC-SHA1 key: ${hexKey}`);

  const Snum = truncate(uKey);
  // console.log('Truncated decimal:', Snum);

  return Snum % (10 ** 6);
}

const recalculateAndDraw = async () => {
  const secret = window['secret-val'].value;
  const counter = window['counter-val'].value;
  if (!secret || !counter) return;

  const result = document.querySelector('.result');

  const HOTP = await generateHOTP(secret, parseInt(counter, 10));
  result.innerHTML = HOTP;
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


document.addEventListener('DOMContentLoaded', () =>
  setupGenerator()  
);
