import { beforeEach, it, expect } from 'vitest'
import { ResponseDecoder } from '/src/response_decoder.ts'

interface Ctxt {
    o: ResponseDecoder,
}

beforeEach<Ctxt>(async (context) => {
    context.o = new ResponseDecoder();
});

it<Ctxt>('write', ({o}) => {
    expect(
        o.parse_response([0x47, 0x50, 0x55, 0x47])
    ).toEqual(
        [
            [0x47],
            { command: "Write", crc: 0x55 }
        ]
    );
});

it<Ctxt>('read', ({o}) => {
    expect(
        o.parse_response([0x47, 0x30, 0x12, 0x34, 0x56, 0x78, 0x55, 0x47])
    ).toEqual(
        [
            [0x47],
            { command: "Read", data: 0x12345678, crc: 0x55 }
        ]
    );
});

it<Ctxt>('incomplete', ({o}) => {
    expect(
        o.parse_response([0x47])
    ).toEqual([[0x47], "Incomplete"]);
});

it<Ctxt>('none', ({o}) => {
    expect(
        o.parse_response([0x00])
    ).toEqual([[0x00], "None"]);
});

it<Ctxt>('bad', ({o}) => {
    expect(
        o.parse_response([0x47, 0x00, 0x47])
    ).toEqual([[0x47], "Bad"]);
});

it<Ctxt>('multiple', ({o}) => {
    expect(
        o.parse_responses([0x47, 0x50, 0x55, 0x47, 0x30, 0x12, 0x34, 0x56, 0x78, 0x55, 0x47])
    ).toEqual(
        [
            [0x47],
            [
                { command: "Write", crc: 0x55 },
                { command: "Read", data: 0x12345678, crc: 0x55 },
            ]
        ]
    );
});

it<Ctxt>('stream', async ({o}) => {
    const byte_stream = new ReadableStream({
        start(controller) {
            controller.enqueue([0x47, 0x50]);
            controller.enqueue([0x55]);
        }
    });

    const response_reader = byte_stream
        .pipeThrough(new TransformStream(new ResponseDecoder()))
        .getReader();

    const {value, done } = await response_reader.read()

    expect(value).toEqual(
        { command: "Write", crc: 0x55 }
    );

});
