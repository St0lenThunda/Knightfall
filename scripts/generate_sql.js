import fs from 'fs';
const [,, startIdx, endIdx, batchName] = process.argv;
const data = JSON.parse(fs.readFileSync('scripts/temp_batch.json', 'utf8'));

const pqBatch = data.puzzle_queue.slice(parseInt(startIdx), parseInt(endIdx));
const ccBatch = data.coaching_cache.slice(parseInt(startIdx), parseInt(endIdx));

let sql = '';

// Puzzle Queue
sql += "INSERT INTO public.puzzle_queue (user_id, puzzle_id, next_review, repetition, interval_days, ease_factor) VALUES\n";
const pqRows = pqBatch.map(pq => 
  `('${pq.user_id}', '${pq.puzzle_id}', '${pq.next_review}', ${pq.repetition}, ${pq.interval_days}, ${pq.ease_factor})`
).join(',\n');
sql += pqRows + "\nON CONFLICT ON CONSTRAINT puzzle_queue_user_id_puzzle_id_key DO NOTHING;\n\n";

// Coaching Cache
sql += "INSERT INTO public.coaching_cache (position_hash, fen, theme, mistake_type, explanation_text, metadata) VALUES\n";
const ccRows = ccBatch.map(cc => {
  const metadata = JSON.stringify(cc.metadata).replace(/'/g, "''");
  const explanation = cc.explanation_text.replace(/'/g, "''");
  return `('${cc.position_hash}', '${cc.fen}', '${cc.theme}', '${cc.mistake_type}', '${explanation}', '${metadata}'::jsonb)`;
}).join(',\n');
sql += ccRows + "\nON CONFLICT ON CONSTRAINT coaching_cache_position_hash_key DO NOTHING;\n";

fs.writeFileSync(`scripts/${batchName}.sql`, sql);
console.log(`Generated scripts/${batchName}.sql`);
