<script setup lang="ts">
import TextInputLabel from './TextInputLabel.vue';
import TextAreaLabel from './TextAreaLabel.vue';
import { UartClient } from 're-uart';
import { ref } from 'vue';

const log = ref("");
const addr = ref("0x00000000");
const data = ref("0x55555555");
const client = ref<UartClient>(new UartClient(logMessage));
const isConnected = ref(false);

async function connect() {
  await client.value.connect();
  isConnected.value = true;
}

async function disconnect() {
  try {
    await client.value.disconnect();
  } finally {
    isConnected.value = false;
  }
}

function logMessage(message: string) {
  if (log.value != "") {
      log.value += "\n";
  }
  log.value += timestamp() + " " + message;
}

async function send_write() {
  const laddr = parseInt(addr.value);
  const ldata = parseInt(data.value);
  await client.value.performWrite(laddr, ldata);
}

async function send_read() {
  const laddr = parseInt(addr.value);
  const ldata = await client.value.performRead(laddr);
  data.value = "0x" + ldata.toString(16).padStart(8, "0");
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
