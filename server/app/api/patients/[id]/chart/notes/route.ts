import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { noteSchema } from '@/lib/schemas';

type Params = { params: Promise<{ id: string }> };

/** POST /api/patients/:id/chart/notes — append a clinical note. */
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return notFound('Patient');
    if (!canAccessPatient(user, patient.assignedDoctor)) return forbidden();

    const parsed = await parseBody(request, noteSchema);
    if (!parsed.ok) return parsed.response;

    await prisma.chart.upsert({ where: { patientId: id }, create: { patientId: id }, update: {} });

    const note = await prisma.clinicalNote.create({
      data: { ...parsed.data, chartId: id },
    });

    return ok({
      note: {
        id: note.id,
        text: note.text,
        author: note.author,
        createdAt: note.createdAt.toISOString(),
      },
    }, 201);
  } catch (err) {
    console.error('[api/chart/notes POST]', err);
    return fail('Erreur serveur', 500);
  }
}
