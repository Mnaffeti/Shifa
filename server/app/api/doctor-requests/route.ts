import { prisma } from '@/lib/prisma';
import { fail, ok, parseBody } from '@/lib/api';
import { doctorRequestSchema } from '@/lib/schemas';

/**
 * POST /api/doctor-requests — public: a doctor requests an account.
 *
 * No password is collected. An admin reviews the request in the back office
 * and, on acceptance, the server creates the account and issues a temporary
 * password for the admin to relay.
 */
export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, doctorRequestSchema);
    if (!parsed.ok) return parsed.response;

    const { name, matricule, specialty, phone } = parsed.data;
    const trimmedMatricule = matricule.trim();

    const existingAccount = await prisma.account.findUnique({ where: { matricule: trimmedMatricule } });
    if (existingAccount) return fail('Un compte existe déjà avec ce matricule', 409);

    const existingPending = await prisma.doctorRequest.findFirst({
      where: { matricule: trimmedMatricule, status: 'PENDING' },
    });
    if (existingPending) return fail('Une demande est déjà en attente pour ce matricule', 409);

    const doctorRequest = await prisma.doctorRequest.create({
      data: {
        name: name.trim(),
        matricule: trimmedMatricule,
        specialty,
        phone: phone.trim(),
      },
    });

    return ok({
      request: {
        id: doctorRequest.id,
        name: doctorRequest.name,
        matricule: doctorRequest.matricule,
        specialty: doctorRequest.specialty,
        phone: doctorRequest.phone,
        status: doctorRequest.status,
        createdAt: doctorRequest.createdAt.toISOString(),
      },
    }, 201);
  } catch (err) {
    console.error('[api/doctor-requests POST]', err);
    return fail('Erreur serveur', 500);
  }
}
