import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { chartUpdateSchema } from '@/lib/schemas';
import { serializeChart } from '@/lib/serializers';

type Params = { params: Promise<{ id: string }> };

const CHART_INCLUDE = {
  allergies: true,
  antecedents: true,
  problemesActifs: true,
  traitements: true,
  alertes: true,
  notes: { orderBy: { createdAt: 'desc' } },
  attachments: { orderBy: { addedAt: 'desc' } },
  vitals: true,
} as const;

/** Loads the patient and verifies the caller may see their chart. */
async function guard(patientId: string) {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized() };

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return { error: notFound('Patient') };
  if (!canAccessPatient(user, patient.assignedDoctor)) return { error: forbidden() };

  return { user, patient };
}

/**
 * GET /api/patients/:id/chart
 * Pass ?withAttachmentData=1 to include base64 blobs; omitted by default
 * because they can be megabytes each.
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ('error' in g) return g.error;

    const withData = new URL(request.url).searchParams.get('withAttachmentData') === '1';

    // The chart row is created alongside the patient, but upsert keeps this
    // safe for records migrated in before that guarantee existed.
    const chart = await prisma.chart.upsert({
      where: { patientId: id },
      create: { patientId: id },
      update: {},
      include: CHART_INCLUDE,
    });

    return ok({ chart: serializeChart(chart, withData) });
  } catch (err) {
    console.error('[api/patients/:id/chart GET]', err);
    return fail('Erreur serveur', 500);
  }
}

/**
 * PATCH /api/patients/:id/chart
 * Each supplied collection replaces its stored counterpart wholesale, which
 * matches how the frontend's `updateChart` already behaves. Collections that
 * are omitted are left untouched.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const g = await guard(id);
    if ('error' in g) return g.error;

    const parsed = await parseBody(request, chartUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;

    await prisma.$transaction(async tx => {
      await tx.chart.upsert({ where: { patientId: id }, create: { patientId: id }, update: {} });

      if (body.allergies) {
        await tx.allergy.deleteMany({ where: { chartId: id } });
        if (body.allergies.length) {
          await tx.allergy.createMany({
            data: body.allergies.map(a => ({ ...a, chartId: id })),
          });
        }
      }

      if (body.antecedents) {
        await tx.antecedent.deleteMany({ where: { chartId: id } });
        if (body.antecedents.length) {
          await tx.antecedent.createMany({
            data: body.antecedents.map(a => ({ ...a, chartId: id })),
          });
        }
      }

      if (body.problemesActifs) {
        await tx.activeProblem.deleteMany({ where: { chartId: id } });
        if (body.problemesActifs.length) {
          await tx.activeProblem.createMany({
            data: body.problemesActifs.map(p => ({
              ...p, status: p.status ?? 'active', chartId: id,
            })),
          });
        }
      }

      if (body.traitements) {
        await tx.chronicTreatment.deleteMany({ where: { chartId: id } });
        if (body.traitements.length) {
          await tx.chronicTreatment.createMany({
            data: body.traitements.map(t => ({ ...t, chartId: id })),
          });
        }
      }

      if (body.alertes) {
        await tx.medicalAlert.deleteMany({ where: { chartId: id } });
        if (body.alertes.length) {
          await tx.medicalAlert.createMany({
            data: body.alertes.map(a => ({ ...a, chartId: id })),
          });
        }
      }

      if (body.dernieresConstantes) {
        const existing = await tx.vitals.findUnique({ where: { chartId: id } });
        if (existing) {
          await tx.vitals.update({ where: { id: existing.id }, data: body.dernieresConstantes });
        } else {
          await tx.vitals.create({ data: { ...body.dernieresConstantes, chartId: id } });
        }
      }
    });

    const chart = await prisma.chart.findUniqueOrThrow({
      where: { patientId: id },
      include: CHART_INCLUDE,
    });

    return ok({ chart: serializeChart(chart) });
  } catch (err) {
    console.error('[api/patients/:id/chart PATCH]', err);
    return fail('Erreur serveur', 500);
  }
}
