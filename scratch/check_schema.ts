import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('exercises').select('*').limit(1);
  if (error) {
    console.error('Error fetching exercises:', error);
  } else {
    console.log('Exercises columns:', data.length > 0 ? Object.keys(data[0]) : 'No data');
  }

  const { data: commData, error: commError } = await supabase.from('community_exercises').select('*').limit(1);
  if (commError) {
    console.error('Error fetching community_exercises:', commError);
  } else {
    console.log('Community Exercises columns:', commData.length > 0 ? Object.keys(commData[0]) : 'No data');
  }
}

checkSchema();
