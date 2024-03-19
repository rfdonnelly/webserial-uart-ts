<script setup lang="ts">
import WebSerialClient from './components/WebSerialClient.vue'
import WebSerialServerModel from './components/WebSerialServerModel.vue'
</script>

<template>
  <h1 class="text-xl mt-10">Client</h1>
  <WebSerialClient/>
  <h1 class="text-xl mt-10">Model</h1>
  <WebSerialServerModel/>
</template>

<style scoped>
</style>
