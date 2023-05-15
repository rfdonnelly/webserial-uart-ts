<script setup lang="ts">
import TextAreaLabel from './TextAreaLabel.vue';
import { requestToString, responseToString, Response } from '../packets.ts';
import { RequestDecoder } from '../request_decoder.ts';
import { ResponseEncoder } from '../response_encoder.ts';
import { ref } from 'vue';

interface Connection {
  port: SerialPort;
  reader: any;
  writer: any;
}

type NullableConnection = Connection | null;

const log = ref("");
const memString = ref("");
const connection = ref<NullableConnection>(null);
const isConnected = ref(false);

async function connect() {
  const port = await navigator.serial.requestPort();
  await port.open({
    baudRate: 115200,
  });

  if (!port.readable || !port.writable) {
    return;
  }

  const reader = port.readable
    .pipeThrough(new TransformStream(new RequestDecoder()))
    .getReader();
  const writer = port.writable.getWriter();
  const encoder = new ResponseEncoder();

  connection.value = {
    port: port,
    reader: reader,
    writer: writer,
  };
  logMessage("Connected");
  isConnected.value = true;

  const mem = new Map<number, number>();

  while (port.readable) {
    const {value} = await reader.read();
    const request = value;
    logMessage(requestToString(request));

    switch (request.command) {
      case "Write":
        mem.set(request.addr, request.data);
        updateMemString(mem);
        await send_response(
          encoder,
          writer,
          {
            command: "Write",
            crc: 0,
          }
        );

        break;
      case "Read":
        if (!mem.has(request.addr)) {
          const data = Math.floor(Math.random() * 0xffffffff);
          mem.set(request.addr, data);
          updateMemString(mem);
        }
        await send_response(
          encoder,
          writer,
        {
          command: "Read",
          data: mem.get(request.addr) || 0,
          crc: 0,
        }
        );
        break;
    }
  }
}

function updateMemString(mem: Map<number, number>) {
  memString.value = Array.from(mem.entries()).map(([a, b]) => {
      return a.toString(16).padStart(8, "0") + ":" + b.toString(16).padStart(8, "0")
      }).join("\n");
}

async function disconnect() {
  if (connection.value) {
    await connection.value.port.close();
    logMessage("Disconnected");
  }
  isConnected.value = false;
}

function logMessage(message: string) {
  log.value += timestamp() + " " + message + "\n";
}

async function send_response(encoder: ResponseEncoder, writer: WritableStreamDefaultWriter<Uint8Array>, response: Response) {
  response.bytes = encoder.encode(response);
  logMessage(responseToString(response));
  await writer.write(response.bytes);
}

function timestamp() {
  return new Date(Date.now()).toISOString();
}
</script>

<template>
  <div class="flex flex-row gap-4 py-10 justify-center">
    <button v-if="!isConnected" type="button"
      class="
        bg-green-500 rounded-lg p-2
        focus:outline-green-700
      "
      @click="connect"
    >Connect</button>
    <button v-if="isConnected" type="button"
      class="
        bg-red-500 rounded-lg p-2
        focus:outline-red-700
      "
      @click="disconnect"
    >Disconnect</button>
  </div>
  <TextAreaLabel label="Log" v-model="log"/>
  <TextAreaLabel label="Memory" v-model="memString"/>
</template>
