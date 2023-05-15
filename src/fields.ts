export type Command = "Read" | "Write";

export enum CommandValue {
  Read = 0x30,
  Write = 0x50,
}

export const SYNC_MARKER = 0x47;
