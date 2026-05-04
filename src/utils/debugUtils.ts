/**
 * Knightfall Debug Utilities
 * 
 * Provides forensic tools for development and diagnostics.
 */

/**
 * Interface for the state required to generate a system snapshot.
 * This decouples the utility from specific store implementations.
 */
export interface SystemSnapshotData {
  gameId: string;
  mode: string;
  gameActive: boolean;
  turn: string;
  viewIdx: number;
  moveCount: number;
  fen: string;
  pgn: string;
  whiteTime: number;
  blackTime: number;
  suspicionScore: number;
  suspicionBreakdown: any;
  lastMoveDuration: number;
  sessionDuration: number;
  engine: {
    evalNumber?: number;
    suggestedMove?: string;
    currentDepth?: number;
  };
  currentDrill?: string[];
  drillIndex?: number;
  debugData?: Record<string, any>;
}

/**
 * Generates a formatted "Black Box" snapshot and copies it to the clipboard.
 * 
 * @param data - The current application state to snapshot
 * @returns string - The formatted metadata string
 */
export async function copySystemSnapshot(data: SystemSnapshotData): Promise<string> {
  const pgnWithEvent = data.debugData?.title 
    ? data.pgn.replace('[Event "?"]', `[Event "${data.debugData.title}"]`)
    : data.pgn;

  const metadata = [
    `--- KNIGHTFALL BLACK BOX SNAPSHOT ---`,
    `Timestamp: ${new Date().toISOString()}`,
    `App Version: ${import.meta.env.VITE_APP_VERSION || '0.0.0-dev'}`,
    `--------------------------------------`,
    `Game ID: ${data.gameId}`,
    `Mode: ${data.mode}`,
    `Active: ${data.gameActive}`,
    `Turn: ${data.turn} | Move: ${data.viewIdx}/${data.moveCount}`,
    `Clock W: ${data.whiteTime}s | Clock B: ${data.blackTime}s`,
    `--------------------------------------`,
    `[WARDEN TELEMETRY]`,
    `Suspicion: ${data.suspicionScore}/100`,
    `Breakdown: ${JSON.stringify(data.suspicionBreakdown)}`,
    `Last Move: ${data.lastMoveDuration}ms`,
    `Session: ${data.sessionDuration}s`,
    `--------------------------------------`,
    `[INTELLIGENCE FEED]`,
    `Eval: ${data.engine.evalNumber || 'N/A'}`,
    `Best Move: ${data.engine.suggestedMove || 'N/A'}`,
    `Engine Depth: ${data.engine.currentDepth || 0}`,
    `--------------------------------------`,
    `FEN: ${data.fen}`,
    `PGN: ${pgnWithEvent}`,
    `Solution: ${JSON.stringify(data.currentDrill || [])}`,
    `Step: ${data.drillIndex || 0}/${(data.currentDrill || []).length}`
  ];

  if (data.debugData && Object.keys(data.debugData).length > 0) {
    metadata.push(`Context: ${JSON.stringify(data.debugData)}`);
  }

  metadata.push(`--------------------------------------`);
  
  const finalMetadata = metadata.join('\n');
  
  // Console dump for deep inspection
  if (import.meta.env.DEV) {
    console.group('%c 🛠️ KNF System Snapshot ', 'background: #7c3aed; color: #fff; padding: 2px 4px; border-radius: 4px;');
    console.log('Snapshot Data:', data);
    console.groupEnd();
  }

  await navigator.clipboard.writeText(finalMetadata);
  return finalMetadata;
}
