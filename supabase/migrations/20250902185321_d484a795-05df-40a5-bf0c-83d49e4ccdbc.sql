-- Fix the search path for the cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_api_request_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_request_log 
  WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;