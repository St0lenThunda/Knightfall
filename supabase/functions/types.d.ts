/**
 * Minimal Deno types for IDE support when the Deno extension is not active.
 */
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

declare module "http/server" {
  export function serve(handler: (request: Request) => Promise<Response> | Response): void;
}

declare module "supabase" {
  export function createClient(url: string, key: string, options?: any): any;
}

declare module "chess.js" {
  export class Chess {
    constructor(fen?: string);
    loadPgn(pgn: string): void;
    history(options?: { verbose: boolean }): any[];
    moveNumber(): number;
    turn(): 'w' | 'b';
  }
}
