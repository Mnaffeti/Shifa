import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { adminUpdateDoctorSchema } from '@/lib/schemas';
import { describeChanges, recordAudit } from '@/lib/audit';
import { trialDaysLeft } from '@/lib/trial';

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/doctors/:id — edit a doctor account. ADMIN only.
 *
 * Covers the three things the back office could not do before: revoke access
 * (`isActive: false`), fix a wrong name or matricule, and update contact
 * details. Revocation takes effect on the doctor's next request, since
 * getSessionUser re-reads the account row every time.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const { id } = await params;
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) return notFound('Compte');

    // This endpoint manages doctors. Editing an admin — including oneself —
    // must not be possible here, or an admin could revoke their own access
    // and lock the whole back office out with no way back in.
    if (existing.role !== 'DOCTOR') {
      return fail('Seuls les comptes médecins sont modifiables ici', 403);
    }

    const parsed = await parseBody(request, adminUpdateDoctorSchema);
    if (!parsed.ok) return parsed.response;

    const data = parsed.data;

    // The matricule is the sign-in identifier and is unique; rejecting a
    // collision here gives a clear message instead of an opaque 500 from the
    // database constraint.
    if (data.matricule && data.matricule.trim() !== existing.matricule) {
      const taken = await prisma.account.findUnique({
        where: { matricule: data.matricule.trim() },
      });
      if (taken) return fail('Un compte existe déjà avec ce matricule', 409);
    }

    // Preserve the "Dr." convention the rest of the app relies on.
    const newName = data.name === undefined
      ? undefined
      : (/^dr\.?\s/i.test(data.name.trim()) ? data.name.trim() : `Dr. ${data.name.trim()}`);

    const account = await prisma.$transaction(async tx => {
      const updated = await tx.account.update({
        where: { id },
        data: {
          ...(newName !== undefined ? { name: newName } : {}),
          ...(data.matricule !== undefined ? { matricule: data.matricule.trim() } : {}),
          ...(data.specialty !== undefined ? { specialty: data.specialty } : {}),
          ...(data.phone !== undefined ? { phone: data.phone.trim() } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });

      // Ownership follows doctorId, so a rename never detaches anything. But
      // patients, appointments and consultations also carry the name as a
      // printed label; refresh it so the UI does not keep showing the old one.
      //
      // Signed consultations are left alone on purpose: `doctor` there records
      // who signed the document, and a legal record must not be rewritten
      // after the fact.
      if (newName !== undefined) {
        await tx.patient.updateMany({ where: { doctorId: id }, data: { assignedDoctor: newName } });
        await tx.appointment.updateMany({ where: { doctorId: id }, data: { doctor: newName } });
        await tx.consultation.updateMany({
          where: { doctorId: id, status: 'draft' },
          data: { doctor: newName },
        });
      }

      return updated;
    });

    // Toggling access is a different event from editing details, so record it
    // as its own action rather than burying it in a field diff.
    if (data.isActive !== undefined && data.isActive !== existing.isActive) {
      await recordAudit({
        actor: user,
        action: data.isActive ? 'DOCTOR_ACTIVATED' : 'DOCTOR_DEACTIVATED',
        target: account,
      });
    }

    const changes = describeChanges(existing, account);
    if (changes) {
      await recordAudit({
        actor: user,
        action: 'DOCTOR_UPDATED',
        target: account,
        details: changes,
      });
    }

    return ok({
      doctor: {
        id: account.id,
        name: account.name,
        matricule: account.matricule,
        specialty: account.specialty,
        phone: account.phone,
        isActive: account.isActive,
        mustChangePassword: account.mustChangePassword,
        lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
        loginCount: account.loginCount,
        trialEndsAt: account.trialEndsAt?.toISOString() ?? null,
        trialDaysLeft: trialDaysLeft(account),
        createdAt: account.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[api/admin/doctors/:id PATCH]', err);
    return fail('Erreur serveur', 500);
  }
}

/**
 * DELETE /api/admin/doctors/:id — permanently remove a doctor account.
 *
 * Deliberately narrow: only an account that never signed in and owns no
 * patients can be deleted, which covers the real use case (a typo during
 * provisioning). Anything else must be deactivated instead — deleting a
 * clinician who has authored consultations would orphan medical records.
 */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const { id } = await params;
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) return notFound('Compte');
    if (existing.role !== 'DOCTOR') {
      return fail('Seuls les comptes médecins sont supprimables ici', 403);
    }

    const patients = await prisma.patient.count({
      where: { doctorId: existing.id },
    });

    if (patients > 0 || existing.lastLoginAt) {
      return fail(
        'Ce compte a déjà servi : désactivez-le plutôt que de le supprimer, ' +
        'afin de ne pas détacher les dossiers médicaux qui y sont rattachés.',
        409,
      );
    }

    await prisma.account.delete({ where: { id } });

    // Target the deleted account by label: the id no longer resolves.
    await recordAudit({
      actor: user,
      action: 'DOCTOR_DELETED',
      targetLabel: `${existing.name} (${existing.matricule ?? '—'})`,
    });

    return ok({ success: true });
  } catch (err) {
    console.error('[api/admin/doctors/:id DELETE]', err);
    return fail('Erreur serveur', 500);
  }
}
