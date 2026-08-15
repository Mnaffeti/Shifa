import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, unauthorized } from '@/lib/api';

type Params = { params: Promise<{ id: string; noteId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id, noteId } = await params;
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return notFound('Patient');
    if (!canAccessPatient(user, patient.assignedDoctor)) return forbidden();

    // Scope the delete to this patient's chart so a valid note id from
    // another patient can't be removed through this route.
    const result = await prisma.clinicalNote.deleteMany({
      where: { id: noteId, chartId: id },
    });
    if (result.count === 0) return notFound('Note');

    return ok({ success: true });
  } catch (err) {
    console.error('[api/chart/notes DELETE]', err);
    return fail('Erreur serveur', 500);
  }
}
