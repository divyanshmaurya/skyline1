
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { COMPANY_DETAILS } from '../constants';

interface NavbarProps {
  isScrolled: boolean;
}

const Logo = ({ isScrolled }: { isScrolled: boolean }) => (
  <div className={`flex items-center group cursor-pointer transition-all duration-300 hover:scale-105 px-3 py-1.5 rounded-xl ${
    !isScrolled ? 'bg-white/10 backdrop-blur-md shadow-xl border border-white/10' : ''
  }`}>
    <div className="flex flex-col items-start leading-none">
      <span className={`font-black tracking-tighter text-xl ${isScrolled ? 'text-slate-900' : 'text-white'}`}>SKYLINE</span>
      <span className={`text-[8px] font-black tracking-[0.4em] uppercase ${isScrolled ? 'text-blue-600' : 'text-blue-400'}`}>Elite Realty</span>
    </div>
  </div>
);

const Navbar: React.FC<NavbarProps> = ({ isScrolled }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Portfolio', href: '#listings' },
    { name: 'About', href: '#about' },
    { name: 'Concierge', href: '#contact' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    
    if (element) {
      setIsOpen(false);
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled || isOpen ? 'bg-white shadow-xl py-2' : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <a href="#home" onClick={(e) => handleLinkClick(e, '#home')}>
            <Logo isScrolled={isScrolled} />
          </a>

          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:text-blue-500 ${
                  isScrolled ? 'text-slate-600' : 'text-white/90'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={isScrolled || isOpen ? 'text-slate-900' : 'text-white'}
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden absolute inset-x-0 top-[64px] bg-white shadow-2xl animate-in fade-in h-screen z-50 overflow-y-auto">
          <div className="px-8 pt-12 pb-24 flex flex-col space-y-8 text-center">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-4xl font-black text-slate-900 hover:text-blue-600 transition-colors uppercase tracking-tight"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
