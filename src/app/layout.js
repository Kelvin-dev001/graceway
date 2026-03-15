import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Graceway Generation — Digital Discipleship Platform',
  description: 'Grow spiritually, earn certificates, and multiply the movement through structured discipleship training.',
  keywords: 'discipleship, faith, Christian, training, certificates, growth',
  openGraph: {
    title: 'Graceway Generation',
    description: 'Digital Discipleship Platform',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
