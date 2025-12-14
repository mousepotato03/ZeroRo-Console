import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-10 px-6 mt-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-8">
        {/* Brand and Copyright */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-white mb-2">ATOM</h2>
          <p className="text-sm text-slate-400">&copy; Atom, 2020</p>
          <p className="text-sm text-slate-400">All Rights Reserved</p>
        </div>

        {/* Products */}
        <div>
          <h3 className="text-md font-semibold text-white mb-3">Products</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="#" className="hover:text-white">Analytics</Link></li>
            <li><Link href="#" className="hover:text-white">Activity</Link></li>
            <li><Link href="#" className="hover:text-white">Publishing</Link></li>
          </ul>
        </div>

        {/* Features */}
        <div>
          <h3 className="text-md font-semibold text-white mb-3">Features</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="#" className="hover:text-white">Influencers</Link></li>
            <li><Link href="#" className="hover:text-white">Content</Link></li>
            <li><Link href="#" className="hover:text-white">Resources</Link></li>
          </ul>
        </div>

        {/* Information */}
        <div>
          <h3 className="text-md font-semibold text-white mb-3">Information</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="#" className="hover:text-white">Product changes</Link></li>
            <li><Link href="#" className="hover:text-white">Company</Link></li>
            <li><Link href="#" className="hover:text-white">Careers</Link></li>
          </ul>
        </div>

        {/* About */}
        <div>
          <h3 className="text-md font-semibold text-white mb-3">About</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="#" className="hover:text-white">Contacts</Link></li>
            <li><Link href="#" className="hover:text-white">FAQ</Link></li>
            <li><Link href="#" className="hover:text-white">Support</Link></li>
          </ul>
        </div>
      </div>

      {/* Social Media and App Links */}
      <div className="max-w-7xl mx-auto border-t border-slate-700 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
        <div className="flex space-x-4 mb-4 md:mb-0">
          <Link href="#" className="text-slate-400 hover:text-white"><Facebook className="w-5 h-5" /></Link>
          <Link href="#" className="text-slate-400 hover:text-white"><Twitter className="w-5 h-5" /></Link>
          <Link href="#" className="text-slate-400 hover:text-white"><Instagram className="w-5 h-5" /></Link>
          <Link href="#" className="text-slate-400 hover:text-white"><Linkedin className="w-5 h-5" /></Link>
          <Link href="#" className="text-slate-400 hover:text-white"><Youtube className="w-5 h-5" /></Link>
        </div>
        <div className="flex space-x-4">
          <Link href="#" className="flex items-center bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2">
            <img src="/google-play-badge.png" alt="Google Play" className="h-6 mr-2" /> {/* Placeholder image */}
            <span className="text-sm font-medium">Google Play</span>
          </Link>
          <Link href="#" className="flex items-center bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2">
            <img src="/app-store-badge.png" alt="App Store" className="h-6 mr-2" /> {/* Placeholder image */}
            <span className="text-sm font-medium">App Store</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
