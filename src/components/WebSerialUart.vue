<script setup lang="ts">
import TextInputLabel from './TextInputLabel.vue';
import TextAreaLabel from './TextAreaLabel.vue';
import { Request } from '../request.ts';
import { RequestEncoder } from '../request_encoder.ts';
import { ResponseDecoder } from '../response_decoder.ts';
import { ref } from 'vue';

const log = ref("");
const addr = ref("0x00000000");
const data = ref("0x55555555");
const port = ref(null);
const isConnected = ref(false);

async function connect() {
  port.value = await navigator.serial.requestPort();
  await port.value.open({
    baudRate: 115200,
  });
  logMessage("Connected");
  isConnected.value = true;
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

async function send_request(request: Request) {
    const encoder = new RequestEncoder();
    request.bytes = encoder.encode(request);
    logMessage(requestToString(request));

    if (port.value && port.value.writeable) {
      const writer = port.value.writeable.getWriter();
      await writer.write(bytes);
      writer.releaseLock();
    }

    if (port.value && port.value.readable) {
      const reader = port.value.readable
        .pipeThrough(new TransformStream(new ResponseDecoder()))
        .getReader();

      const {value, done} = await reader.read();
      const response = value;
      if (response.command == "Read") {
        data.value = response.data;
      }
      logMessage(responseToString(response));
      reader.releaseLock();
    }
}

function requestToString(request: Request) {
  const bytes = Array.from(request.bytes)
    .map(x => x.toString(16).padStart(2, "0"))
    .join(" ");
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

function responseToString(response: Response) {
  const bytes = Array.from(request.bytes)
    .map(x => x.toString(16).padStart(2, "0"))
    .join(" ");
  switch (request.command) {
    case "Read": {
      const data = request.data.toString(16).padStart(8, "0");
      const obj = { command: request.command, data: data, bytes: bytes };
      return JSON.stringify(obj).replaceAll(",", ", ");
    }
    case "Write": {
      const obj = { command: request.command, bytes: bytes };
      return JSON.stringify(obj).replaceAll(",", ", ");
    }
  }
}
</script>

<template>
  <div class="flex flex-row gap-4 py-10">
    <button v-if="!isConnected" type="button"
      class="
        bg-green-500 rounded-lg p-2
      "
      @click="connect"
    >Connect</button>
    <button v-if="isConnected" type="button"
      class="
        bg-red-500 rounded-lg p-2
      "
      @click="disconnect"
    >Disconnect</button>
  </div>
    <div id="tx">
      <div class="flex flex-row py-2 gap-4">
        <TextInputLabel class="w-1/2" label="Address" v-model="addr"/>
        <TextInputLabel class="w-1/2" label="Data" v-model="data"/>
      </div>
      <div class="flex flex-row">
        <button type="button"
          class="
            p-2 bg-sky-500 rounded-l-lg rounded-r-none
          "
          @click="send_write"
        >W</button>
        <button type="button"
          class="
            p-2 bg-sky-500 rounded-l-none rounded-r-lg
          "
          @click="send_read"
        >R</button>
      </div>
      <TextAreaLabel class="mt-10" label="Log" v-model="log"/>
    </div>
</template>
