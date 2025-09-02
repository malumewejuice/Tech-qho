import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
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

interface ContactEmailRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
  honeypot?: string; // Should be empty for legitimate submissions
}

// Input sanitization function
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets to prevent HTML injection
    .replace(/["\\']/g, (match) => `&#${match.charCodeAt(0)};`) // HTML encode quotes
    .trim();
};

// Validation functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)\.]{7,15}$/;
  return phoneRegex.test(phone);
};

const validateFormData = (data: ContactEmailRequest): string | null => {
  // Check honeypot - should be empty for legitimate submissions
  if (data.honeypot && data.honeypot.trim() !== '') {
    return 'Bot detected';
  }

  // Field presence validation
  if (!data.firstName?.trim()) return 'First name is required';
  if (!data.lastName?.trim()) return 'Last name is required';
  if (!data.email?.trim()) return 'Email is required';
  if (!data.phone?.trim()) return 'Phone is required';
  if (!data.company?.trim()) return 'Company is required';
  if (!data.service?.trim()) return 'Service is required';
  if (!data.message?.trim()) return 'Message is required';

  // Length validation
  if (data.firstName.length > 50) return 'First name too long';
  if (data.lastName.length > 50) return 'Last name too long';
  if (data.email.length > 100) return 'Email too long';
  if (data.phone.length > 20) return 'Phone too long';
  if (data.company.length > 100) return 'Company name too long';
  if (data.service.length > 100) return 'Service too long';
  if (data.message.length > 2000) return 'Message too long';

  // Format validation
  if (!isValidEmail(data.email)) return 'Invalid email format';
  if (!isValidPhone(data.phone)) return 'Invalid phone format';

  return null;
};

// Rate limiting function
const checkRateLimit = async (ip: string, endpoint: string): Promise<boolean> => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Check requests in the last minute (max 5)
    const { count: minuteCount } = await supabase
      .from('api_request_log')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('endpoint', endpoint)
      .gte('created_at', oneMinuteAgo);

    if ((minuteCount || 0) >= 5) {
      return false; // Rate limit exceeded
    }

    // Check requests in the last hour (max 50)
    const { count: hourCount } = await supabase
      .from('api_request_log')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('endpoint', endpoint)
      .gte('created_at', oneHourAgo);

    if ((hourCount || 0) >= 50) {
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

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0] || 
               req.headers.get("x-real-ip") || 
               "unknown";

    // Check rate limits
    const withinLimits = await checkRateLimit(ip, "send-contact-email");
    if (!withinLimits) {
      console.log(`Rate limit exceeded for IP: ${ip}, Request ID: ${requestId}`);
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
        { status: 429, headers: corsHeaders }
      );
    }

    // Parse and validate request body size
    const body = await req.text();
    if (body.length > 10000) { // 10KB limit
      console.log(`Request too large for IP: ${ip}, Request ID: ${requestId}`);
      return new Response(
        JSON.stringify({ success: false, error: "Request payload too large" }),
        { status: 413, headers: corsHeaders }
      );
    }

    const formData: ContactEmailRequest = JSON.parse(body);
    
    // Validate form data
    const validationError = validateFormData(formData);
    if (validationError) {
      console.log(`Validation failed for IP: ${ip}, Request ID: ${requestId}, Error: ${validationError}`);
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      firstName: sanitizeInput(formData.firstName),
      lastName: sanitizeInput(formData.lastName),
      email: sanitizeInput(formData.email),
      phone: sanitizeInput(formData.phone),
      company: sanitizeInput(formData.company),
      service: sanitizeInput(formData.service),
      message: sanitizeInput(formData.message),
    };

    console.log(`Processing contact form - Request ID: ${requestId}, IP: ${ip}`);

    // Send notification email to business
    const businessEmailResponse = await resend.emails.send({
      from: "Tech Q Contact Form <no-reply@techq.co.za>", // Use your domain once verified
      to: ["Techqho@outlook.com"],
      subject: `New Contact Form Submission from ${sanitizedData.firstName} ${sanitizedData.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0066cc; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${sanitizedData.firstName} ${sanitizedData.lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${sanitizedData.phone}">${sanitizedData.phone}</a></p>
            <p><strong>Company:</strong> ${sanitizedData.company}</p>
            <p><strong>Service Interest:</strong> ${sanitizedData.service}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #0066cc; margin-top: 0;">Message</h3>
            <p style="line-height: 1.6; white-space: pre-wrap;">${sanitizedData.message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              This email was sent from the Tech Q contact form on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.
            </p>
          </div>
        </div>
      `,
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Tech Q <no-reply@techq.co.za>", // Use your domain once verified
      to: [sanitizedData.email],
      subject: "Thank you for contacting Tech Q - We'll be in touch soon!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            Thank You for Contacting Tech Q!
          </h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Hi ${sanitizedData.firstName},
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for reaching out to Tech Q! We have received your message and our team will review it shortly.
          </p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0066cc; margin-top: 0;">What happens next?</h3>
            <ul style="line-height: 1.8;">
              <li>Our team will review your inquiry within 24 hours</li>
              <li>We'll contact you via email or phone to discuss your ${sanitizedData.service} needs</li>
              <li>We'll provide you with a customized solution proposal</li>
            </ul>
          </div>
          
          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #0066cc;">Your Message Summary:</p>
            <p style="margin: 10px 0 0 0; font-style: italic;">"${sanitizedData.message.substring(0, 100)}${sanitizedData.message.length > 100 ? '...' : ''}"</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            If you have any urgent questions, feel free to contact us directly at:
          </p>
          
          <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
            <p style="margin: 5px 0;"><strong>Email:</strong> Techqho@outlook.com</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> [Your Phone Number]</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
            Best regards,<br>
            <strong>The Tech Q Team</strong>
          </p>
        </div>
      `,
    });

    console.log(`Emails sent successfully - Request ID: ${requestId}, Business: ${businessEmailResponse.id}, Customer: ${customerEmailResponse.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emails sent successfully"
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error(`Error in send-contact-email - Request ID: ${requestId}:`, error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to send email" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);