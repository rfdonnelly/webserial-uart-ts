import { Command, CommandValue, SYNC_MARKER } from "./fields.ts";
import { Request } from "./request.ts";

export class RequestEncoder {
  encode(request: Request): Uint8Array {
    const request_length = this.request_length(request.command);
    let bytes = new Uint8Array(request_length);
    let byte_idx = 0;
    bytes[byte_idx++] = SYNC_MARKER;
    bytes[byte_idx++] = this.command_value(request.command);
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

  request_length(command: Command): number {
    const sync_len = 1;
    const command_len = 1;
    const addr_len = 4;
    const data_len = 4;
    const crc_len = 1;

    switch (command) {
      case "Read": {
        return sync_len + command_len + addr_len + crc_len;
      }
      case "Write": {
        return sync_len + command_len + addr_len + data_len + crc_len;
      }
    }
  }

  command_value(command: Command): number {
    switch (command) {
      case "Read": {
        return CommandValue.Read;
      }
      case "Write": {
        return CommandValue.Write;
      }
    }
  }
}
