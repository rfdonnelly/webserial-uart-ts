import {
  requestToString,
  responseToString,
  Request,
  Response,
} from "./packets";
import { RequestDecoder } from "./request_decoder";
import { ResponseEncoder } from "./response_encoder";

interface Connection {
  port: SerialPort;
  reader: any;
  readerClosed: Promise<any>;
  writer: any;
  decoder: TransformStream<Uint8Array, Request>;
}

type Logger = (message: string) => void;

export class ServerModel {
  connection: Connection | null;
  encoder: ResponseEncoder;
  logger?: Logger;
  updateMemCallback?: Logger;
  mem: Map<number, number>;

  constructor(logger?: Logger, updateMemCallback?: Logger) {
    this.connection = null;
    this.logger = logger;
    this.updateMemCallback = updateMemCallback;
    this.encoder = new ResponseEncoder();
    this.mem = new Map();
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

    const decoder = new TransformStream(new RequestDecoder());
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

  async listen() {
    if (!this.connection) {
      return;
    }

    while (this.connection.port.readable) {
      const result = await this.connection.reader.read();
      if (result.done) {
        return;
      }
      const request = result.value;
      this.log(requestToString(request));

      switch (request.command) {
        case "Write":
          this.mem.set(request.addr, request.data);
          this.updateMemString(this.mem);
          await this.send_response(this.encoder, this.connection.writer, {
            command: "Write",
            crc: 0,
          });

          break;
        case "Read":
          const data = this.getMemEntry(request.addr);
          await this.send_response(this.encoder, this.connection.writer, {
            command: "Read",
            data: data,
            crc: 0,
          });
          break;
      }
    }
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

  async send_response(
    encoder: ResponseEncoder,
    writer: WritableStreamDefaultWriter<Uint8Array>,
    response: Response,
  ) {
    response.bytes = encoder.encode(response);
    this.log(responseToString(response));
    await writer.write(response.bytes);
  }

  log(message: string) {
    if (this.logger) {
      this.logger(message);
    }
  }

  getMemEntry(addr: number): number {
    if (!this.mem.has(addr)) {
      return Math.floor(Math.random() * 0xffffffff);
    } else {
      return this.mem.get(addr) || 0;
    }
  }

  updateMemString(mem: Map<number, number>) {
    if (!this.updateMemCallback) {
      return;
    }
    const value = Array.from(mem.entries())
      .map(([a, b]) => {
        return (
          a.toString(16).padStart(8, "0") +
          ":" +
          b.toString(16).padStart(8, "0")
        );
      })
      .join("\n");
    this.updateMemCallback(value);
  }
}
