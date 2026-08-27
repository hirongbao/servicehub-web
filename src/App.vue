<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loggedIn = ref(Boolean(localStorage.getItem('servicehub_token')))
const username = ref('hirongbao')
const password = ref('')
const loginLoading = ref(false)
const tokens = ref([])
const files = ref([])
const activeView = ref('overview')
const tokenName = ref('')
const validDays = ref(30)
const customDays = ref(180)
const tokenDialogVisible = ref(false)
const loading = ref(false)
const fileLoading = ref(false)
const fileUploading = ref(false)
const fileInput = ref(null)
const revealedTokens = ref(new Set())
const activeTokens = computed(() => tokens.value.filter((token) => token.status === 1 && !isExpired(token)))

// 调用后端接口并统一处理登录凭证
const request = async (url, options = {}) => {
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) }
  const token = localStorage.getItem('servicehub_token')
  if (token) headers.satoken = token
  const response = await fetch(url, { ...options, headers })
  const result = await response.json().catch(() => ({ message: '服务响应格式错误' }))
  if (!response.ok || result.code !== 0) throw new Error(result.message || '请求失败')
  return result.data
}

// 登录管理后台
const login = async () => {
  loginLoading.value = true
  try {
    const data = await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ username: username.value, password: password.value }) })
    localStorage.setItem('servicehub_token', data.token)
    loggedIn.value = true
    password.value = ''
    await loadTokens()
  } catch (error) { ElMessage.error(error.message) } finally { loginLoading.value = false }
}

// 加载 Token 列表
const loadTokens = async () => {
  loading.value = true
  try { tokens.value = await request('/api/tokens') } catch (error) {
    if (error.message.toLowerCase().includes('token')) logout()
    else ElMessage.error(error.message)
  } finally { loading.value = false }
}

// 加载文件列表
const loadFiles = async () => {
  fileLoading.value = true
  try { files.value = await request('/api/files') } catch (error) { ElMessage.error(error.message) } finally { fileLoading.value = false }
}

// 上传图片文件
const uploadFile = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const body = new FormData()
  body.append('file', file)
  fileUploading.value = true
  try { await request('/api/files/upload', { method: 'POST', body }); await loadFiles(); ElMessage.success('图片上传成功') } catch (error) { ElMessage.error(error.message) } finally { fileUploading.value = false }
}

// 删除图片文件
const deleteFile = async (file) => {
  try { await ElMessageBox.confirm(`确定删除“${file.originalName}”吗？`, '确认删除', { type: 'warning' }); await request(`/api/files/${file.id}`, { method: 'DELETE' }); await loadFiles(); ElMessage.success('文件已删除') } catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(error.message) }
}

// 切换后台内容视图
const selectView = (view) => { activeView.value = view; if (view === 'files') loadFiles(); if (view === 'overview') loadTokens() }

// 打开创建 Token 对话框
const openCreateDialog = () => {
  tokenName.value = ''
  validDays.value = 30
  customDays.value = 180
  tokenDialogVisible.value = true
}

// 创建服务 Token
const createToken = async () => {
  if (!tokenName.value.trim()) return ElMessage.warning('请输入 Token 名称')
  const days = validDays.value === 'custom' ? Number(customDays.value) : Number(validDays.value)
  if (validDays.value === 'custom' && (!Number.isInteger(days) || days < 1 || days > 3650)) return ElMessage.warning('自定义有效期需为 1～3650 天')
  try {
    await request('/api/tokens', { method: 'POST', body: JSON.stringify({ tokenName: tokenName.value.trim(), tokenType: 'FILEHUB', validDays: days }) })
    tokenDialogVisible.value = false
    await loadTokens()
    ElMessage.success('Token 创建成功')
  } catch (error) { ElMessage.error(error.message) }
}

// 判断 Token 是否已经过期
const isExpired = (token) => token.expiresAt && new Date(token.expiresAt) <= new Date()

// 格式化 Token 有效期
const formatExpiry = (value) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '永不过期'

// 生成 Token 脱敏显示文本
const maskToken = (value) => value && value.length > 14 ? `${value.slice(0, 6)}****${value.slice(-8)}` : '••••••••'

// 切换 Token 明文显示状态
const toggleReveal = (id) => {
  const next = new Set(revealedTokens.value)
  next.has(id) ? next.delete(id) : next.add(id)
  revealedTokens.value = next
}

// 复制完整 Token 到剪贴板
const copyToken = async (value) => {
  try { await navigator.clipboard.writeText(value); ElMessage.success('Token 已复制') } catch (_) { ElMessage.error('复制失败，请先显示 Token 后手动复制') }
}

// 切换服务 Token 启用状态
const toggleToken = async (token) => {
  try {
    await request(`/api/tokens/${token.id}/status`, { method: 'POST', body: JSON.stringify({ status: token.status === 1 ? 0 : 1 }) })
    await loadTokens()
  } catch (error) { ElMessage.error(error.message) }
}

// 删除服务 Token
const deleteToken = async (token) => {
  try {
    await ElMessageBox.confirm(`确定删除 Token“${token.tokenName}”吗？`, '确认删除', { type: 'warning' })
    await request(`/api/tokens/${token.id}`, { method: 'DELETE' })
    await loadTokens()
    ElMessage.success('Token 已删除')
  } catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(error.message) }
}

// 注销管理后台
const logout = async () => {
  try { await request('/api/admin/logout', { method: 'POST' }) } catch (_) { /* 会话失效时直接清理本地凭证 */ }
  localStorage.removeItem('servicehub_token')
  loggedIn.value = false
  tokens.value = []
  revealedTokens.value = new Set()
}

// 恢复已有登录会话
onMounted(() => { if (loggedIn.value) loadTokens() })
</script>

<template>
  <main class="page">
    <el-card v-if="!loggedIn" class="login-card" shadow="always">
      <div class="brand"><span class="brand-mark">RB</span><div><h1>ServiceHub</h1><p>个人项目基础服务平台</p></div></div>
      <el-form class="login-form" @submit.prevent="login">
        <el-form-item label="管理员账号"><el-input v-model="username" autocomplete="username" size="large" /></el-form-item>
        <el-form-item label="管理员密码"><el-input v-model="password" type="password" show-password autocomplete="current-password" size="large" /></el-form-item>
        <el-button type="primary" native-type="submit" :loading="loginLoading" size="large" class="full-button">登录管理后台</el-button>
      </el-form>
    </el-card>
    <section v-else class="shell">
      <aside class="sidebar"><div class="side-brand"><span class="brand-mark">RB</span><span>ServiceHub</span></div><div class="side-label">工作台</div><button :class="['nav-item', { active: activeView === 'overview' }]" @click="selectView('overview')"><span>▦</span>概览</button><button :class="['nav-item', { active: activeView === 'tokens' }]" @click="selectView('tokens')"><span>⌁</span>Token 管理</button><button :class="['nav-item', { active: activeView === 'files' }]" @click="selectView('files')"><span>▧</span>文件中心</button><div class="side-bottom"><div class="user-chip"><span class="avatar">{{ username.slice(0, 1).toUpperCase() }}</span><span>{{ username }}</span></div><button class="logout" @click="logout">退出登录</button></div></aside>
      <div class="main-area"><header class="topbar"><div><span class="crumb">ServiceHub / </span><span>{{ activeView === 'files' ? '文件中心' : activeView === 'tokens' ? 'Token 管理' : '概览' }}</span></div><span class="online-dot">系统运行中</span></header>
      <div class="dashboard"><header class="header"><div><div class="eyebrow">PERSONAL SERVICE PLATFORM</div><h1>{{ activeView === 'files' ? '文件中心' : activeView === 'tokens' ? 'Token 管理' : '欢迎回来，' + username }}</h1><p>{{ activeView === 'files' ? '上传、查看并管理你的图片资源' : activeView === 'tokens' ? '为你的服务创建和管理访问凭证' : '管理你的服务凭证与云端文件' }}</p></div><div class="header-actions"><el-button v-if="activeView !== 'files'" @click="loadTokens" :loading="loading">刷新</el-button><el-button v-if="activeView === 'files'" type="primary" :loading="fileUploading" @click="fileInput?.click()">上传图片</el-button><el-button v-if="activeView === 'tokens' || activeView === 'overview'" type="primary" @click="openCreateDialog">新建 Token</el-button><input ref="fileInput" hidden type="file" accept="image/jpeg,image/png,image/gif,image/webp" @change="uploadFile" /></div></header>
      <section class="stats"><div class="stat"><span>全部 Token</span><strong>{{ tokens.length }}</strong><small>服务访问凭证</small></div><div class="stat"><span>当前可用</span><strong class="success-text">{{ activeTokens.length }}</strong><small>正在生效</small></div><div class="stat"><span>云端文件</span><strong class="blue-text">{{ files.length }}</strong><small>已上传图片</small></div></section>
      <section v-if="activeView === 'files'" class="panel"><div class="panel-title"><div><h2>图片资源</h2><p>支持 JPG、PNG、GIF、WEBP，单个文件不超过 10MB</p></div></div><el-table :data="files" v-loading="fileLoading" class="token-table" row-key="id"><el-table-column label="预览" width="90"><template #default="scope"><el-image class="thumb" :src="scope.row.fileUrl" fit="cover" :preview-src-list="[scope.row.fileUrl]" /></template></el-table-column><el-table-column prop="originalName" label="文件名" min-width="220" /><el-table-column prop="contentType" label="类型" width="150" /><el-table-column label="大小" width="120"><template #default="scope">{{ (scope.row.fileSize / 1024 / 1024).toFixed(2) }} MB</template></el-table-column><el-table-column prop="createdAt" label="上传时间" width="190" /><el-table-column label="操作" width="100" fixed="right"><template #default="scope"><el-button link type="danger" @click="deleteFile(scope.row)">删除</el-button></template></el-table-column></el-table><el-empty v-if="!fileLoading && files.length === 0" description="还没有上传图片" /></section>
      <section v-else class="panel"><div class="panel-title"><div><h2>{{ activeView === 'overview' ? '最近的 Token' : '全部 Token' }}</h2><p>Token 以 rb- 开头，可按有效期控制访问范围</p></div><el-button v-if="activeView === 'overview' && tokens.length > 0" text type="primary" @click="selectView('tokens')">查看全部</el-button></div><el-table :data="activeView === 'overview' ? tokens.slice(0, 5) : tokens" v-loading="loading" class="token-table" row-key="id"><el-table-column prop="tokenName" label="名称" min-width="180" /><el-table-column prop="tokenType" label="类型" width="130"><template #default="scope"><el-tag effect="plain">{{ scope.row.tokenType }}</el-tag></template></el-table-column><el-table-column prop="tokenValue" label="访问 Token" min-width="360"><template #default="scope"><div class="token-value"><code>{{ revealedTokens.has(scope.row.id) ? scope.row.tokenValue : maskToken(scope.row.tokenValue) }}</code><el-button link type="primary" @click="toggleReveal(scope.row.id)">{{ revealedTokens.has(scope.row.id) ? '隐藏' : '显示' }}</el-button><el-button link @click="copyToken(scope.row.tokenValue)">复制</el-button></div></template></el-table-column><el-table-column label="有效期" width="190"><template #default="scope">{{ formatExpiry(scope.row.expiresAt) }}</template></el-table-column><el-table-column label="状态" width="100"><template #default="scope"><el-tag :type="scope.row.status === 1 && !isExpired(scope.row) ? 'success' : 'info'">{{ scope.row.status !== 1 ? '已禁用' : (isExpired(scope.row) ? '已过期' : '启用') }}</el-tag></template></el-table-column><el-table-column v-if="activeView === 'tokens'" label="操作" width="180" fixed="right"><template #default="scope"><el-button link type="primary" @click="toggleToken(scope.row)">{{ scope.row.status === 1 ? '禁用' : '启用' }}</el-button><el-button link type="danger" @click="deleteToken(scope.row)">删除</el-button></template></el-table-column></el-table><el-empty v-if="!loading && tokens.length === 0" description="还没有 Token，创建一个开始使用吧" /></section>
      </div></div>
    </section>
    <el-dialog v-model="tokenDialogVisible" title="新建 Token" width="460px">
      <el-form label-position="top" @submit.prevent="createToken">
        <el-form-item label="Token 名称"><el-input v-model="tokenName" placeholder="例如：图片服务、个人博客" /></el-form-item>
        <el-form-item label="有效期"><el-select v-model="validDays" class="full-width"><el-option label="7 天" :value="7" /><el-option label="30 天" :value="30" /><el-option label="90 天" :value="90" /><el-option label="180 天" :value="180" /><el-option label="365 天" :value="365" /><el-option label="永不过期" :value="0" /><el-option label="自定义天数" value="custom" /></el-select></el-form-item>
        <el-input-number v-if="validDays === 'custom'" v-model="customDays" :min="1" :max="3650" controls-position="right" class="full-width" />
      </el-form>
      <template #footer><el-button @click="tokenDialogVisible = false">取消</el-button><el-button type="primary" @click="createToken">创建 Token</el-button></template>
    </el-dialog>
  </main>
</template>

<style scoped>
.page { min-height: 100vh; padding: 48px; box-sizing: border-box; background: #f3f6fb; color: #172033; }
.login-card { width: 430px; margin: 12vh auto; border: 0; border-radius: 18px; }
.brand { display: flex; align-items: center; gap: 14px; margin-bottom: 34px; }.brand-mark { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; color: white; font-weight: 800; background: linear-gradient(135deg, #3b82f6, #6366f1); }.brand h1 { margin: 0; font-size: 25px; }.brand p, .header p { margin: 6px 0 0; color: #8a94a6; }.login-form :deep(.el-form-item__label) { color: #566176; }.full-button, .full-width { width: 100%; }
.shell { display: flex; min-height: calc(100vh - 96px); max-width: 1500px; margin: 0 auto; overflow: hidden; border: 1px solid #e5eaf3; border-radius: 20px; background: #fff; box-shadow: 0 20px 60px rgba(50, 74, 120, .08); }.sidebar { display: flex; flex-direction: column; width: 235px; flex-shrink: 0; padding: 26px 16px; color: #b9c4dc; background: #17233d; }.side-brand { display: flex; align-items: center; gap: 11px; padding: 0 12px 42px; color: #fff; font-size: 17px; font-weight: 700; }.side-brand .brand-mark { width: 36px; height: 36px; border-radius: 10px; font-size: 12px; background: linear-gradient(135deg, #5d8dff, #7767ed); }.side-label { padding: 0 12px 12px; color: #71809f; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }.nav-item { display: flex; align-items: center; gap: 13px; width: 100%; margin: 3px 0; padding: 12px; border: 0; border-radius: 9px; color: #aebbd4; background: transparent; font: inherit; text-align: left; cursor: pointer; }.nav-item span { width: 18px; color: #8292b4; font-size: 19px; text-align: center; }.nav-item:hover, .nav-item.active { color: #fff; background: #2b3b62; }.nav-item.active span { color: #79a1ff; }.side-bottom { margin-top: auto; padding: 18px 8px 0; border-top: 1px solid #2d3b5d; }.user-chip { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; color: #e0e7f5; font-size: 13px; }.avatar { display: grid; place-items: center; width: 29px; height: 29px; border-radius: 50%; color: #fff; background: #5a79da; font-size: 12px; font-weight: 700; }.logout { width: 100%; padding: 8px 0; border: 0; color: #8594b2; background: transparent; text-align: left; cursor: pointer; }.logout:hover { color: #fff; }.main-area { flex: 1; min-width: 0; background: #f8faff; }.topbar { display: flex; justify-content: space-between; align-items: center; height: 66px; padding: 0 42px; border-bottom: 1px solid #e9edf5; color: #66738b; font-size: 13px; background: #fff; }.crumb { color: #a0aabe; }.online-dot { color: #20a875; }.online-dot::before { display: inline-block; width: 7px; height: 7px; margin-right: 7px; border-radius: 50%; background: #2ac28d; content: ''; }.dashboard { padding: 42px; }.header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding-bottom: 28px; }.eyebrow { color: #5471e8; font-size: 11px; font-weight: 700; letter-spacing: 1.6px; }.header h1 { margin: 8px 0 0; color: #17233d; font-size: 29px; }.header p, .panel-title p { margin: 7px 0 0; color: #8a96aa; }.header-actions { display: flex; gap: 8px; align-items: center; }.stats { display: grid; grid-template-columns: repeat(3, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }.stat { padding: 20px 22px; border: 1px solid #edf0f6; border-radius: 13px; background: #fff; box-shadow: 0 5px 18px rgba(45, 65, 110, .035); }.stat span, .stat small { display: block; color: #8993a5; font-size: 13px; }.stat strong { display: block; margin: 7px 0 3px; color: #273550; font-size: 28px; }.success-text { color: #18a673 !important; }.blue-text { color: #5471e8 !important; }.panel { padding: 26px; border: 1px solid #edf0f6; border-radius: 15px; background: #fff; box-shadow: 0 5px 18px rgba(45, 65, 110, .035); }.panel-title { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }.panel-title h2 { margin: 0; color: #273550; font-size: 18px; }.token-table { border-radius: 10px; overflow: hidden; }.token-value { display: flex; align-items: center; gap: 5px; min-width: 320px; }code { color: #5367c9; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }.thumb { width: 48px; height: 48px; border-radius: 8px; }
@media (max-width: 800px) { .page { padding: 14px; }.shell { min-height: calc(100vh - 28px); }.sidebar { width: 58px; padding: 20px 8px; }.side-brand { padding: 0 3px 35px; }.side-brand > span:not(.brand-mark), .side-label, .nav-item:not(.active)::after, .nav-item { font-size: 0; }.nav-item { justify-content: center; padding: 12px 0; }.nav-item span { font-size: 19px; }.side-bottom { padding: 15px 0 0; }.user-chip { justify-content: center; }.user-chip > span:not(.avatar), .logout { display: none; }.topbar { padding: 0 18px; }.dashboard { padding: 24px 16px; }.header { flex-direction: column; }.header-actions { flex-wrap: wrap; }.stats { grid-template-columns: 1fr; }.panel { padding: 14px; } }
</style>
