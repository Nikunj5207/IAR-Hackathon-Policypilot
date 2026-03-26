import React from 'react';
import ProgressBar from './ProgressBar';

const ChecklistContent = ({ data }) => {
  if (!data) return <div className="p-4 text-gray-500">No checklist data available.</div>;

  const renderSection = (title, items, icon) => (
    <div className="mb-6">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy mb-3">
        <span>{icon}</span> {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <span className="text-lg mt-0.5">
              {item.status === 'completed' ? '✅' : item.status === 'attention' ? '⚠️' : '⭕'}
            </span>
            <span className={`text-sm ${item.status === 'completed' ? 'text-green-600 font-semibold' : 'text-navy font-medium'}`}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="p-1">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-navy uppercase tracking-widest">Progress to Application</span>
          <span className="text-lg font-black text-gold">{data.progress}%</span>
        </div>
        <ProgressBar progress={data.progress} />
      </div>

      {data.eligibility && renderSection('Eligibility Criteria', data.eligibility, '🔍')}
      {data.documents && renderSection('Required Documents', data.documents, '📄')}
      {data.steps && (
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy mb-3">
            <span>🚀</span> Application Steps
          </h3>
          <div className="space-y-4 ml-2 border-l-2 border-gold/30 pl-6">
            {data.steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-gold border-4 border-white shadow-sm"></div>
                <p className="text-sm font-semibold text-navy mb-1">Step {idx + 1}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.status && data.status.length > 0 && (
        <div className="mt-8 p-4 bg-navy/5 border border-navy/10 rounded-2xl">
          <h4 className="text-xs font-bold text-navy uppercase mb-3 px-1">Post-Application Tracking</h4>
          {data.status.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-navy/5 last:border-0">
              <span className="text-sm font-medium text-navy/70">{s.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                s.value === 'Done' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChecklistContent;
