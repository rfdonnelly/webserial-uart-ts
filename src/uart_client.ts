import {
  requestToString,
  responseToString,
  Request,
  Response,
} from "./packets.ts";
import { RequestEncoder } from "./request_encoder.ts";
import { ResponseDecoder } from "./response_decoder.ts";

interface Connection {
  port: SerialPort;
  reader: any;
  readerClosed: Promise<any>;
  writer: any;
  decoder: TransformStream<Uint8Array, Response>;
}

type Logger = (message: string) => void;

export class UartClient {
  connection: Connection | null;
  encoder: RequestEncoder;
  logger?: Logger;

  constructor(logger?: Logger) {
    this.connection = null;
    this.logger = logger;
    this.encoder = new RequestEncoder();
  }

  async connect() {
    const port = await navigator.serial.requestPort();
    await port.open({
      baudRate: 115200,
      parity: "odd",
    });

    if (!port.readable || !port.writable) {
      return;
    }

    const decoder = new TransformStream(new ResponseDecoder());
    const readerClosed = port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();
    const writer = port.writable.getWriter();

    this.connection = {
      port: port,
      reader: reader,
      readerClosed: readerClosed,
      writer: writer,
      decoder: decoder,
    };

    this.log("Connected");
  }

  async disconnect() {
    if (this.connection) {
      this.connection.writer.releaseLock();
      await this.connection.reader.cancel().catch(() => {
        // Ignore error
      });
      await this.connection.readerClosed.catch(() => {
        // Ignore error
      });
      await this.connection.port.close();
      this.connection = null;
      this.log("Disconnected");
    }
  }

  async performWrite(addr: number, data: number) {
    await this.write({
      command: "Write",
      addr: addr,
      data: data,
      crc: 0,
    });

    try {
      await this.read();
    } catch {
      // Ignore
    }
  }

  async performRead(addr: number): Promise<number> {
    await this.write({
      command: "Read",
      addr: addr,
      crc: 0,
    });
    try {
      const response = await this.read();
      if (response.command === "Read") {
        return response.data;
      } else {
        throw "invalid";
      }
    } catch (e) {
      throw e;
    }
  }

  async write(request: Request) {
    request.bytes = this.encoder.encode(request);
    this.log("Request " + requestToString(request));

    if (this.connection) {
      this.connection.writer.write(request.bytes);
    }
  }

  async read(): Promise<Response> {
    try {
      const response = await Promise.race<Response>([
        this.readWithoutTimeout(),
        this.responseTimeout(1000),
      ]);
      return response;
    } catch (e) {
      if (this.connection) {
        await this.connection.reader.cancel().catch(() => {
          // Ignore error
        });
      }
      this.log((e as Error).message);
      throw e;
    }
  }

  async responseTimeout(ms: number): Promise<never> {
    return new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout waiting for response")), ms);
    });
  }

  async readWithoutTimeout(): Promise<Response> {
    if (!this.connection) {
      throw new Error("Attempt to read a response without a connection");
    }

    const { value, done } = await this.connection.reader.read();
    if (done) {
      this.connection.reader.releaseLock();
      throw new Error("No response");
    }

    const response = value;
    this.log("Response " + responseToString(response));
    return response;
  }

  log(message: string) {
    if (this.logger) {
      this.logger(message);
    }
  }
}
