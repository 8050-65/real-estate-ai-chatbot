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
        <style dangerouslySetInnerHTML={{__html: `
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #ffffff;
            width: 100vw;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
        `}} />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
