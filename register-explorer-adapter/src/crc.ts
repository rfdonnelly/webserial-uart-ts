const CRC_INIT_DEFAULT = 0x47;
const CRC_POLY_DEFAULT = 0x8d;
const CRC_REFLECT_DEFAULT = false;
const CRC_SIZE = 8;
const CRC_MASK = 0xff;

export class Crc {
  crcInit: number;
  crcPoly: number;
  crcReflect: boolean;

  constructor(crcInit: number, crcPoly: number, crcReflect: boolean) {
    this.crcInit = crcInit;
    this.crcPoly = crcPoly;
    this.crcReflect = crcReflect;
  }

  static default(): Crc {
    return new Crc(CRC_INIT_DEFAULT, CRC_POLY_DEFAULT, CRC_REFLECT_DEFAULT);
  }

  calculate(bytes: Uint8Array): number {
    let state = this.crcInit;

    for (const byte of bytes.values()) {
      for (let i = CRC_SIZE - 1; i >= 0; i--) {
        const input = (byte >> i) & 1;
        const msb = state >> (CRC_SIZE - 1);
        const feedback = msb ^ input;

        state = (state << 1) & CRC_MASK;

        if (feedback) {
          state ^= this.crcPoly;
        }
      }
    }

    return state;
  }
}
