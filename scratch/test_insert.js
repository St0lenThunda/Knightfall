import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    // 1. Try to insert into skill_nodes
    console.log('Inserting into skill_nodes...');
    const { data: insertedNode, error: nodeError } = await supabase
      .from('skill_nodes')
      .insert([
        {
          id: 'found-origins',
          title: 'Foundations: The Origin of Chess',
          category: 'Opening',
          requirements: []
        }
      ])
      .select();
      
    if (nodeError) {
      console.error('Error inserting node:', nodeError);
    } else {
      console.log('Inserted node:', insertedNode);
    }

    // 2. Try to insert progress
    console.log('Inserting into user_skill_progress...');
    // We need a user ID. Let's get a user ID from auth/profiles first.
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No profiles found in database.');
      return;
    }
    
    const userId = profiles[0].id;
    console.log('Using profile user ID:', userId);
    
    const { data: progress, error: progressError } = await supabase
      .from('user_skill_progress')
      .insert([
        {
          user_id: userId,
          node_id: 'found-origins'
        }
      ])
      .select();
      
    if (progressError) {
      console.error('Error inserting progress:', progressError);
    } else {
      console.log('Inserted progress successfully:', progress);
      
      // Cleanup progress
      await supabase
        .from('user_skill_progress')
        .delete()
        .eq('user_id', userId)
        .eq('node_id', 'found-origins');
    }

    // Cleanup node
    await supabase
      .from('skill_nodes')
      .delete()
      .eq('id', 'found-origins');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
