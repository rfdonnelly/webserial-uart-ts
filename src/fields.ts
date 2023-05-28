export type Command = "Read" | "Write";

// TODO: Add support for error responses
export type ResponseCommand = "Read" | "Write" | "Error";

export enum CommandValue {
  Read = 0x30,
  Write = 0x50,
}

export const SYNC_MARKER = 0x47;

export function parse_command(byte: number): Command | null {
  switch (byte) {
    case CommandValue.Read:
      return "Read";
    case CommandValue.Write:
      return "Write";
    default:
      return null;
  }
}

export function command_value(command: Command): number {
  switch (command) {
    case "Read": {
      return CommandValue.Read;
    }
    case "Write": {
      return CommandValue.Write;
    }
  }
}

export function request_length(command: Command): number {
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

export function response_length(command: Command): number {
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
