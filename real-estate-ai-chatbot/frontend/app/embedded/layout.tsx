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
    <>
      {children}
    </>
  );
}
