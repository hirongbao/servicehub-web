<template>
  <Modal v-model:visible="visible" title="站点资料与社媒名片" width="760px">
    <div v-if="loading" class="py-20 flex justify-center"><RefreshCw class="w-8 h-8 animate-spin text-zinc-300" /></div>
    <div v-else class="space-y-10 mt-4">
      
      <!-- 基础资料 -->
      <div>
        <h4 class="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 mb-4">基本资料</h4>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">全名 / 品牌名</label>
            <input v-model="profile.name" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" />
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">唯一标识 (Handle)</label>
            <input v-model="profile.handle" type="text" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" />
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">个人简介 (Bio)</label>
          <textarea v-model="profile.bio" rows="3" class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all resize-none"></textarea>
        </div>
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">头像链接 (Avatar URL)</label>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
              <img v-if="profile.avatarUrl" :src="profile.avatarUrl" class="w-full h-full object-cover" />
            </div>
            <input v-model="profile.avatarUrl" type="text" class="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all" />
          </div>
        </div>
        <div class="mt-4 text-right">
          <button @click="saveProfile" :disabled="saving" class="bg-zinc-900 text-white px-6 py-2.5 rounded-full text-xs font-bold tracking-wider hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-md">
            {{ saving ? '保存中...' : '保存基础资料' }}
          </button>
        </div>
      </div>

      <!-- 社媒名片 -->
      <div>
        <div class="flex items-center justify-between border-b border-zinc-100 pb-2 mb-4">
          <h4 class="text-sm font-bold text-zinc-900">社媒连接</h4>
          <button @click="addSocial" class="text-xs font-bold text-zinc-900 hover:text-zinc-600 transition-colors flex items-center gap-1">
            <Plus class="w-3.5 h-3.5" /> 新增名片
          </button>
        </div>
        
        <div class="space-y-3">
          <div v-for="(s, i) in socials" :key="i" class="flex items-center gap-3 bg-white p-3 rounded-2xl border border-zinc-200">
            <div class="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100">
              <Link2 class="w-4 h-4 text-zinc-400" />
            </div>
            <div class="flex-1 grid grid-cols-3 gap-3">
              <input v-model="s.platform" type="text" placeholder="平台" class="bg-zinc-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-zinc-900" />
              <input v-model="s.iconId" type="text" placeholder="图标ID (lucide)" class="bg-zinc-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-zinc-900" />
              <input v-model="s.url" type="text" placeholder="链接" class="bg-zinc-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-zinc-900" />
            </div>
            
            <div class="flex items-center gap-1 shrink-0 px-2">
              <button v-if="!s.id" @click="saveSocial(s, i)" class="w-7 h-7 rounded-md flex items-center justify-center bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors">
                <Check class="w-3.5 h-3.5" />
              </button>
              <button v-if="s.id" @click="toggleSocialStatus(s)" class="w-7 h-7 rounded-md flex items-center justify-center transition-colors" :class="s.status === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'">
                <Power class="w-3.5 h-3.5" />
              </button>
              <button @click="deleteSocial(s, i)" class="w-7 h-7 rounded-md flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import { Plus, RefreshCw, Link2, Check, Power, Trash2 } from 'lucide-vue-next';
import Modal from '../ui/Modal.vue';
import { request, showToast, showConfirm } from '../../store';

const visible = ref(false);
const loading = ref(false);
const saving = ref(false);

const profile = ref({ name: '', handle: '', bio: '', avatarUrl: '' });
const socials = ref([]);

const open = async () => {
  visible.value = true;
  loading.value = true;
  try {
    const d = await request('/api/site/profile');
    profile.value = d.profile || { name: '', handle: '', bio: '', avatarUrl: '' };
    socials.value = d.socials || [];
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  saving.value = true;
  try {
    await request('/api/site/profile', { method: 'POST', body: JSON.stringify(profile.value) });
    showToast('资料已保存', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    saving.value = false;
  }
};

const addSocial = () => socials.value.push({ platform: '', iconId: 'link-2', url: '' });

const saveSocial = async (s, index) => {
  if (!s.platform || !s.url) return showToast('请填写平台和链接', 'warning');
  try {
    const saved = await request('/api/site/socials', { method: 'POST', body: JSON.stringify(s) });
    socials.value[index] = saved;
    showToast('名片已添加', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
};

const toggleSocialStatus = async (s) => {
  try {
    const newStatus = s.status === 1 ? 0 : 1;
    await request(`/api/site/socials/${s.id}/status`, { method: 'POST', body: JSON.stringify({ status: newStatus }) });
    s.status = newStatus;
  } catch (e) { showToast(e.message, 'error'); }
};

const deleteSocial = async (s, index) => {
  if (!s.id) {
    socials.value.splice(index, 1);
    return;
  }
  try {
    await showConfirm('删除名片', '确认删除该社媒名片？');
    await request(`/api/site/socials/${s.id}`, { method: 'DELETE' });
    socials.value.splice(index, 1);
    showToast('已删除', 'success');
  } catch (e) {}
};

defineExpose({ open });
</script>
