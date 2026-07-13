import type { Metadata, Viewport } from 'next';
// Global CSS can only be imported from the root layout in the App Router —
// used by components/AdminBigCalendar.tsx, scoped to .rbc-* class names so
// it doesn't affect any other page even though it loads everywhere. Must
// come BEFORE globals.css: this file's own .admin-big-calendar overrides
// live in globals.css and need to win the cascade against react-big-calendar's
// defaults, which only happens if they're the later (not earlier) import.
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './globals.css';
import { Providers } from '@/components/Providers';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Flourishing Hub — IIT Bombay Student Wellness Center',
  description: 'Your comprehensive wellness companion at IIT Bombay. Track your wellbeing journey, attend workshops, and thrive.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
            __html: `try{var t=localStorage.getItem('fh-theme');document.documentElement.setAttribute('data-theme', (t==='dark'||t==='light-1')?t:'dark');}catch(e){}`,
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
