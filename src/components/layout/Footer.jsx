import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-navy-500 text-white py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Graceway logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="font-bold text-lg">Graceway Generation</span>
            </div>
            <p className="text-navy-200 text-sm leading-relaxed">
              Digital Discipleship Platform helping young believers grow spiritually and multiply the movement.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-navy-100">Platform</h4>
            <ul className="flex flex-col gap-2 text-sm text-navy-200">
              <li><Link href="/courses" className="hover:text-white transition-colors">Courses</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/certificates" className="hover:text-white transition-colors">Certificates</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-navy-100">Account</h4>
            <ul className="flex flex-col gap-2 text-sm text-navy-200">
              <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-navy-400 mt-8 pt-8 text-center text-sm text-navy-200">
          <p>© {new Date().getFullYear()} Graceway Generation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
