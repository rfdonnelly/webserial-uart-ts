import { beforeEach, it, expect } from "vitest";
import { ResponseEncoder } from "/src/response_encoder.ts";
import { ResponseDecoder } from "/src/response_decoder.ts";

interface Ctxt {
  encoder: ResponseEncoder;
  decoder: ResponseDecoder;
}

beforeEach<Ctxt>(async (ctxt) => {
  ctxt.encoder = new ResponseEncoder();
  ctxt.decoder = new ResponseDecoder();
});

it<Ctxt>("write", (ctxt) => {
  const responseExpected = {
    command: "Write",
    crc: 0xf8,
  };
  responseExpected.bytes = ctxt.encoder.encode(responseExpected);
  const [remainingBytes, responseActual] = ctxt.decoder.parse_response(
    responseExpected.bytes,
  );
  expect(responseActual).toEqual(responseExpected);
});

it<Ctxt>("read", (ctxt) => {
  const responseExpected = {
    command: "Read",
    data: 0x12345678,
    crc: 0xa9,
  };
  responseExpected.bytes = ctxt.encoder.encode(responseExpected);
  const [remainingBytes, responseActual] = ctxt.decoder.parse_response(
    responseExpected.bytes,
  );
  expect(responseActual).toEqual(responseExpected);
});
