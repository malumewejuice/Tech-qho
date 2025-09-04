-- Fix RLS policy for api_request_log table to properly restrict access
-- This table contains sensitive IP addresses and should only be accessible by service role

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Service role can manage api_request_log" ON public.api_request_log;

-- Create a proper policy that only allows service role access
-- Service role bypasses RLS, but this provides additional security documentation
CREATE POLICY "Block all public access to api_request_log" 
ON public.api_request_log 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Ensure RLS remains enabled
ALTER TABLE public.api_request_log ENABLE ROW LEVEL SECURITY;

-- Add a comment explaining the security considerations
COMMENT ON TABLE public.api_request_log IS 'Contains sensitive IP addresses and activity patterns. Access restricted to service role only via edge functions for rate limiting.';