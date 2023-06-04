<script setup lang="ts">
import WebSerialUart from './components/WebSerialUart.vue'
import WebSerialModel from './components/WebSerialModel.vue'
</script>

<template>
  <h1 class="text-xl mt-10">Client</h1>
  <WebSerialUart/>
  <h1 class="text-xl mt-10">Model</h1>
  <WebSerialModel/>
</template>

<style scoped>
</style>
