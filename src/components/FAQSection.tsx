import React, { useState } from 'react';
import { FAQ_DATA } from '../data/tournamentData';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { sfx } from '../utils/sfx';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>("faq-1");
  const [search, setSearch] = useState('');

  const toggleFAQ = (id: string) => {
    sfx.playClick();
    setOpenId(prev => (prev === id ? null : id));
  };

  const filteredFaqs = FAQ_DATA.filter(f => 
    f.question.toLowerCase().includes(search.toLowerCase()) || 
    f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section id="faq" className="relative py-14 sm:py-16 bg-[#08080a] border-t border-white/5">
      {/* Background Decor */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-red-600/10 blur-[160px] pointer-events-none rounded-full"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-red-950/40 border border-red-600/30 text-[11px] font-tech font-bold uppercase tracking-widest text-[#ff3333] mb-2">
            <HelpCircle className="w-3 h-3" />
            <span>KNOWLEDGE BASE</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight mb-2">
            FREQUENTLY ASKED <span className="text-[#e10600]">QUESTIONS</span>
          </h2>

          <div className="w-14 h-0.5 bg-gradient-to-r from-transparent via-[#e10600] to-transparent mx-auto mb-4"></div>

          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
            Everything you need to know about game formats, payouts, participation rules, and Blackhawk Team operations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions (e.g. prizes, draw, BGMI, discord)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0c0c10] border border-white/10 rounded-lg font-tech text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors shadow-md"
          />
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-2.5">
          {filteredFaqs.length === 0 ? (
            <div className="p-6 text-center text-zinc-400 font-tech uppercase tracking-wider bg-[#0c0c10] rounded-xl border border-white/5 text-xs">
              No matching questions found. Try searching for "prize", "points", or "draw".
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openId === faq.id;

              return (
                <div
                  key={faq.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-[#0f0f15] border-red-600/50 shadow-[0_0_20px_rgba(225,6,0,0.15)]'
                      : 'bg-[#0b0b0f] border-white/10 hover:border-white/20'
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full p-3 sm:p-3.5 flex items-center justify-between text-left cursor-pointer gap-3"
                  >
                    <span className="font-display font-bold text-sm sm:text-base text-white uppercase tracking-wide">
                      {idx + 1}. {faq.question}
                    </span>

                    <div className="p-1 rounded bg-black/40 text-zinc-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#ff2a2a]" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 font-sans leading-relaxed border-t border-white/5 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
};
