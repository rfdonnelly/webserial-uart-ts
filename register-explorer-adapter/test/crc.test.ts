import { beforeEach, it, expect } from "vitest";
import { Crc } from "/src/crc.ts";

it("crc", () => {
  expect(
    Crc.default().calculate(new Uint8Array([0x47, 0x50, 0x00, 0x01, 0x12, 0x34, 0x56, 0x78])),
  ).toBe(0xe9);
});

it("crc-hw-actual", () => {
  expect(Crc.default().calculate(new Uint8Array([0x47, 0x30, 0x12, 0x34, 0x56, 0x78]))).toBe(0xba);
});

it("crc-hw-expected", () => {
  expect(Crc.default().calculate(new Uint8Array([0x47, 0x30, 0x00, 0x00, 0x00, 0x00]))).toBe(0x7e);
});
