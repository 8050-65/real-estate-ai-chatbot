import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leadrat Chat',
  description: 'Embedded chat widget',
  robots: 'noindex, nofollow',
};

export default function EmbeddedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#ffffff',
        width: '100vw',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}>
        {children}
      </body>
    </html>
  );
}
