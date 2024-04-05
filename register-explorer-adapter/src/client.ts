import {
  requestToString,
  responseToString,
  Request,
  Response,
} from "./packets.ts";
import { Crc } from "./crc.ts";
import { RequestEncoder } from "./request_encoder.ts";
import { ResponseDecoder } from "./response_decoder.ts";
import {
  Adapter,
  AdapterConstructor,
  AdapterConstructorParams,
  AccessCallback,
  LogCallback,
} from "regvue-adapter";

interface Connection {
  port: SerialPort;
  reader: any;
  readerClosed: Promise<any>;
  writer: any;
  decoder: TransformStream<Uint8Array, Response>;
}

interface Options {
  baudRate: number;
  parity: ParityType;
  crcInit: number;
  crcPoly: number;
  crcReflect: boolean;
}

export const Client: AdapterConstructor = class Client implements Adapter {
  name = "Register Explorer UART";
  description = "Client for the Register Explorer UART protocol";

  crc: Crc;
  connection: Connection | null;
  encoder: RequestEncoder;
  logCallback?: LogCallback;
  accessCallback?: AccessCallback;

  opts: Options;

  constructor({
    options,
    accessCallback,
    logCallback,
  }: AdapterConstructorParams) {
    this.connection = null;
    this.logCallback = logCallback;
    this.accessCallback = accessCallback;
    this.opts = this.parseOptions(options);
    this.crc = new Crc(
      this.opts.crcInit,
      this.opts.crcPoly,
      this.opts.crcReflect,
    );
    this.encoder = new RequestEncoder(this.crc);
  }

  defaultOptions(): Options {
    return {
      baudRate: 115200,
      parity: "odd",
      crcInit: 0x47,
      crcPoly: 0x8d,
      crcReflect: false,
    };
  }

  parseOptions(options?: Map<string, string>): Options {
    let opts = this.defaultOptions();

    if (options) {
      options.forEach((v, k) => {
        switch (k) {
          case "baudRate":
            opts.baudRate = parseInt(v);
            break;
          case "parity":
            opts.parity = this.parseEnumeratedValue(k, v, [
              "odd",
              "even",
              "none",
            ]) as ParityType;
            break;
          case "crcInit":
            opts.crcInit = parseInt(v);
            break;
          case "crcPoly":
            opts.crcPoly = parseInt(v);
            break;
          case "crcReflect":
            opts.crcReflect =
              this.parseEnumeratedValue(k, v, ["0", "1"]) === "1";
            break;
          default:
            throw new Error("Invalid option: '" + k + "'");
        }
      });
    }

    return opts;
  }

  parseEnumeratedValue(
    name: string,
    value: string,
    validValues: string[],
  ): string {
    if (!validValues.includes(value)) {
      throw new Error(
        "Invalid " +
          name +
          " value '" +
          value +
          "'.  Valid values: " +
          validValues.join(" "),
      );
    }
    return value;
  }

  async connect() {
    const port = await navigator.serial.requestPort();
    await port.open({
      baudRate: this.opts.baudRate,
      parity: this.opts.parity,
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

  async write(addr: number, data: number) {
    await this.writeRequest({
      command: "Write",
      addr: addr,
      data: data,
      // Encoder encodes a good CRC for us
      crc: 0,
    });

    try {
      const response = await this.readResponse();
      if (this.crc.calculate(response.bytes as Uint8Array) != 0) {
        throw new Error("Bad CRC in response");
      }
      if (response.command == "Write") {
        if (this.accessCallback) {
          this.accessCallback({
            type: "Write",
            addr: addr,
            data: data,
          });
        }
      } else {
        throw new Error(
          "Expected a Write response but received a " +
            response.command +
            " response.",
        );
      }
    } catch {
      // Ignore
    }
  }

  async read(addr: number): Promise<number> {
    await this.writeRequest({
      command: "Read",
      addr: addr,
      // Encoder encodes a good CRC for us
      crc: 0,
    });
    try {
      const response = await this.readResponse();
      if (this.crc.calculate(response.bytes as Uint8Array) != 0) {
        throw new Error("Bad CRC in response");
      }
      if (response.command === "Read") {
        if (this.accessCallback) {
          this.accessCallback({
            type: "Read",
            addr: addr,
            data: response.data,
          });
        }
        return response.data;
      } else {
        throw new Error(
          "Expected a Read response but received a " +
            response.command +
            " response.",
        );
      }
    } catch (e) {
      throw e;
    }
  }

  async writeRequest(request: Request) {
    request.bytes = this.encoder.encode(request);
    this.log("Request " + requestToString(request));

    if (this.connection) {
      this.connection.writer.write(request.bytes);
    }
  }

  async readResponse(): Promise<Response> {
    try {
      const response = await Promise.race<Response>([
        this.readResponseWithoutTimeout(),
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

  async readResponseWithoutTimeout(): Promise<Response> {
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
    if (this.logCallback) {
      this.logCallback(message);
    } else {
      console.log(message);
    }
  }
};
