<script setup lang="ts">
  const props = defineProps<{
    label: string,
    modelValue: string,
  }>();
  const emit = defineEmits(['update:modelValue']);

  function updateValue(e: Event) {
    emit("update:modelValue", (e.target as HTMLInputElement).value);
  }
</script>

<template>
    <div class="relative h-10 w-full min-w-[200px]">
    <input
      class="
        peer h-full w-full rounded-md border border-t-transparent bg-transparent px-3 py-2.5
        font-mono text-sm font-normal text-blue-gray-700 outline outline-0 transition-all
        focus:border-2 focus:border-blue-500 focus:border-t-transparent focus:outline-0
        disabled:border-0 disabled:bg-blue-gray-50
      "
      placeholder=""
      :value="props.modelValue"
      @input="updateValue"
    />
    <label
      class="
        before:content[' '] after:content[' '] pointer-events-none
        absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal
        leading-tight text-blue-gray-400 transition-all
        before:mt-[6.5px] before:mr-1 before:w-2.5 before:rounded-tl-md before:border-t before:border-l
        before:border-blue-gray-200 before:transition-all
        after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5
        after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200
        after:transition-all
        peer-focus:leading-tight peer-focus:text-blue-500
        peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-blue-500
        peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-blue-500
      "
    >{{props.label}}</label>
    </div>
</template>
