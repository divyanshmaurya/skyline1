
import React from 'react';
import { Target, Eye, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { COMPANY_DETAILS } from '../constants';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-24">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-blue-600 font-bold tracking-[0.3em] uppercase text-xs flex items-center">
                <span className="w-8 h-px bg-blue-600 mr-3"></span>
                The Skyline Elite Ethos
              </h2>
              <h3 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Navigating the <span className="text-blue-600">Complex</span> <br />
                NYC Landscape.
              </h3>
            </div>
            
            <div className="space-y-6">
              <p className="text-lg text-slate-700 leading-relaxed font-medium">
                Skyline Elite Realty is not just a brokerage; we are your strategic partners in New York's most competitive market. From Manhattan's glass towers to the tree-lined streets of Brooklyn Heights, we understand the soul of the city.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Whether you are navigating complex co-op board packages or seeking high-yield commercial assets in Midtown, our deep industry connections and market intelligence provide you with the ultimate advantage.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                  <ShieldCheck size={16} className="text-blue-600" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Licensed NY Brokerage</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                  <Award size={16} className="text-blue-600" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">REBNY Member</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-600/5 rounded-[3rem] blur-2xl group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="relative rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl aspect-[4/3] bg-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1600607687940-47a0928d330c?q=80&w=1200&auto=format&fit=crop" 
                alt="New York Luxury Interior View" 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-10">
                <p className="text-white font-bold italic text-lg leading-relaxed max-w-sm">
                  "Finding the extraordinary in every borough."
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-24">
          <div className="bg-slate-950 p-12 rounded-[3rem] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Target size={160} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-900/40">
                <Target size={32} />
              </div>
              <h4 className="text-3xl font-black tracking-tight">Precision Advisory</h4>
              <p className="text-slate-400 leading-relaxed text-lg">
                We provide the exact data and local insights needed to make confident decisions in a market that never waits.
              </p>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-blue-600">
              <Eye size={160} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-slate-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Eye size={32} />
              </div>
              <h4 className="text-3xl font-black tracking-tight text-slate-900">Iconic Vision</h4>
              <p className="text-slate-500 leading-relaxed text-lg">
                To steward the legacy of New York's historic homes while ushering in the next generation of architectural marvels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
