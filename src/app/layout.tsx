import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wheel of Meals - Modern Meal Planning',
  description: 'Discover new meal ideas with our intelligent food selection platform',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen">
        <AuthProvider>
          <div id="smooth-wrapper">
            <div id="smooth-content">
              {children}
            </div>
          </div>
          <div className="custom-cursor hidden md:block"></div>
        </AuthProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', () => {
              const cursor = document.querySelector('.custom-cursor');
              if (cursor) {
                document.addEventListener('mousemove', (e) => {
                  cursor.setAttribute('style', 'top: ' + e.pageY + 'px; left: ' + e.pageX + 'px;');
                });
              }
            });
          `
        }} />
      </body>
    </html>
  );
} 