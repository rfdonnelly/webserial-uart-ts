<script setup lang="ts">
import { Request } from '../request.ts';
import { RequestEncoder } from '../request_encoder.ts';
import { ref } from 'vue';

const tx_log = ref("");
const addr = ref(0);
const write_data = ref(0);

function send_write() {
  send_request({
    command: "Write",
    addr: addr.value,
    data: write_data.value,
    crc: 0,
  });
}

function send_read() {
  send_request({
    command: "Read",
    addr: addr.value,
    crc: 0,
  });
}

function send_request(request: Request) {
    const encoder = new RequestEncoder();
    const bytes = encoder.encode(request);
    tx_log.value += JSON.stringify(request);
    tx_log.value += "\n";
    tx_log.value += bytes;
    tx_log.value += "\n";
}

</script>

<template>
  <div class="grid gap-4 grid-cols-2">
    <div id="tx grid grid-rows-2">
      <div>
        <div class="relative">
          <input id="addr" type="text" :value="addr"
            class="peer block min-h-[auto] w-full rounded border-0 bg-neutral-100 px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:bg-neutral-700 dark:text-neutral-200 dark:placeholder:text-neutral-200 dark:peer-focus:text-primary [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0"
          >
          <label for="addr"
            class="pointer-events-none absolute left-3 top-0 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out -translate-y-[0.9rem] scale-[0.8] text-primary peer-data-[te-input-state-active]:-translate-y-[0.9rem] peer-data-[te-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-200 dark:peer-focus:text-primary"
          >
            Address
          </label>
        </div>
        <div class="relative">
          <input id="write_data" type="text" :value="write_data"
            class="peer block min-h-[auto] w-full rounded border-0 bg-neutral-100 px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:bg-neutral-700 dark:text-neutral-200 dark:placeholder:text-neutral-200 dark:peer-focus:text-primary [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0"
          >
          <label for="write_data"
            class="pointer-events-none absolute left-3 top-0 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out -translate-y-[0.9rem] scale-[0.8] text-primary peer-data-[te-input-state-active]:-translate-y-[0.9rem] peer-data-[te-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-200 dark:peer-focus:text-primary"
          >
            Data
          </label>
        </div>
        <button type="button" class="bg-sky-500 rounded-l-lg rounded-r-none" @click="send_write">W</button>
        <button type="button" class="bg-sky-500 rounded-l-none rounded-r-lg" @click="send_read">R</button>
      </div>
      <div>
        <label for="tx_log">Log</label>
        <textarea id="tx_log" rows="4" class="block font-mono w-full">{{ tx_log }}</textarea>
      </div>
    </div>
    <div id="rx">
      <div class="relative">
        <input id="read_data" type="text" :value="read_data"
          class="peer block min-h-[auto] w-full rounded border-0 bg-neutral-100 px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:bg-neutral-700 dark:text-neutral-200 dark:placeholder:text-neutral-200 dark:peer-focus:text-primary [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0"
        >
        <label for="read_data"
          class="pointer-events-none absolute left-3 top-0 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out -translate-y-[0.9rem] scale-[0.8] text-primary peer-data-[te-input-state-active]:-translate-y-[0.9rem] peer-data-[te-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-200 dark:peer-focus:text-primary"
        >
          Data
        </label>
      </div>
      <label for="rx_log">Log</label>
      <textarea id="rx_log" rows="4" class="block font-mono w-full">{{ rx_log }}</textarea>
    </div>
  </div>
</template>
