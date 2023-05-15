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

export type Request = ReadRequest | WriteRequest;
export type Response = ReadResponse | WriteResponse;

export function requestToString(request: Request): string {
  const bytes = packetBytesToString(request);
  const addr = request.addr.toString(16).padStart(8, "0");
  switch (request.command) {
    case "Read": {
      const obj = { command: request.command, addr: addr, bytes: bytes };
      return JSON.stringify(obj).replaceAll(",", ", ");
    }
    case "Write": {
      const data = request.data.toString(16).padStart(8, "0");
      const obj = { command: request.command, addr: addr, data: data, bytes: bytes };
      return JSON.stringify(obj).replaceAll(",", ", ");
    }
  }
}

export function responseToString(response: Response): string {
  const bytes = packetBytesToString(response);
  switch (response.command) {
    case "Read": {
      const data = response.data.toString(16).padStart(8, "0");
      const obj = { command: response.command, data: data, bytes: bytes };
      return JSON.stringify(obj).replaceAll(",", ", ");
    }
    case "Write": {
      const obj = { command: response.command, bytes: bytes };
      return JSON.stringify(obj).replaceAll(",", ", ");
    }
  }
}

function packetBytesToString(packet: Request | Response): string {
  if (packet.bytes !== undefined) {
    const array: Array<number> = Array.from(packet.bytes);
    return array
      .map(x => x.toString(16).padStart(2, "0"))
      .join(" ");
  } else {
    return "";
  }
}
