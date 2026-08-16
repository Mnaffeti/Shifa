import type { OrdonnanceItem } from '../context/ConsultationContext';

/**
 * Reusable prescription templates.
 *
 * These are starting points, not clinical advice: the doctor edits dose,
 * frequency and duration per patient before signing. They exist to save
 * retyping the same four lines for common presentations, and the values
 * follow ordinary adult outpatient practice.
 *
 * Nothing here is applied automatically — a template only ever fills the
 * prescription form, which the doctor then reviews.
 */

export type TemplateCategory = 'infection' | 'douleur' | 'digestif' | 'respiratoire' | 'chronique';

/** A single line of a template — same shape as OrdonnanceItem minus its id. */
export type TemplateLine = Omit<OrdonnanceItem, 'id'>;

export interface PrescriptionTemplate {
  id: string;
  /** What the doctor searches for: the presentation, not the drug. */
  name: string;
  category: TemplateCategory;
  /** Shown under the name so the doctor can tell similar templates apart. */
  summary: string;
  items: TemplateLine[];
  /** Free-text caution shown when the template is previewed. */
  note?: string;
}

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  infection: 'Infections',
  douleur: 'Douleur & fièvre',
  respiratoire: 'Respiratoire',
  digestif: 'Digestif',
  chronique: 'Chronique',
};

export const TEMPLATES: PrescriptionTemplate[] = [
  // ── Douleur & fièvre ─────────────────────────────────────────────────────
  {
    id: 'tpl-grippe',
    name: 'Grippe / syndrome grippal',
    category: 'respiratoire',
    summary: 'Paracétamol + vitamine C + spray nasal',
    items: [
      {
        medication: 'Paracétamol 1 g',
        dosage: '1 comprimé',
        frequency: '3×/jour',
        duration: '5 jours',
        instructions: 'Espacer de 6 h minimum. Max 4 g/jour.',
      },
      {
        medication: 'Vitamine C 500 mg',
        dosage: '1 comprimé',
        frequency: '1×/jour',
        duration: '7 jours',
        instructions: 'Le matin, après le petit-déjeuner.',
      },
      {
        medication: 'Sérum physiologique (spray nasal)',
        dosage: '1 pulvérisation par narine',
        frequency: '3×/jour',
        duration: '5 jours',
        instructions: 'Se moucher avant application.',
      },
    ],
    note: 'Réévaluer si fièvre > 38,5 °C persistant au-delà de 3 jours.',
  },
  {
    id: 'tpl-cephalees',
    name: 'Céphalées',
    category: 'douleur',
    summary: 'Paracétamol, palier 1',
    items: [
      {
        medication: 'Paracétamol 1 g',
        dosage: '1 comprimé',
        frequency: 'Jusqu’à 3×/jour si douleur',
        duration: '5 jours',
        instructions: 'Espacer de 6 h. Ne pas dépasser 4 g/jour.',
      },
    ],
    note: 'Si céphalées inhabituelles, brutales ou avec signes neurologiques : avis urgent.',
  },
  {
    id: 'tpl-douleur-inflammatoire',
    name: 'Douleur inflammatoire',
    category: 'douleur',
    summary: 'AINS + protecteur gastrique',
    items: [
      {
        medication: 'Ibuprofène 400 mg',
        dosage: '1 comprimé',
        frequency: '3×/jour',
        duration: '5 jours',
        instructions: 'Pendant les repas.',
      },
      {
        medication: 'Oméprazole 20 mg',
        dosage: '1 gélule',
        frequency: '1×/jour',
        duration: '7 jours',
        instructions: 'Le matin à jeun, 30 min avant le petit-déjeuner.',
      },
    ],
    note: 'AINS contre-indiqués : ulcère évolutif, insuffisance rénale, 3ᵉ trimestre de grossesse.',
  },

  // ── Infections ───────────────────────────────────────────────────────────
  {
    id: 'tpl-angine-bacterienne',
    name: 'Angine bactérienne',
    category: 'infection',
    summary: 'Amoxicilline + antalgique',
    items: [
      {
        medication: 'Amoxicilline 1 g',
        dosage: '1 comprimé',
        frequency: '2×/jour',
        duration: '6 jours',
        instructions: 'Matin et soir, au cours des repas. Terminer le traitement.',
      },
      {
        medication: 'Paracétamol 1 g',
        dosage: '1 comprimé',
        frequency: '3×/jour si douleur',
        duration: '5 jours',
        instructions: 'Espacer de 6 h.',
      },
    ],
    note: 'Vérifier l’absence d’allergie aux bêta-lactamines avant prescription.',
  },
  {
    id: 'tpl-infection-urinaire',
    name: 'Infection urinaire simple',
    category: 'infection',
    summary: 'Fosfomycine dose unique',
    items: [
      {
        medication: 'Fosfomycine trométamol 3 g',
        dosage: '1 sachet',
        frequency: 'Dose unique',
        duration: '1 jour',
        instructions: 'Le soir au coucher, vessie vide, dilué dans un verre d’eau.',
      },
    ],
    note: 'Cystite simple de la femme non enceinte. ECBU si récidive ou échec.',
  },

  // ── Respiratoire ─────────────────────────────────────────────────────────
  {
    id: 'tpl-bronchite',
    name: 'Bronchite aiguë',
    category: 'respiratoire',
    summary: 'Antalgique + fluidifiant',
    items: [
      {
        medication: 'Paracétamol 1 g',
        dosage: '1 comprimé',
        frequency: '3×/jour',
        duration: '5 jours',
        instructions: 'Espacer de 6 h.',
      },
      {
        medication: 'Acétylcystéine 200 mg',
        dosage: '1 sachet',
        frequency: '3×/jour',
        duration: '7 jours',
        instructions: 'Dilué dans un verre d’eau, en dehors des repas.',
      },
    ],
    note: 'Origine virale le plus souvent : pas d’antibiotique en première intention.',
  },
  {
    id: 'tpl-rhinite-allergique',
    name: 'Rhinite allergique',
    category: 'respiratoire',
    summary: 'Antihistaminique + corticoïde nasal',
    items: [
      {
        medication: 'Cétirizine 10 mg',
        dosage: '1 comprimé',
        frequency: '1×/jour',
        duration: '15 jours',
        instructions: 'Le soir (somnolence possible).',
      },
      {
        medication: 'Budésonide (spray nasal)',
        dosage: '1 pulvérisation par narine',
        frequency: '2×/jour',
        duration: '1 mois',
        instructions: 'Après lavage de nez.',
      },
    ],
  },

  // ── Digestif ─────────────────────────────────────────────────────────────
  {
    id: 'tpl-gastro',
    name: 'Gastro-entérite',
    category: 'digestif',
    summary: 'Réhydratation + antiémétique + pansement',
    items: [
      {
        medication: 'Soluté de réhydratation orale',
        dosage: '1 sachet dans 200 ml d’eau',
        frequency: 'Après chaque selle liquide',
        duration: '3 jours',
        instructions: 'Boire par petites gorgées fréquentes.',
      },
      {
        medication: 'Racécadotril 100 mg',
        dosage: '1 gélule',
        frequency: '3×/jour',
        duration: '3 jours',
        instructions: 'Avant les repas. Arrêt dès normalisation des selles.',
      },
    ],
    note: 'Consulter en urgence si signes de déshydratation, sang dans les selles ou fièvre élevée.',
  },
  {
    id: 'tpl-rgo',
    name: 'Reflux gastro-œsophagien',
    category: 'digestif',
    summary: 'IPP 4 semaines',
    items: [
      {
        medication: 'Oméprazole 20 mg',
        dosage: '1 gélule',
        frequency: '1×/jour',
        duration: '1 mois',
        instructions: 'Le matin à jeun, 30 min avant le petit-déjeuner.',
      },
    ],
    note: 'Mesures associées : repas légers le soir, surélévation de la tête du lit.',
  },

  // ── Chronique ────────────────────────────────────────────────────────────
  {
    id: 'tpl-hta',
    name: 'HTA — renouvellement',
    category: 'chronique',
    summary: 'Amlodipine + périndopril, 3 mois',
    items: [
      {
        medication: 'Amlodipine 5 mg',
        dosage: '1 comprimé',
        frequency: '1×/jour',
        duration: '3 mois',
        instructions: 'Le matin.',
      },
      {
        medication: 'Périndopril 5 mg',
        dosage: '1 comprimé',
        frequency: '1×/jour',
        duration: '3 mois',
        instructions: 'Le matin, à distance des repas.',
      },
    ],
    note: 'Contrôle tensionnel et ionogramme avant renouvellement.',
  },
  {
    id: 'tpl-diabete-2',
    name: 'Diabète type 2 — renouvellement',
    category: 'chronique',
    summary: 'Metformine, 3 mois',
    items: [
      {
        medication: 'Metformine 850 mg',
        dosage: '1 comprimé',
        frequency: '2×/jour',
        duration: '3 mois',
        instructions: 'Pendant les repas (midi et soir).',
      },
    ],
    note: 'HbA1c et fonction rénale à contrôler tous les 3 mois.',
  },
];

/** Case- and accent-insensitive match on name, summary and medication names. */
export function searchTemplates(query: string): PrescriptionTemplate[] {
  const q = normalize(query);
  if (!q) return TEMPLATES;

  return TEMPLATES.filter(t =>
    normalize(`${t.name} ${t.summary} ${t.items.map(i => i.medication).join(' ')}`).includes(q),
  );
}

/** Strips diacritics so "cephalees" matches "Céphalées". */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    // Combining-diacritics block that NFD splits accents into.
    .replace(/[̀-ͯ]/g, '')
    .trim();
}
