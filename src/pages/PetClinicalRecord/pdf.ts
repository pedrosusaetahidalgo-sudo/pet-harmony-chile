/**
 * Generación del PDF de ficha clínica (HTML imprimible).
 * Extraído del god component en el split 2026-04-08.
 */

import { toast } from "sonner";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNative } from '@/lib/platform';
import type { PetData } from "./types";
import type { VetClinicalNote } from "@/hooks/useVetClinicalNotes";
import { calculateAge } from "./helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generatePDF(pet: PetData, records: any[], vetNotes?: VetClinicalNote[]) {
  const age = pet.birth_date ? calculateAge(pet.birth_date) : "No especificada";
  const now = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

  const allergies = [
    ...(pet.allergies_food || []).map(a => ({ type: "Alimentaria", name: a })),
    ...(pet.allergies_medication || []).map(a => ({ type: "Medicamento", name: a })),
    ...(pet.allergies_environmental || []).map(a => ({ type: "Ambiental", name: a })),
  ];

  const meds = pet.current_medications || [];

  const sortedRecords = [...records].sort((a, b) =>
    new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  const recordRows = sortedRecords.map(r => {
    const date = r.date || "";
    const formattedDate = date ? new Date(date).toLocaleDateString("es-CL") : "\u2014";
    return `<tr>
      <td>${formattedDate}</td>
      <td><span class="badge">${(r.record_type || "").toUpperCase()}</span></td>
      <td>${r.title || "\u2014"}</td>
      <td>${r.clinic_name || "\u2014"}</td>
      <td>${r.veterinarian_name || "\u2014"}</td>
    </tr>`;
  }).join("");

  // Build vet clinical notes section
  const sortedVetNotes = [...(vetNotes || [])].sort((a, b) => {
    const dateA = a.consultation_date || a.created_at;
    const dateB = b.consultation_date || b.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const vetNotesTypeLabels: Record<string, string> = {
    consulta: 'Consulta',
    vacuna: 'Vacuna',
    control: 'Control',
    cirugia: 'Cirugía',
    urgencia: 'Urgencia',
    otro: 'Otro',
  };

  const vetNotesHtml = sortedVetNotes.length > 0 ? `
  <div class="section" style="page-break-inside: avoid;">
    <div class="section-title">Notas Cl\u00ednicas Veterinarias (${sortedVetNotes.length})</div>
    ${sortedVetNotes.map(note => {
      const noteDate = note.consultation_date || note.created_at;
      const formattedDate = noteDate ? new Date(noteDate).toLocaleDateString("es-CL") : "\u2014";
      const typeLabel = vetNotesTypeLabels[note.note_type] || note.note_type;
      const isAudioTranscription = note.source === 'audio_transcription';

      let followupHtml = '';
      if (note.followup_required && note.followup_date) {
        const followupDate = new Date(note.followup_date).toLocaleDateString("es-CL");
        followupHtml = `
          <div style="margin-top: 4px; padding: 4px 8px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; font-size: 10px;">
            <strong style="color: #92400e;">Seguimiento:</strong> ${followupDate}${note.followup_reason ? ` \u2014 ${note.followup_reason}` : ''}
          </div>`;
      }

      return `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 10px; color: #666;">${formattedDate}</span>
          <span class="badge">${typeLabel.toUpperCase()}</span>
          ${isAudioTranscription ? '<span class="badge" style="background: #fef2f2; color: #dc2626;">TRANSCRIPCI\u00d3N DE AUDIO</span>' : ''}
        </div>
        <p style="font-weight: 600; font-size: 12px; margin-top: 4px;">${note.title}</p>
        ${note.description ? `<p style="font-size: 11px; color: #374151; margin-top: 2px;">${note.description}</p>` : ''}
        <p style="font-size: 10px; color: #666; margin-top: 4px;">Veterinario: ${note.provider_name || 'No especificado'}</p>
        ${followupHtml}
      </div>`;
    }).join("")}
  </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ficha Cl\u00ednica - ${pet.name}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { background: #f0f0f0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.5; max-width: 210mm; margin: 0 auto; background: white; padding: 18mm; min-height: 297mm; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
    /* Print: dejamos que @page maneje el margen y eliminamos el doble
       padding del body, el max-width y el box-shadow. Sin esto el PDF
       salía con texto diminuto y márgenes laterales gigantes. */
    @media print {
      html { background: white; }
      body {
        padding: 0;
        max-width: none;
        margin: 0;
        box-shadow: none;
        min-height: auto;
        font-size: 11pt;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 3px solid #7c3aed; margin-bottom: 20px; }
    .header h1 { font-size: 20px; color: #7c3aed; font-weight: 700; }
    .header .subtitle { font-size: 10px; color: #666; }
    .header .date { font-size: 10px; color: #999; text-align: right; }
    .header .logo { font-size: 22px; color: #7c3aed; font-weight: 800; display: flex; align-items: center; gap: 8px; letter-spacing: -0.5px; }
    .header .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #7c3aed, #a855f7); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(124,58,237,0.3); }

    .section { margin-bottom: 14px; }
    .section-title { font-size: 12px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px; }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 16px; }
    .field { display: flex; gap: 6px; padding: 2px 0; }
    .field .label { color: #666; font-weight: 500; min-width: 90px; flex-shrink: 0; }
    .field .value { color: #1a1a2e; font-weight: 600; }

    .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; }
    .alert-box .alert-title { font-weight: 700; color: #92400e; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
    .badge { display: inline-block; background: #ede9fe; color: #7c3aed; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }

    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
    tr:hover td { background: #faf5ff; }

    .footer { margin-top: 20px; padding-top: 10px; border-top: 2px solid #e5e7eb; text-align: center; color: #999; font-size: 9px; }
    .footer .brand { color: #7c3aed; font-weight: 700; }

    .med-item { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px; margin-bottom: 4px; }
    .med-name { font-weight: 700; color: #166534; }
    .med-detail { color: #666; font-size: 10px; }

    .no-data { color: #999; font-style: italic; }

    @media print {
      html { background: white; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-shadow: none; padding: 0; margin: 0; max-width: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#7c3aed;color:white;padding:12px 20px;text-align:center;font-size:13px;">
    Usa <strong>Ctrl+P</strong> (o Cmd+P) para guardar como PDF o imprimir &nbsp;|&nbsp;
    <a href="javascript:window.print()" style="color:white;text-decoration:underline;">Imprimir ahora</a>
  </div>

  <div class="header">
    <div>
      <h1>Ficha Cl\u00ednica Veterinaria</h1>
      <div class="subtitle">Documento generado digitalmente \u2014 pawfriend.cl</div>
    </div>
    <div class="date">
      <div class="logo"><div class="logo-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white"/></svg></div> Paw Friend</div>
      <div>Emitido: ${now}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Datos del Paciente</div>
    <div class="grid">
      <div class="field"><span class="label">Nombre:</span><span class="value">${pet.name}</span></div>
      <div class="field"><span class="label">Especie:</span><span class="value">${pet.species || "\u2014"}</span></div>
      <div class="field"><span class="label">Raza:</span><span class="value">${pet.breed || "No especificada"}</span></div>
      <div class="field"><span class="label">Sexo:</span><span class="value">${pet.gender || "\u2014"}</span></div>
      <div class="field"><span class="label">Edad:</span><span class="value">${age}</span></div>
      <div class="field"><span class="label">Peso:</span><span class="value">${pet.weight ? pet.weight + " kg" : "\u2014"}</span></div>
      <div class="field"><span class="label">Tama\u00f1o:</span><span class="value">${pet.size || "\u2014"}</span></div>
      <div class="field"><span class="label">Color:</span><span class="value">${pet.color || "\u2014"}</span></div>
      <div class="field"><span class="label">Microchip:</span><span class="value">${pet.microchip_number || "No registrado"}</span></div>
      <div class="field"><span class="label">Esterilizado:</span><span class="value">${pet.neutered ? "S\u00ed" : "No"}</span></div>
      <div class="field"><span class="label">Tipo sangre:</span><span class="value">${pet.blood_type || "\u2014"}</span></div>
      <div class="field"><span class="label">Adoptado:</span><span class="value">${pet.is_adopted ? "S\u00ed" : "No"}</span></div>
    </div>
  </div>

  ${allergies.length > 0 ? `
  <div class="section">
    <div class="section-title">Alergias</div>
    <div class="alert-box">
      ${allergies.map(a => `<div><strong>${a.type}:</strong> ${a.name}</div>`).join("")}
    </div>
  </div>` : ""}

  <div class="section">
    <div class="section-title">Medicamentos Actuales</div>
    ${meds.length > 0 ? meds.map((m) => `
      <div class="med-item">
        <span class="med-name">${m.name || "\u2014"}</span>
        <span class="med-detail">${m.dose ? " \u2014 " + m.dose : ""}${m.frequency ? " | " + m.frequency : ""}${m.since ? " | Desde: " + m.since : ""}</span>
      </div>
    `).join("") : '<p class="no-data">Sin medicamentos registrados</p>'}
  </div>

  <div class="section">
    <div class="section-title">Alimentaci\u00f3n y H\u00e1bitos</div>
    <div class="grid">
      <div class="field"><span class="label">Dieta:</span><span class="value">${pet.diet_type || "\u2014"}</span></div>
      <div class="field"><span class="label">Marca:</span><span class="value">${pet.diet_brand || "\u2014"}</span></div>
      <div class="field"><span class="label">Actividad:</span><span class="value">${pet.activity_level || "\u2014"}</span></div>
      <div class="field"><span class="label">Entorno:</span><span class="value">${pet.living_environment || "\u2014"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Contacto de Emergencia</div>
    <div class="grid">
      <div class="field"><span class="label">Veterinario:</span><span class="value">${pet.emergency_vet_name || "\u2014"}</span></div>
      <div class="field"><span class="label">Tel\u00e9fono:</span><span class="value">${pet.emergency_vet_phone || "\u2014"}</span></div>
      <div class="field"><span class="label">Cl\u00ednica:</span><span class="value">${pet.preferred_clinic || "\u2014"}</span></div>
      <div class="field"><span class="label">Seguro:</span><span class="value">${pet.insurance_provider || "\u2014"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Historial M\u00e9dico (${sortedRecords.length} registros)</div>
    ${sortedRecords.length > 0 ? `
    <table>
      <thead><tr><th>Fecha</th><th>Tipo</th><th>T\u00edtulo</th><th>Cl\u00ednica</th><th>Veterinario</th></tr></thead>
      <tbody>${recordRows}</tbody>
    </table>` : '<p class="no-data">Sin registros m\u00e9dicos</p>'}
  </div>

  ${vetNotesHtml}

  ${(pet.behavior_notes || pet.medical_notes || pet.special_needs) ? `
  <div class="section">
    <div class="section-title">Notas Adicionales</div>
    <p>${[pet.behavior_notes, pet.medical_notes, pet.special_needs].filter(Boolean).join(" | ")}</p>
  </div>` : ""}

  <div class="footer">
    <div class="brand">🐾 Paw Friend — pawfriend.cl</div>
    <div>Este documento es informativo y no reemplaza la evaluaci\u00f3n cl\u00ednica profesional.</div>
    <div>Documento privado \u2014 Solo para uso del tutor y profesionales autorizados.</div>
  </div>
</body>
</html>`;

  if (isNative()) {
    try {
      const fileName = `ficha_${pet.name}_${Date.now()}.html`;
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: btoa(unescape(encodeURIComponent(html))),
        directory: Directory.Cache,
      });
      await Share.share({
        title: `Ficha clínica de ${pet.name}`,
        url: saved.uri,
      });
      toast.success("Ficha clínica lista para compartir");
    } catch {
      toast.error("No se pudo generar la ficha");
    }
  } else {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
    toast.success("Ficha clínica generada — usa Ctrl+P para guardar como PDF");
  }
}
