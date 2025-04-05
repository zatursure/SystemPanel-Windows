<template>
  <div class="monitor" v-loading="initialLoading">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>CPU使用率</template>
          <el-progress type="dashboard" :percentage="cpuUsage" :color="getColor" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>内存使用率</template>
          <el-progress type="dashboard" :percentage="memoryUsage" :color="getColor" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>磁盘使用率</template>
          <el-progress type="dashboard" :percentage="diskUsage" :color="getColor" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const cpuUsage = ref(0)
const memoryUsage = ref(0)
const diskUsage = ref(0)
const initialLoading = ref(true) // 只在首次加载时显示
let timer: NodeJS.Timer

const getColor = (percentage: number) => {
  if (percentage < 70) return '#67C23A'
  if (percentage < 90) return '#E6A23C'
  return '#F56C6C'
}

const fetchSystemData = async (isInitial = false) => {
  if (isInitial) initialLoading.value = true
  try {
    const { data } = await axios.get('http://localhost:3000/api/system')
    if (data.success) {
      cpuUsage.value = data.data.cpu
      memoryUsage.value = data.data.memory
      diskUsage.value = data.data.disk
    }
  } catch (error: any) {
    console.error('获取系统信息失败:', error)
    ElMessage.error(error.message || '获取系统信息失败')
  } finally {
    if (isInitial) initialLoading.value = false
  }
}

onMounted(async () => {
  await fetchSystemData(true) // 首次加载
  timer = setInterval(() => fetchSystemData(false), 5000) // 定时刷新
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.monitor {
  padding: 20px;
}
</style>
