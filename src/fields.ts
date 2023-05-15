export type Command = "Read" | "Write";

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
