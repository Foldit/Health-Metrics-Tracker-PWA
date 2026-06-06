<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
  <van-tabbar route>
    <van-tabbar-item to="/dashboard" icon="home-o">首页</van-tabbar-item>
    <van-tabbar-item to="/trends" icon="bar-chart-o">
      趋势
    </van-tabbar-item>
    <van-tabbar-item to="/reports" icon="notes-o">
      报告
    </van-tabbar-item>
    <van-tabbar-item to="/settings" icon="setting-o">
      设置
    </van-tabbar-item>
  </van-tabbar>
</template>
