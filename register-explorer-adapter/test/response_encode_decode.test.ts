import { beforeEach, it, expect } from "vitest";
import { ResponseEncoder } from "/src/response_encoder.ts";
import { ResponseDecoder } from "/src/response_decoder.ts";
import { Crc } from "/src/crc.ts";

interface Ctxt {
  encoder: ResponseEncoder;
  decoder: ResponseDecoder;
}

beforeEach<Ctxt>(async (ctxt) => {
  ctxt.encoder = new ResponseEncoder(Crc.default());
  ctxt.decoder = new ResponseDecoder();
});

it<Ctxt>("write", (ctxt) => {
  const responseExpected = {
    command: "Write",
    crc: 0x77,
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
    crc: 0xba,
  };
  responseExpected.bytes = ctxt.encoder.encode(responseExpected);
  const [remainingBytes, responseActual] = ctxt.decoder.parse_response(
    responseExpected.bytes,
  );
  expect(responseActual).toEqual(responseExpected);
});
