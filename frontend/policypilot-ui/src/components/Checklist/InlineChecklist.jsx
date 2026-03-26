import React, { useRef, useEffect } from 'react';
import ChecklistContent from './ChecklistContent';

const InlineChecklist = ({ isExpanded, data, highlight }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (isExpanded && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isExpanded]);

  if (!isExpanded) return null;

  return (
    <div 
      ref={containerRef}
      className={`mt-4 p-6 bg-white rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
        highlight ? 'border-gold shadow-xl scale-[1.01]' : 'border-navy/10 shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-navy flex items-center gap-2">
          <span>📋</span> Requirements & Application Guide
        </h3>
        <span className="text-[10px] bg-navy text-gold px-2 py-1 rounded-md font-bold uppercase tracking-widest leading-none">Scheme ID: {data?.id || 'N/A'}</span>
      </div>
      
      <ChecklistContent data={data} />
      
      <div className="mt-8 flex gap-3">
        <button className="flex-1 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 transition-all shadow-md">
          Download PDF Guide
        </button>
        <button className="flex-1 py-3 bg-gold text-navy font-bold rounded-xl hover:bg-gold/90 transition-all shadow-md">
          Start Application
        </button>
      </div>
    </div>
  );
};

export default InlineChecklist;
