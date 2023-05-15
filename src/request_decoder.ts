import { parse_command, Command, SYNC_MARKER } from "./fields.ts";
import { Request } from "./request.ts";
import { ParseResult } from "./parse_types.ts";

export class RequestDecoder {
  bytes: number[];

  constructor() {
    this.bytes = [];
  }

  transform(chunk: Uint8Array, controller: TransformStreamDefaultController) {
    this.accumulate_bytes(chunk);
    const [next_bytes, result] = this.parse_requests(this.bytes);
    if (Array.isArray(result)) {
      const requests = result;
      for (const request of requests) {
        controller.enqueue(request);
      }
    }
    this.bytes = next_bytes;
  }

  accumulate_bytes(chunk: Uint8Array) {
    for (const byte of chunk) {
      this.bytes.push(byte);
    }
  }

  parse_requests(bytes: number[]): ParseResult<Request[]> {
    let requests = [];
    let next = false;

    do {
      next = false;
      const [next_bytes, result] = this.parse_request(bytes);
      if (typeof result == "object") {
        const request = result;
        requests.push(request);
        next = true;
      }
      bytes = next_bytes;
    } while (next);

    return [bytes, requests];
  }

  parse_request(bytes: number[]): ParseResult<Request> {
    let sop_index = bytes.indexOf(SYNC_MARKER);

    if (sop_index >= 0) {
      const command_index = sop_index + 1;
      if (bytes.length > command_index) {
        const command_byte = bytes[command_index];
        const command = parse_command(command_byte);

        if (command) {
          const request_length = this.request_length(command);
          if (bytes.length >= sop_index + request_length) {
            const eop_index = sop_index + request_length;
            const request_bytes = bytes.slice(sop_index, eop_index);
            const request = this.parse_request_bounded(command, request_bytes);
            return [bytes.slice(eop_index), request];
          } else {
            // Not enough bytes for a request
            return [bytes, "Incomplete"];
          }
        } else {
          // Skip bad command
          return [bytes.slice(command_index + 1), "Bad"];
        }
      } else {
        // Not enough bytes for a command byte let alone a full request
        return [bytes, "Incomplete"];
      }
    } else {
      return [bytes, "None"];
    }
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

  parse_request_bounded(command: Command, bytes: number[]): Request {
    const buffer = new Uint8Array(bytes).buffer;
    const view = new DataView(buffer);
    const addr = view.getUint32(2, false);

    switch (command) {
      case "Read": {
        return {
          command: command,
          addr: addr,
          crc: bytes[6],
          bytes: new Uint8Array(bytes),
        };
      }
      case "Write": {
        const data = view.getUint32(6, false);
        return {
          command: command,
          addr: addr,
          data: data,
          crc: bytes[10],
          bytes: new Uint8Array(bytes),
        };
      }
    }
  }
}
