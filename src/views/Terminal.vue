<template>
  <div class="terminal">
    <el-card>
      <template #header>
        <div class="command-header">
          <span>命令执行器</span>
          <el-button type="warning" @click="clearOutput">清空输出</el-button>
        </div>
      </template>

      <div class="terminal-content">
        <el-input
          v-model="command"
          type="text"
          placeholder="输入命令"
          @keyup.enter="executeCommand"
        >
          <template #prepend>
            {{ shellType === 'powershell' ? 'PS>' : 'C:\\>' }}
          </template>
          <template #append>
            <el-select v-model="shellType" style="width: 120px">
              <el-option label="PowerShell" value="powershell" />
              <el-option label="CMD" value="cmd" />
            </el-select>
          </template>
        </el-input>

        <div class="output-container" v-loading="loading">
          <pre v-if="output" class="output">{{ output }}</pre>
          <div v-else class="empty-output">命令输出将显示在这里</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const command = ref('')
const output = ref('')
const loading = ref(false)
const shellType = ref('powershell')

const executeCommand = async () => {
  if (!command.value.trim()) {
    ElMessage.warning('请输入命令')
    return
  }

  loading.value = true
  try {
    const { data } = await axios.post('/api/terminal/execute', {
      command: command.value,
      shell: shellType.value
    })
    
    if (data.success) {
      output.value += `\n> ${command.value}\n${data.output}`
      command.value = ''
    } else {
      throw new Error(data.error)
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || error.message || '执行失败')
  } finally {
    loading.value = false
  }
}

const clearOutput = () => {
  output.value = ''
}
</script>

<style scoped>
.terminal {
  padding: 20px;
}

.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terminal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.output-container {
  padding: 10px;
  background-color: #1e1e1e;
  border-radius: 4px;
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
}

.output {
  margin: 0;
  color: #fff;
  font-family: Consolas, monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.empty-output {
  color: #666;
  text-align: center;
  padding: 20px;
}
</style>
