<script setup lang="ts">
import { RouterView } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import BrToast from '@/components/base/BrToast.vue'
</script>

<template>
  <MainLayout>
    <RouterView v-slot="{ Component }">
      <Transition name="br-page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </MainLayout>
  <BrToast />
</template>

<style>
/* 全局样式已在 styles/main.css 中统一引入 */
</style>
