type Logger = (message: string) => void;

export interface RegvueHardwareClientInterface {
  name: string;
  description: string;
  logInfo?: Logger;
  logError?: Logger;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  write(addr: number, data: number): Promise<void>;
  read(addr: number): Promise<number>;
}


