require('dotenv').config()
const jwt = require('jsonwebtoken')
const auth = require('./middleware/auth')

const express = require('express')
const path = require('path')
const cors = require('cors')
const si = require('systeminformation')
const { Service } = require('node-windows')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

const app = express()

app.use(cors())
app.use(express.json())

// 静态文件服务
app.use(express.static(path.join(__dirname, '../dist')))

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('API错误:', err)
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误'
  })
}

// 登录API
app.post('/api/login', (req, res) => {
  const { password } = req.body

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: '密码错误'
    })
  }

  const token = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: '24h' })
  res.json({
    success: true,
    token
  })
})

// 添加认证中间件到需要保护的API
app.use('/api/*', auth)

// 系统信息API
app.get('/api/system', async (req, res) => {
  try {
    const [cpu, mem, disk] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize()
    ])
    
    res.json({
      success: true,
      data: {
        cpu: Math.round(cpu.currentLoad),
        memory: Math.round((mem.used / mem.total) * 100),
        disk: Math.round(disk[0].use)
      }
    })
  } catch (error) {
    console.error('获取系统信息失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 添加缓存对象
const cache = {
  services: {
    data: null,
    timestamp: 0
  },
  processes: {
    data: null,
    timestamp: 0
  }
}

// 缓存时间（毫秒）
const CACHE_DURATION = 5000

// 优化进程API
app.get('/api/processes', async (req, res) => {
  try {
    const now = Date.now()
    if (cache.processes.data && now - cache.processes.timestamp < CACHE_DURATION) {
      return res.json(cache.processes.data)
    }

    const processes = await si.processes()
    const formattedProcesses = processes.list
      .filter(p => p.pid && p.name)
      .map(p => ({
        pid: p.pid,
        name: p.name,
        cpu: parseFloat(p.cpu || 0).toFixed(2),
        mem: Math.round(p.memRss / 1024 / 1024)
      }))
      .sort((a, b) => parseFloat(b.cpu) - parseFloat(a.cpu))

    const response = {
      success: true,
      list: formattedProcesses
    }
    
    cache.processes.data = response
    cache.processes.timestamp = now
    
    res.json(response)
  } catch (error) {
    console.error('获取进程列表失败:', error)
    res.status(500).json({
      success: false,
      error: '获取进程列表失败: ' + error.message
    })
  }
})

// 优化服务API
app.get('/api/services', async (req, res) => {
  try {
    const now = Date.now()
    if (cache.services.data && now - cache.services.timestamp < CACHE_DURATION) {
      return res.json(cache.services.data)
    }

    const services = await si.services('*')
    const formattedServices = await Promise.all(
      services.map(async service => {
        const state = await execPromise(`sc query "${service.name}"`).then(
          ({stdout}) => stdout.includes('RUNNING') ? 'RUNNING' : 'STOPPED',
          () => 'UNKNOWN'
        )
        return {
          name: service.name,
          displayName: service.displayname,
          state,
          startType: service.startmode
        }
      })
    )

    const response = {
      success: true,
      list: formattedServices
    }
    
    cache.services.data = response
    cache.services.timestamp = now
    
    res.json(response)
  } catch (error) {
    console.error('获取服务列表失败:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// 添加进程终止API
app.post('/api/processes/:pid/kill', async (req, res) => {
  const pid = parseInt(req.params.pid)
  try {
    process.kill(pid)
    cache.processes.data = null // 清除进程缓存
    res.json({ success: true, message: `进程 ${pid} 已终止` })
  } catch (error) {
    console.error(`终止进程 ${pid} 失败:`, error)
    res.status(500).json({
      success: false,
      error: `终止进程失败: ${error.message}`
    })
  }
})

// 服务API
app.get('/api/services', async (req, res) => {
  try {
    // 使用 sc query 命令获取更准确的服务状态
    const getServiceState = async (serviceName) => {
      try {
        const { stdout } = await execPromise(`sc query "${serviceName}"`)
        if (stdout.includes('RUNNING')) return 'RUNNING'
        if (stdout.includes('STOPPED')) return 'STOPPED'
        return 'UNKNOWN'
      } catch (error) {
        console.error(`获取服务 ${serviceName} 状态失败:`, error)
        return 'UNKNOWN'
      }
    }

    const services = await si.services('*')
    const formattedServices = await Promise.all(services.map(async service => {
      const currentState = await getServiceState(service.name)
      return {
        name: service.name,
        displayName: service.displayname,
        state: currentState,
        startType: service.startmode,
        description: service.description
      }
    }))

    console.log(`成功获取 ${formattedServices.length} 个服务状态`)
    res.json({
      success: true,
      list: formattedServices
    })
  } catch (error) {
    console.error('获取服务列表失败:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// 添加进程管理API
app.post('/api/processes/:pid/kill', async (req, res) => {
  try {
    process.kill(parseInt(req.params.pid))
    cache.processes.data = null // 清除进程缓存
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 服务控制API也需要更新
app.post('/api/services/:name/:action', async (req, res) => {
  const { name, action } = req.params
  try {
    const { stdout } = await execPromise(`sc ${action} "${name}"`)
    // 等待服务状态变化
    await new Promise(resolve => setTimeout(resolve, 1000))
    cache.services.data = null // 清除服务缓存
    res.json({ 
      success: true, 
      message: `服务${action}操作已执行` 
    })
  } catch (error) {
    console.error(`服务${action}操作失败:`, error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

app.post('/api/processes/priority', async (req, res) => {
  const { pid, priority } = req.body
  try {
    // 需要使用管理员权限
    await si.processSetPriority(pid, priority)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 修改命令执行API
app.post('/api/terminal/execute', async (req, res) => {
  const { command, shell } = req.body
  
  if (!command || typeof command !== 'string') {
    return res.status(400).json({
      success: false,
      error: '无效的命令'
    })
  }

  try {
    const shellCmd = shell === 'powershell' ? 
      ['powershell', '-NoProfile', '-Command', command] :
      ['cmd', '/c', command]

    const { stdout, stderr } = await execPromise(shellCmd.join(' '), {
      timeout: 30000,
      maxBuffer: 1024 * 1024
    })
    
    res.json({
      success: true,
      output: stdout || stderr || '命令执行成功，无输出'
    })
  } catch (error) {
    console.error('命令执行错误:', error)
    res.status(500).json({
      success: false,
      error: error.message || '命令执行失败'
    })
  }
})

// 所有其他请求返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.use(errorHandler)

app.listen(3000, () => {
  console.log('--------- System Panel ---------')
  console.log('服务运行在 http://localhost:3000')
})
