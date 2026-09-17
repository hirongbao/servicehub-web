<template>
  <div class="relative select-none" ref="selectRef" v-click-outside="close">
    <div 
      @click="toggle"
      :class="[
        'w-full flex items-center justify-between border rounded-xl cursor-pointer transition-colors',
        size === 'sm' ? 'px-3 py-1.5 text-xs bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100/80' : 'px-4 py-3 text-sm bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100/80',
        isOpen ? 'ring-2 ring-zinc-900 border-zinc-900 bg-white' : '',
        buttonClass
      ]"
    >
      <span class="font-medium truncate" :class="(modelValue !== '' && modelValue !== null && modelValue !== undefined) ? 'text-zinc-900' : 'text-zinc-400'">
        {{ displayLabel || placeholder }}
      </span>
      <ChevronDown class="text-zinc-400 transition-transform ml-2 shrink-0" :class="[size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4', {'rotate-180': isOpen}]" />
    </div>

    <teleport to="body">
      <Transition name="dropdown">
        <div 
          v-if="isOpen" 
          :style="dropdownStyle"
          class="fixed z-[9999] bg-white border border-zinc-200/90 rounded-xl shadow-xl shadow-zinc-900/10 py-1.5 max-h-60 overflow-y-auto"
        >
          <div 
            v-for="opt in options" 
            :key="opt.value"
            @click.stop="select(opt)"
            :class="[
              'cursor-pointer flex items-center justify-between transition-colors mx-1.5 rounded-lg',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
              String(modelValue) === String(opt.value) ? 'bg-zinc-900 text-white font-medium' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            ]"
          >
            <span class="truncate">{{ opt.label }}</span>
            <Check v-if="String(modelValue) === String(opt.value)" :class="[size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4', 'shrink-0 ml-2']" />
          </div>
        </div>
      </Transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      // Check if click is outside the select component and not in the teleported dropdown
      const isOutside = !(el === event.target || el.contains(event.target));
      const dropdownEl = document.querySelector('.fixed.z-\\[9999\\]');
      const isOutsideDropdown = !dropdownEl || !(dropdownEl === event.target || dropdownEl.contains(event.target));
      
      if (isOutside && isOutsideDropdown) {
        binding.value();
      }
    };
    // Add with capture phase to prevent issues with teleported clicks
    document.body.addEventListener('click', el.clickOutsideEvent, true);
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent, true);
  }
};

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  size: { type: String, default: 'md' },
  buttonClass: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const selectRef = ref(null);
const dropdownStyle = ref({});

const displayLabel = computed(() => {
  const selected = props.options.find(o => String(o.value) === String(props.modelValue));
  return selected ? selected.label : '';
});

const updatePosition = () => {
  if (!selectRef.value || !isOpen.value) return;
  const rect = selectRef.value.getBoundingClientRect();
  dropdownStyle.value = {
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`
  };
};

const toggle = () => {
  if (isOpen.value) {
    close();
  } else {
    updatePosition();
    isOpen.value = true;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
  }
};

const close = () => {
  isOpen.value = false;
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
};

onUnmounted(() => {
  close();
});

const select = (opt) => {
  emit('update:modelValue', opt.value);
  emit('change', opt.value);
  close();
};
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }
</style>
