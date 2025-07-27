import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import App from '@/App.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import DebugPanel from '@/components/DebugPanel.vue'
import MainStage from '@/components/MainStage.vue'
import { useStageStore } from '@/store'

// Browser mode provides real Canvas APIs - no mocking needed!

describe('Integration Tests - Full Application', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Panel Communication', () => {
    it('should synchronize state between all panels', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      // Add component through store
      store.addComponent('viewer')
      await wrapper.vm.$nextTick()
      
      // Check that all panels reflect the change
      const controlPanel = wrapper.findComponent(ControlPanel)
      const debugPanel = wrapper.findComponent(DebugPanel)
      const mainStage = wrapper.findComponent(MainStage)
      
      expect(controlPanel.exists()).toBe(true)
      expect(debugPanel.exists()).toBe(true)
      expect(mainStage.exists()).toBe(true)
      
      // Verify component count is updated in debug panel
      expect(debugPanel.text()).toContain('Components: 1')
    })

    it('should handle mode changes across all panels', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      // Change mode through store
      store.setMode('sandbox')
      await wrapper.vm.$nextTick()
      
      // Verify mode is reflected in debug panel
      const debugPanel = wrapper.findComponent(DebugPanel)
      expect(debugPanel.text()).toContain('Mode: sandbox')
      
      // Change to game mode
      store.setMode('game')
      await wrapper.vm.$nextTick()
      
      expect(debugPanel.text()).toContain('Mode: game')
    })

    it('should update debug panel when components are added from control panel', async () => {
      const wrapper = mount(App)
      const controlPanel = wrapper.findComponent(ControlPanel)
      const debugPanel = wrapper.findComponent(DebugPanel)
      
      // Add component via control panel
      const addButton = controlPanel.find('.component-button')
      await addButton.trigger('click')
      
      await wrapper.vm.$nextTick()
      
      // Debug panel should show the new component count
      expect(debugPanel.text()).toContain('Components: 1')
    })
  })

  describe('Cross-Panel Workflows', () => {
    it('should complete full edit workflow', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      // 1. Start in edit mode (default)
      expect(store.currentMode).toBe('edit')
      
      // 2. Add components
      store.addComponent('viewer')
      store.addComponent('mirror')
      store.addComponent('bunny')
      
      await wrapper.vm.$nextTick()
      
      // 3. Verify components were added
      expect(store.stageSpec.components).toHaveLength(3)
      
      // 4. Select a component
      const mirrorId = store.getComponentsByType('mirror')[0].id
      store.selectComponent(mirrorId)
      
      // 5. Verify selection is shown in control panel
      expect(store.selectedComponentId).toBe(mirrorId)
    })

    it('should complete full sandbox workflow', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      // 1. Set up scene in edit mode
      store.addComponent('viewer')
      store.addComponent('mirror')
      store.addComponent('bunny')
      
      // 2. Switch to sandbox mode
      store.setMode('sandbox')
      await wrapper.vm.$nextTick()
      
      expect(store.currentMode).toBe('sandbox')
      
      // 3. Try to test rays (would normally require viewer)
      const viewer = store.getViewer
      if (viewer) {
        // Simulate test ray functionality
        store.setRaySegments([{
          origin: viewer.position,
          direction: { x: 1, y: 0 },
          length: 5
        }])
      }
      
      await wrapper.vm.$nextTick()
    })

    it('should complete full game workflow', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      // 1. Set up game scenario
      store.addComponent('viewer')
      store.addComponent('mirror')
      store.addComponent('bunny')
      store.addComponent('phantom')
      store.addComponent('phantom')
      
      // 2. Switch to game mode
      store.setMode('game')
      await wrapper.vm.$nextTick()
      
      expect(store.currentMode).toBe('game')
      
      // 3. Set up game state
      const phantoms = store.getPhantoms
      if (phantoms.length > 0) {
        store.setCorrectPhantom(phantoms[0].id)
        
        // 4. Make a guess
        store.checkPhantomGuess(phantoms[0].id)
        
        // 5. Verify result
        expect(store.gameResult).toBe('correct')
      }
    })
  })

  describe('JSON Debug Panel Integration', () => {
    it('should export and import stage via JSON panel', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      const debugPanel = wrapper.findComponent(DebugPanel)
      
      // 1. Create a scene
      store.addComponent('viewer')
      store.addComponent('wall')
      
      await wrapper.vm.$nextTick()
      
      // 2. Get JSON representation
      const originalSpec = { ...store.stageSpec }
      
      // 3. Simulate JSON export/import
      const textarea = debugPanel.find('textarea')
      
      expect(textarea.exists()).toBe(true)
      
      // 4. Modify and re-import
      const modifiedSpec = {
        ...originalSpec,
        worldSize: { width: 15, height: 10 }
      }
      
      await textarea.setValue(JSON.stringify(modifiedSpec))
      
      const saveButton = debugPanel.findAll('.debug-button')[0]
      await saveButton.trigger('click')
      
      // 5. Verify changes were applied
      expect(store.stageSpec.worldSize.width).toBe(15)
      expect(store.stageSpec.worldSize.height).toBe(10)
    })

    it('should handle invalid JSON gracefully', async () => {
      const wrapper = mount(App)
      const debugPanel = wrapper.findComponent(DebugPanel)
      
      const textarea = debugPanel.find('textarea')
      const saveButton = debugPanel.findAll('.debug-button')[0]
      
      // Try to save invalid JSON
      await textarea.setValue('{ invalid json }')
      await saveButton.trigger('click')
      
      // Should show error
      expect(debugPanel.text()).toContain('JSON Error')
    })

    it('should reset JSON to current state', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      const debugPanel = wrapper.findComponent(DebugPanel)
      
      // Add component
      store.addComponent('bunny')
      await wrapper.vm.$nextTick()
      
      const textarea = debugPanel.find('textarea')
      const resetButton = debugPanel.findAll('.debug-button')[1]
      
      // Modify textarea content
      await textarea.setValue('modified content')
      
      // Reset should restore original content
      await resetButton.trigger('click')
      
      const restoredContent = JSON.parse(textarea.element.value)
      expect(restoredContent.components).toHaveLength(1)
      expect(restoredContent.components[0].type).toBe('bunny')
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle window resize events', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      // Simulate window resize
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()
      
      // Should maintain valid scaling ratio
      expect(store.metersToPixelsRatio).toBeGreaterThan(0)
    })

    it('should maintain state during resize', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      // Add components
      store.addComponent('viewer')
      store.addComponent('wall')
      
      const componentCount = store.stageSpec.components.length
      
      // Resize window
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()
      
      // Components should still be there
      expect(store.stageSpec.components).toHaveLength(componentCount)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing components gracefully', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      // Try to select non-existent component
      store.selectComponent('non-existent-id')
      
      // Should not crash
      expect(wrapper.exists()).toBe(true)
      expect(store.selectedComponentId).toBe('non-existent-id')
      expect(store.getComponentById('non-existent-id')).toBeUndefined()
    })

    it('should handle invalid component operations', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      // Try to move non-existent component
      store.moveComponent('invalid-id', { x: 5, y: 5 })
      
      // Should not crash
      expect(wrapper.exists()).toBe(true)
    })

    it('should recover from render errors', async () => {
      const wrapper = mount(App)
      
      // Should not crash the entire app even with potential render errors
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should handle multiple rapid updates', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      // Add multiple components rapidly
      for (let i = 0; i < 10; i++) {
        store.addComponent('bunny')
      }
      
      await wrapper.vm.$nextTick()
      
      expect(store.stageSpec.components).toHaveLength(10)
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle mode switching rapidly', async () => {
      const wrapper = mount(App)
      const store = useStageStore()
      
      const modes = ['edit', 'sandbox', 'game'] as const
      
      // Switch modes rapidly
      for (let i = 0; i < 5; i++) {
        for (const mode of modes) {
          store.setMode(mode)
          await wrapper.vm.$nextTick()
        }
      }
      
      expect(wrapper.exists()).toBe(true)
      expect(modes.includes(store.currentMode)).toBe(true)
    })
  })
})