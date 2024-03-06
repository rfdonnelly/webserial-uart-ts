export type LogCallback = (message: string) => void;
export type ReadResponseCallback = (value: number) => void;

export interface RegvueHardwareClientInterface {
  name: string;
  description: string;
  logInfo?: LogCallback;
  logError?: LogCallback;
  receivedReadResponse: ReadResponseCallback;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  write(addr: number, data: number): Promise<void>;
  read(addr: number): Promise<void>;
}


