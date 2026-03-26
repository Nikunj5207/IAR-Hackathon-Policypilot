import React from 'react';
import ChecklistContent from './ChecklistContent';

const ChecklistDrawer = ({ isOpen, onClose, data }) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-navy/40 backdrop-blur-sm z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      ></div>
      <aside 
        className={`fixed top-0 right-0 h-full w-[420px] max-w-full bg-white shadow-2xl z-[1001] transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <header className="p-6 bg-navy text-white flex items-center justify-between shadow-md">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Scheme Checklist</h2>
              <p className="text-xs text-gold/70 font-medium uppercase mt-1 tracking-widest">{data?.scheme_name || 'Loading...'}</p>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 bg-bg-app/30">
            {data ? (
              <ChecklistContent data={data} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                <div className="text-4xl animate-pulse">📋</div>
                <p className="text-sm font-medium">Select a scheme to view its checklist</p>
              </div>
            )}
          </div>
          
          <footer className="p-6 border-t border-gray-100 bg-white">
            <button 
              className="w-full py-4 bg-navy text-gold font-bold rounded-xl shadow-lg hover:bg-navy/90 hover:-translate-y-0.5 transition-all"
              onClick={() => console.log('Proceed to apply')}
            >
              PROCEED TO APPLY NOW →
            </button>
          </footer>
        </div>
      </aside>
    </>
  );
};

export default ChecklistDrawer;
