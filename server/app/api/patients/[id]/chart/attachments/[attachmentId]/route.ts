import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, unauthorized } from '@/lib/api';

type Params = { params: Promise<{ id: string; attachmentId: string }> };

async function guard(patientId: string) {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized() };

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return { error: notFound('Patient') };
  if (!canAccessPatient(user, patient.assignedDoctor)) return { error: forbidden() };

  return { user };
}

/** GET — fetches the full attachment including its base64 payload. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { id, attachmentId } = await params;
    const g = await guard(id);
    if ('error' in g) return g.error;

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, chartId: id },
    });
    if (!attachment) return notFound('Pièce jointe');

    return ok({
      attachment: {
        id: attachment.id,
        name: attachment.name,
        kind: attachment.kind,
        mimeType: attachment.mimeType,
        dataUrl: attachment.dataUrl,
        addedAt: attachment.addedAt.toISOString(),
        addedBy: attachment.addedBy,
      },
    });
  } catch (err) {
    console.error('[api/chart/attachments GET]', err);
    return fail('Erreur serveur', 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id, attachmentId } = await params;
    const g = await guard(id);
    if ('error' in g) return g.error;

    const result = await prisma.attachment.deleteMany({
      where: { id: attachmentId, chartId: id },
    });
    if (result.count === 0) return notFound('Pièce jointe');

    return ok({ success: true });
  } catch (err) {
    console.error('[api/chart/attachments DELETE]', err);
    return fail('Erreur serveur', 500);
  }
}
