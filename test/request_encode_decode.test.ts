import { beforeEach, it, expect } from "vitest";
import { RequestEncoder } from "/src/request_encoder.ts";
import { RequestDecoder } from "/src/request_decoder.ts";

interface Ctxt {
  encoder: RequestEncoder;
  decoder: RequestDecoder;
}

beforeEach<Ctxt>(async (ctxt) => {
  ctxt.encoder = new RequestEncoder();
  ctxt.decoder = new RequestDecoder();
});

it<Ctxt>("write", (ctxt) => {
  const requestExpected = {
    command: "Write",
    addr: 0x87654321,
    data: 0x12345678,
    crc: 0x55,
  };
  requestExpected.bytes = ctxt.encoder.encode(requestExpected);
  const [remainingBytes, requestActual] = ctxt.decoder.parse_request(
    requestExpected.bytes,
  );
  expect(requestActual).toEqual(requestExpected);
});

it<Ctxt>("write", (ctxt) => {
  const requestExpected = {
    command: "Read",
    addr: 0x12345678,
    crc: 0x55,
  };
  requestExpected.bytes = ctxt.encoder.encode(requestExpected);
  const [remainingBytes, requestActual] = ctxt.decoder.parse_request(
    requestExpected.bytes,
  );
  expect(requestActual).toEqual(requestExpected);
});
