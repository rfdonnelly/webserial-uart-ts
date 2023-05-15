<script setup lang="ts">
import TextInputLabel from './TextInputLabel.vue';
import TextAreaLabel from './TextAreaLabel.vue';
import { Request } from '../request.ts';
import { Response } from '../response.ts';
import { RequestDecoder } from '../request_decoder.ts';
import { ResponseEncoder } from '../response_encoder.ts';
import { ref } from 'vue';

const log = ref("");
const memString = ref("");
const port = ref<SerialPort | null>(null);
const isConnected = ref(false);

async function connect() {
  port.value = await navigator.serial.requestPort();
  await port.value.open({
    baudRate: 115200,
  });
  logMessage("Connected");
  isConnected.value = true;

  const reader = port.value.readable
    .pipeThrough(new TransformStream(new RequestDecoder()))
    .getReader();
  const writer = port.value.writable.getWriter();
  const encoder = new ResponseEncoder();

  let mem = {};

  while (port.value.readable) {
    const {value} = await reader.read();
    const request = value;
    logMessage(requestToString(request));

    let response = {};
    switch (request.command) {
      case "Write":
        mem[request.addr] = request.data;
        memString.value = JSON.stringify(mem);
        response = {
          command: "Write",
          crc: 0x55,
        };
        response.bytes = encoder.encode(response);
        logMessage(responseToString(response));
        await writer.write(response.bytes);

        break;
      case "Read":
        response = {
          command: "Read",
          data: mem[request.addr],
          crc: 0x55,
        };
        response.bytes = encoder.encode(response);
        logMessage(responseToString(response));
        await writer.write(response.bytes);
        break;
    }
  }
}

async function disconnect() {
  if (port.value) {
    await port.value.close();
    logMessage("Disconnected");
  }
  isConnected.value = false;
}

function logMessage(message: string) {
  log.value += timestamp() + " " + message + "\n";
}

async function send_write() {
  await send_request({
    command: "Write",
    addr: parseInt(addr.value),
    data: parseInt(data.value),
    crc: 0,
  });
}

async function send_read() {
  await send_request({
    command: "Read",
    addr: parseInt(addr.value),
    crc: 0,
  });
}

function timestamp() {
  return new Date(Date.now()).toISOString();
}

async function process_request(request: Request) {
    const encoder = new RequestEncoder();
    request.bytes = encoder.encode(request);
    logMessage(requestToString(request));

    if (port.value && port.value.writable) {
      const writer = port.value.writable.getWriter();
      await writer.write(request.bytes);
      writer.releaseLock();
    }

    if (port.value && port.value.readable) {
      const reader = port.value.readable
        .pipeThrough(new TransformStream(new ResponseDecoder()))
        .getReader();

      const {value} = await reader.read();
      const response = value;
      if (response.command == "Read") {
        data.value = response.data;
      }
      logMessage(responseToString(response));
      reader.releaseLock();
    }
}

function requestToString(request: Request): string {
  const bytes = packetBytesToString(request);
  const addr = request.addr.toString(16).padStart(8, "0");
  switch (request.command) {
    case "Read": {
      const obj = { command: request.command, addr: addr, bytes: bytes };
      return JSON.stringify(obj).replaceAll(",", ", ");
    }
    case "Write": {
      const data = request.data.toString(16).padStart(8, "0");
      const obj = { command: request.command, addr: addr, data: data, bytes: bytes };
      return JSON.stringify(obj).replaceAll(",", ", ");
    }
  }
}

function packetBytesToString(packet: Request | Response): string {
  if (packet.bytes !== undefined) {
    const array: Array<number> = Array.from(packet.bytes);
    return array
      .map(x => x.toString(16).padStart(2, "0"))
      .join(" ");
  } else {
    return "";
  }
}

function responseToString(response: Response): string {
  const bytes = packetBytesToString(response);
  switch (response.command) {
    case "Read": {
      const data = response.data.toString(16).padStart(8, "0");
      const obj = { command: response.command, data: data, bytes: bytes };
      return JSON.stringify(obj).replaceAll(",", ", ");
    }
    case "Write": {
      const obj = { command: response.command, bytes: bytes };
      return JSON.stringify(obj).replaceAll(",", ", ");
    }
  }
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
