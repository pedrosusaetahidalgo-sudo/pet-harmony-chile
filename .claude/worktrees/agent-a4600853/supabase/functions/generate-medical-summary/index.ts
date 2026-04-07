/**
 * Edge Function: Generate Medical Summary PDF
 * Creates a comprehensive PDF summary of a pet's medical records
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

    // Get medical summary data
    const { data: summaryData, error: summaryError } = await supabase.rpc(
      "get_medical_summary_data",
      { p_pet_id: pet_id }
    );

    if (summaryError) throw summaryError;
    if (!summaryData) throw new Error("No data found for pet");

    const pet = summaryData.pet;
    const owner = summaryData.owner;
    const vaccinations = summaryData.vaccinations || [];
    const recentVisits = summaryData.recent_visits || [];

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    const { width, height } = page.getSize();

    // Fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = height - 50;

    // Header
    page.drawText("Pet Medical Summary", {
      x: 50,
      y: yPosition,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Pet Information
    page.drawText("Pet Information", {
      x: 50,
      y: yPosition,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 25;

    const petInfo = [
      `Name: ${pet.name || "N/A"}`,
      `Species: ${pet.species || "N/A"}`,
      `Breed: ${pet.breed || "N/A"}`,
      `Gender: ${pet.gender || "N/A"}`,
      `Birth Date: ${pet.birth_date || "N/A"}`,
      `Weight: ${pet.weight ? `${pet.weight} kg` : "N/A"}`,
      `Microchip: ${pet.microchip_number || "N/A"}`,
      `Neutered: ${pet.neutered ? "Yes" : "No"}`,
    ];

    petInfo.forEach((line) => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    });

    // Allergies & Chronic Conditions
    if (pet.allergies && pet.allergies.length > 0) {
      yPosition -= 10;
      page.drawText("Allergies:", {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
      page.drawText(pet.allergies.join(", "), {
        x: 50,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    }

    if (pet.chronic_conditions && pet.chronic_conditions.length > 0) {
      page.drawText("Chronic Conditions:", {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
      page.drawText(pet.chronic_conditions.join(", "), {
        x: 50,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    }

    // Owner Information
    yPosition -= 10;
    page.drawText("Owner Information", {
      x: 50,
      y: yPosition,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 25;

    const ownerInfo = [
      `Name: ${owner.display_name || "N/A"}`,
      `Email: ${owner.email || "N/A"}`,
    ];

    ownerInfo.forEach((line) => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    });

    // Vaccinations
    if (vaccinations.length > 0) {
      yPosition -= 20;
      page.drawText("Vaccination Overview", {
        x: 50,
        y: yPosition,
        size: 16,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      yPosition -= 25;

      vaccinations.slice(0, 10).forEach((vacc: any) => {
        const line = `${vacc.title || "Vaccine"} - ${vacc.date || "N/A"}${
          vacc.next_date ? ` (Next: ${vacc.next_date})` : ""
        }`;
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helvetica,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
        if (yPosition < 50) {
          // New page if needed
          const newPage = pdfDoc.addPage([612, 792]);
          yPosition = newPage.getSize().height - 50;
        }
      });
    }

    // Recent Visits
    if (recentVisits.length > 0) {
      yPosition -= 20;
      page.drawText("Recent Visits", {
        x: 50,
        y: yPosition,
        size: 16,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      yPosition -= 25;

      recentVisits.forEach((visit: any) => {
        page.drawText(`Date: ${visit.visit_date || "N/A"}`, {
          x: 50,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;

        if (visit.clinic_name) {
          page.drawText(`Clinic: ${visit.clinic_name}`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
          yPosition -= 15;
        }

        if (visit.reason) {
          page.drawText(`Reason: ${visit.reason}`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
          yPosition -= 15;
        }

        if (visit.diagnosis) {
          page.drawText(`Diagnosis: ${visit.diagnosis}`, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
          yPosition -= 15;
        }

        yPosition -= 10;
        if (yPosition < 100) {
          const newPage = pdfDoc.addPage([612, 792]);
          yPosition = newPage.getSize().height - 50;
        }
      });
    }

    // Footer
    const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
    lastPage.drawText(
      `Generated on ${new Date().toLocaleDateString()}`,
      {
        x: 50,
        y: 30,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Upload to storage
    const fileName = `medical-summary-${pet_id}-${Date.now()}.pdf`;
    const filePath = `summaries/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("medical-documents")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Create signed URL (1 hour expiry)
    const { data: urlData, error: urlError } = await supabase.storage
      .from("medical-documents")
      .createSignedUrl(filePath, 3600);

    if (urlError) throw urlError;

    return new Response(
      JSON.stringify({
        success: true,
        download_url: urlData.signedUrl,
        file_path: filePath,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating medical summary:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to generate medical summary. Please try again later.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

