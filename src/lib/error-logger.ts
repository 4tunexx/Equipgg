import { createServerSupabaseClient } from './supabase';

interface ErrorLog {
  error_type: string;
  message: string;
  user_id?: string;
  metadata?: Record<string, any>;
  stack_trace?: string;
  created_at?: string;
}

export async function logError(error: Error, userId?: string, metadata?: Record<string, any>) {
  try {
    const supabase = createServerSupabaseClient();
    
    const errorLog: ErrorLog = {
      error_type: error.name,
      message: error.message,
      user_id: userId,
      metadata,
      stack_trace: error.stack,
      created_at: new Date().toISOString()
    };

    const { error: logError } = await supabase
      .from('error_logs')
      .insert(errorLog);

    if (logError) {
      console.error('Failed to log error:', logError);
    }
  } catch (loggingError) {
    console.error('Error logging failed:', loggingError);
  }
}

export async function getErrorLogs(userId?: string, limit = 100) {
  try {
    const supabase = createServerSupabaseClient();
    
    const query = supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (userId) {
      query.eq('user_id', userId);
    }
    
    const { data: logs, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return logs;
  } catch (error) {
    console.error('Failed to fetch error logs:', error);
    return [];
  }
}