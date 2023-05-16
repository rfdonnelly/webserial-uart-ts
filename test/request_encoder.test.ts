import { beforeEach, it, expect } from "vitest";
import { RequestEncoder } from "/src/request_encoder.ts";
import { CommandValue, SYNC_MARKER } from "/src/fields.ts";

interface Ctxt {
  o: RequestEncoder;
}

beforeEach<Ctxt>(async (context) => {
  context.o = new RequestEncoder();
});

it<Ctxt>("read", ({ o }) => {
  expect(
    Array.from(
      o.encode({ command: "Read", addr: 0x12345678, crc: 0x55 }).values(),
    ),
  ).toEqual([SYNC_MARKER, CommandValue.Read, 0x12, 0x34, 0x56, 0x78, 0xa9]);
});
