<template>
  <div class="process-manager">
    <el-card>
      <template #header>
        <div class="header-operations">
          <div class="left-tools">
            <el-input
              v-model="searchQuery"
              placeholder="搜索进程"
              style="width: 200px"
              clearable
            />
            <el-select v-model="filterType" style="margin-left: 10px">
              <el-option label="全部" value="" />
              <el-option label="系统进程" value="system" />
              <el-option label="用户进程" value="user" />
            </el-select>
          </div>
          <div class="right-tools">
            <el-button type="primary" @click="refreshProcesses">刷新</el-button>
            <el-button type="danger" @click="killSelected" :disabled="!selectedProcesses.length">
              结束选中进程
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredProcesses"
        stripe
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="pid" label="PID" width="80" sortable />
        <el-table-column prop="name" label="进程名称" sortable />
        <el-table-column prop="cpu" label="CPU" width="100" sortable>
          <template #default="{ row }">{{ row.cpu }}%</template>
        </el-table-column>
        <el-table-column prop="mem" label="内存" width="100" sortable>
          <template #default="{ row }">{{ row.mem }}MB</template>
        </el-table-column>
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-select 
              v-model="row.priority" 
              size="small"
              @change="(val) => changePriority(row.pid, val)"
            >
              <el-option label="低" :value="0" />
              <el-option label="普通" :value="1" />
              <el-option label="高" :value="2" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button 
                type="danger" 
                size="small" 
                @click="killProcess(row.pid)"
              >结束</el-button>
              <el-button
                type="primary"
                size="small"
                @click="showDetails(row)"
              >详情</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 进程详情对话框 -->
    <el-dialog
      v-model="detailsVisible"
      title="进程详情"
      width="500px"
    >
      <template v-if="selectedProcess">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="PID">{{ selectedProcess.pid }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ selectedProcess.name }}</el-descriptions-item>
          <el-descriptions-item label="路径">{{ selectedProcess.path }}</el-descriptions-item>
          <el-descriptions-item label="线程数">{{ selectedProcess.threads }}</el-descriptions-item>
          <el-descriptions-item label="启动时间">{{ selectedProcess.startTime }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const processes = ref([])
const loading = ref(false)
const searchQuery = ref('')
const selectedProcesses = ref([])
const filterType = ref('')
const detailsVisible = ref(false)
const selectedProcess = ref(null)

const filteredProcesses = computed(() => {
  let result = processes.value
  if (searchQuery.value) {
    result = result.filter(p => 
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  if (filterType.value) {
    result = result.filter(p => 
      filterType.value === 'system' ? p.user === 'SYSTEM' : p.user !== 'SYSTEM'
    )
  }
  return result
})

const refreshProcesses = async () => {
  loading.value = true
  try {
    const { data } = await request.get('/api/processes')
    if (data.success) {
      processes.value = data.list
    } else {
      throw new Error(data.error || '获取进程列表失败')
    }
  } catch (error: any) {
    console.error('获取进程列表失败:', error)
    ElMessage.error(error.response?.data?.error || error.message || '获取进程列表失败')
    processes.value = [] // 清空列表
  } finally {
    loading.value = false
  }
}

const killProcess = async (pid: number) => {
  try {
    await ElMessageBox.confirm('确定要结束此进程吗？', '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    
    const { data } = await request.post(`/api/processes/${pid}/kill`)
    if (data.success) {
      ElMessage.success('进程已终止')
      refreshProcesses()
    } else {
      throw new Error(data.error)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.error || error.message || '操作失败')
    }
  }
}

const killSelected = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要结束选中的 ${selectedProcesses.value.length} 个进程吗？`,
      '警告'
    )
    await Promise.all(
      selectedProcesses.value.map(process => 
        request.post(`/api/processes/${process.pid}/kill`)
      )
    )
    ElMessage.success('所选进程已终止')
    refreshProcesses()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleSelectionChange = (selection: any[]) => {
  selectedProcesses.value = selection
}

const changePriority = async (pid: number, priority: number) => {
  try {
    await axios.post('/api/processes/priority', { pid, priority })
    ElMessage.success('优先级修改成功')
  } catch (error) {
    ElMessage.error('修改优先级失败')
  }
}

const showDetails = (process) => {
  selectedProcess.value = process
  detailsVisible.value = true
}

onMounted(() => {
  refreshProcesses()
})
</script>

<style scoped>
.header-operations {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.left-tools, .right-tools {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
