import { requestToString, responseToString, Request, Response } from './packets.ts';
import { RequestEncoder } from './request_encoder.ts';
import { ResponseDecoder } from './response_decoder.ts';

interface Connection {
  port: SerialPort;
  reader: any;
  writer: any;
}

type Logger = (message: string) => void;

export class Uart {
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

    const reader = port.readable
      .pipeThrough(new TransformStream(new ResponseDecoder()))
      .getReader();
    const writer = port.writable.getWriter();

    this.connection = {
      port: port,
      reader: reader,
      writer: writer,
    };

    this.log("Connected");
  }

  async disconnect() {
    if (this.connection) {
      this.connection.writer.releaseLock();
      this.connection.reader.releaseLock();
      // FIXME: Trying to close the serial port after writing/reading a
      // request/response results in an exception because the reader is still
      // locked even if we call releaseLock above.
      // Fix seems to be to use pipeTo instead of pipeThrough above.  See
      // https://github.com/WICG/serial/issues/134.
      await this.connection.port.close();
      this.log("Disconnected");
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
      return this.promiseWithTimeout(
        this.read_without_timeout(),
        1000,
        new Error("Timeout waiting for response")
      );
    } catch (error) {
      if (this.connection) {
        this.connection.reader.cancel();
      }
      throw error;
    }
  }

  async promiseWithTimeout<T>(
    promise: Promise<T>,
    ms: number,
    timeoutError: Error,
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(timeoutError), ms)
    });

    const result = Promise.race<T>([promise, timeout]);
    if (typeof result !== "object") {
      throw timeoutError;
    } else {
      return result;
    }
  }

  async read_without_timeout(): Promise<Response> {
    if (!this.connection) {
      throw new Error("Attempt to read without a connection");
    }

    const { value, done } = await this.connection.reader.read();
    if (done) {
      throw new Error("stream closed");
    } else {
      const response = value;
      this.log("Response " + responseToString(response));
      return response;
    }
  }

  log(message: string) {
    if (this.logger) {
      this.logger(message);
    }
  }
}
