import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'RealEstate AI CRM',
  description: 'AI-powered CRM for real estate builders',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
          :root {
            --background: 0 0% 100%;
            --foreground: 0 0% 3.6%;
            --card: 0 0% 100%;
            --card-foreground: 0 0% 3.6%;
            --popover: 0 0% 100%;
            --popover-foreground: 0 0% 3.6%;
            --primary: 0 0% 9%;
            --primary-foreground: 0 0% 98%;
            --secondary: 0 0% 96.1%;
            --secondary-foreground: 0 0% 9%;
            --muted: 0 0% 89.1%;
            --muted-foreground: 0 0% 45.9%;
            --accent: 0 0% 9%;
            --accent-foreground: 0 0% 98%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 0 0% 98%;
            --border: 0 0% 89.1%;
            --input: 0 0% 89.1%;
            --ring: 0 0% 3.6%;
            --radius: 0.5rem;
          }

          .dark {
            --background: 0 0% 3.6%;
            --foreground: 0 0% 98%;
            --card: 0 0% 3.6%;
            --card-foreground: 0 0% 98%;
            --popover: 0 0% 3.6%;
            --popover-foreground: 0 0% 98%;
            --primary: 0 0% 98%;
            --primary-foreground: 0 0% 9%;
            --secondary: 0 0% 14.9%;
            --secondary-foreground: 0 0% 98%;
            --muted: 0 0% 14.9%;
            --muted-foreground: 0 0% 63.9%;
            --accent: 0 0% 98%;
            --accent-foreground: 0 0% 9%;
            --destructive: 0 62.8% 30.6%;
            --destructive-foreground: 0 0% 98%;
            --border: 0 0% 14.9%;
            --input: 0 0% 14.9%;
            --ring: 0 0% 83.3%;
          }

          * {
            border-color: hsl(var(--border));
          }

          html {
            scroll-behavior: smooth;
          }

          body {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          input, textarea, select {
            font-size: 16px;
          }
        `}</style>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
