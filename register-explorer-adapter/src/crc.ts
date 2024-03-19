const CRC_INIT = 0x47;
const CRC_POLY = 0x8d;
const CRC_SIZE = 8;
const CRC_MASK = 0xff;

export function crc(bytes: Uint8Array): number {
  let state = CRC_INIT;

  for (const byte of bytes.values()) {
    for (let i = CRC_SIZE - 1; i >= 0; i--) {
      const input = (byte >> i) & 1;
      const msb = state >> (CRC_SIZE - 1);
      const feedback = msb ^ input;

      state = (state << 1) & CRC_MASK;

      if (feedback) {
        state ^= CRC_POLY;
      }
    }
  }

  return state;
}
