/**
 * Elo Rating System Implementation
 * 
 * This module provides the core logic for calculating rating changes
 * in the Knightfall ecosystem. We use the standard Elo formula:
 * Rn = Ro + K * (W - We)
 * 
 * Why? By centralizing this logic, we ensure that whether a user
 * finishes a vs-computer game, a puzzle, or a Gauntlet session,
 * the math governing their progression remains consistent.
 */

/**
 * The standard K-Factor determines how much a rating can change per game.
 * A higher K-Factor (e.g., 40) makes ratings volatile (better for new players).
 * A lower K-Factor (e.g., 20) makes ratings stable (better for established players).
 */
export const DEFAULT_K_FACTOR = 32;

/**
 * The starting rating for all new accounts.
 */
export const BASE_RATING = 1200;

/**
 * Calculates the expected score for a player based on their rating
 * and their opponent's rating.
 * 
 * @param playerRating - The current rating of the player
 * @param opponentRating - The rating of the opponent (or target difficulty)
 * @returns number - The probability of winning (0.0 to 1.0)
 */
export function getExpectedScore(playerRating: number, opponentRating: number): number {
    // The Elo formula uses a logistic curve with a base of 10
    // and a divisor of 400 (standard for chess).
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Calculates the new rating after a game has been completed.
 * 
 * @param currentRating - The player's rating before the game
 * @param opponentRating - The opponent's rating
 * @param result - 1.0 for a win, 0.5 for a draw, 0.0 for a loss
 * @param kFactor - Optional override for the K-Factor
 * @returns number - The newly calculated rating (rounded)
 */
export function calculateNewRating(
    currentRating: number,
    opponentRating: number,
    result: number,
    kFactor: number = DEFAULT_K_FACTOR
): number {
    const expectedScore = getExpectedScore(currentRating, opponentRating);
    const newRating = currentRating + kFactor * (result - expectedScore);
    
    // We always round to the nearest integer for display
    // and enforce a floor of 100 to prevent negative ratings.
    return Math.max(100, Math.round(newRating));
}

/**
 * Calculates the rating change (delta) for a completed game.
 * Useful for displaying " +12 " or " -8 " in the UI.
 */
export function getRatingDelta(
    currentRating: number,
    opponentRating: number,
    result: number,
    kFactor: number = DEFAULT_K_FACTOR
): number {
    const newRating = calculateNewRating(currentRating, opponentRating, result, kFactor);
    return newRating - currentRating;
}

/**
 * Composable wrapper for Vue components.
 * Allows components to reactive-ly access rating utilities.
 */
export function useRatingSystem() {
    return {
        BASE_RATING,
        DEFAULT_K_FACTOR,
        getExpectedScore,
        calculateNewRating,
        getRatingDelta
    };
}
