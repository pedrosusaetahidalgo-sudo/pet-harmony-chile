export const MEDICAL_RECORD_TYPES = [
  // Consultas
  { value: "consulta_general", label: "Consulta general" },
  { value: "control_sano", label: "Control sano (preventivo)" },
  { value: "urgencia", label: "Urgencia" },
  { value: "seguimiento", label: "Consulta de seguimiento" },
  { value: "segunda_opinion", label: "Segunda opinión" },

  // Vacunas y prevención
  { value: "vacuna", label: "Vacuna" },
  { value: "desparasitacion", label: "Desparasitación" },
  { value: "antipulgas", label: "Antipulgas / garrapatas" },

  // Procedimientos
  { value: "cirugia", label: "Cirugía" },
  { value: "esterilizacion", label: "Esterilización / castración" },
  { value: "limpieza_dental", label: "Limpieza dental" },
  { value: "ecografia", label: "Ecografía" },
  { value: "rayos_x", label: "Rayos X" },
  { value: "examen_sangre", label: "Examen de sangre" },
  { value: "examen_orina", label: "Examen de orina" },

  // Tratamientos
  { value: "tratamiento", label: "Tratamiento / medicación" },
  { value: "quimioterapia", label: "Quimioterapia" },
  { value: "rehabilitacion", label: "Rehabilitación / fisioterapia" },
  { value: "hospitalizacion", label: "Hospitalización" },

  // Registros
  { value: "alergia", label: "Alergia detectada" },
  { value: "peso", label: "Control de peso" },
  { value: "microchip", label: "Implantación de microchip" },

  // Otros
  { value: "otro", label: "Otro" },
] as const;

export type MedicalRecordType = (typeof MEDICAL_RECORD_TYPES)[number]["value"];
