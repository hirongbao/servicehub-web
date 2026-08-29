<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loggedIn = ref(Boolean(localStorage.getItem('servicehub_token')))
const overview = ref(null)
const username = ref(localStorage.getItem('servicehub_username') || 'hirongbao')
const password = ref(localStorage.getItem('servicehub_password') || '')
const rememberPwd = ref(Boolean(localStorage.getItem('servicehub_password')))
const loginLoading = ref(false)
const tokens = ref([])
const files = ref([])
const activeView = ref('overview')
const tokenName = ref('')
const validDays = ref(30)
const tokenType = ref('FILEHUB')
const customDays = ref(180)
const tokenDialogVisible = ref(false)
const loading = ref(false)
const fileLoading = ref(false)
const fileUploading = ref(false)
const fileInput = ref(null)
const revealedTokens = ref(new Set())
const tokenSearch = ref('')
const tokenFilter = ref('all')
const links = ref([])
const linkLoading = ref(false)
const linkDialogVisible = ref(false)
const linkTarget = ref('')
const linkRemark = ref('')
const linkCode = ref('')
const linkValidDays = ref(0)
const linkSearch = ref('')
const statsVisible = ref(false)
const statsLoading = ref(false)
const statsLink = ref(null)
const statsTotal = ref(0)
const statsDaily = ref([])

const isExpired = t => t.expiresAt && new Date(t.expiresAt) <= new Date()
const activeTokens = computed(() => tokens.value.filter(t => t.status === 1 && !isExpired(t)))
const filteredTokens = computed(() => tokens.value.filter(t => {
  const s = tokenSearch.value.toLowerCase()
  const q = !s || t.tokenName.toLowerCase().includes(s)
  const f = tokenFilter.value === 'all' || (tokenFilter.value === 'active' ? t.status === 1 && !isExpired(t) : tokenFilter.value === 'expired' ? isExpired(t) : t.status !== 1)
  return q && f
}))
const navItems = computed(() => [
  { id: 'overview', label: '概览' },
  { id: 'tokens', label: '凭证', count: overview.value?.totalTokens ?? 0 },
  { id: 'links', label: '短链', count: overview.value?.totalLinks ?? 0 },
  { id: 'files', label: '图片', count: overview.value?.totalFiles ?? 0 }
])
const meta = computed(() => ({
  overview: { eyebrow: '服务概览', title: '概览', desc: '凭证、短链与图片资源，尽在一处。' },
  tokens: { eyebrow: '访问凭证', title: '访问凭证', desc: '创建和管理服务访问凭证，敏感值默认隐藏。' },
  links: { eyebrow: '短链服务', title: '短链', desc: '把长链接变成好记的短地址，并统计访问。' },
  files: { eyebrow: '图片资源', title: '图片资源', desc: '支持 JPG、PNG、GIF、WEBP，单个文件最大 10MB。' }
})[activeView.value])
const linkExpired = l => l.expiresAt && new Date(l.expiresAt) <= new Date()
const activeLinks = computed(() => links.value.filter(l => l.status === 1 && !linkExpired(l)))
const filteredLinks = computed(() => links.value.filter(l => {
  const s = linkSearch.value.toLowerCase()
  return !s || l.code.toLowerCase().includes(s) || (l.remark || '').toLowerCase().includes(s) || l.targetUrl.toLowerCase().includes(s)
}))
const shortUrl = l => `${location.origin}/s/${l.code}`
const maxVisits = computed(() => Math.max(...statsDaily.value.map(d => Number(d.visits)), 1))

// 调用后端接口，统一携带登录凭证并在失效时登出
const request = async (url, options = {}) => {
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) }
  const token = localStorage.getItem('servicehub_token')
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(url, { ...options, headers })
  const d = await r.json().catch(() => ({ message: '服务响应格式错误' }))
  if (r.status === 401) {
    localStorage.removeItem('servicehub_token')
    loggedIn.value = false
    tokens.value = []
    files.value = []
    throw Error('登录状态已失效，请重新登录')
  }
  if (!r.ok || d.code !== 0) throw Error(d.message || '请求失败')
  return d.data
}

// 登录管理后台，按勾选决定是否记住密码
const login = async () => {
  loginLoading.value = true
  try {
    const d = await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ username: username.value, password: password.value }) })
    localStorage.setItem('servicehub_username', username.value)
    if (rememberPwd.value) localStorage.setItem('servicehub_password', password.value)
    else localStorage.removeItem('servicehub_password')
    localStorage.setItem('servicehub_token', d.token)
    loggedIn.value = true
    password.value = ''
    await loadOverview()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loginLoading.value = false
  }
}

// 加载概览聚合统计
const loadOverview = async () => {
  try {
    overview.value = await request('/api/overview')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

// 加载 Token 列表
const loadTokens = async () => {
  loading.value = true
  try {
    tokens.value = await request('/api/tokens')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

// 加载文件列表
const loadFiles = async () => {
  fileLoading.value = true
  try {
    files.value = await request('/api/files')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    fileLoading.value = false
  }
}

// 上传图片文件
const uploadFile = async (e) => {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  const b = new FormData()
  b.append('file', f)
  fileUploading.value = true
  try {
    const r = await request('/api/files/upload', { method: 'POST', body: b })
    const duplicated = files.value.some(f => f.id === r.id)
    await loadFiles()
    loadOverview()
    ElMessage.success(duplicated ? '图片内容重复，已返回原文件' : '图片上传成功')
  } catch (x) {
    ElMessage.error(x.message)
  } finally {
    fileUploading.value = false
  }
}

// 删除图片文件
const deleteFile = async (f) => {
  try {
    await ElMessageBox.confirm(`确定删除“${f.originalName}”吗？`, '确认删除', { type: 'warning' })
    await request(`/api/files/${f.id}`, { method: 'DELETE' })
    await loadFiles()
    loadOverview()
    ElMessage.success('文件已删除')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.message)
  }
}

// 切换后台内容视图，按需加载对应数据
const selectView = v => {
  activeView.value = v
  if (v === 'overview') loadOverview()
  if (v === 'files') loadFiles()
  if (v === 'tokens') loadTokens()
  if (v === 'links') loadLinks()
}

// 刷新当前视图数据
const refreshView = () => {
  if (activeView.value === 'overview') return loadOverview()
  if (activeView.value === 'files') return loadFiles()
  if (activeView.value === 'tokens') return loadTokens()
  return loadLinks()
}

// 打开创建 Token 对话框
const openCreateDialog = () => {
  tokenName.value = ''
  validDays.value = 30
  tokenType.value = 'FILEHUB'
  customDays.value = 180
  tokenDialogVisible.value = true
}

// 创建服务 Token
const createToken = async () => {
  if (!tokenName.value.trim()) return ElMessage.warning('请输入 Token 名称')
  const days = validDays.value === 'custom' ? Number(customDays.value) : Number(validDays.value)
  if (validDays.value === 'custom' && (!Number.isInteger(days) || days < 1 || days > 3650)) return ElMessage.warning('自定义有效期需为 1～3650 天')
  try {
    await request('/api/tokens', { method: 'POST', body: JSON.stringify({ tokenName: tokenName.value.trim(), tokenType: tokenType.value, validDays: days }) })
    tokenDialogVisible.value = false
    await loadTokens()
    loadOverview()
    ElMessage.success('Token 创建成功')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const formatExpiry = v => v ? new Date(v).toLocaleString('zh-CN', { hour12: false }) : '永不过期'
const formatSize = v => {
  if (!v) return '0 KB'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(v) / Math.log(1024)), 3)
  return `${(v / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`
}
const maskToken = v => v && v.length > 14 ? `${v.slice(0, 6)}****${v.slice(-8)}` : '••••••••'

// 切换 Token 明文显示状态
const toggleReveal = id => {
  const n = new Set(revealedTokens.value)
  n.has(id) ? n.delete(id) : n.add(id)
  revealedTokens.value = n
}

// 加载短链列表
const loadLinks = async () => {
  linkLoading.value = true
  try {
    links.value = await request('/api/links')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    linkLoading.value = false
  }
}

// 打开创建短链对话框
const openLinkDialog = () => {
  linkTarget.value = ''
  linkRemark.value = ''
  linkCode.value = ''
  linkValidDays.value = 0
  linkDialogVisible.value = true
}

// 创建短链
const createLink = async () => {
  if (!linkTarget.value.trim()) return ElMessage.warning('请输入目标链接')
  try {
    const d = await request('/api/links', { method: 'POST', body: JSON.stringify({
      targetUrl: linkTarget.value.trim(),
      code: linkCode.value.trim() || undefined,
      remark: linkRemark.value.trim() || undefined,
      validDays: Number(linkValidDays.value)
    }) })
    linkDialogVisible.value = false
    await loadLinks()
    loadOverview()
    ElMessage.success(`短链创建成功：${shortUrl(d)}`)
    copyText(shortUrl(d))
  } catch (e) {
    ElMessage.error(e.message)
  }
}

// 切换短链启用状态
const toggleLink = async l => {
  try {
    await request(`/api/links/${l.id}/status`, { method: 'POST', body: JSON.stringify({ status: l.status === 1 ? 0 : 1 }) })
    await loadLinks()
    loadOverview()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

// 删除短链
const deleteLink = async l => {
  try {
    await ElMessageBox.confirm(`确定删除短链“${l.remark || l.code}”吗？访问记录将一并删除。`, '确认删除', { type: 'warning' })
    await request(`/api/links/${l.id}`, { method: 'DELETE' })
    await loadLinks()
    loadOverview()
    ElMessage.success('短链已删除')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.message)
  }
}

// 查看短链访问统计
const showStats = async l => {
  statsLink.value = l
  statsTotal.value = 0
  statsDaily.value = []
  statsVisible.value = true
  statsLoading.value = true
  try {
    const s = await request(`/api/links/${l.id}/stats`)
    statsTotal.value = s.total
    statsDaily.value = s.daily
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    statsLoading.value = false
  }
}

// 复制文本到剪贴板
const copyText = async (v, tip = '已复制') => {
  try {
    await navigator.clipboard.writeText(v)
    ElMessage.success(tip)
  } catch (_) {
    ElMessage.error('复制失败')
  }
}

// 复制完整 Token 到剪贴板
const copyToken = async v => copyText(v, 'Token 已复制')

// 切换服务 Token 启用状态
const toggleToken = async t => {
  try {
    await request(`/api/tokens/${t.id}/status`, { method: 'POST', body: JSON.stringify({ status: t.status === 1 ? 0 : 1 }) })
    await loadTokens()
    loadOverview()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

// 删除服务 Token
const deleteToken = async t => {
  try {
    await ElMessageBox.confirm(`确定删除 Token“${t.tokenName}”吗？`, '确认删除', { type: 'warning' })
    await request(`/api/tokens/${t.id}`, { method: 'DELETE' })
    await loadTokens()
    loadOverview()
    ElMessage.success('Token 已删除')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.message)
  }
}

// 注销管理后台，退出后回填记住的密码
const logout = async () => {
  try {
    await request('/api/admin/logout', { method: 'POST' })
  } catch (_) {}
  localStorage.removeItem('servicehub_token')
  loggedIn.value = false
  tokens.value = []
  files.value = []
  password.value = localStorage.getItem('servicehub_password') || ''
}

onMounted(() => {
  if (loggedIn.value) loadOverview()
})
</script>

<template>
  <!-- 背景装饰元素 -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-neutral-50">
    <div class="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-orange-100/40 to-rose-100/20 blur-3xl opacity-50"></div>
    <div class="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-blue-50/60 to-cyan-50/30 blur-3xl opacity-50"></div>
  </div>

  <!-- 登录页 -->
  <main v-if="!loggedIn" class="relative z-10 flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-md rounded-[24px] bg-white/70 px-10 py-12 backdrop-blur-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-white">
      <div class="mb-10 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-md mb-6">
          <span class="text-2xl font-bold font-serif italic">S</span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 mb-2">欢迎回来</h1>
        <p class="text-sm text-neutral-500">登录管理后台，管理你的服务与资源。</p>
      </div>

      <form @submit.prevent="login" class="space-y-5">
        <div>
          <label class="mb-1.5 block text-xs font-bold tracking-wider text-neutral-500">管理员账号</label>
          <input v-model="username" type="text" required class="w-full rounded-xl border border-neutral-200 bg-white/50 px-4 py-3 text-sm outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900" placeholder="输入管理员账号" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-bold tracking-wider text-neutral-500">管理员密码</label>
          <input v-model="password" type="password" required class="w-full rounded-xl border border-neutral-200 bg-white/50 px-4 py-3 text-sm outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900" placeholder="••••••••" />
        </div>
        <div class="flex items-center pt-2 pb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="rememberPwd" class="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer" />
            <span class="text-sm text-neutral-600 font-medium">记住密码</span>
          </label>
        </div>
        <button type="submit" :disabled="loginLoading" class="w-full rounded-xl bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12">
          <span v-if="loginLoading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span v-else>登 录</span>
        </button>
      </form>
    </div>
  </main>

  <!-- 控制台 -->
  <main v-else class="relative z-10 flex h-screen w-full flex-col items-center px-4 sm:px-6 lg:px-8 py-6">
    <!-- 悬浮顶栏 -->
    <header class="w-full max-w-[1200px] flex items-center justify-between rounded-[20px] bg-white/80 px-6 py-4 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-white mb-6 shrink-0 z-20">
      <div class="flex items-center gap-8">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-sm">
            <span class="text-lg font-bold font-serif italic">S</span>
          </div>
          <strong class="text-sm font-bold tracking-tight text-neutral-900">ServiceHub</strong>
        </div>
        <nav class="hidden md:flex items-center gap-1 bg-neutral-100/50 p-1 rounded-xl border border-neutral-200/50">
          <button v-for="item in navItems" :key="item.id" @click="selectView(item.id)" :class="['relative px-4 py-1.5 text-sm font-medium transition-all rounded-lg flex items-center gap-2', activeView === item.id ? 'text-neutral-900 bg-white shadow-sm border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/30 border border-transparent']">
            {{ item.label }}
            <span v-if="item.count" :class="['text-[10px] px-1.5 py-0.5 rounded-md font-mono', activeView === item.id ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-200/50 text-neutral-400']">{{ item.count }}</span>
          </button>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-neutral-100/50 border border-neutral-200/50">
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-300/50 text-neutral-700 text-xs font-bold">{{ username.charAt(0).toUpperCase() }}</div>
          <span class="text-xs font-semibold text-neutral-700 pr-1">{{ username }}</span>
        </div>
        <button @click="logout" class="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors">退出登录</button>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="w-full max-w-[1200px] flex-1 flex flex-col bg-white rounded-[32px] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)] border border-neutral-200/60 overflow-hidden relative z-10">
      <!-- 页头 -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-10 pt-10 pb-8 shrink-0 bg-white z-10 relative border-b border-neutral-100">
        <div>
          <p class="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 mb-3">{{ meta.eyebrow }}</p>
          <h2 class="text-3xl font-bold tracking-tight text-neutral-900 mb-2">{{ meta.title }}</h2>
          <p class="text-sm text-neutral-500">{{ meta.desc }}</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="refreshView" class="h-10 px-4 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors bg-white">刷新</button>

          <button v-if="activeView === 'files'" :disabled="fileUploading" @click="fileInput?.click()" class="h-10 px-5 rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50">
            {{ fileUploading ? '上传中…' : '上传图片' }}
          </button>
          <button v-else-if="activeView === 'tokens'" @click="openCreateDialog" class="h-10 px-5 rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 transition-colors shadow-sm">
            创建凭证
          </button>
          <button v-else-if="activeView === 'links'" @click="openLinkDialog" class="h-10 px-5 rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 transition-colors shadow-sm">
            创建短链
          </button>
          <input ref="fileInput" hidden type="file" accept="image/jpeg,image/png,image/gif,image/webp" @change="uploadFile" />
        </div>
      </div>

      <!-- 可滚动内容区 -->
      <div class="flex-1 overflow-auto bg-neutral-50/30 p-10">
        
        <!-- 概览 -->
        <div v-if="activeView === 'overview'" class="space-y-8 animate-[rise_0.4s_ease-out]">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <button @click="selectView('tokens')" class="group flex flex-col items-start p-6 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/5 transition-all text-left">
              <span class="text-[11px] font-bold tracking-wider text-neutral-500 mb-4">可用凭证</span>
              <div class="flex items-baseline gap-2 mb-2">
                <span class="text-4xl font-bold tracking-tighter text-neutral-900">{{ overview?.activeTokens ?? '—' }}</span>
                <span class="text-sm font-medium text-neutral-400">/ {{ overview?.totalTokens ?? '—' }}</span>
              </div>
              <span class="text-[11px] font-medium text-neutral-400 group-hover:text-neutral-900 transition-colors">管理凭证 &rarr;</span>
            </button>
            <button @click="selectView('links')" class="group flex flex-col items-start p-6 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/5 transition-all text-left">
              <span class="text-[11px] font-bold tracking-wider text-neutral-500 mb-4">活跃短链</span>
              <div class="flex items-baseline gap-2 mb-2">
                <span class="text-4xl font-bold tracking-tighter text-neutral-900">{{ overview?.activeLinks ?? '—' }}</span>
                <span class="text-sm font-medium text-neutral-400">/ {{ overview?.totalLinks ?? '—' }}</span>
              </div>
              <span class="text-[11px] font-medium text-neutral-400 group-hover:text-neutral-900 transition-colors">管理短链 &rarr;</span>
            </button>
            <button @click="selectView('files')" class="group flex flex-col items-start p-6 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/5 transition-all text-left">
              <span class="text-[11px] font-bold tracking-wider text-neutral-500 mb-4">云端图片</span>
              <div class="flex items-baseline gap-2 mb-2">
                <span class="text-4xl font-bold tracking-tighter text-neutral-900">{{ overview?.totalFiles ?? '—' }}</span>
              </div>
              <span class="text-[11px] font-medium text-neutral-400 group-hover:text-neutral-900 transition-colors">查看图片 &rarr;</span>
            </button>
            <div class="flex flex-col items-start p-6 rounded-2xl border border-neutral-200 bg-neutral-900 text-white shadow-md">
              <span class="text-[11px] font-bold tracking-wider text-neutral-400 mb-4">服务状态</span>
              <div class="flex items-center gap-3 mb-3 h-[40px]">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span class="text-lg font-semibold tracking-tight text-white">运行正常</span>
              </div>
              <span class="text-[11px] font-medium text-neutral-400 mt-auto">ServiceHub API 连接正常</span>
            </div>
          </div>

          <div class="rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
            <div class="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <div>
                <h3 class="text-sm font-bold text-neutral-900">最近凭证</h3>
                <p class="text-xs text-neutral-500 mt-0.5">最新创建的访问凭证</p>
              </div>
              <button @click="selectView('tokens')" class="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">查看全部 &rarr;</button>
            </div>
            <div class="divide-y divide-neutral-100 bg-white">
              <button v-for="t in overview?.recentTokens || []" :key="t.tokenName + t.createdAt" @click="selectView('tokens')" class="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors text-left group">
                <div>
                  <strong class="block text-sm font-semibold text-neutral-900 mb-1">{{ t.tokenName }}</strong>
                  <span class="text-[11px] font-mono text-neutral-400">{{ formatExpiry(t.expiresAt) }}</span>
                </div>
                <div class="flex items-center gap-4">
                  <span :class="['px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide', t.active ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-neutral-50 border border-neutral-200 text-neutral-500']">{{ t.active ? '启用' : '不可用' }}</span>
                  <span class="text-neutral-300 group-hover:text-neutral-900 transition-colors">&rarr;</span>
                </div>
              </button>
              <div v-if="!overview?.recentTokens?.length" class="px-6 py-12 text-center">
                <div class="mx-auto h-12 w-12 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300 mb-3"><span class="text-xl">⌁</span></div>
                <h4 class="text-sm font-semibold text-neutral-900">还没有凭证</h4>
                <p class="text-xs text-neutral-500 mt-1">创建第一条凭证，开始管理访问权限。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 凭证管理 -->
        <div v-else-if="activeView === 'tokens'" class="flex flex-col h-full animate-[rise_0.4s_ease-out]">
          <div class="flex items-center gap-4 mb-6">
            <input v-model="tokenSearch" type="text" placeholder="搜索凭证名称..." class="w-64 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm outline-none transition-all focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-sm" />
            <select v-model="tokenFilter" class="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm outline-none transition-all focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 cursor-pointer shadow-sm">
              <option value="all">全部状态</option>
              <option value="active">可用</option>
              <option value="disabled">已禁用</option>
              <option value="expired">已过期</option>
            </select>
          </div>
          
          <div class="flex-1 rounded-2xl border border-neutral-200 overflow-hidden flex flex-col bg-white shadow-sm">
            <div class="grid grid-cols-[1fr_1.5fr_1fr_100px_140px] gap-4 px-6 py-3 bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-bold tracking-wider text-neutral-500">
              <span>凭证名称</span>
              <span>Token 值</span>
              <span>有效期至</span>
              <span>使用次数</span>
              <span class="text-right">操作</span>
            </div>
            <div v-loading="loading" class="flex-1 overflow-auto divide-y divide-neutral-100">
              <div v-for="t in filteredTokens" :key="t.id" class="grid grid-cols-[1fr_1.5fr_1fr_100px_140px] gap-4 px-6 py-4 items-center hover:bg-neutral-50/50 transition-colors">
                <div class="min-w-0 pr-4">
                  <strong class="block text-sm font-semibold text-neutral-900 truncate mb-1">{{ t.tokenName }}</strong>
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded border border-neutral-200 text-[10px] font-mono text-neutral-500 bg-neutral-50">{{ t.tokenType }}</span>
                    <span :class="['w-1.5 h-1.5 rounded-full ring-2', t.status === 1 && !isExpired(t) ? 'bg-emerald-500 ring-emerald-100' : 'bg-neutral-300 ring-neutral-100']"></span>
                  </div>
                </div>
                <div class="flex items-center min-w-0 pr-4 gap-2">
                  <code class="flex-1 min-w-0 truncate px-2.5 py-1.5 rounded-lg bg-neutral-50 text-[11px] font-mono text-neutral-700 border border-neutral-200/60">{{ revealedTokens.has(t.id) ? t.tokenValue : maskToken(t.tokenValue) }}</code>
                  <button @click="toggleReveal(t.id)" class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors shrink-0">{{ revealedTokens.has(t.id) ? '隐藏' : '显示' }}</button>
                  <button @click="copyToken(t.tokenValue)" class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors shrink-0">复制</button>
                </div>
                <div class="min-w-0">
                  <span :class="['text-xs font-mono truncate block', isExpired(t) ? 'text-red-500 font-medium' : 'text-neutral-600']">{{ formatExpiry(t.expiresAt) }}</span>
                </div>
                <div>
                  <strong class="block text-sm font-semibold text-neutral-900">{{ t.usageCount ?? 0 }}</strong>
                  <span class="text-[10px] text-neutral-400 block truncate">{{ t.lastUsedAt ? '最近 ' + formatExpiry(t.lastUsedAt).split(' ')[0] : '从未使用' }}</span>
                </div>
                <div class="flex items-center justify-end gap-2 shrink-0">
                  <button @click="toggleToken(t)" class="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-all bg-white">{{ t.status === 1 ? '禁用' : '启用' }}</button>
                  <button @click="deleteToken(t)" class="px-3 py-1.5 rounded-lg border border-red-100 text-xs font-medium text-red-600 hover:bg-red-50 transition-all bg-white">删除</button>
                </div>
              </div>
              <div v-if="!loading && !filteredTokens.length" class="flex flex-col items-center justify-center py-20 text-center px-4">
                <div class="h-12 w-12 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300 mb-4 border border-neutral-100"><span class="text-xl">⌁</span></div>
                <h4 class="text-sm font-semibold text-neutral-900">{{ tokenSearch || tokenFilter !== 'all' ? '没有匹配的凭证' : '还没有凭证' }}</h4>
                <p class="text-xs text-neutral-500 mt-1 max-w-sm">{{ tokenSearch || tokenFilter !== 'all' ? '换个关键词或筛选条件试试。' : '点击右上角“创建凭证”，生成第一条访问凭证。' }}</p>
              </div>
            </div>
            <div class="px-6 py-3 bg-neutral-50/80 border-t border-neutral-200 text-[11px] font-bold tracking-wider text-neutral-500 flex justify-between items-center">
              <span>共 {{ filteredTokens.length }} 条凭证</span>
              <span>启用 {{ activeTokens.length }} · 禁用 {{ tokens.filter(t => t.status !== 1).length }} · 过期 {{ tokens.filter(t => isExpired(t)).length }}</span>
            </div>
          </div>
        </div>

        <!-- 短链管理 -->
        <div v-else-if="activeView === 'links'" class="flex flex-col h-full animate-[rise_0.4s_ease-out]">
          <div class="flex items-center gap-4 mb-6">
            <input v-model="linkSearch" type="text" placeholder="搜索短码、备注或目标链接..." class="w-72 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm outline-none transition-all focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-sm" />
          </div>
          
          <div class="flex-1 rounded-2xl border border-neutral-200 overflow-hidden flex flex-col bg-white shadow-sm">
            <div class="grid grid-cols-[1.5fr_2fr_80px_1fr_140px] gap-4 px-6 py-3 bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-bold tracking-wider text-neutral-500">
              <span>短链</span>
              <span>目标链接</span>
              <span>点击</span>
              <span>有效期至</span>
              <span class="text-right">操作</span>
            </div>
            <div v-loading="linkLoading" class="flex-1 overflow-auto divide-y divide-neutral-100">
              <div v-for="l in filteredLinks" :key="l.id" class="grid grid-cols-[1.5fr_2fr_80px_1fr_140px] gap-4 px-6 py-4 items-center hover:bg-neutral-50/50 transition-colors">
                <div class="min-w-0 pr-4">
                  <div class="flex items-center gap-2 mb-1">
                    <button @click="copyText(shortUrl(l), '已复制')" class="text-sm font-semibold text-neutral-900 hover:text-neutral-500 transition-colors truncate text-left underline decoration-neutral-200 underline-offset-4">{{ l.code }}</button>
                    <span :class="['w-1.5 h-1.5 rounded-full ring-2 shrink-0', l.status === 1 && !linkExpired(l) ? 'bg-emerald-500 ring-emerald-100' : 'bg-neutral-300 ring-neutral-100']"></span>
                  </div>
                  <span class="text-[11px] text-neutral-500 block truncate">{{ l.remark || '无备注' }}</span>
                </div>
                <div class="min-w-0 pr-4">
                  <span class="text-xs text-neutral-600 block truncate" :title="l.targetUrl">{{ l.targetUrl }}</span>
                </div>
                <div>
                  <button @click="showStats(l)" class="text-sm font-bold text-neutral-900 hover:text-neutral-500 transition-colors underline decoration-neutral-200 underline-offset-4">{{ l.visitCount ?? 0 }}</button>
                </div>
                <div class="min-w-0">
                  <span :class="['text-xs font-mono truncate block', linkExpired(l) ? 'text-red-500 font-medium' : 'text-neutral-600']">{{ formatExpiry(l.expiresAt) }}</span>
                </div>
                <div class="flex items-center justify-end gap-2 shrink-0">
                  <button @click="toggleLink(l)" class="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-all bg-white">{{ l.status === 1 ? '禁用' : '启用' }}</button>
                  <button @click="deleteLink(l)" class="px-3 py-1.5 rounded-lg border border-red-100 text-xs font-medium text-red-600 hover:bg-red-50 transition-all bg-white">删除</button>
                </div>
              </div>
              <div v-if="!linkLoading && !filteredLinks.length" class="flex flex-col items-center justify-center py-20 text-center px-4">
                <div class="h-12 w-12 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300 mb-4 border border-neutral-100"><span class="text-xl">/</span></div>
                <h4 class="text-sm font-semibold text-neutral-900">还没有短链</h4>
                <p class="text-xs text-neutral-500 mt-1 max-w-sm">点击右上角“创建短链”，把长链接变成短地址。</p>
              </div>
            </div>
            <div class="px-6 py-3 bg-neutral-50/80 border-t border-neutral-200 text-[11px] font-bold tracking-wider text-neutral-500 flex justify-between items-center">
              <span>共 {{ filteredLinks.length }} 条短链</span>
              <span>启用 {{ links.filter(l => l.status === 1 && !linkExpired(l)).length }} · 禁用 {{ links.filter(l => l.status !== 1).length }} · 过期 {{ links.filter(l => linkExpired(l)).length }}</span>
            </div>
          </div>
        </div>

        <!-- 图片资源 -->
        <div v-else class="animate-[rise_0.4s_ease-out]">
          <div v-if="fileLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div v-for="i in 10" :key="i" class="aspect-[4/3] rounded-2xl bg-neutral-100 animate-pulse border border-neutral-200/60"></div>
          </div>
          <div v-else-if="files.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <article v-for="f in files" :key="f.id" class="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-neutral-300 transition-all duration-300">
              <a :href="f.fileUrl" target="_blank" rel="noreferrer" class="relative block aspect-[4/3] w-full overflow-hidden bg-neutral-50">
                <img :src="f.fileUrl" :alt="f.originalName" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
              </a>
              <div class="p-4 bg-white z-10 relative">
                <strong class="block truncate text-xs font-semibold text-neutral-900 mb-2" :title="f.originalName">{{ f.originalName }}</strong>
                <div class="flex items-center justify-between mt-auto">
                  <span class="text-[10px] font-mono font-medium text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{{ formatSize(f.fileSize) }}</span>
                  <button @click="deleteFile(f)" class="opacity-0 group-hover:opacity-100 px-2 py-1 rounded text-[10px] font-bold tracking-wider text-red-500 hover:bg-red-50 transition-all">删除</button>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-32 text-center px-4 border border-dashed border-neutral-200 rounded-[24px] bg-white shadow-sm">
            <div class="h-16 w-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300 mb-6 shadow-sm border border-neutral-100"><span class="text-2xl">🖼️</span></div>
            <h4 class="text-base font-bold text-neutral-900">还没有上传图片</h4>
            <p class="text-sm text-neutral-500 mt-2 max-w-sm mb-6">上传图片，集中托管与管理。支持 JPG、PNG、GIF、WEBP。</p>
            <button @click="fileInput?.click()" class="h-10 px-6 rounded-xl bg-white border border-neutral-200 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 shadow-sm transition-all">选择图片</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="tokenDialogVisible" title="新建 Token" width="440px" custom-class="custom-dialog">
      <el-form label-position="top" @submit.prevent="createToken">
        <el-form-item label="Token 名称">
          <el-input v-model="tokenName" placeholder="例如：图片服务、个人博客" size="large" />
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="tokenType" class="w-full" size="large">
            <el-option label="文件服务（FILEHUB）" value="FILEHUB" />
            <el-option label="短链服务（LINKHUB）" value="LINKHUB" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-select v-model="validDays" class="w-full" size="large">
            <el-option label="7 天" :value="7" />
            <el-option label="30 天" :value="30" />
            <el-option label="90 天" :value="90" />
            <el-option label="180 天" :value="180" />
            <el-option label="365 天" :value="365" />
            <el-option label="永不过期" :value="0" />
            <el-option label="自定义天数" value="custom" />
          </el-select>
        </el-form-item>
        <el-input-number v-if="validDays === 'custom'" v-model="customDays" :min="1" :max="3650" class="w-full" size="large" />
      </el-form>
      <template #footer>
        <el-button @click="tokenDialogVisible = false" size="large">取消</el-button>
        <el-button type="primary" @click="createToken" size="large">创建 Token</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="linkDialogVisible" title="创建短链" width="440px" custom-class="custom-dialog">
      <el-form label-position="top" @submit.prevent="createLink">
        <el-form-item label="目标链接">
          <el-input v-model="linkTarget" placeholder="https://example.com/very/long/url" size="large" />
        </el-form-item>
        <el-form-item label="备注（可选）">
          <el-input v-model="linkRemark" placeholder="例如：博客首发文章" size="large" />
        </el-form-item>
        <el-form-item label="自定义短码（可选）">
          <el-input v-model="linkCode" placeholder="仅字母和数字，最长 16 位，留空自动生成" size="large" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-select v-model="linkValidDays" class="w-full" size="large">
            <el-option label="永不过期" :value="0" />
            <el-option label="7 天" :value="7" />
            <el-option label="30 天" :value="30" />
            <el-option label="90 天" :value="90" />
            <el-option label="365 天" :value="365" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkDialogVisible = false" size="large">取消</el-button>
        <el-button type="primary" @click="createLink" size="large">创建短链</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statsVisible" :title="`短链统计 · ${statsLink?.code || ''}`" width="520px" custom-class="custom-dialog">
      <div v-loading="statsLoading" class="min-h-[220px]">
        <div class="flex items-baseline gap-3 mb-6">
          <span class="text-sm font-semibold tracking-wider text-neutral-400">总点击</span>
          <strong class="text-4xl font-bold tracking-tight text-neutral-900">{{ statsTotal }}</strong>
        </div>
        <div v-if="statsDaily.length" class="flex items-end gap-2 h-40 pt-4 border-b border-neutral-100">
          <div v-for="d in statsDaily" :key="d.visitDate" class="flex-1 flex flex-col items-center justify-end gap-2 h-full group relative">
            <div class="w-full rounded-t-md bg-neutral-200 transition-all group-hover:bg-neutral-800" :style="{ height: Math.max(Number(d.visits) / maxVisits * 100, 4) + '%' }"></div>
            <span class="text-[10px] font-mono text-neutral-400">{{ d.visitDate.slice(5) }}</span>
            <div class="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-neutral-900 text-white text-[10px] py-1 px-2 rounded font-mono shadow-lg z-10 pointer-events-none whitespace-nowrap">
              {{ d.visits }} 次点击
            </div>
          </div>
        </div>
        <div v-else-if="!statsLoading" class="h-40 flex items-center justify-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 mt-4">
          <p class="text-sm text-neutral-500 font-medium">还没有访问记录</p>
        </div>
      </div>
    </el-dialog>
  </main>
</template>
