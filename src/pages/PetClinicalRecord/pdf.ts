/**
 * Generación del PDF de ficha clínica (HTML imprimible).
 * Extraído del god component en el split 2026-04-08.
 */

import { toast } from "sonner";
import type { PetData } from "./types";
import { calculateAge } from "./helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generatePDF(pet: PetData, records: any[]) {
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

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ficha Cl\u00ednica - ${pet.name}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { background: #f0f0f0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; font-size: 11px; line-height: 1.5; max-width: 210mm; margin: 0 auto; background: white; padding: 24mm; min-height: 297mm; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }

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

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }

  toast.success("Ficha cl\u00ednica generada \u2014 usa Ctrl+P para guardar como PDF");
}
