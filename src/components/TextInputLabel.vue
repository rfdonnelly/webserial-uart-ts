<script setup lang="ts">
  const props = defineProps<{
    label: string,
    modelValue: string,
  }>();
  defineEmits(['update:modelValue']);
</script>

<template>
  <div class="relative">
    <input
      id="input"
      type="text"
      :value="props.modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="
        peer
        font-mono
        h-10
        w-full
        border-0
        outline-none
        px-2
      "
      />
    <label for="input"
      class="
        absolute
        left-0
        -top-3.5
        text-sm
      "
      >{{props.label}}
    </label>
  </div>
</template>
