<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
    <button 
      @click="prev" 
      :disabled="modelValue <= 1"
      class="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition-all"
    >
      <ChevronLeft class="w-4 h-4" />
    </button>
    
    <div class="flex items-center gap-1 mx-2">
      <button 
        v-for="page in pages" 
        :key="page"
        @click="goTo(page)"
        :class="[
          'w-10 h-10 rounded-full text-sm font-bold font-mono transition-all flex items-center justify-center',
          modelValue === page 
            ? 'bg-zinc-900 text-white shadow-md' 
            : 'text-zinc-500 hover:bg-zinc-100'
        ]"
      >
        {{ page }}
      </button>
    </div>

    <button 
      @click="next" 
      :disabled="modelValue >= totalPages"
      class="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition-all"
    >
      <ChevronRight class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps({
  modelValue: { type: Number, required: true },
  total: { type: Number, required: true },
  pageSize: { type: Number, default: 12 }
});

const emit = defineEmits(['update:modelValue', 'change']);

const totalPages = computed(() => Math.ceil(props.total / props.pageSize));

const pages = computed(() => {
  const current = props.modelValue;
  const max = totalPages.value;
  const arr = [];
  // simple window of 5 pages
  let start = Math.max(1, current - 2);
  let end = Math.min(max, start + 4);
  if (end - start < 4) {
    start = Math.max(1, end - 4);
  }
  for (let i = start; i <= end; i++) {
    arr.push(i);
  }
  return arr;
});

const prev = () => {
  if (props.modelValue > 1) {
    emit('update:modelValue', props.modelValue - 1);
    emit('change', props.modelValue - 1);
  }
};

const next = () => {
  if (props.modelValue < totalPages.value) {
    emit('update:modelValue', props.modelValue + 1);
    emit('change', props.modelValue + 1);
  }
};

const goTo = (page) => {
  if (page !== props.modelValue) {
    emit('update:modelValue', page);
    emit('change', page);
  }
};
</script>
