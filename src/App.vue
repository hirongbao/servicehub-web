<script setup>
import { ref } from 'vue'

const loggedIn = ref(false)
const username = ref('hirongbao')
const password = ref('123456')
const login = () => { loggedIn.value = true }
</script>

<template>
  <main class="page">
    <el-card v-if="!loggedIn" class="login-card">
      <h1>ServiceHub Admin</h1>
      <el-form @submit.prevent="login">
        <el-form-item label="用户名"><el-input v-model="username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="password" type="password" show-password /></el-form-item>
        <el-button type="primary" native-type="submit">登录</el-button>
      </el-form>
    </el-card>
    <el-card v-else><h1>Token 管理</h1><el-empty description="Token 管理功能待接入后端 API" /></el-card>
  </main>
</template>

<style scoped>
.page { min-height: 100vh; display: grid; place-items: center; background: #f5f7fa; }
.login-card { width: 420px; }
h1 { margin-top: 0; }
</style>
