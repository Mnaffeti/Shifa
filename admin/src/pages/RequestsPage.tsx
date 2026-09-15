import DoctorRequestsSection from '../components/DoctorRequestsSection';

interface Props {
  /** Fired after a request is accepted, so the pending badge can refresh. */
  onAccepted?: () => void;
}

/** Pending doctor account requests, awaiting an admin decision. */
export default function RequestsPage({ onAccepted }: Props) {
  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="mb-7">
        <h1 className="text-[30px] font-semibold text-text-primary tracking-tight leading-tight">
          Demandes de compte
        </h1>
        <p className="text-[14px] text-text-muted font-normal mt-1.5">
          Les médecins qui souhaitent rejoindre la plateforme
        </p>
      </header>

      <DoctorRequestsSection onAccepted={() => onAccepted?.()} />
    </div>
  );
}
