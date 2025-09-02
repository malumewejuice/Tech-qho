-- Create table for API rate limiting
CREATE TABLE public.api_request_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.api_request_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role access (functions will use service key to bypass RLS)
CREATE POLICY "Service role can manage api_request_log" 
ON public.api_request_log 
FOR ALL 
USING (false);

-- Create index for efficient rate limiting queries
CREATE INDEX idx_api_request_log_ip_endpoint_time 
ON public.api_request_log (ip_address, endpoint, created_at);

-- Create function to clean up old rate limiting logs (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_api_request_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_request_log 
  WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;