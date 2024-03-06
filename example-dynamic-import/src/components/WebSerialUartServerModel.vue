<script setup lang="ts">
import TextAreaLabel from './TextAreaLabel.vue';
import { ref } from 'vue';

const log = ref("");
const memString = ref("");
const serverModel = ref<any>(null);
const isConnected = ref(false);

async function connect() {
  const path = "./re-uart.js";
  const href = new URL(path, window.location.href).href
  const {UartServerModel} = await import(/*@vite-ignore*/ href);
  serverModel.value = new UartServerModel(logMessage, updateMemCallback);
  await serverModel.value.connect();
  isConnected.value = true;

  await serverModel.value.listen();
}

async function disconnect() {
  try {
    await serverModel.value.disconnect();
  } finally {
    isConnected.value = false;
  }
}

function updateMemCallback(value: string) {
  memString.value = value;
}

function logMessage(message: string) {
  if (log.value != "") {
      log.value += "\n";
  }
  log.value += timestamp() + " " + message;
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
