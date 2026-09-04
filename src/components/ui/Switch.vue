<template>
  <button 
    type="button"
    @click="toggle"
    :class="[
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
      modelValue ? 'bg-zinc-900' : 'bg-zinc-200'
    ]"
  >
    <span class="sr-only">Toggle</span>
    <span 
      :class="[
        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        modelValue ? 'translate-x-5' : 'translate-x-0'
      ]" 
    />
  </button>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'change']);

const toggle = () => {
  emit('update:modelValue', !props.modelValue);
  emit('change', !props.modelValue);
};
</script>
