
import React from 'react';
import { COMPANY_DETAILS } from '../constants';

const FooterLogo = () => (
  <div className="flex items-center mb-6 transition-transform duration-300 hover:scale-105 bg-white p-3 rounded-2xl w-fit shadow-lg shadow-white/5">
    <div className="flex flex-col items-start leading-none p-2">
      <span className="font-black tracking-tighter text-2xl text-slate-900">SKYLINE</span>
      <span className="text-[8px] font-black tracking-[0.4em] uppercase text-blue-600">Elite Realty</span>
    </div>
  </div>
);

const Footer: React.FC = () => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    
    if (element) {
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
    <footer className="bg-slate-950 text-slate-400 py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-16 mb-16">
          <div className="col-span-1 md:col-span-1">
            <FooterLogo />
            <p className="text-sm leading-relaxed mb-6 font-medium">
              Curating New York's most exclusive portfolio of luxury residences and strategic investment assets.
            </p>
          </div>

          <div>
            <h4 className="text-white font-black mb-8 text-[10px] uppercase tracking-[0.3em]">Services</h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
              <li><a href="#home" onClick={(e) => handleLinkClick(e, '#home')} className="hover:text-blue-500 transition-colors">Home</a></li>
              <li><a href="#listings" onClick={(e) => handleLinkClick(e, '#listings')} className="hover:text-blue-500 transition-colors">Portfolios</a></li>
              <li><a href="#about" onClick={(e) => handleLinkClick(e, '#about')} className="hover:text-blue-500 transition-colors">NYC Advisory</a></li>
              <li><a href="#contact" onClick={(e) => handleLinkClick(e, '#contact')} className="hover:text-blue-500 transition-colors">Viewing Request</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black mb-8 text-[10px] uppercase tracking-[0.3em]">Manhattan Search</h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
              <li><a href="#listings" className="hover:text-blue-500 transition-colors">Penthouses</a></li>
              <li><a href="#listings" className="hover:text-blue-500 transition-colors">Condos</a></li>
              <li><a href="#listings" className="hover:text-blue-500 transition-colors">Townhouses</a></li>
              <li><a href="#listings" className="hover:text-blue-500 transition-colors">Office Space</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black mb-8 text-[10px] uppercase tracking-[0.3em]">NYC Headquarters</h4>
            <p className="text-[10px] leading-loose font-bold mb-6 uppercase tracking-wider">
              {COMPANY_DETAILS.address}
            </p>
            <div className="pt-6 border-t border-white/5">
              <a href={`mailto:${COMPANY_DETAILS.email}`} className="text-blue-500 font-black text-sm hover:text-blue-400 transition-colors">
                {COMPANY_DETAILS.email}
              </a>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">© {new Date().getFullYear()} Skyline Elite Realty NYC. Licensed Real Estate Broker. Member REBNY.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
