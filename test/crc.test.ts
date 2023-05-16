import { beforeEach, it, expect } from "vitest";
import { crc } from "/src/crc.ts";

it("crc", () => {
  expect(
    crc(new Uint8Array([0x47, 0x50, 0x00, 0x01, 0x12, 0x34, 0x56, 0x78])),
  ).toBe(0xe9);
});
