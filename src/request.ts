export interface ReadRequest {
    command: "Read";
    addr: number;
    crc: number;
    bytes?: Uint8Array;
}

export interface WriteRequest {
    command: "Write";
    addr: number;
    data: number;
    crc: number;
    bytes?: Uint8Array;
}

export type Request = ReadRequest | WriteRequest;
