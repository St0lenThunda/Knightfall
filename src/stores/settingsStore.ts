import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type BoardTheme = 'classic' | 'wood' | 'obsidian'
export type PieceTheme = 'classic' | 'neo' | 'glass'
export type CoachPersonality = 'encouraging' | 'strict' | 'socratic'

export const useSettingsStore = defineStore('settings', () => {
  const boardTheme = ref<BoardTheme>((localStorage.getItem('boardTheme') as BoardTheme) || 'classic')
  const pieceTheme = ref<PieceTheme>((localStorage.getItem('pieceTheme') as PieceTheme) || 'classic')
  const soundEnabled = ref<boolean>(localStorage.getItem('soundEnabled') !== 'false')
  
  // Engine Settings
  const engineMultiPv = ref<number>(parseInt(localStorage.getItem('engineMultiPv') || '3'))
  const analysisDepth = ref<number>(parseInt(localStorage.getItem('analysisDepth') || '12'))
  
  // UI/UX
  const animationSpeed = ref<string>(localStorage.getItem('animationSpeed') || 'normal')
  const coachPersonality = ref<CoachPersonality>((localStorage.getItem('coachPersonality') as CoachPersonality) || 'encouraging')
  const showBestMoveArrow = ref<boolean>(localStorage.getItem('showBestMoveArrow') !== 'false')
  const showThreatArrow = ref<boolean>(localStorage.getItem('showThreatArrow') !== 'false')

  watch(boardTheme, (newTheme) => {
    localStorage.setItem('boardTheme', newTheme)
    document.documentElement.setAttribute('data-board-theme', newTheme)
  }, { immediate: true })

  watch(pieceTheme, (newVal) => localStorage.setItem('pieceTheme', newVal))
  watch(soundEnabled, (newVal) => localStorage.setItem('soundEnabled', newVal.toString()))
  watch(engineMultiPv, (newVal) => localStorage.setItem('engineMultiPv', newVal.toString()))
  watch(analysisDepth, (newVal) => localStorage.setItem('analysisDepth', newVal.toString()))
  watch(animationSpeed, (newVal) => localStorage.setItem('animationSpeed', newVal))
  watch(coachPersonality, (newVal) => localStorage.setItem('coachPersonality', newVal))
  watch(showBestMoveArrow, (newVal) => localStorage.setItem('showBestMoveArrow', newVal.toString()))
  watch(showThreatArrow, (newVal) => localStorage.setItem('showThreatArrow', newVal.toString()))

  return { 
    boardTheme, pieceTheme, soundEnabled, 
    engineMultiPv, analysisDepth, 
    animationSpeed, coachPersonality, showBestMoveArrow, showThreatArrow
  }
})
