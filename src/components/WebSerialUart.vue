<script setup lang="ts">
import TextInputLabel from './TextInputLabel.vue';
import TextAreaLabel from './TextAreaLabel.vue';
import { requestToString, responseToString, Request } from '../packets.ts';
import { RequestEncoder } from '../request_encoder.ts';
import { ResponseDecoder } from '../response_decoder.ts';
import { ref } from 'vue';

interface Connection {
  port: SerialPort;
  reader: any;
  writer: any;
}

type NullableConnection = Connection | null;

const log = ref("");
const addr = ref("0x00000000");
const data = ref("0x55555555");
const connection = ref<NullableConnection>(null);
const isConnected = ref(false);

async function timeout(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject();
    }, ms);
  });
}

async function connect() {
  const port = await navigator.serial.requestPort();
  await port.open({
    baudRate: 115200,
  });

  if (!port.readable || !port.writable) {
    return;
  }

  const reader = port.readable
    .pipeThrough(new TransformStream(new ResponseDecoder()))
    .getReader();
  const writer = port.writable.getWriter();

  connection.value = {
    port: port,
    reader: reader,
    writer: writer,
  };
  logMessage("Connected");
  isConnected.value = true;
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

async function get_response() {
  if (connection.value) {
    const result = await connection.value.reader.read();
    if (!result.done) {
      const response = result.value;
      if (response.command == "Read") {
        data.value = response.data;
      }
      logMessage(responseToString(response));
    }
  }
}

async function send_request(request: Request) {
    const encoder = new RequestEncoder();
    request.bytes = encoder.encode(request);
    logMessage(requestToString(request));

    if (connection.value) {
      await connection.value.writer.write(request.bytes);
      connection.value.writer.releaseLock();
    }

    if (connection.value) {
      let timeoutOccurred = false;
      const getResponsePromise = get_response();
      await Promise.race([
        timeout(1000)
        .catch(() => {
          timeoutOccurred = true;
          logMessage("Timeout waiting for response");
        }),
        getResponsePromise,
      ]);
      if (timeoutOccurred) {
        connection.value.reader.cancel();
        await getResponsePromise;
      }
      connection.value.reader.releaseLock();
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
    <div id="tx">
      <div class="flex flex-row py-2 gap-4">
        <TextInputLabel class="w-1/2" label="Address" v-model="addr"/>
        <TextInputLabel class="w-1/2" label="Data" v-model="data"/>
      </div>
      <div class="flex flex-row justify-end">
        <button type="button"
          class="
            p-2 bg-sky-500 rounded-l-lg rounded-r-none
            focus:outline-sky-700
          "
          @click="send_write"
        >W</button>
        <button type="button"
          class="
            p-2 bg-sky-500 rounded-l-none rounded-r-lg
            focus:outline-sky-700
          "
          @click="send_read"
        >R</button>
      </div>
      <TextAreaLabel class="mt-10" label="Log" v-model="log"/>
    </div>
</template>
