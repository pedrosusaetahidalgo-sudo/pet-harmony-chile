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

    // Ownership check: verify the authenticated user owns this pet
    const { data: petOwnership, error: ownershipError } = await supabase
      .from("pets")
      .select("owner_id")
      .eq("id", pet_id)
      .single();

    if (ownershipError || !petOwnership) {
      throw new Error("Pet not found");
    }
    if (petOwnership.owner_id !== userData.user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
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

    // Crear PDF
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]); // US Letter
    const { height } = page.getSize();

    // Fuentes
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = height - 50;
    const PAGE_BOTTOM_MARGIN = 60;

    // Helper: dibuja una linea de texto. Si excede el bottom, crea nueva pagina y reasigna `page`.
    const drawLine = (
      text: string,
      opts: { size: number; bold?: boolean; spacing?: number }
    ) => {
      const spacing = opts.spacing ?? 15;
      if (yPosition < PAGE_BOTTOM_MARGIN) {
        page = pdfDoc.addPage([612, 792]);
        yPosition = page.getSize().height - 50;
      }
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size: opts.size,
        font: opts.bold ? helveticaBold : helvetica,
        color: rgb(0, 0, 0),
      });
      yPosition -= spacing;
    };

    // Encabezado
    drawLine("Resumen médico de la mascota", { size: 24, bold: true, spacing: 40 });

    // Información de la mascota
    drawLine("Información de la mascota", { size: 16, bold: true, spacing: 25 });

    const petInfo = [
      `Nombre: ${pet.name || "N/A"}`,
      `Especie: ${pet.species || "N/A"}`,
      `Raza: ${pet.breed || "N/A"}`,
      `Sexo: ${pet.gender || "N/A"}`,
      `Fecha de nacimiento: ${pet.birth_date || "N/A"}`,
      `Peso: ${pet.weight ? `${pet.weight} kg` : "N/A"}`,
      `Microchip: ${pet.microchip_number || "N/A"}`,
      `Esterilizado: ${pet.neutered ? "Sí" : "No"}`,
    ];
    petInfo.forEach((line) => drawLine(line, { size: 10 }));

    // Alergias
    if (pet.allergies && pet.allergies.length > 0) {
      yPosition -= 10;
      drawLine("Alergias:", { size: 12, bold: true });
      drawLine(pet.allergies.join(", "), { size: 10, spacing: 20 });
    }

    // Condiciones crónicas
    if (pet.chronic_conditions && pet.chronic_conditions.length > 0) {
      drawLine("Condiciones crónicas:", { size: 12, bold: true });
      drawLine(pet.chronic_conditions.join(", "), { size: 10, spacing: 20 });
    }

    // Información del dueño
    yPosition -= 10;
    drawLine("Información del dueño", { size: 16, bold: true, spacing: 25 });

    const ownerInfo = [
      `Nombre: ${owner.display_name || "N/A"}`,
      `Email: ${owner.email || "N/A"}`,
    ];
    ownerInfo.forEach((line) => drawLine(line, { size: 10 }));

    // Vacunas
    if (vaccinations.length > 0) {
      yPosition -= 20;
      drawLine("Vacunas", { size: 16, bold: true, spacing: 25 });

      vaccinations.slice(0, 10).forEach((vacc: any) => {
        const line = `${vacc.title || "Vacuna"} - ${vacc.date || "N/A"}${
          vacc.next_date ? ` (Próxima: ${vacc.next_date})` : ""
        }`;
        drawLine(line, { size: 10 });
      });
    }

    // Visitas recientes
    if (recentVisits.length > 0) {
      yPosition -= 20;
      drawLine("Visitas recientes", { size: 16, bold: true, spacing: 25 });

      recentVisits.forEach((visit: any) => {
        drawLine(`Fecha: ${visit.visit_date || "N/A"}`, { size: 11, bold: true });
        if (visit.clinic_name) drawLine(`Clínica: ${visit.clinic_name}`, { size: 10 });
        if (visit.reason) drawLine(`Motivo: ${visit.reason}`, { size: 10 });
        if (visit.diagnosis) drawLine(`Diagnóstico: ${visit.diagnosis}`, { size: 10 });
        yPosition -= 10;
      });
    }

    // Footer en la última página
    const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
    lastPage.drawText(
      `Generado el ${new Date().toLocaleDateString("es-CL")}`,
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

