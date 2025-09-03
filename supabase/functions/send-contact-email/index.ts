import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const formData: ContactFormData = await req.json();
    
    console.log("Received contact form data:", formData);

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send email to business
    const businessEmailResponse = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: ["techqho@outlook.com"],
      subject: `New Contact Form Submission from ${formData.firstName} ${formData.lastName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        ${formData.phone ? `<p><strong>Phone:</strong> ${formData.phone}</p>` : ''}
        ${formData.company ? `<p><strong>Company:</strong> ${formData.company}</p>` : ''}
        ${formData.service ? `<p><strong>Service:</strong> ${formData.service}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${formData.message}</p>
        
        <hr>
        <p><em>This message was sent from your website contact form.</em></p>
      `,
    });

    console.log("Business email sent:", businessEmailResponse);

    // Send confirmation email to customer
    const confirmationEmailResponse = await resend.emails.send({
      from: "Tech QHO <onboarding@resend.dev>",
      to: [formData.email],
      subject: "Thank you for contacting us!",
      html: `
        <h2>Thank you for your message!</h2>
        <p>Dear ${formData.firstName},</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        
        <h3>Your message:</h3>
        <p>${formData.message}</p>
        
        <p>Best regards,<br>
        The Tech QHO Team</p>
        
        <hr>
        <p><em>Please do not reply to this email. If you need immediate assistance, contact us directly at techqho@outlook.com</em></p>
      `,
    });

    console.log("Confirmation email sent:", confirmationEmailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      businessEmail: businessEmailResponse,
      confirmationEmail: confirmationEmailResponse 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);