export interface ReadResponse {
  command: "Read";
  data: number;
  crc: number;
  bytes?: Uint8Array;
}

export interface WriteResponse {
  command: "Write";
  crc: number;
  bytes?: Uint8Array;
}

export type Response = ReadResponse | WriteResponse;
