import { Command } from './fields.ts'

export interface Request {
    command: Command,
    addr: number,
    data: number,
    crc: number,
    bytes?: Uint8Array,
}
