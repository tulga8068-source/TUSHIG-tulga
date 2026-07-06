import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Typeracer MN/EN',
  description: 'Монгол хэл дээрх хурдан шивэлтийн Typeracer тоглоом. Хурдаа сорьж WPM болон алдаагаа хянах боломжтой.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="mn" className={`${inter.variable}`}>
      <body className="antialiased font-sans bg-[#0d0f14]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
