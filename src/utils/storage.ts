/**
 * Centralized Storage Utility for Knightfall.
 * 
 * This utility provides a type-safe wrapper around localStorage to prevent
 * key collisions, handle serialization/deserialization automatically,
 * and provide a single point of entry for all persistent state.
 * 
 * Why: Raw localStorage access is error-prone (key typos) and doesn't 
 * handle complex objects well without JSON.stringify/parse.
 */
import { logger } from './logger'

export const StorageKey = {
  AUTH_SESSION: 'kf_auth_session',
  USER_PROFILE: 'kf_user_profile',
  LAST_ANALYSIS_PGN: 'kf_last_analysis_pgn',
  LAST_ANALYSIS_ID: 'kf_last_analysis_id',
  LAST_ANALYSIS_VIEW_INDEX: 'kf_last_analysis_view_index',
  SETTINGS: 'kf_settings',
  GAME_HISTORY: 'kf_game_history',
  DISCLAIMER_ACCEPTED: 'kf_disclaimer_accepted',
  VAULT_SORT_BY: 'vault_sortBy',
  VAULT_SORT_ORDER: 'vault_sortOrder',
  VAULT_VIEW_MODE: 'vault_view_mode',
  VAULT_LIMIT: 'vault_limit',
  LICHESS_USERNAME: 'knightfall_lichess_username',
  LICHESS_TOKEN: 'knightfall_lichess_token',
  CHESSCOM_TOKEN: 'knightfall_chesscom_token',
  COMPLETED_QUESTS: 'knightfall_completed_quests',
  ADMIN_CACHE_HITS: 'admin_cache_hits',
  ADMIN_CACHE_MISSES: 'admin_cache_misses',
  ADMIN_TOTAL_TOKENS: 'admin_total_tokens',
  ADMIN_TOTAL_RESPONSES: 'admin_total_responses',
  ADMIN_AVG_LEN: 'admin_avg_len',
  ADMIN_MOVES_PLAYED: 'admin_moves_played',
  ADMIN_MOVES_ANALYZED: 'admin_moves_analyzed',
  BOARD_THEME: 'boardTheme',
  PIECE_THEME: 'pieceTheme',
  SOUND_ENABLED: 'soundEnabled',
  ENGINE_MULTI_PV: 'engineMultiPv',
  ANALYSIS_DEPTH: 'analysisDepth',
  ANIMATION_SPEED: 'animationSpeed',
  COACH_PERSONALITY: 'coachPersonality',
  SHOW_BEST_MOVE_ARROW: 'showBestMoveArrow',
  SHOW_THREAT_ARROW: 'showThreatArrow',
  ANALYSIS_SHOW_SUGGESTIONS: 'kf_analysis_show_suggestions',
  ANALYSIS_SHOW_COACH: 'kf_analysis_show_coach',
  ANALYSIS_SHOW_POSITIONAL_HEALTH: 'kf_analysis_show_positional_health',
  ANALYSIS_SHOW_CRITICAL_LINES: 'kf_analysis_show_critical_lines',
  ANALYSIS_SHOW_EVAL_BAR: 'kf_analysis_show_eval_bar',
  LICHESS_DAILY_PUZZLE: 'kf_lichess_daily_puzzle',
  LICHESS_DAILY_FETCH_DATE: 'kf_lichess_daily_fetch_date',
} as const;

export type StorageKeyType = typeof StorageKey[keyof typeof StorageKey];


export const Storage = {
  /**
   * Saves a value to localStorage.
   * @param key - The StorageKey to use
   * @param value - The value to save (will be JSON stringified)
   */
  set<T>(key: StorageKeyType, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      logger.error(`[Storage] Error saving key "${key}":`, error)
    }
  },

  /**
   * Retrieves a value from localStorage.
   * @param key - The StorageKey to retrieve
   * @param defaultValue - Optional fallback if key doesn't exist
   * @returns The parsed value or defaultValue (ensures T if defaultValue is T)
   */
  get<T>(key: StorageKeyType, defaultValue: T): T {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        // Fallback for legacy strings that weren't JSON-stringified
        return value as unknown as T;
      }
    } catch (error) {
      logger.error(`[Storage] Error reading key "${key}":`, error)
      return defaultValue
    }
  },

  /**
   * Removes a specific item from storage.
   * @param key - The StorageKey to remove
   */
  remove(key: StorageKeyType): void {
    localStorage.removeItem(key);
  },

  /**
   * Clears all Knightfall-related keys from storage.
   */
  clearAll(): void {
    Object.values(StorageKey).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};
