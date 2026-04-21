import { invoke } from '@tauri-apps/api/core'
import { useUiStore } from '../stores/uiStore'

/**
 * Composable to manage the native DuckDB database connection.
 * We use Tauri's IPC to send SQL commands to our high-performance Rust backend.
 */
export function useDatabase() {
  const uiStore = useUiStore()

  /**
   * Executes a SQL query against the native DuckDB engine.
   * 
   * @param sql - The SQL command to run
   * @returns Promise<any[]> - The result rows as objects
   */
  async function execute(sql: string): Promise<any[]> {
    try {
      // Logic handled by our pure-Rust 'run_query' command in src-tauri/src/lib.rs
      const result = await invoke<any[]>('run_query', { sql })
      return result
    } catch (err: any) {
      const errorMsg = `DuckDB Error: ${err}`
      uiStore.addToast(errorMsg, 'error')
      throw new Error(errorMsg)
    }
  }

  return {
    execute
  }
}
