import { Command } from "./fields.ts";

export interface Response {
  command: Command;
  data?: number;
  crc: number;
  bytes?: Uint8Array;
}
