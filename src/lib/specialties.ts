/**
 * Medical specialties offered in the signup and demo forms.
 *
 * Shared so the two forms cannot drift apart, and so stored values stay
 * consistent enough to group by later.
 */
export const SPECIALTIES = [
  'Médecine générale',
  'Cardiologie',
  'Dermatologie',
  'Gynécologie',
  'Pédiatrie',
  'Neurologie',
  'Ophtalmologie',
  'ORL',
  'Orthopédie',
  'Psychiatrie',
  'Radiologie',
  'Endocrinologie',
  'Gastro-entérologie',
  'Pneumologie',
  'Autre',
] as const;

export type Specialty = (typeof SPECIALTIES)[number];
