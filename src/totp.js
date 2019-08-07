class TOTP {
  timer = document.querySelector('.timer');
  counterRaf = null;
  lastTimeStep = 0;
  stepWindow = 30 * 1000;
  generator = null;

  getTOTPCounter() {
    const time = Date.now();
    return Math.floor(time / this.stepWindow);
  }

  constructor(generator) {
    this.generator = generator;
  }

  toggleCounterClock = () => {
    if (!this.counterRaf) {
      this.counterRaf = requestAnimationFrame(this.tickCounter);
      return;
    }

    this.timer.innerHTML = '';

    cancelAnimationFrame(this.counterRaf);
    this.counterRaf = null;
    return;
  }

  updateTimer = time => {
    this.timer.innerHTML = ('00' + time).slice(-2);
  }

  tickCounter = () => {
    if (this.generator.mode !== 'totp') return;

    const timeSinceStep = Date.now() - this.lastTimeStep * this.stepWindow;
    const timeLeft = Math.ceil((this.stepWindow - timeSinceStep) / 1000);

    this.updateTimer(timeLeft);

    if (timeLeft > 0) {
      return requestAnimationFrame(this.tickCounter);
    }

    this.refreshCounter();

    requestAnimationFrame(this.tickCounter);
  }

  refreshCounter = () => {
    const timeStep = this.getTOTPCounter();

    this.lastTimeStep = timeStep;
    this.generator.updateCounterValue(timeStep);
  }
}

export default TOTP;
