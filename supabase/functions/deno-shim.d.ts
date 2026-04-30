/**
 * Knightfall Deno Shim
 * Provides global types for the IDE when the Deno extension is not properly initialized.
 */

declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };

  interface Crypto {
    subtle: SubtleCrypto;
  }
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: any): any;
}

declare module "https://esm.sh/chess.js@1.0.0-beta.7" {
  export class Chess {
    constructor(fen?: string);
    loadPgn(pgn: string): void;
    history(options?: { verbose: boolean }): any[];
    moveNumber(): number;
    turn(): 'w' | 'b';
  }
}


export {};
