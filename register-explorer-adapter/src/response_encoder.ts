import { command_value, response_length, SYNC_MARKER } from "./fields.ts";
import { Response } from "./packets.ts";
import { Crc } from "./crc.ts";

export class ResponseEncoder {
  crc: Crc;

  constructor(crc: Crc) {
    this.crc = crc;
  }

  encode(response: Response): Uint8Array {
    const length = response_length(response.command);
    const bytes = new Uint8Array(length);
    let byte_idx = 0;
    bytes[byte_idx++] = SYNC_MARKER;
    bytes[byte_idx++] = command_value(response.command);
    if (response.command === "Read") {
      const buffer = new Uint32Array([response.data]).buffer;
      const view = new DataView(buffer);
      for (let i = 0; i < 4; i++) {
        bytes[byte_idx++] = view.getUint8(3 - i);
      }
    }
    bytes[byte_idx++] = this.crc.calculate(bytes.slice(0, length - 1));

    return bytes;
  }
}
