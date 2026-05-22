import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local
const envContent = fs.readFileSync('/Users/thunda/Desktop/Development/Knightfall/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

console.log('Connecting to Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data: nodes, error: nodesError } = await supabase
      .from('skill_nodes')
      .select('*');
    
    if (nodesError) {
      console.error('Error fetching skill_nodes:', nodesError);
    } else {
      console.log('Total skill_nodes:', nodes ? nodes.length : 0);
      console.log('Sample skill_nodes:', nodes ? nodes.slice(0, 3) : []);
    }

    const { data: progress, error: progressError } = await supabase
      .from('user_skill_progress')
      .select('*');
      
    if (progressError) {
      console.error('Error fetching user_skill_progress:', progressError);
    } else {
      console.log('Total user_skill_progress rows:', progress ? progress.length : 0);
      console.log('Sample user_skill_progress:', progress ? progress.slice(0, 5) : []);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
