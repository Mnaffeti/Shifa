/**
 * Minimal root layout. This project is an API surface, not a rendered site —
 * Next.js just requires a root layout to exist.
 */
export const metadata = {
  title: 'SHIFA API',
  description: 'Backend API for the SHIFA medical workspace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
