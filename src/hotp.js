class HOTP {
  static async generateKey(secret, counter) {
    const Crypto = window.crypto.subtle;
    const encoder = new TextEncoder('utf-8');
    const secretBytes = encoder.encode(secret);
    const counterArray = this.padCounter(counter);

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

  static padCounter(counter) {
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

  static DT(HS) {
    const offset = HS[19] & 0b1111;
    const P = ((HS[offset] & 0x7f) << 24) | (HS[offset + 1] << 16) | (HS[offset + 2] << 8) | HS[offset + 3]
    const pString = P.toString(2);

    return pString;
  }

  static truncate(uKey) {
    const Sbits = this.DT(uKey);
    const Snum = parseInt(Sbits, 2);

    return Snum;
  }

  static async generateHOTP(secret, counter) {
    const key = await this.generateKey(secret, counter);
    const uKey = new Uint8Array(key);

    const Snum = this.truncate(uKey);
    const padded = ('000000' + (Snum % (10 ** 6))).slice(-6);

    return padded;
  }
}

export default HOTP;
