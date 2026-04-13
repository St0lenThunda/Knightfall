import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type BoardTheme = 'classic' | 'wood' | 'obsidian'

export const useSettingsStore = defineStore('settings', () => {
  const boardTheme = ref<BoardTheme>((localStorage.getItem('boardTheme') as BoardTheme) || 'classic')
  const soundEnabled = ref<boolean>(localStorage.getItem('soundEnabled') !== 'false')

  watch(boardTheme, (newTheme) => {
    localStorage.setItem('boardTheme', newTheme)
    document.documentElement.setAttribute('data-board-theme', newTheme)
  }, { immediate: true })

  watch(soundEnabled, (newVal) => {
    localStorage.setItem('soundEnabled', newVal.toString())
  }, { immediate: true })

  return { boardTheme, soundEnabled }
})
