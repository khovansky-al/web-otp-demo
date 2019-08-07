import HOTP from './hotp';
import TOTP from './totp';
import Stream from './stream';

class Generator {
  mode = 'hotp'
  secretInput = window['secret-val'];
  counterInput = window['counter-val'];
  activeButton = document.querySelector('button[data-mode=hotp]');
  modeButtons = document.querySelectorAll('.mode-selector > button');
  qrButton = document.querySelector('.qr-scan');

  totpInstance = new TOTP(this);
  streamInstance = new Stream(this);

  constructor(secret, counter) {
    this.secretInput.addEventListener('input', this.recalculateAndDraw);
    this.counterInput.addEventListener('input', this.recalculateAndDraw);

    this.qrButton.addEventListener('click', this.onScanQr);

    this.modeButtons.forEach(button => {
      button.addEventListener('click', this.onModeSwitch);
    });

    this.updateKeyPair(secret, counter);
  }

  updateKeyPair = (secret, counter) => {
    this.secretInput.value = secret;
    this.counterInput.value = counter;

    this.recalculateAndDraw();
  }

  updateCounterValue = counter => {
    this.counterInput.value = counter;
    this.recalculateAndDraw();
  }

  updateActiveButton = mode => {
    const buttonToActivate = document.querySelector(`button[data-mode=${mode}]`);

    this.activeButton.classList.remove('active');
    this.activeButton = buttonToActivate;
    this.activeButton.classList.add('active');
  }

  switchMode = newMode => {
    this.mode = newMode;
    this.updateActiveButton(newMode);

    if (newMode === 'totp') {
      this.totpInstance.refreshCounter();
    }

    this.totpInstance.toggleCounterClock();
  }

  setupFromQR = data => {
    const url = new URL(data);
    const [scheme] = url.pathname.slice(2).split('/');
    const params = new URLSearchParams(url.search);

    const secret = params.get('secret');
    let counter;

    if (scheme === 'hotp') {
      counter = params.get('counter');
    } else {
      this.totpInstance.stepWindow = parseInt(params.get('period'), 10) * 1000;
      counter = this.totpInstance.getTOTPCounter();
    }

    this.switchMode(scheme);
    this.updateKeyPair(secret, counter);
  }

  recalculateAndDraw = async () => {
    if (!this.secretInput || !this.counterInput) return;

    const result = document.querySelector('.result');

    const code = await HOTP.generateHOTP(
      this.secretInput.value, parseInt(this.counterInput.value, 10)
    );
    result.innerHTML = code;
  }

  onModeSwitch = e => {
    e.preventDefault();

    const newMode = e.target.dataset.mode;
    this.switchMode(newMode);
  }

  onScanQr = e => {
    e.preventDefault();

    if (!this.streamInstance.streamRunning) {
      this.streamInstance.startStream();
    } else {
      this.streamInstance.stopStream();
    }
  }
}

export default Generator
