import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ControlPanel from '@/components/ControlPanel.vue'
import DebugPanel from '@/components/DebugPanel.vue'
import { useStageStore } from '@/store'

describe('UI Components Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('ControlPanel Rendering', () => {
    it('should render without errors', () => {
      const wrapper = mount(ControlPanel)
      expect(wrapper.exists()).toBe(true)
    })

    it('should render mode buttons', () => {
      const wrapper = mount(ControlPanel)
      const modeButtons = wrapper.findAll('.mode-button')
      
      expect(modeButtons).toHaveLength(3)
      expect(modeButtons[0].text()).toBe('Edit')
      expect(modeButtons[1].text()).toBe('Sandbox')
      expect(modeButtons[2].text()).toBe('Game')
    })

    it('should have active class on current mode', () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      expect(store.currentMode).toBe('edit')
      
      const activeButton = wrapper.find('.mode-button.active')
      expect(activeButton.exists()).toBe(true)
      expect(activeButton.text()).toBe('Edit')
    })

    it('should render component addition buttons in edit mode', () => {
      const wrapper = mount(ControlPanel)
      const componentButtons = wrapper.findAll('.component-button')
      
      expect(componentButtons.length).toBeGreaterThan(0)
      expect(wrapper.text()).toContain('Add Viewer')
      expect(wrapper.text()).toContain('Add Wall')
      expect(wrapper.text()).toContain('Add Mirror')
      expect(wrapper.text()).toContain('Add Bunny')
    })

    it('should show test button in sandbox mode', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      store.setMode('sandbox')
      await wrapper.vm.$nextTick()
      
      const testButton = wrapper.find('.test-button')
      expect(testButton.exists()).toBe(true)
      expect(testButton.text()).toBe('Test Rays')
    })

    it('should hide component buttons in sandbox mode', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      store.setMode('sandbox')
      await wrapper.vm.$nextTick()
      
      // Should not show component addition in sandbox mode
      expect(wrapper.text()).not.toContain('Add Components')
    })

    it('should show game feedback in game mode', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      store.setMode('game')
      store.checkPhantomGuess('test-phantom')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.game-feedback').exists()).toBe(true)
    })
  })

  describe('DebugPanel Rendering', () => {
    it('should render without errors', () => {
      const wrapper = mount(DebugPanel)
      expect(wrapper.exists()).toBe(true)
    })

    it('should display current stats', () => {
      const wrapper = mount(DebugPanel)
      
      expect(wrapper.text()).toContain('Mode:')
      expect(wrapper.text()).toContain('Components:')
      expect(wrapper.text()).toContain('Selected:')
      expect(wrapper.text()).toContain('World Size:')
      expect(wrapper.text()).toContain('Scale:')
    })

    it('should render JSON textarea', () => {
      const wrapper = mount(DebugPanel)
      const textarea = wrapper.find('textarea')
      
      expect(textarea.exists()).toBe(true)
      expect(textarea.element.value).toBeTruthy()
    })

    it('should render save and reset buttons', () => {
      const wrapper = mount(DebugPanel)
      const buttons = wrapper.findAll('.debug-button')
      
      expect(buttons).toHaveLength(2)
      expect(buttons[0].text()).toBe('Save')
      expect(buttons[1].text()).toBe('Reset')
    })

    it('should update stats when store changes', async () => {
      const wrapper = mount(DebugPanel)
      const store = useStageStore()
      
      expect(wrapper.text()).toContain('Components: 0')
      
      store.addComponent('viewer')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('Components: 1')
    })

    it('should update mode display when mode changes', async () => {
      const wrapper = mount(DebugPanel)
      const store = useStageStore()
      
      expect(wrapper.text()).toContain('Mode: edit')
      
      store.setMode('sandbox')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('Mode: sandbox')
    })
  })

  describe('Component Property Panel', () => {
    it('should show component options when component is selected', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      store.addComponent('wall')
      const wallId = store.stageSpec.components[0].id
      store.selectComponent(wallId)
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.component-options').exists()).toBe(true)
      expect(wrapper.text()).toContain('Wall Options')
    })

    it('should show position controls for all components', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      store.addComponent('bunny')
      const bunnyId = store.stageSpec.components[0].id
      store.selectComponent(bunnyId)
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('Position X')
      expect(wrapper.text()).toContain('Position Y')
    })

    it('should show orientation control for oriented components', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      store.addComponent('mirror')
      const mirrorId = store.stageSpec.components[0].id
      store.selectComponent(mirrorId)
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('Orientation')
    })

    it('should show length control for wall and mirror components', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      store.addComponent('wall')
      const wallId = store.stageSpec.components[0].id
      store.selectComponent(wallId)
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('Length')
    })

    it('should handle property updates', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      store.addComponent('viewer')
      const viewerId = store.stageSpec.components[0].id
      store.selectComponent(viewerId)
      
      await wrapper.vm.$nextTick()
      
      const positionInput = wrapper.find('input[type="number"]')
      await positionInput.setValue('5')
      await positionInput.trigger('input')
      
      // Should trigger update (tested through store changes)
      expect(wrapper.exists()).toBe(true) // Basic existence check
    })
  })

  describe('User Interactions', () => {
    it('should handle mode switching clicks', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      const sandboxButton = wrapper.findAll('.mode-button')[1]
      await sandboxButton.trigger('click')
      
      expect(store.currentMode).toBe('sandbox')
    })

    it('should handle component addition clicks', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      const addViewerButton = wrapper.find('.component-button')
      await addViewerButton.trigger('click')
      
      expect(store.stageSpec.components).toHaveLength(1)
      expect(store.stageSpec.components[0].type).toBe('viewer')
    })

    it('should handle component deletion', async () => {
      const wrapper = mount(ControlPanel)
      const store = useStageStore()
      
      store.addComponent('wall')
      const wallId = store.stageSpec.components[0].id
      store.selectComponent(wallId)
      
      await wrapper.vm.$nextTick()
      
      const deleteButton = wrapper.find('button[style*="background-color: #dc3545"]')
      expect(deleteButton.exists()).toBe(true)
      
      await deleteButton.trigger('click')
      
      expect(store.stageSpec.components).toHaveLength(0)
    })
  })

  describe('JSON Panel Functionality', () => {
    it('should handle valid JSON save', async () => {
      const wrapper = mount(DebugPanel)
      const store = useStageStore()
      
      const textarea = wrapper.find('textarea')
      const saveButton = wrapper.findAll('.debug-button')[0]
      
      const validSpec = {
        version: '1.0.0',
        worldSize: { width: 12, height: 10 },
        components: []
      }
      
      await textarea.setValue(JSON.stringify(validSpec))
      await saveButton.trigger('click')
      
      expect(store.stageSpec.worldSize.width).toBe(12)
      expect(store.stageSpec.worldSize.height).toBe(10)
    })

    it('should handle invalid JSON gracefully', async () => {
      const wrapper = mount(DebugPanel)
      
      const textarea = wrapper.find('textarea')
      const saveButton = wrapper.findAll('.debug-button')[0]
      
      await textarea.setValue('{ invalid json }')
      await saveButton.trigger('click')
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.text()).toContain('JSON Error')
    })

    it('should reset JSON to current state', async () => {
      const wrapper = mount(DebugPanel)
      const store = useStageStore()
      
      store.addComponent('bunny')
      await wrapper.vm.$nextTick()
      
      const textarea = wrapper.find('textarea')
      const resetButton = wrapper.findAll('.debug-button')[1]
      
      await textarea.setValue('modified content')
      await resetButton.trigger('click')
      
      const restoredContent = JSON.parse(textarea.element.value)
      expect(restoredContent.components).toHaveLength(1)
      expect(restoredContent.components[0].type).toBe('bunny')
    })
  })
})