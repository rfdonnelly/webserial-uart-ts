<script setup lang="ts">
import TextInputLabel from './TextInputLabel.vue';
import TextAreaLabel from './TextAreaLabel.vue';
import { type Request, Uart } from 're-uart';
import { ref } from 'vue';

const log = ref("");
const addr = ref("0x00000000");
const data = ref("0x55555555");
const uart = ref<Uart>(new Uart(logMessage));
const isConnected = ref(false);

async function connect() {
  await uart.value.connect();
  isConnected.value = true;
}

async function disconnect() {
  try {
    await uart.value.disconnect();
  } finally {
    isConnected.value = false;
    uart.value = new Uart(logMessage);
  }
}

function logMessage(message: string) {
  if (log.value != "") {
      log.value += "\n";
  }
  log.value += timestamp() + " " + message;
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
  await uart.value.write(request);
  try {
    const response = await uart.value.read();
    if (response.command === "Read") {
      data.value = "0x" + response.data.toString(16).padStart(8, "0");
    }
  } catch {
    // Ignore
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
