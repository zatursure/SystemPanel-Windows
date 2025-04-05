<template>
  <div class="service-manager">
    <el-card>
      <template #header>
        <div class="header-operations">
          <el-input
            v-model="searchQuery"
            placeholder="搜索服务"
            style="width: 200px"
          />
          <el-button type="primary" @click="refreshServices">刷新</el-button>
        </div>
      </template>

      <el-table
        :data="filteredServices"
        stripe
        v-loading="loading"
      >
        <el-table-column prop="name" label="服务名称" width="200" sortable />
        <el-table-column prop="displayName" label="显示名称" sortable />
        <el-table-column prop="startType" label="启动类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getStartTypeTag(row.startType)">
              {{ getStartTypeText(row.startType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="state" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.state === 'RUNNING' ? 'success' : 'danger'">
              {{ row.state === 'RUNNING' ? '运行中' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="250">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                type="primary"
                size="small"
                :disabled="row.state === 'RUNNING'"
                @click="controlService(row.name, 'start')"
              >
                启动
              </el-button>
              <el-button
                type="warning"
                size="small"
                :disabled="row.state !== 'RUNNING'"
                @click="controlService(row.name, 'stop')"
              >
                停止
              </el-button>
              <el-button
                type="success"
                size="small"
                :disabled="row.state !== 'RUNNING'"
                @click="controlService(row.name, 'restart')"
              >
                重启
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const services = ref([])
const loading = ref(false)
const searchQuery = ref('')

const filteredServices = computed(() => {
  return services.value.filter(service =>
    service.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    service.displayName.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const getStartTypeTag = (type: string) => {
  const types = {
    'AUTO_START': 'success',
    'DEMAND_START': 'warning',
    'DISABLED': 'info'
  }
  return types[type] || 'info'
}

const getStartTypeText = (type: string) => {
  const types = {
    'AUTO_START': '自动',
    'DEMAND_START': '手动',
    'DISABLED': '禁用'
  }
  return types[type] || type
}

const refreshServices = async () => {
  loading.value = true
  try {
    const { data } = await axios.get('/api/services')
    if (data.success) {
      services.value = data.list
    } else {
      throw new Error(data.error)
    }
  } catch (error) {
    console.error('获取服务列表失败:', error)
    ElMessage.error('获取服务列表失败')
  } finally {
    loading.value = false
  }
}

const controlService = async (name: string, action: string) => {
  try {
    const actionText = {
      start: '启动',
      stop: '停止',
      restart: '重启'
    }[action]
    
    await ElMessageBox.confirm(
      `确定要${actionText}服务 "${name}" 吗？`,
      '确认操作'
    )
    
    await axios.post(`http://localhost:3000/api/services/${name}/${action}`)
    ElMessage.success(`服务${actionText}成功`)
    refreshServices()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(refreshServices)
</script>

<style scoped>
.header-operations {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
