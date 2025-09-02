import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(',') || [];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to get CORS headers
const getCorsHeaders = (origin: string | null) => {
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};

// Rate limiting function
const checkRateLimit = async (ip: string, endpoint: string): Promise<boolean> => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Check requests in the last minute (max 10 for chat)
    const { count: minuteCount } = await supabase
      .from('api_request_log')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('endpoint', endpoint)
      .gte('created_at', oneMinuteAgo);

    if ((minuteCount || 0) >= 10) {
      return false; // Rate limit exceeded
    }

    // Check requests in the last hour (max 100 for chat)
    const { count: hourCount } = await supabase
      .from('api_request_log')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('endpoint', endpoint)
      .gte('created_at', oneHourAgo);

    if ((hourCount || 0) >= 100) {
      return false; // Rate limit exceeded
    }

    // Log this request
    await supabase
      .from('api_request_log')
      .insert({ ip_address: ip, endpoint });

    return true; // Within rate limits
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true; // Allow on error to avoid blocking legitimate users
  }
};

const systemPrompt = `You are Mpho, a friendly and knowledgeable AI assistant for Tech Q.
Your job is to:
- Answer customer questions accurately about Tech Q's AI automation and web development services.
- Always be polite, concise, and use simple language.
- If you are not sure, ask the user to clarify or suggest contacting support.
- Never make up facts; only answer from your knowledge base and instructions.
- If the request is urgent or cannot be solved in chat, respond with:
  "I'm not sure I can help with that. Please provide your contact details, and our support team will reach out to you."

Tech Q offers:
- AI Automation services to streamline business processes
- Web Development for modern, responsive websites
- Custom solutions for businesses
- 24/7 support and consultation

For pricing and detailed consultations, direct users to contact the team.`;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const requestId = crypto.randomUUID();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0] || 
               req.headers.get("x-real-ip") || 
               "unknown";

    // Check rate limits
    const withinLimits = await checkRateLimit(ip, "chat-support");
    if (!withinLimits) {
      console.log(`Chat rate limit exceeded for IP: ${ip}, Request ID: ${requestId}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment before sending another message." }),
        { status: 429, headers: corsHeaders }
      );
    }

    // Parse and validate request body size
    const body = await req.text();
    if (body.length > 5000) { // 5KB limit for chat
      console.log(`Chat request too large for IP: ${ip}, Request ID: ${requestId}`);
      return new Response(
        JSON.stringify({ error: "Message too long" }),
        { status: 413, headers: corsHeaders }
      );
    }

    const { message, conversationHistory = [] } = JSON.parse(body);

    // Validate message length
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (message.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Message too long. Please keep it under 1000 characters." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate conversation history
    if (!Array.isArray(conversationHistory) || conversationHistory.length > 20) {
      return new Response(
        JSON.stringify({ error: "Invalid conversation history" }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Processing chat message - Request ID: ${requestId}, IP: ${ip}`);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Limit to last 10 messages
      { role: 'user', content: message.trim() }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`OpenAI API error - Request ID: ${requestId}:`, data?.error?.message || 'Unknown error');
      throw new Error('AI service temporarily unavailable');
    }
    
    if (!data.choices || !data.choices[0]) {
      console.error(`Invalid OpenAI response - Request ID: ${requestId}:`, data);
      throw new Error('Invalid AI response');
    }
    
    const botResponse = data.choices[0].message.content;

    console.log(`Chat response generated - Request ID: ${requestId}`);

    return new Response(JSON.stringify({ response: botResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error in chat-support - Request ID: ${requestId}:`, error.message);
    return new Response(JSON.stringify({ error: "Sorry, I'm having trouble right now. Please try again in a moment." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});