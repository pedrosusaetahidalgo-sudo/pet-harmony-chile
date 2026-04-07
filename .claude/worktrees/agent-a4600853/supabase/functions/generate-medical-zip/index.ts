/**
 * Edge Function: Generate ZIP of all medical documents for a pet
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const { pet_id } = await req.json();

    if (!pet_id || typeof pet_id !== "string") {
      throw new Error("pet_id is required and must be a string");
    }

    // Get all documents for the pet
    const { data: documents, error: docsError } = await supabase
      .from("medical_documents")
      .select("id, file_url, title, type, mime_type")
      .eq("pet_id", pet_id);

    if (docsError) throw docsError;

    if (!documents || documents.length === 0) {
      throw new Error("No documents found for this pet");
    }

    // For now, return a list of signed URLs
    // In production, you would use a ZIP library like JSZip to create a ZIP file
    // This is a simplified version that returns signed URLs for all documents

    const signedUrls = await Promise.all(
      documents.map(async (doc) => {
        const { data: urlData, error: urlError } = await supabase.storage
          .from("medical-documents")
          .createSignedUrl(doc.file_url, 3600); // 1 hour expiry

        if (urlError) throw urlError;

        return {
          id: doc.id,
          title: doc.title,
          type: doc.type,
          url: urlData.signedUrl,
        };
      })
    );

    // Note: In a production environment, you would:
    // 1. Download all files
    // 2. Create a ZIP using JSZip or similar
    // 3. Upload the ZIP to storage
    // 4. Return a signed URL to the ZIP
    // For now, we return the list of signed URLs that can be downloaded individually

    return new Response(
      JSON.stringify({
        success: true,
        documents: signedUrls,
        message:
          "ZIP generation not yet implemented. Returning individual document URLs.",
        // TODO: Implement actual ZIP generation
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating medical ZIP:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to generate medical ZIP. Please try again later.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

