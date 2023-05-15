import { Command, CommandValue, SYNC_MARKER } from "./fields.ts";
import { Response } from "./response.ts";

type ParseResult<T> = [number[], "None" | "Incomplete" | "Bad" | T];

export class ResponseDecoder {
  bytes: number[];

  constructor() {
    this.bytes = [];
  }

  transform(chunk: Uint8Array, controller: TransformStreamDefaultController) {
    this.accumulate_bytes(chunk);
    const [next_bytes, result] = this.parse_responses(this.bytes);
    if (Array.isArray(result)) {
      const responses = result;
      for (const response of responses) {
        controller.enqueue(response);
      }
    }
    this.bytes = next_bytes;
  }

  accumulate_bytes(chunk: Uint8Array) {
    for (const byte of chunk) {
      this.bytes.push(byte);
    }
  }

  parse_responses(bytes: number[]): ParseResult<Response[]> {
    let responses = [];
    let next = false;

    do {
      next = false;
      const [next_bytes, result] = this.parse_response(bytes);
      if (typeof result == "object") {
        const response = result;
        responses.push(response);
        next = true;
      }
      bytes = next_bytes;
    } while (next);

    return [bytes, responses];
  }

  parse_response(bytes: number[]): ParseResult<Response> {
    let sop_index = bytes.indexOf(SYNC_MARKER);

    if (sop_index >= 0) {
      const command_index = sop_index + 1;
      if (bytes.length > command_index) {
        const command_byte = bytes[command_index];
        const command = this.parse_command(command_byte);

        if (command) {
          const response_length = this.response_length(command);
          if (bytes.length >= sop_index + response_length) {
            const eop_index = sop_index + response_length;
            const response_bytes = bytes.slice(sop_index, eop_index);
            const response = this.parse_response_bounded(command, response_bytes);
            return [bytes.slice(eop_index), response];
          } else {
            // Not enough bytes for a response
            return [bytes, "Incomplete"];
          }
        } else {
          // Skip bad command
          return [bytes.slice(command_index + 1), "Bad"];
        }
      } else {
        // Not enough bytes for a command byte let alone a full response
        return [bytes, "Incomplete"];
      }
    } else {
      return [bytes, "None"];
    }
  }

  flush(_controller: TransformStreamDefaultController) {}

  parse_command(byte: number): Command | null {
    switch (byte) {
      case CommandValue.Read:
        return "Read";
      case CommandValue.Write:
        return "Write";
      default:
        return null;
    }
  }

  response_length(command: Command): number {
    const sync_len = 1;
    const command_len = 1;
    const data_len = 4;
    const crc_len = 1;

    switch (command) {
      case "Read": {
        return sync_len + command_len + data_len + crc_len;
      }
      case "Write": {
        return sync_len + command_len + crc_len;
      }
    }
  }

  parse_response_bounded(command: Command, bytes: number[]): Response {
    switch (command) {
      case "Read": {
        const buffer = new Uint8Array(bytes).buffer;
        const view = new DataView(buffer);
        const data = view.getUint32(2, false);
        return {
          command: command,
          data: data,
          crc: bytes[6],
          bytes: new Uint8Array(bytes),
        };
      }
      case "Write": {
        return {
          command: command,
          crc: bytes[2],
          bytes: new Uint8Array(bytes),
        };
      }
    }
  }
}
