<template>
  <el-container>
    <el-aside width="200px">
      <el-menu router>
        <el-menu-item index="/">
          <el-icon><Monitor /></el-icon>
          <span>系统监控</span>
        </el-menu-item>
        <el-menu-item index="/processes">
          <el-icon><List /></el-icon>
          <span>进程管理</span>
        </el-menu-item>
        <el-menu-item index="/services">
          <el-icon><Setting /></el-icon>
          <span>服务管理</span>
        </el-menu-item>
        <el-menu-item index="/terminal">
          <el-icon><Platform /></el-icon>
          <span>命令提示符</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { Monitor, List, Setting, Platform } from '@element-plus/icons-vue'
</script>

<style scoped>
.el-container {
  height: 100vh;
  width: 100vw;
}

.el-aside {
  background-color: #f6f8f9;
  border-right: solid 1px #e6e6e6;
}

.el-main {
  padding: 20px;
  background-color: #ffffff;
}
</style>
