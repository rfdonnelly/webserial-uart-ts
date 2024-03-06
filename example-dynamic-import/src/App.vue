<script setup lang="ts">
import WebSerialUartClient from './components/WebSerialUartClient.vue'
import WebSerialUartServerModel from './components/WebSerialUartServerModel.vue'
</script>

<template>
  <h1 class="text-xl mt-10">Client</h1>
  <WebSerialUartClient/>
  <h1 class="text-xl mt-10">Model</h1>
  <WebSerialUartServerModel/>
</template>

<style scoped>
</style>
