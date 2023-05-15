import { beforeEach, it, expect } from "vitest";
import { RequestDecoder } from "/src/request_decoder.ts";

interface Ctxt {
  o: RequestDecoder;
}

beforeEach<Ctxt>(async (context) => {
  context.o = new RequestDecoder();
});

it<Ctxt>("write", ({ o }) => {
  expect(
    o.parse_request([
      0x47, 0x50, 0x21, 0x43, 0x65, 0x87, 0x78, 0x56, 0x34, 0x12, 0x55, 0x47,
    ]),
  ).toEqual([
    [0x47],
    {
      command: "Write",
      addr: 0x87654321,
      data: 0x12345678,
      crc: 0x55,
      bytes: new Uint8Array([
        0x47, 0x50, 0x21, 0x43, 0x65, 0x87, 0x78, 0x56, 0x34, 0x12, 0x55,
      ]),
    },
  ]);
});

it<Ctxt>("read", ({ o }) => {
  expect(
    o.parse_request([0x47, 0x30, 0x78, 0x56, 0x34, 0x12, 0x55, 0x47]),
  ).toEqual([
    [0x47],
    {
      command: "Read",
      addr: 0x12345678,
      crc: 0x55,
      bytes: new Uint8Array([0x47, 0x30, 0x78, 0x56, 0x34, 0x12, 0x55]),
    },
  ]);
});

it<Ctxt>("incomplete", ({ o }) => {
  expect(o.parse_request([0x47])).toEqual([[0x47], "Incomplete"]);
});

it<Ctxt>("none", ({ o }) => {
  expect(o.parse_request([0x00])).toEqual([[0x00], "None"]);
});

it<Ctxt>("bad", ({ o }) => {
  expect(o.parse_request([0x47, 0x00, 0x47])).toEqual([[0x47], "Bad"]);
});

it<Ctxt>("multiple", ({ o }) => {
  expect(
    o.parse_requests([
      0x47, 0x50, 0x21, 0x43, 0x65, 0x87, 0x78, 0x56, 0x34, 0x12, 0x55, 0x47,
      0x30, 0x78, 0x56, 0x34, 0x12, 0x55, 0x47,
    ]),
  ).toEqual([
    [0x47],
    [
      {
        command: "Write",
        addr: 0x87654321,
        data: 0x12345678,
        crc: 0x55,
        bytes: new Uint8Array([
          0x47, 0x50, 0x21, 0x43, 0x65, 0x87, 0x78, 0x56, 0x34, 0x12, 0x55,
        ]),
      },
      {
        command: "Read",
        addr: 0x12345678,
        crc: 0x55,
        bytes: new Uint8Array([0x47, 0x30, 0x78, 0x56, 0x34, 0x12, 0x55]),
      },
    ],
  ]);
});

it<Ctxt>("stream", async ({ o }) => {
  const byte_stream = new ReadableStream({
    start(controller) {
      controller.enqueue([0x47, 0x50]);
      controller.enqueue([0x21, 0x43, 0x65, 0x87]);
      controller.enqueue([0x78, 0x56, 0x34, 0x12]);
      controller.enqueue([0x55]);
    },
  });

  const request_reader = byte_stream
    .pipeThrough(new TransformStream(new RequestDecoder()))
    .getReader();

  const { value, done } = await request_reader.read();

  expect(value).toEqual({
    command: "Write",
    addr: 0x87654321,
    data: 0x12345678,
    crc: 0x55,
    bytes: new Uint8Array([
      0x47, 0x50, 0x21, 0x43, 0x65, 0x87, 0x78, 0x56, 0x34, 0x12, 0x55,
    ]),
  });
});
