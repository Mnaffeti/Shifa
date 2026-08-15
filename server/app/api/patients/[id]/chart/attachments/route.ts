import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { attachmentSchema } from '@/lib/schemas';

type Params = { params: Promise<{ id: string }> };

/** Roughly 8 MB of base64, i.e. ~6 MB of binary. */
const MAX_DATA_URL_CHARS = 8 * 1024 * 1024;

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return notFound('Patient');
    if (!canAccessPatient(user, patient.assignedDoctor)) return forbidden();

    const parsed = await parseBody(request, attachmentSchema);
    if (!parsed.ok) return parsed.response;

    const data = parsed.data;
    if (data.dataUrl.length > MAX_DATA_URL_CHARS) {
      return fail('Fichier trop volumineux (max ~6 Mo)', 413);
    }

    await prisma.chart.upsert({ where: { patientId: id }, create: { patientId: id }, update: {} });

    const attachment = await prisma.attachment.create({ data: { ...data, chartId: id } });

    // Echo metadata only — the client already holds the blob it just sent.
    return ok({
      attachment: {
        id: attachment.id,
        name: attachment.name,
        kind: attachment.kind,
        mimeType: attachment.mimeType,
        dataUrl: '',
        addedAt: attachment.addedAt.toISOString(),
        addedBy: attachment.addedBy,
      },
    }, 201);
  } catch (err) {
    console.error('[api/chart/attachments POST]', err);
    return fail('Erreur serveur', 500);
  }
}
