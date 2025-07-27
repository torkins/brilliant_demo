<template>
  <ControlPanel
    @animate-ray="handleAnimateRay"
    @unfold-ray="handleUnfoldRay"
  />
  <MainStage ref="mainStageRef" />
  <DebugPanel />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ControlPanel from './components/ControlPanel.vue'
import MainStage from './components/MainStage.vue'
import DebugPanel from './components/DebugPanel.vue'

const mainStageRef = ref<InstanceType<typeof MainStage>>()

async function handleAnimateRay() {
  if (mainStageRef.value) {
    await mainStageRef.value.animateReverseRay()
  }
}

async function handleUnfoldRay() {
  if (mainStageRef.value) {
    await mainStageRef.value.animateUnfoldRay()
  }
}
</script>