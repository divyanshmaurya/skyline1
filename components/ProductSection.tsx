
import React, { useState } from 'react';
import { PROPERTIES } from '../constants';
import { PropertyType } from '../types';
import { MapPin, CheckCircle2, Tag } from 'lucide-react';

const ProductSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<PropertyType | 'All'>('All');

  const filteredProperties = activeCategory === 'All' 
    ? PROPERTIES 
    : PROPERTIES.filter(p => p.type === activeCategory);

  return (
    <section id="listings" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-4">Featured Portfolio</h2>
          <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Explore Prime Real Estate</h3>
          <p className="text-slate-600">From waterfront penthouses to expansive suburban villas, discover your next move within our handpicked selection of premium properties.</p>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              activeCategory === 'All' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Listings
          </button>
          {Object.values(PropertyType).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                activeCategory === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Property Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-10">
          {filteredProperties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 group flex flex-col h-full">
              <div className="relative h-80 overflow-hidden">
                <img src={prop.image} alt={prop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-6 left-6 flex space-x-2">
                  <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    {prop.type}
                  </span>
                  <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border border-white/20">
                    {prop.location}
                  </span>
                </div>
              </div>
              
              <div className="p-10 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-3xl font-black text-slate-900 tracking-tight">{prop.name}</h4>
                  <div className="flex items-center text-blue-600 font-bold">
                    <Tag size={16} className="mr-1" />
                    <span className="text-sm whitespace-nowrap">{prop.price}</span>
                  </div>
                </div>
                
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  {prop.description}
                </p>
                
                {prop.features && (
                  <div className="grid grid-cols-2 gap-4 mt-auto border-t border-slate-100 pt-8">
                    {prop.features.map((feat, i) => (
                      <div key={i} className="flex items-center text-xs text-slate-700 font-bold uppercase tracking-wider">
                        <CheckCircle2 size={14} className="text-blue-500 mr-2 shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
