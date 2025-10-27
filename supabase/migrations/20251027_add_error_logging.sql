CREATE TABLE IF NOT EXISTS error_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  error_type VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  user_id VARCHAR(255) REFERENCES users(id),
  metadata JSONB,
  stack_trace TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS error_logs_user_id_idx ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS error_logs_error_type_idx ON error_logs(error_type);

-- Add RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Only allow admin users to view error logs
CREATE POLICY admin_error_logs ON error_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Users can only see their own error logs
CREATE POLICY user_error_logs ON error_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());