import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Flourishing Hub — IIT Bombay Student Wellness Center',
  description: 'Your comprehensive wellness companion at IIT Bombay. Track your wellbeing journey, attend workshops, and thrive.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.setAttribute('data-theme', localStorage.getItem('fh-theme') || 'dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-dark text-white antialiased">
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
