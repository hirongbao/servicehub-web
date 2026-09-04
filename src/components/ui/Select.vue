<template>
  <div class="relative" v-click-outside="close">
    <div 
      @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-100/80 transition-colors"
      :class="{'ring-2 ring-zinc-900 border-zinc-900 bg-white': isOpen}"
    >
      <span class="text-sm font-medium" :class="modelValue ? 'text-zinc-900' : 'text-zinc-400'">
        {{ displayLabel || placeholder }}
      </span>
      <ChevronDown class="w-4 h-4 text-zinc-400 transition-transform" :class="{'rotate-180': isOpen}" />
    </div>

    <Transition name="dropdown">
      <div v-if="isOpen" class="absolute z-50 w-full mt-2 bg-white border border-zinc-100 rounded-2xl shadow-xl shadow-zinc-200/50 py-2 max-h-60 overflow-y-auto">
        <div 
          v-for="opt in options" 
          :key="opt.value"
          @click="select(opt)"
          class="px-4 py-2.5 mx-2 rounded-xl cursor-pointer flex items-center justify-between text-sm transition-colors"
          :class="modelValue === opt.value ? 'bg-zinc-900 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-50 font-medium'"
        >
          <span>{{ opt.label }}</span>
          <Check v-if="modelValue === opt.value" class="w-4 h-4" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

// simple click outside directive inline
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el == event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent);
  }
};

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);

const displayLabel = computed(() => {
  const selected = props.options.find(o => o.value === props.modelValue);
  return selected ? selected.label : '';
});

const close = () => {
  isOpen.value = false;
};

const select = (opt) => {
  emit('update:modelValue', opt.value);
  emit('change', opt.value);
  close();
};
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-10px) scale(0.98); }
</style>
