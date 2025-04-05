<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>系统管理面板</h2>
      </template>
      
      <el-form @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="请输入管理员密码"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!password.value) {
    ElMessage.warning('请输入密码')
    return
  }

  loading.value = true
  try {
    const { data } = await axios.post('/api/login', {
      password: password.value
    })
    
    if (data.success) {
      localStorage.setItem('token', data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      router.push('/')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
}

.login-card {
  width: 100%;
  max-width: 360px;
}

h2 {
  text-align: center;
  margin: 0;
  color: #303133;
}
</style>
