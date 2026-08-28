<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loggedIn = ref(Boolean(localStorage.getItem('servicehub_token')))
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
  { id: 'tokens', label: '凭证', count: tokens.value.length },
  { id: 'links', label: '短链', count: links.value.length },
  { id: 'files', label: '图片', count: files.value.length }
])
const meta = computed(() => ({
  overview: { eyebrow: 'OVERVIEW', title: '概览', desc: '凭证与图片资源，尽在一处。' },
  tokens: { eyebrow: 'ACCESS KEYS', title: '访问凭证', desc: '创建和管理服务访问凭证，敏感值默认隐藏。' },
  links: { eyebrow: 'SHORT LINKS', title: '短链', desc: '把长链接变成好记的短地址，并统计访问。' },
  files: { eyebrow: 'MEDIA', title: '图片资源', desc: '支持 JPG、PNG、GIF、WEBP，单个文件最大 10MB。' }
})[activeView.value])
const linkExpired = l => l.expiresAt && new Date(l.expiresAt) <= new Date()
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
    await Promise.all([loadTokens(), loadFiles()])
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loginLoading.value = false
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
    ElMessage.success('文件已删除')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.message)
  }
}

// 切换后台内容视图
const selectView = v => {
  activeView.value = v
  if (v === 'files' || v === 'overview') loadFiles()
  if (v === 'overview' || v === 'tokens') loadTokens()
  if (v === 'links') loadLinks()
}

// 刷新当前视图数据，只请求该视图需要的列表
const refreshView = () => {
  if (activeView.value === 'files') return loadFiles()
  if (activeView.value === 'tokens') return loadTokens()
  if (activeView.value === 'links') return loadLinks()
  return Promise.all([loadTokens(), loadFiles()])
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
  if (loggedIn.value) Promise.all([loadTokens(), loadFiles()])
})
</script>

<template>
  <!-- 登录页 -->
  <main v-if="!loggedIn" class="login-page">
    <div class="login-card">
      <div class="login-brand"><span class="brand-mark">S</span><strong>ServiceHub</strong></div>
      <h1>欢迎回来</h1>
      <p class="login-sub">登录管理后台，管理你的访问凭证与图片资源。</p>
      <el-form @submit.prevent="login">
        <el-form-item label="管理员账号">
          <el-input v-model="username" autocomplete="username" size="large" placeholder="输入管理员账号" />
        </el-form-item>
        <el-form-item label="管理员密码">
          <el-input v-model="password" type="password" show-password autocomplete="current-password" size="large" placeholder="输入管理员密码" />
        </el-form-item>
        <div class="login-options">
          <el-checkbox v-model="rememberPwd">记住密码</el-checkbox>
        </div>
        <el-button type="primary" native-type="submit" :loading="loginLoading" size="large" class="login-btn">登 录</el-button>
      </el-form>
      <p class="login-foot">ServiceHub · Personal Console</p>
    </div>
  </main>

  <!-- 控制台 -->
  <main v-else class="console">
    <aside class="sidebar">
      <div class="sidebar-brand"><span class="brand-mark">S</span><strong>ServiceHub</strong></div>
      <nav class="sidebar-nav">
        <button v-for="item in navItems" :key="item.id" :class="{ active: activeView === item.id }" @click="selectView(item.id)">
          <span>{{ item.label }}</span>
          <small v-if="item.count">{{ item.count }}</small>
        </button>
      </nav>
      <div class="sidebar-foot">
        <div class="user-chip"><span class="avatar">{{ username.slice(0, 1).toUpperCase() }}</span><span>{{ username }}</span></div>
        <button class="logout-button" @click="logout">退出登录</button>
      </div>
    </aside>

    <section class="main">
      <header class="main-header">
        <div class="main-heading">
          <p class="eyebrow">{{ meta.eyebrow }}</p>
          <h1>{{ meta.title }}</h1>
          <p class="main-desc">{{ meta.desc }}</p>
        </div>
        <div class="view-actions">
          <button class="ghost-button" @click="refreshView">刷新</button>
          <button v-if="activeView === 'files'" class="primary-action" :disabled="fileUploading" @click="fileInput?.click()">
            {{ fileUploading ? '上传中…' : '上传图片' }}
          </button>
          <button v-else-if="activeView === 'tokens'" class="primary-action" @click="openCreateDialog">创建凭证</button>
          <button v-else-if="activeView === 'links'" class="primary-action" @click="openLinkDialog">创建短链</button>
          <input ref="fileInput" hidden type="file" accept="image/jpeg,image/png,image/gif,image/webp" @change="uploadFile" />
        </div>
      </header>

      <div class="main-body">
        <!-- 概览 -->
        <section v-if="activeView === 'overview'" class="overview">
          <div class="stat-grid">
            <button class="stat-card" @click="selectView('tokens')">
              <span class="stat-label">可用凭证</span>
              <strong class="stat-value">{{ activeTokens.length }}<small> / {{ tokens.length }}</small></strong>
              <span class="stat-hint">管理凭证 →</span>
            </button>
            <button class="stat-card" @click="selectView('files')">
              <span class="stat-label">云端图片</span>
              <strong class="stat-value">{{ files.length }}</strong>
              <span class="stat-hint">查看图片 →</span>
            </button>
            <div class="stat-card static">
              <span class="stat-label">服务状态</span>
              <strong class="stat-value status-ok"><i class="ok-dot" />运行正常</strong>
              <span class="stat-hint">ServiceHub API</span>
            </div>
          </div>
          <div class="panel">
            <div class="panel-head">
              <div>
                <h2>最近凭证</h2>
                <p>最新创建的访问凭证</p>
              </div>
              <button class="link-button" @click="selectView('tokens')">查看全部</button>
            </div>
            <div class="recent-list">
              <button v-for="t in tokens.slice(0, 5)" :key="t.id" class="recent-row" @click="selectView('tokens')">
                <span class="recent-name"><strong>{{ t.tokenName }}</strong><small>{{ formatExpiry(t.expiresAt) }}</small></span>
                <span :class="['status-pill', t.status === 1 && !isExpired(t) ? 'success' : 'muted']">{{ t.status !== 1 ? '已禁用' : isExpired(t) ? '已过期' : '启用' }}</span>
                <span class="recent-arrow">→</span>
              </button>
              <div v-if="!tokens.length" class="empty-state">
                <div class="empty-inner">
                  <span class="empty-icon">⌁</span>
                  <strong>还没有凭证</strong>
                  <p>创建第一条凭证，开始管理访问权限。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 凭证管理 -->
        <section v-else-if="activeView === 'tokens'" class="panel table-panel">
          <div class="panel-toolbar">
            <el-input v-model="tokenSearch" clearable placeholder="搜索凭证名称" />
            <el-select v-model="tokenFilter">
              <el-option label="全部状态" value="all" />
              <el-option label="可用" value="active" />
              <el-option label="已禁用" value="disabled" />
              <el-option label="已过期" value="expired" />
            </el-select>
          </div>
          <div class="token-head">
            <span>凭证名称</span><span>Token 值</span><span>有效期至</span><span>使用次数</span><span>操作</span>
          </div>
          <div v-loading="loading" class="token-list">
            <article v-for="t in filteredTokens" :key="t.id" class="token-row">
              <div class="token-name">
                <strong>{{ t.tokenName }}</strong>
                <span class="token-hub">{{ t.tokenType }}</span>
                <span :class="['status-pill', t.status === 1 && !isExpired(t) ? 'success' : 'muted']">{{ t.status !== 1 ? '已禁用' : isExpired(t) ? '已过期' : '启用' }}</span>
              </div>
              <div class="token-value">
                <code>{{ revealedTokens.has(t.id) ? t.tokenValue : maskToken(t.tokenValue) }}</code>
                <button @click="toggleReveal(t.id)">{{ revealedTokens.has(t.id) ? '隐藏' : '显示' }}</button>
                <button @click="copyToken(t.tokenValue)">复制</button>
              </div>
              <div class="token-expiry"><span :class="{ warn: isExpired(t) }">{{ formatExpiry(t.expiresAt) }}</span></div>
              <div class="token-usage">
                <strong>{{ t.usageCount ?? 0 }}</strong>
                <small>{{ t.lastUsedAt ? '最近 ' + formatExpiry(t.lastUsedAt) : '从未使用' }}</small>
              </div>
              <div class="row-actions">
                <button class="btn-quiet" @click="toggleToken(t)">{{ t.status === 1 ? '禁用' : '启用' }}</button>
                <button class="btn-danger" @click="deleteToken(t)">删除</button>
              </div>
            </article>
            <div v-if="!loading && !filteredTokens.length" class="empty-state">
              <div class="empty-inner">
                <span class="empty-icon">⌁</span>
                <strong>{{ tokenSearch || tokenFilter !== 'all' ? '没有匹配的凭证' : '还没有凭证' }}</strong>
                <p>{{ tokenSearch || tokenFilter !== 'all' ? '换个关键词或筛选条件试试。' : '点击右上角“创建凭证”，生成第一条访问凭证。' }}</p>
              </div>
            </div>
          </div>
          <footer class="panel-foot">
            <span>共 {{ filteredTokens.length }} 条凭证</span>
            <span>启用 {{ activeTokens.length }} · 禁用 {{ tokens.filter(t => t.status !== 1).length }} · 过期 {{ tokens.filter(t => isExpired(t)).length }}</span>
          </footer>
        </section>

        <!-- 短链管理 -->
        <section v-else-if="activeView === 'links'" class="panel table-panel">
          <div class="panel-toolbar">
            <el-input v-model="linkSearch" clearable placeholder="搜索短码、备注或目标链接" />
          </div>
          <div class="link-head">
            <span>短链</span><span>目标链接</span><span>点击</span><span>有效期至</span><span>操作</span>
          </div>
          <div v-loading="linkLoading" class="token-list">
            <article v-for="l in filteredLinks" :key="l.id" class="link-row">
              <div class="link-main">
                <div class="link-title">
                  <button class="link-code" :title="'点击复制 ' + shortUrl(l)" @click="copyText(shortUrl(l), '短链已复制')">{{ l.code }}</button>
                  <span :class="['status-pill', l.status === 1 && !linkExpired(l) ? 'success' : 'muted']">{{ l.status !== 1 ? '已禁用' : linkExpired(l) ? '已过期' : '启用' }}</span>
                </div>
                <small class="link-remark">{{ l.remark || '无备注' }}</small>
              </div>
              <div class="link-target" :title="l.targetUrl">{{ l.targetUrl }}</div>
              <button class="link-visits" title="查看访问统计" @click="showStats(l)">{{ l.visitCount ?? 0 }}</button>
              <div class="token-expiry"><span :class="{ warn: linkExpired(l) }">{{ formatExpiry(l.expiresAt) }}</span></div>
              <div class="row-actions">
                <button class="btn-quiet" @click="toggleLink(l)">{{ l.status === 1 ? '禁用' : '启用' }}</button>
                <button class="btn-danger" @click="deleteLink(l)">删除</button>
              </div>
            </article>
            <div v-if="!linkLoading && !filteredLinks.length" class="empty-state">
              <div class="empty-inner">
                <span class="empty-icon">/</span>
                <strong>还没有短链</strong>
                <p>点击右上角“创建短链”，把长链接变成短地址。</p>
              </div>
            </div>
          </div>
          <footer class="panel-foot">
            <span>共 {{ filteredLinks.length }} 条短链</span>
            <span>启用 {{ links.filter(l => l.status === 1 && !linkExpired(l)).length }} · 禁用 {{ links.filter(l => l.status !== 1).length }} · 过期 {{ links.filter(l => linkExpired(l)).length }}</span>
          </footer>
        </section>

        <!-- 图片资源 -->
        <section v-else class="panel files-panel">
          <div v-if="fileLoading" class="file-grid">
            <div v-for="i in 8" :key="i" class="file-skeleton" />
          </div>
          <div v-else-if="files.length" class="file-grid">
            <article v-for="f in files" :key="f.id" class="file-card">
              <a :href="f.fileUrl" target="_blank" rel="noreferrer" class="file-image"><img :src="f.fileUrl" :alt="f.originalName" /></a>
              <div class="file-meta">
                <strong :title="f.originalName">{{ f.originalName }}</strong>
                <div><small>{{ formatSize(f.fileSize) }}</small><button class="btn-danger" @click="deleteFile(f)">删除</button></div>
              </div>
            </article>
          </div>
          <div v-else class="empty-state">
            <div class="empty-inner">
              <span class="empty-icon">◻</span>
              <strong>还没有上传图片</strong>
              <p>点击右上角“上传图片”，支持 JPG、PNG、GIF、WEBP。</p>
            </div>
          </div>
        </section>
      </div>
    </section>

    <el-dialog v-model="tokenDialogVisible" title="新建 Token" width="440px">
      <el-form label-position="top" @submit.prevent="createToken">
        <el-form-item label="Token 名称">
          <el-input v-model="tokenName" placeholder="例如：图片服务、个人博客" />
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="tokenType" class="dialog-select">
            <el-option label="文件服务（FILEHUB）" value="FILEHUB" />
            <el-option label="短链服务（LINKHUB）" value="LINKHUB" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-select v-model="validDays" class="dialog-select">
            <el-option label="7 天" :value="7" />
            <el-option label="30 天" :value="30" />
            <el-option label="90 天" :value="90" />
            <el-option label="180 天" :value="180" />
            <el-option label="365 天" :value="365" />
            <el-option label="永不过期" :value="0" />
            <el-option label="自定义天数" value="custom" />
          </el-select>
        </el-form-item>
        <el-input-number v-if="validDays === 'custom'" v-model="customDays" :min="1" :max="3650" class="dialog-select" />
      </el-form>
      <template #footer>
        <el-button @click="tokenDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createToken">创建 Token</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="linkDialogVisible" title="创建短链" width="440px">
      <el-form label-position="top" @submit.prevent="createLink">
        <el-form-item label="目标链接">
          <el-input v-model="linkTarget" placeholder="https://example.com/very/long/url" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="linkRemark" placeholder="例如：博客首发文章" />
        </el-form-item>
        <el-form-item label="自定义短码（可选）">
          <el-input v-model="linkCode" placeholder="仅字母和数字，最长 16 位，留空自动生成" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-select v-model="linkValidDays" class="dialog-select">
            <el-option label="永不过期" :value="0" />
            <el-option label="7 天" :value="7" />
            <el-option label="30 天" :value="30" />
            <el-option label="90 天" :value="90" />
            <el-option label="365 天" :value="365" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createLink">创建短链</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="statsVisible" :title="`短链统计 · ${statsLink?.code || ''}`" width="520px">
      <div v-loading="statsLoading" class="stats-body">
        <div class="stats-total"><span>总点击</span><strong>{{ statsTotal }}</strong></div>
        <div v-if="statsDaily.length" class="stats-bars">
          <div v-for="d in statsDaily" :key="d.visitDate" class="stats-bar-item">
            <div class="stats-bar" :style="{ height: Math.max(Number(d.visits) / maxVisits * 100, 4) + '%' }" :title="`${d.visitDate} · ${d.visits} 次点击`" />
            <small>{{ d.visitDate.slice(5) }}</small>
          </div>
        </div>
        <p v-else-if="!statsLoading" class="stats-empty">还没有访问记录</p>
      </div>
    </el-dialog>
  </main>
</template>
