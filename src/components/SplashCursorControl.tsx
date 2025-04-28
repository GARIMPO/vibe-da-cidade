import React, { useState, useEffect } from 'react';
import { Settings, EyeOff, Eye } from 'lucide-react';

interface SplashCursorControlProps {
  isEnabled: boolean;
  onToggle: () => void;
  intensity: number;
  onIntensityChange: (value: number) => void;
}

const SplashCursorControl: React.FC<SplashCursorControlProps> = ({
  isEnabled,
  onToggle,
  intensity,
  onIntensityChange
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div 
      className="fixed top-20 right-4 z-50 flex flex-col items-end"
      style={{ opacity: showSettings ? 1 : 0.6 }}
      onMouseEnter={() => setShowSettings(true)}
      onMouseLeave={() => setShowSettings(false)}
      onTouchStart={() => setShowSettings(true)}
    >
      <div className="flex items-center justify-center mb-2">
        <button
          onClick={onToggle}
          className="bg-black/60 hover:bg-black/80 text-white rounded-full p-2 shadow-lg transition-all duration-300 flex items-center justify-center"
          title={isEnabled ? "Desativar efeito" : "Ativar efeito"}
          aria-label={isEnabled ? "Desativar efeito" : "Ativar efeito"}
        >
          {isEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {isEnabled && showSettings && (
        <div className="bg-black/70 text-white p-3 rounded-lg shadow-lg transition-all duration-300 mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs">Intensidade</span>
            <span className="text-xs font-mono bg-black/50 px-2 py-0.5 rounded">
              {intensity < 4 ? 'Leve' : intensity < 7 ? 'Médio' : 'Forte'} ({intensity}/10)
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => onIntensityChange(parseInt(e.target.value))}
            className="w-32 h-2 rounded-lg appearance-none cursor-pointer bg-gray-700"
            aria-label="Ajustar intensidade do efeito"
          />
        </div>
      )}
    </div>
  );
};

export default SplashCursorControl; 