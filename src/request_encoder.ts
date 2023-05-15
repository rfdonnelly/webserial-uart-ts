import {
  command_value,
  request_length,
  SYNC_MARKER,
} from "./fields.ts";
import { Request } from "./packets.ts";

export class RequestEncoder {
  encode(request: Request): Uint8Array {
    const length = request_length(request.command);
    let bytes = new Uint8Array(length);
    let byte_idx = 0;
    bytes[byte_idx++] = SYNC_MARKER;
    bytes[byte_idx++] = command_value(request.command);
    const buffer = new Uint32Array([request.addr]).buffer;
    const view = new DataView(buffer);
    for (let i = 0; i < 4; i++) {
      bytes[byte_idx++] = view.getUint8(i);
    }
    if (request.command == "Write") {
      const buffer = new Uint32Array([request.data]).buffer;
      const view = new DataView(buffer);
      for (let i = 0; i < 4; i++) {
        bytes[byte_idx++] = view.getUint8(i);
      }
    }
    bytes[byte_idx++] = request.crc;

    return bytes;
  }
}
