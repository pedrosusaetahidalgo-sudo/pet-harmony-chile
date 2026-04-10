/**
 * Edge Function: Generate Medical Summary PDF
 * Creates a comprehensive, professionally formatted PDF of a pet's medical records.
 * Order: Header → Pet info → Owner → Estado actual → Vacunas → Consultas → Desparasitaciones → Footer
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PURPLE = rgb(0.416, 0.227, 0.718); // #6A3AB7
const GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.85, 0.85, 0.85);
const BLACK = rgb(0, 0, 0);
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 50;
const MARGIN_BOTTOM = 60;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const { pet_id } = await req.json();
    if (!pet_id || typeof pet_id !== "string") throw new Error("pet_id is required");

    // Ownership check
    const { data: petOwnership, error: ownershipError } = await supabase
      .from("pets")
      .select("owner_id")
      .eq("id", pet_id)
      .single();

    if (ownershipError || !petOwnership) throw new Error("Pet not found");
    if (petOwnership.owner_id !== userData.user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Get all data
    const { data: summaryData, error: summaryError } = await supabase.rpc(
      "get_medical_summary_data",
      { p_pet_id: pet_id }
    );
    if (summaryError) throw summaryError;
    if (!summaryData) throw new Error("No data found");

    const pet = summaryData.pet;
    const owner = summaryData.owner;
    const vaccinations = (summaryData.vaccinations || []).sort((a: any, b: any) =>
      (b.date || "").localeCompare(a.date || "")
    );
    const recentVisits = (summaryData.recent_visits || []).sort((a: any, b: any) =>
      (b.visit_date || "").localeCompare(a.visit_date || "")
    );

    // Fetch dewormings separately
    const { data: dewormings } = await supabase
      .from("medical_records")
      .select("title, date, description")
      .eq("pet_id", pet_id)
      .in("record_type", ["desparasitacion", "antipulgas"])
      .order("date", { ascending: false })
      .limit(20);

    // === Build PDF ===
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - 40;

    const ensureSpace = (needed: number) => {
      if (y < MARGIN_BOTTOM + needed) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - 40;
      }
    };

    const text = (t: string, opts: { x?: number; size?: number; font?: any; color?: any; maxWidth?: number }) => {
      ensureSpace(20);
      const font = opts.font || helvetica;
      const size = opts.size || 10;
      // Truncate to fit
      let display = t;
      const maxW = opts.maxWidth || (PAGE_W - MARGIN_X * 2);
      while (font.widthOfTextAtSize(display, size) > maxW && display.length > 3) {
        display = display.slice(0, -4) + "...";
      }
      page.drawText(display, {
        x: opts.x || MARGIN_X,
        y,
        size,
        font,
        color: opts.color || BLACK,
      });
    };

    const line = () => {
      ensureSpace(10);
      page.drawLine({
        start: { x: MARGIN_X, y },
        end: { x: PAGE_W - MARGIN_X, y },
        thickness: 0.5,
        color: LIGHT_GRAY,
      });
      y -= 12;
    };

    const section = (title: string) => {
      ensureSpace(40);
      y -= 8;
      page.drawRectangle({
        x: MARGIN_X,
        y: y - 2,
        width: PAGE_W - MARGIN_X * 2,
        height: 20,
        color: rgb(0.95, 0.93, 1), // light purple bg
      });
      text(title, { size: 12, font: bold, color: PURPLE });
      y -= 18;
    };

    const field = (label: string, value: string) => {
      ensureSpace(16);
      text(label, { size: 9, font: bold, color: GRAY });
      text(value, { x: MARGIN_X + 140, size: 9 });
      y -= 14;
    };

    const formatDate = (d: string | null) => {
      if (!d) return "N/A";
      try {
        return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
      } catch {
        return d;
      }
    };

    // ── HEADER ──
    text("🐾 Paw Friend", { size: 22, font: bold, color: PURPLE });
    y -= 8;
    text("Ficha clínica veterinaria", { size: 11, color: GRAY });
    y -= 6;
    text(`Generado el ${new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}`, { size: 8, color: GRAY });
    y -= 10;
    line();

    // ── DATOS DE LA MASCOTA ──
    section("Datos de la mascota");

    const calcAge = (bd: string | null): string => {
      if (!bd) return "N/A";
      const years = Math.floor((Date.now() - new Date(bd).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (years < 1) {
        const months = Math.floor((Date.now() - new Date(bd).getTime()) / (30.44 * 24 * 60 * 60 * 1000));
        return `${months} mes${months !== 1 ? "es" : ""}`;
      }
      return `${years} año${years !== 1 ? "s" : ""}`;
    };

    field("Nombre", pet.name || "N/A");
    field("Especie / Raza", `${pet.species || "N/A"}${pet.breed ? ` — ${pet.breed}` : ""}`);
    field("Edad", `${calcAge(pet.birth_date)}${pet.birth_date ? ` (nac. ${formatDate(pet.birth_date)})` : ""}`);
    field("Sexo", pet.gender || "N/A");
    field("Peso", pet.weight ? `${pet.weight} kg` : "N/A");
    field("Esterilizado/a", pet.neutered ? "Sí" : "No");
    field("Microchip", pet.microchip_number || "No registrado");

    // ── DUEÑO ──
    section("Dueño/a");
    field("Nombre", owner.display_name || "N/A");
    field("Email", owner.email || "N/A");

    // ── ESTADO ACTUAL ──
    const hasAlerts = pet.chronic_conditions?.length || pet.allergies?.length || pet.current_medications;
    if (hasAlerts) {
      section("Estado actual");
      if (pet.chronic_conditions?.length) {
        field("Condiciones crónicas", pet.chronic_conditions.join(", "));
      }
      if (pet.allergies?.length) {
        field("Alergias", pet.allergies.join(", "));
      }
      if (pet.current_medications) {
        const meds = Array.isArray(pet.current_medications)
          ? pet.current_medications.map((m: any) => `${m.name}${m.dose ? ` (${m.dose})` : ""}`).join(", ")
          : JSON.stringify(pet.current_medications);
        field("Medicamentos actuales", meds);
      }
    }

    // ── VACUNAS (cronológico desc) ──
    section(`Vacunas (${vaccinations.length})`);
    if (vaccinations.length === 0) {
      text("Sin vacunas registradas", { size: 9, color: GRAY });
      y -= 14;
    } else {
      vaccinations.slice(0, 15).forEach((v: any) => {
        ensureSpace(16);
        text(`${formatDate(v.date)}`, { size: 8, font: bold, color: GRAY });
        text(v.title || "Vacuna", { x: MARGIN_X + 90, size: 9 });
        if (v.next_date) {
          text(`Próxima: ${formatDate(v.next_date)}`, { x: MARGIN_X + 350, size: 8, color: GRAY });
        }
        y -= 14;
      });
    }

    // ── CONSULTAS VETERINARIAS (cronológico desc) ──
    section(`Consultas veterinarias (${recentVisits.length})`);
    if (recentVisits.length === 0) {
      text("Sin consultas registradas", { size: 9, color: GRAY });
      y -= 14;
    } else {
      recentVisits.slice(0, 15).forEach((v: any) => {
        ensureSpace(40);
        text(formatDate(v.visit_date || v.date), { size: 8, font: bold, color: GRAY });
        text(v.reason || v.title || "Consulta", { x: MARGIN_X + 90, size: 9, font: bold });
        y -= 13;
        if (v.clinic_name) {
          text(`Clínica: ${v.clinic_name}`, { x: MARGIN_X + 20, size: 8, color: GRAY });
          y -= 12;
        }
        if (v.diagnosis) {
          text(`Diagnóstico: ${v.diagnosis}`, { x: MARGIN_X + 20, size: 8 });
          y -= 12;
        }
        y -= 4;
      });
    }

    // ── DESPARASITACIONES ──
    if (dewormings && dewormings.length > 0) {
      section(`Desparasitaciones (${dewormings.length})`);
      dewormings.slice(0, 10).forEach((d: any) => {
        ensureSpace(16);
        text(formatDate(d.date), { size: 8, font: bold, color: GRAY });
        text(d.title || "Desparasitación", { x: MARGIN_X + 90, size: 9 });
        y -= 14;
      });
    }

    // ── FOOTER en todas las páginas ──
    const totalPages = pdfDoc.getPageCount();
    const allPages = pdfDoc.getPages();
    for (let i = 0; i < totalPages; i++) {
      const p = allPages[i];
      const footerY = 25;
      p.drawText(
        `Generado por Paw Friend · pawfriend.cl · ${new Date().toLocaleDateString("es-CL")}`,
        { x: MARGIN_X, y: footerY, size: 7, font: helvetica, color: GRAY }
      );
      p.drawText(
        `Página ${i + 1} de ${totalPages}`,
        { x: PAGE_W - MARGIN_X - 60, y: footerY, size: 7, font: helvetica, color: GRAY }
      );
    }

    // Generate and upload
    const pdfBytes = await pdfDoc.save();
    const fileName = `ficha-${pet.name?.replace(/\s+/g, "-").toLowerCase() || pet_id}-${Date.now()}.pdf`;
    const filePath = `summaries/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("medical-documents")
      .upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData, error: urlError } = await supabase.storage
      .from("medical-documents")
      .createSignedUrl(filePath, 3600);
    if (urlError) throw urlError;

    return new Response(
      JSON.stringify({ success: true, download_url: urlData.signedUrl, file_path: filePath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error generating medical summary:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error al generar la ficha. Intenta de nuevo." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
