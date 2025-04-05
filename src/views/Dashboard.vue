<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>CPU信息</template>
          <div v-if="systemInfo.cpu">
            <p>型号: {{ systemInfo.cpu.brand }}</p>
            <p>核心数: {{ systemInfo.cpu.cores }}</p>
            <p>速度: {{ systemInfo.cpu.speed }}GHz</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>内存信息</template>
          <div v-if="systemInfo.mem">
            <p>总内存: {{ formatBytes(systemInfo.mem.total) }}</p>
            <p>已用内存: {{ formatBytes(systemInfo.mem.used) }}</p>
            <p>空闲内存: {{ formatBytes(systemInfo.mem.free) }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>系统信息</template>
          <div v-if="systemInfo.os">
            <p>系统: {{ systemInfo.os.platform }}</p>
            <p>版本: {{ systemInfo.os.release }}</p>
            <p>架构: {{ systemInfo.os.arch }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const systemInfo = ref({
  cpu: null,
  mem: null,
  os: null
})

const formatBytes = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

const fetchSystemInfo = async () => {
  try {
    const { data } = await axios.get('/api/system/info')
    systemInfo.value = data
  } catch (error) {
    console.error('获取系统信息失败:', error)
  }
}

onMounted(() => {
  fetchSystemInfo()
  setInterval(fetchSystemInfo, 5000)
})
</script>
