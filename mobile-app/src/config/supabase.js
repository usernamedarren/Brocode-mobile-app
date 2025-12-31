import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://glpepglnmtdxfwbuhhbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGVwZ2xubXRkeGZ3YnVoaGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTI2OTgsImV4cCI6MjA3ODA4ODY5OH0.-cylb6rCgMlfTGpBqQ1KdgLWdgRJfqFxkLA-eaM8mKc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
