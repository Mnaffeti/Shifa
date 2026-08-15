/** Landing page listing the available endpoints, for quick manual checks. */
export default function Home() {
  const groups: Array<{ title: string; routes: string[] }> = [
    {
      title: 'Auth',
      routes: [
        'POST   /api/auth/login',
        'POST   /api/auth/signup',
        'POST   /api/auth/logout',
        'GET    /api/auth/me',
      ],
    },
    {
      title: 'Patients',
      routes: [
        'GET    /api/patients',
        'POST   /api/patients',
        'GET    /api/patients/:id',
        'PATCH  /api/patients/:id',
        'DELETE /api/patients/:id',
      ],
    },
    {
      title: 'Charts',
      routes: [
        'GET    /api/patients/:id/chart',
        'PATCH  /api/patients/:id/chart',
        'POST   /api/patients/:id/chart/notes',
        'DELETE /api/patients/:id/chart/notes/:noteId',
        'POST   /api/patients/:id/chart/attachments',
        'GET    /api/patients/:id/chart/attachments/:attachmentId',
        'DELETE /api/patients/:id/chart/attachments/:attachmentId',
      ],
    },
    {
      title: 'Appointments',
      routes: [
        'GET    /api/appointments',
        'POST   /api/appointments',
        'PATCH  /api/appointments/:id',
        'DELETE /api/appointments/:id',
      ],
    },
    {
      title: 'Consultations',
      routes: [
        'GET    /api/consultations',
        'POST   /api/consultations',
        'GET    /api/consultations/:id',
        'PATCH  /api/consultations/:id',
        'POST   /api/consultations/:id/sign',
        'POST   /api/consultations/:id/unlock',
        'POST   /api/consultations/:id/addenda',
      ],
    },
    {
      title: 'Reminders & waitlist',
      routes: [
        'GET    /api/reminders',
        'POST   /api/reminders',
        'PATCH  /api/reminders/:id',
        'DELETE /api/reminders/:id',
        'GET    /api/waitlist',
        'POST   /api/waitlist',
      ],
    },
  ];

  return (
    <main style={{ fontFamily: 'ui-monospace, monospace', padding: '2rem', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '1.25rem' }}>SHIFA API</h1>
      <p>
        <a href="/api/health">/api/health</a> — liveness + database check
      </p>
      {groups.map(g => (
        <section key={g.title}>
          <h2 style={{ fontSize: '0.95rem', marginBottom: 0 }}>{g.title}</h2>
          <pre style={{ margin: '0.25rem 0 1rem' }}>{g.routes.join('\n')}</pre>
        </section>
      ))}
    </main>
  );
}
