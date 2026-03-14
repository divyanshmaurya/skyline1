
import React from 'react';
import { ArrowRight, Landmark, Compass, Award } from 'lucide-react';

const Hero: React.FC = () => {
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
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-slate-950">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale-[0.2]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-[0.3em] uppercase">
              <span className="relative flex h-2 w-2 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Defining the New York Skyline
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter">
              A New <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Standard</span> for NYC.
            </h1>
            
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              Exclusive Manhattan penthouses and historic Brooklyn residences. Experience the pinnacle of New York real estate.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="#listings" 
                onClick={(e) => handleLinkClick(e, '#listings')}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold transition-all shadow-2xl shadow-blue-600/30 active:scale-95 group"
              >
                View Portfolio
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#contact" 
                onClick={(e) => handleLinkClick(e, '#contact')}
                className="flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white border border-white/10 px-10 py-5 rounded-2xl font-bold transition-all active:scale-95"
              >
                Consult an Advisor
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-10 border-t border-white/5 mt-8">
              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <Landmark className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Acquisitions</span>
                </div>
                <p className="text-white font-bold text-sm">Strategic Assets</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <Compass className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Locations</span>
                </div>
                <p className="text-white font-bold text-sm">Manhattan & Beyond</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Heritage</span>
                </div>
                <p className="text-white font-bold text-sm">Bespoke Service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
