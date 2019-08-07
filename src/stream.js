import StreamDisplay from 'stream-display';
import jsQR from 'jsqr';

class Stream {
  streamRunning = false;
  feed = null;
  generator = null;

  constructor(generator) {
    this.generator = generator;
  }

  startStream = () => {
    this.feed = new StreamDisplay(this.searchQR);
    this.feed.startCapture();
    this.streamRunning = true;
  }

  stopStream = () => {
    this.feed.stopCapture();
    this.feed = null;
    this.streamRunning = false;
  }

  searchQR = imageData => {
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      this.stopStream();
      this.generator.setupFromQR(code.data);
    }
  }
}

export default Stream;
