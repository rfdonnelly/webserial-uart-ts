<script setup lang="ts">
import TextInputLabel from './TextInputLabel.vue';
import { Request } from '../request.ts';
import { RequestEncoder } from '../request_encoder.ts';
import { ResponseDecoder } from '../response_decoder.ts';
import { ref } from 'vue';

const log = ref("");
const addr = ref("0x00000000");
const data = ref("0x55555555");
const port = ref(null);

async function connect() {
  port.value = await navigator.serial.requestPort();
  await port.value.open({
    baudRate: 115200,
  });
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

async function send_request(request: Request) {
    const encoder = new RequestEncoder();
    const bytes = encoder.encode(request);
    log.value += new Date(Date.now()).toISOString() + "\n";
    log.value += JSON.stringify(request) + "\n";
    log.value += bytes + "\n";

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
      log.value += new Date(Date.now()).toISOString() + "\n";
      log.value += JSON.stringify(response) + "\n";
      reader.releaseLock();
    }
}

</script>

<template>
  <div class="flex flex-row gap-4 py-10">
    <button type="button"
      class="
        bg-sky-500 rounded-lg p-2
      "
      @click="connect"
    >Connect</button>
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
      <div class="relative my-10">
        <textarea
          id="log"
          rows="12"
          class="
            block
            font-mono
            w-full
            border-0
            outline-none
            p-2
          "
        >{{ log }}</textarea>
        <label
          for="log"
          class="
            absolute
            left-0
            -top-3.5
            text-sm
          "
        >
          Log
        </label>
      </div>
    </div>
</template>
