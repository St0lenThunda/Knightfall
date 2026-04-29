import { type Ref, computed } from 'vue'
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
 * Normalizes varied PGN date formats into ISO strings.
 */
function normalizeDate(d: string): string {
    if (!d || d.includes('?')) return new Date().toISOString();
    const clean = d.replace(/\./g, '-');
    const p = new Date(clean);
    return isNaN(p.getTime()) ? new Date().toISOString() : p.toISOString();
}

/**
 * Processes a collection of games into a chronological rating history.
 * 
 * @param games - Array of game records (PastGame or LibraryGame)
 * @param isMe - Optional function to determine if a username is the player
 * @returns Array of { date, rating } snapshots
 */
export function calculateRatingHistory(
    games: any[], 
    isMe?: (username: string) => boolean
): { date: string, rating: number }[] {
    let current = BASE_RATING;
    const history: { date: string, rating: number }[] = [];
    
    // 1. Deduplicate and Sort Chronologically
    const uniqueIds = new Set<string>();
    const sorted = [...games]
        .filter(g => {
            if (!g.id || uniqueIds.has(g.id)) return false;
            uniqueIds.add(g.id);
            return true;
        })
        .sort((a, b) => new Date(normalizeDate(a.date)).getTime() - new Date(normalizeDate(b.date)).getTime());
    
    // 2. Inject Starting Point
    if (sorted.length > 0) {
        const firstDate = new Date(normalizeDate(sorted[0].date));
        firstDate.setDate(firstDate.getDate() - 1);
        history.push({ date: firstDate.toISOString(), rating: BASE_RATING });
    } else {
        history.push({ date: new Date().toISOString(), rating: BASE_RATING });
    }

    // 3. Sequential Calculation
    sorted.forEach(g => {
        // Resolve result value
        let resultValue = 0.5;
        
        // Priority 1: Use persisted userSide if available
        // Priority 2: Use provided isMe predicate
        // Priority 3: Default to white
        const isWhite = g.userSide === 'white' || (g.userSide === undefined && isMe && isMe(g.white)) || (g.userSide === undefined && !isMe);

        if (g.result === 'win' || g.result === '1-0') {
            resultValue = isWhite ? 1.0 : 0.0;
        } else if (g.result === 'loss' || g.result === '0-1') {
            resultValue = isWhite ? 0.0 : 1.0;
        } else if (g.result.includes('1/2')) {
            resultValue = 0.5;
        }

        // Resolve opponent rating (handles both UserStore and LibraryStore formats)
        let oppRating = g.opponentRating;
        if (oppRating === undefined) {
            const oppRatingStr = isWhite ? g.blackElo : g.whiteElo;
            oppRating = oppRatingStr ? parseInt(oppRatingStr) : null;
        }
        
        // If we still don't have an opponent rating, we can't accurately calculate Elo change
        // but for the sake of progression we assume a balanced match or skip.
        if (oppRating === null || isNaN(oppRating)) {
            oppRating = current; 
        }

        current = calculateNewRating(current, oppRating, resultValue);
        history.push({ date: normalizeDate(g.date), rating: current });
    });

    return history;
}

/**
 * Composable wrapper for Vue components.
 * Allows components to reactive-ly access rating utilities and history.
 */
export function useRatingSystem(pastGames?: Ref<any[]>, isMe?: (username: string) => boolean) {
    const history = computed(() => {
        if (!pastGames || !pastGames.value) return [{ date: new Date().toISOString(), rating: BASE_RATING }];
        return calculateRatingHistory(pastGames.value, isMe);
    });

    const currentRating = computed(() => {
        return history.value.length > 0 ? history.value[history.value.length - 1].rating : BASE_RATING;
    });

    return {
        BASE_RATING,
        DEFAULT_K_FACTOR,
        history,
        currentRating,
        getExpectedScore,
        calculateNewRating,
        getRatingDelta
    };
}
