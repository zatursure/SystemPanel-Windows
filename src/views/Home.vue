<template>
  <el-container class="layout-container">
    <el-header>
      <div class="header-content">
        <h2>系统管理面板</h2>
        <div class="header-right">
          <el-button type="danger" @click="handleLogout">
            退出登录
          </el-button>
        </div>
      </div>
    </el-header>

    <el-main>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>欢迎使用系统管理面板</span>
              </div>
            </template>
            <div class="card-content">
              这里是系统主界面内容
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()

const handleLogout = () => {
  localStorage.removeItem('token')
  delete axios.defaults.headers.common['Authorization']
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  padding: 0 20px;
}

.header-content {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content h2 {
  margin: 0;
  color: #303133;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  padding: 20px 0;
}
</style>
