
import React from 'react';
import { Mail, MapPin, Globe, Calendar } from 'lucide-react';
import { COMPANY_DETAILS } from '../constants';

const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-4">New York Headquarters</h2>
          <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">Secure your place in the city's future</h3>
          <p className="text-slate-600 text-lg">Our Manhattan-based advisors are ready to help you navigate the New York market.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 group hover:shadow-2xl transition-all duration-500">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-200">
              <MapPin size={32} />
            </div>
            <h4 className="text-2xl font-bold text-slate-900 mb-4">Empire State Hub</h4>
            <p className="text-slate-600 leading-relaxed mb-6 font-medium">
              {COMPANY_DETAILS.address}
            </p>
            <div className="pt-6 border-t border-slate-200 flex items-center text-blue-600 font-bold">
              <Globe size={18} className="mr-2" />
              <span>New York, NY — United States</span>
            </div>
          </div>

          <div className="bg-slate-950 p-10 rounded-[2.5rem] text-white group hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Calendar size={120} />
            </div>
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-900">
              <Mail size={32} />
            </div>
            <h4 className="text-2xl font-bold mb-4">Advisor Desk</h4>
            <p className="text-slate-300 leading-relaxed mb-8">
              Inquire about off-market listings, upcoming development launches, or request a custom valuation for your property.
            </p>
            <a 
              href={`mailto:${COMPANY_DETAILS.email}`} 
              className="inline-block bg-white text-slate-950 px-8 py-4 rounded-2xl font-bold hover:bg-blue-500 hover:text-white transition-all transform hover:-translate-y-1"
            >
              {COMPANY_DETAILS.email}
            </a>
          </div>
        </div>

        <div className="mt-20 p-10 bg-blue-600 rounded-[3rem] text-white text-center">
          <h4 className="text-2xl font-bold mb-2">Exclusive NYC Access?</h4>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">Connect with our Concierge AI for instant updates on non-public co-ops and pre-market investment opportunities.</p>
          <div className="flex justify-center space-x-6 flex-wrap gap-y-4">
             {['Park Views', 'Pre-War', 'Terraces', 'Keyed Elevator'].map(tag => (
               <div key={tag} className="flex items-center space-x-2 text-[10px] font-black opacity-80 uppercase tracking-[0.2em]">
                 <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                 <span>{tag}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
