import {
  command_value,
  response_length,
  SYNC_MARKER,
} from "./fields.ts";
import { Response } from "./packets.ts";

export class ResponseEncoder {
  encode(response: Response): Uint8Array {
    const length = response_length(response.command);
    let bytes = new Uint8Array(length);
    let byte_idx = 0;
    bytes[byte_idx++] = SYNC_MARKER;
    bytes[byte_idx++] = command_value(response.command);
    if (response.command == "Read") {
      const buffer = new Uint32Array([response.data]).buffer;
      const view = new DataView(buffer);
      for (let i = 0; i < 4; i++) {
        bytes[byte_idx++] = view.getUint8(i);
      }
    }
    bytes[byte_idx++] = response.crc;

    return bytes;
  }
}
