import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { Storage, StorageKey } from '../utils/storage'

export type BoardTheme = 'classic' | 'wood' | 'obsidian' | 'echoes' | 'magma' | 'abyss' | 'aether'
export type PieceTheme = 'classic' | 'neo' | 'glass' | 'runic' | 'neon' | 'void' | 'token'
export type CoachPersonality = 'encouraging' | 'strict' | 'socratic'
export type MoveAnimationEffect = 'none' | 'fire' | 'ice'
export type MoveAnimationDensity = 'low' | 'medium' | 'high'
export type MoveAnimationLength = 'short' | 'normal' | 'long'

export const useSettingsStore = defineStore('settings', () => {
  const boardTheme = ref<BoardTheme>(Storage.get(StorageKey.BOARD_THEME, 'classic'))
  const pieceTheme = ref<PieceTheme>(Storage.get(StorageKey.PIECE_THEME, 'classic'))
  const soundEnabled = ref<boolean>(Storage.get(StorageKey.SOUND_ENABLED, true))
  
  // Engine Settings
  const engineMultiPv = ref<number>(Storage.get(StorageKey.ENGINE_MULTI_PV, 3))
  const analysisDepth = ref<number>(Storage.get(StorageKey.ANALYSIS_DEPTH, 12))
  
  // UI/UX
  const animationSpeed = ref<string>(Storage.get(StorageKey.ANIMATION_SPEED, 'normal'))
  const coachPersonality = ref<CoachPersonality>(Storage.get(StorageKey.COACH_PERSONALITY, 'encouraging'))
  const showBestMoveArrow = ref<boolean>(Storage.get(StorageKey.SHOW_BEST_MOVE_ARROW, true))
  const showThreatArrow = ref<boolean>(Storage.get(StorageKey.SHOW_THREAT_ARROW, true))
  const showCoordinates = ref<boolean>(Storage.get(StorageKey.SHOW_COORDINATES, false))
  const showPieceOutlines = ref<boolean>(Storage.get(StorageKey.SHOW_PIECE_OUTLINES, true))
  const moveAnimationEffect = ref<MoveAnimationEffect>(Storage.get(StorageKey.MOVE_ANIMATION_EFFECT, 'none'))
  const moveAnimationDensity = ref<MoveAnimationDensity>(Storage.get(StorageKey.MOVE_ANIMATION_DENSITY, 'medium'))
  const moveAnimationLength = ref<MoveAnimationLength>(Storage.get(StorageKey.MOVE_ANIMATION_LENGTH, 'normal'))

  // Analysis Visibility
  const analysisShowSuggestions = ref<boolean>(Storage.get(StorageKey.ANALYSIS_SHOW_SUGGESTIONS, true))
  const analysisShowCoach = ref<boolean>(Storage.get(StorageKey.ANALYSIS_SHOW_COACH, true))
  const analysisShowPositionalHealth = ref<boolean>(Storage.get(StorageKey.ANALYSIS_SHOW_POSITIONAL_HEALTH, true))
  const analysisShowCriticalLines = ref<boolean>(Storage.get(StorageKey.ANALYSIS_SHOW_CRITICAL_LINES, true))
  const analysisShowEvalBar = ref<boolean>(Storage.get(StorageKey.ANALYSIS_SHOW_EVAL_BAR, true))

  watch(boardTheme, (newTheme) => {
    Storage.set(StorageKey.BOARD_THEME, newTheme)
    document.documentElement.setAttribute('data-board-theme', newTheme)
  }, { immediate: true })

  watch(pieceTheme, (newVal) => Storage.set(StorageKey.PIECE_THEME, newVal))
  watch(soundEnabled, (newVal) => Storage.set(StorageKey.SOUND_ENABLED, newVal))
  watch(engineMultiPv, (newVal) => Storage.set(StorageKey.ENGINE_MULTI_PV, newVal))
  watch(analysisDepth, (newVal) => Storage.set(StorageKey.ANALYSIS_DEPTH, newVal))
  watch(animationSpeed, (newVal) => Storage.set(StorageKey.ANIMATION_SPEED, newVal))
  watch(coachPersonality, (newVal) => Storage.set(StorageKey.COACH_PERSONALITY, newVal))
  watch(showBestMoveArrow, (newVal) => Storage.set(StorageKey.SHOW_BEST_MOVE_ARROW, newVal))
  watch(showThreatArrow, (newVal) => Storage.set(StorageKey.SHOW_THREAT_ARROW, newVal))
  watch(showCoordinates, (newVal) => Storage.set(StorageKey.SHOW_COORDINATES, newVal))
  watch(showPieceOutlines, (newVal) => {
    Storage.set(StorageKey.SHOW_PIECE_OUTLINES, newVal)
    document.documentElement.setAttribute('data-piece-outlines', newVal ? 'true' : 'false')
  }, { immediate: true })
  watch(moveAnimationEffect, (newVal) => Storage.set(StorageKey.MOVE_ANIMATION_EFFECT, newVal))
  watch(moveAnimationDensity, (newVal) => Storage.set(StorageKey.MOVE_ANIMATION_DENSITY, newVal))
  watch(moveAnimationLength, (newVal) => Storage.set(StorageKey.MOVE_ANIMATION_LENGTH, newVal))

  watch(analysisShowSuggestions, (newVal) => Storage.set(StorageKey.ANALYSIS_SHOW_SUGGESTIONS, newVal))
  watch(analysisShowCoach, (newVal) => Storage.set(StorageKey.ANALYSIS_SHOW_COACH, newVal))
  watch(analysisShowPositionalHealth, (newVal) => Storage.set(StorageKey.ANALYSIS_SHOW_POSITIONAL_HEALTH, newVal))
  watch(analysisShowCriticalLines, (newVal) => Storage.set(StorageKey.ANALYSIS_SHOW_CRITICAL_LINES, newVal))
  watch(analysisShowEvalBar, (newVal) => Storage.set(StorageKey.ANALYSIS_SHOW_EVAL_BAR, newVal))

  /**
   * Mobile Eco-Mode: Auto-disable canvas particle move trails on mobile.
   * The MoveTrailCanvas component runs a requestAnimationFrame loop that
   * is unnecessarily expensive on battery-constrained phones.
   * Users can re-enable it manually in Settings if they want the effect.
   */
  if (
    typeof window !== 'undefined' &&
    (window.matchMedia('(max-width: 768px)').matches ||
     window.matchMedia('(pointer: coarse)').matches)
  ) {
    // Only override if the user hasn't explicitly set a preference before
    const storedEffect = Storage.get<string | null>(StorageKey.MOVE_ANIMATION_EFFECT, null)
    if (!storedEffect || storedEffect === 'none') {
      moveAnimationEffect.value = 'none'
    }
  }

  return { 
    boardTheme, pieceTheme, soundEnabled, 
    engineMultiPv, analysisDepth, 
    animationSpeed, coachPersonality, showBestMoveArrow, showThreatArrow, showCoordinates, showPieceOutlines, moveAnimationEffect,
    moveAnimationDensity, moveAnimationLength,
    analysisShowSuggestions, analysisShowCoach, analysisShowPositionalHealth,
    analysisShowCriticalLines, analysisShowEvalBar
  }
})
