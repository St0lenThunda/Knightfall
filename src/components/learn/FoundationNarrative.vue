<script setup lang="ts">
/**
 * FoundationNarrative — Phase 1: The Story
 *
 * Renders a single slide's narrative content alongside the chess board.
 * This is the "tell" phase of the Mentor's Path — the user reads the
 * story, absorbs the historical context, and explores the board freely.
 *
 * Why a separate component? Keeps the main FoundationLessonView under
 * 500 lines by extracting all narrative rendering logic. Also allows
 * independent styling and animation of the text panel.
 */
import type { FoundationSlide } from '../../types/foundationTypes'
import { renderMarkdown } from '../../utils/markdown'

/**
 * @prop slide - The current slide data to render
 * @prop currentIndex - Zero-based index of the current slide
 * @prop totalSlides - Total number of slides in this lesson
 * @prop hasChallenge - Whether this slide has a challenge to complete
 * @prop challengeCompleted - Whether the challenge (if any) has been completed
 */
const props = defineProps<{
  slide: FoundationSlide
  currentIndex: number
  totalSlides: number
  hasChallenge: boolean
  challengeCompleted: boolean
}>()

const emit = defineEmits<{
  /** Fired when the user clicks "Next" to advance to the next slide */
  (e: 'next'): void
  /** Fired when the user clicks "Skip to Challenge" to jump to the challenge */
  (e: 'skip-to-challenge'): void
}>()

/**
 * Determines whether the "Next" button should be enabled.
 *
 * If the slide has a challenge that hasn't been completed,
 * we still allow advancing — challenges are optional and low-stakes.
 * But we show different button text to encourage completion.
 */
function canAdvance(): boolean {
  return true
}

/**
 * Returns contextual button text based on the current state.
 *
 * Why? Gives the user clear feedback about what happens next —
 * are there more slides, a challenge to try, or is this the end?
 */
function getButtonText(): string {
  if (props.hasChallenge && !props.challengeCompleted) {
    return 'Try the Challenge →'
  }
  if (props.currentIndex < props.totalSlides - 1) {
    return 'Next →'
  }
  return 'Take the Quiz →'
}
</script>

<template>
  <div class="narrative-panel">
    <!-- Slide Counter Dots -->
    <div class="slide-dots">
      <span
        v-for="i in totalSlides"
        :key="i"
        class="dot"
        :class="{
          'dot-active': i - 1 === currentIndex,
          'dot-completed': i - 1 < currentIndex
        }"
      />
    </div>

    <!-- Title -->
    <h2 class="narrative-title">{{ slide.title }}</h2>

    <!-- Main Narrative Text -->
    <div class="narrative-body">
      <div
        v-for="(paragraph, idx) in slide.narrative.split('\n\n')"
        :key="idx"
        class="narrative-paragraph"
        v-html="renderMarkdown(paragraph)"
      >
      </div>
    </div>

    <!-- Historical Note (Did You Know?) -->
    <div v-if="slide.historicalNote" class="historical-note glass-sm">
      <div class="note-header">
        <span class="note-icon">📜</span>
        <span class="note-label">Did You Know?</span>
      </div>
      <div class="note-text" v-html="renderMarkdown(slide.historicalNote)"></div>
    </div>

    <!-- Board Description (What to Notice) -->
    <div class="board-caption">
      <span class="caption-icon">👁️</span>
      <div class="caption-text" v-html="renderMarkdown(slide.boardDescription)"></div>
    </div>

    <!-- Exploration Hint -->
    <div v-if="slide.explorationHint" class="exploration-hint">
      <span class="hint-icon">🎮</span>
      <div class="hint-text" v-html="renderMarkdown(slide.explorationHint)"></div>
    </div>

    <!-- Navigation -->
    <div class="narrative-actions">
      <button
        v-if="hasChallenge && !challengeCompleted"
        class="btn btn-ghost btn-sm"
        @click="emit('next')"
      >
        Skip Challenge →
      </button>
      <button
        class="btn btn-primary btn-lg narrative-next-btn"
        :disabled="!canAdvance()"
        @click="hasChallenge && !challengeCompleted ? emit('skip-to-challenge') : emit('next')"
      >
        {{ getButtonText() }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.narrative-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
  animation: fadeIn 0.5s var(--ease) both;
}

/* ─── SLIDE DOTS ─── */
.slide-dots {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  transition: all 0.3s var(--ease);
}

.dot-active {
  background: var(--gold);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
  transform: scale(1.3);
}

.dot-completed {
  background: var(--green);
}

/* ─── TITLE ─── */
.narrative-title {
  font-size: clamp(1.2rem, 2.5vw, 1.6rem);
  font-weight: 800;
  background: linear-gradient(135deg, var(--gold), #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

/* ─── BODY TEXT ─── */
.narrative-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.narrative-paragraph {
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-primary);
  opacity: 0.9;
}

.narrative-paragraph :deep(p) {
  margin: 0;
}

.narrative-paragraph :deep(strong) {
  color: var(--gold);
  font-weight: 700;
}

/* ─── HISTORICAL NOTE ─── */
.historical-note {
  padding: var(--space-4);
  border-left: 3px solid var(--gold);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.note-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.note-icon {
  font-size: 1.2rem;
}

.note-label {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gold);
}

.note-text {
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--text-secondary);
  font-style: italic;
}

.note-text :deep(p) {
  margin: 0;
}

.note-text :deep(strong) {
  color: var(--gold);
  font-weight: 700;
}

/* ─── BOARD CAPTION ─── */
.board-caption {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: 0.85rem;
  color: var(--text-secondary);
  padding: var(--space-3);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.caption-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.caption-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.caption-text :deep(p) {
  margin: 0;
}

.caption-text :deep(strong) {
  color: var(--text-primary);
  font-weight: 700;
}

/* ─── EXPLORATION HINT ─── */
.exploration-hint {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.85rem;
  color: var(--accent-bright);
  padding: var(--space-3);
  background: var(--accent-dim);
  border-radius: var(--radius-md);
  border: 1px solid rgba(139, 92, 246, 0.15);
  animation: pulse-glow 3s infinite;
}

.hint-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.hint-text {
  font-size: 0.85rem;
  color: var(--accent-bright);
  line-height: 1.5;
}

.hint-text :deep(p) {
  margin: 0;
}

.hint-text :deep(strong) {
  color: var(--text-primary);
  font-weight: 700;
}

/* ─── ACTIONS ─── */
.narrative-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.narrative-next-btn {
  min-width: 180px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

