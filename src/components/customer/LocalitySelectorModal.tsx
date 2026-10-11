import React from 'react';
import { useApp } from '../../context/AppContext';
import { LOCALITIES } from '../../data/initialData';
import { X, MapPin, Check, Navigation } from 'lucide-react';

export const LocalitySelectorModal: React.FC = () => {
  const {
    isLocalityModalOpen,
    setIsLocalityModalOpen,
    currentLocality,
    setCurrentLocality
  } = useApp();

  if (!isLocalityModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#c0c9c2]/50 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#c0c9c2]/40">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#e2e7ff] text-[#003523] flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#131b2e]">Select Your Neighborhood</h3>
              <p className="text-[11px] text-[#707973]">Kharar & Mohali Sector Coverage</p>
            </div>
          </div>
          <button
            onClick={() => setIsLocalityModalOpen(false)}
            className="p-1 rounded-lg text-[#707973] hover:text-[#131b2e]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          {LOCALITIES.map((loc) => {
            const isSelected = loc === currentLocality;
            return (
              <button
                key={loc}
                onClick={() => {
                  setCurrentLocality(loc);
                  setIsLocalityModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between border transition-all text-xs font-semibold ${
                  isSelected
                    ? 'border-[#003523] bg-[#c0edd3]/20 text-[#003523]'
                    : 'border-[#c0c9c2]/40 bg-[#faf8ff] hover:bg-[#eaedff] text-[#131b2e]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <MapPin
                    className={`w-4 h-4 ${
                      isSelected ? 'text-[#003523]' : 'text-[#707973]'
                    }`}
                  />
                  <span>{loc}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#003523]" />}
              </button>
            );
          })}
        </div>

        <div className="p-2.5 rounded-lg bg-[#f2f3ff] text-[11px] text-[#404943] text-center">
          Artisans stationed across Kharar West, Landran & Mohali for fast response.
        </div>
      </div>
    </div>
  );
};
