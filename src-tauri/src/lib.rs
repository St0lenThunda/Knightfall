use duckdb::{params, Connection};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use regex::Regex;
use serde::Serialize;

#[derive(Serialize)]
struct FileEntry {
    name: String,
    is_dir: bool,
    full_path: String,
}

/// A simple greeting command to verify the IPC bridge between the Vue frontend
/// and the Rust native backend.
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Global State for the native database.
/// We use a tokio::sync::Mutex to ensure the application remains responsive 
/// while queries are executing. std::sync::Mutex can block entire threads,
/// whereas tokio's version is designed for async environments.
struct DbManager {
    conn: Mutex<Connection>,
}

/// Executes a raw SQL query against the bundled DuckDB engine.
/// We mark this as async so it can yield back to the Tauri event loop
/// without blocking the UI.
#[tauri::command]
async fn run_query(state: tauri::State<'_, DbManager>, sql: String) -> std::result::Result<serde_json::Value, String> {
    let conn = state.conn.lock().await; // Non-blocking wait for the DB lock
    
    // We execute the heavy query logic inside a block to ensure we can
    // return early if errors occur.
    let results = {
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let column_names: Vec<String> = stmt.column_names();
        
        let rows = stmt.query_map([], |row| {
            let mut obj = serde_json::Map::new();
            for (i, name) in column_names.iter().enumerate() {
                let val = match row.get::<_, String>(i) {
                    Ok(s) => serde_json::Value::String(s),
                    Err(_) => {
                       match row.get::<_, f64>(i) {
                           Ok(n) => serde_json::Value::Number(serde_json::Number::from_f64(n).unwrap()),
                           Err(_) => serde_json::Value::Null
                       }
                    }
                };
                obj.insert(name.clone(), val);
            }
            Ok(serde_json::Value::Object(obj))
        }).map_err(|e| e.to_string())?;

        rows.collect::<Result<Vec<serde_json::Value>, _>>().map_err(|e| e.to_string())?
    };
    
    Ok(serde_json::Value::Array(results))
}


/// High-speed PGN Importer.
/// Reads a file from the local disk and streams it into the DuckDB engine.
/// We added periodic yielding to the tokio runtime to prevent this command
/// from "hogging" the CPU and making the application feel stalled.
#[tauri::command]
async fn import_pgn(state: tauri::State<'_, DbManager>, path: String) -> std::result::Result<usize, String> {
    let target_path = PathBuf::from(&path);
    if !target_path.exists() {
        return Err("File does not exist".to_string());
    }
    
    let absolute_path = target_path.canonicalize().map_err(|e| e.to_string())?;
    let file = File::open(absolute_path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);
    
    let mut conn = state.conn.lock().await;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS games (id VARCHAR PRIMARY KEY, pgn TEXT, white TEXT, black TEXT, result TEXT)",
        [],
    ).map_err(|e| e.to_string())?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    let mut game_count = 0;
    let mut current_pgn = String::new();
    let id_regex = Regex::new(r#"\[Event "([^"]+)"\]"#).unwrap();
    
    for line_result in reader.lines() {
        let line = line_result.map_err(|e| e.to_string())?;
        
        if line.starts_with("[Event ") && !current_pgn.is_empty() {
             let event_name = id_regex.captures(&current_pgn)
                 .and_then(|cap| cap.get(1))
                 .map(|m| m.as_str())
                 .unwrap_or("Unknown Event");
                 
             let id = format!("{}-{}", event_name, game_count);
             
             tx.execute(
                 "INSERT INTO games (id, pgn, white, black, result) VALUES (?, ?, ?, ?, ?)",
                 params![id, current_pgn, "Unknown", "Unknown", "Unknown"],
             ).map_err(|e| e.to_string())?;
             
             game_count += 1;
             current_pgn = String::new();

             // IMPORTANT: Yield every 100 games to allow other async tasks 
             // (like UI heartbeats or other commands) to run.
             if game_count % 100 == 0 {
                tokio::task::yield_now().await;
             }
        }
        
        current_pgn.push_str(&line);
        current_pgn.push('\n');
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(game_count)
}

/// Secure File Explorer.
/// Mark as async to keep the main thread responsive during file I/O.
#[tauri::command]
async fn list_directory(path: String) -> std::result::Result<Vec<FileEntry>, String> {
    let target_path = PathBuf::from(&path);
    
    if !target_path.exists() {
        return Err("Directory does not exist".to_string());
    }

    let absolute_path = target_path.canonicalize().map_err(|e| e.to_string())?;
    
    // Use spawn_blocking for directory traversal as it can be slow on large disks
    let entries = tokio::task::spawn_blocking(move || {
        let mut entries = Vec::new();
        let dir = std::fs::read_dir(absolute_path).map_err(|e| e.to_string())?;

        for entry_result in dir {
            let entry = entry_result.map_err(|e| e.to_string())?;
            let meta = entry.metadata().map_err(|e| e.to_string())?;
            
            entries.push(FileEntry {
                name: entry.file_name().to_string_lossy().into_owned(),
                is_dir: meta.is_dir(),
                full_path: entry.path().to_string_lossy().into_owned(),
            });
        }

        entries.sort_by(|a, b| {
            if a.is_dir && !b.is_dir {
                std::cmp::Ordering::Less
            } else if !a.is_dir && b.is_dir {
                std::cmp::Ordering::Greater
            } else {
                a.name.cmp(&b.name)
            }
        });
        Ok(entries)
    }).await.map_err(|e| e.to_string())??;

    Ok(entries)
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // Initialize the global DuckDB connection
      let conn = Connection::open_in_memory().expect("Failed to open DuckDB memory");
      app.manage(DbManager { conn: Mutex::new(conn) });

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![greet, run_query, import_pgn, list_directory])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
