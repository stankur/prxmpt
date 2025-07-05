import React from 'react';

interface PromptItemProps {
  item: {
    name: string;
    prompt: string;
    llm: {
      model: string;
      temperature: number;
    };
  };
  index: number;
  isExpanded?: boolean;
  onEditName?: (value: string) => void;
  onRemove?: () => void;
  onToggleExpand?: () => void;
}

export const PromptItem: React.FC<PromptItemProps> = ({ 
  item, 
  isExpanded = false,
  onEditName,
  onRemove,
}) => {
  const promptText = item.prompt;

  return (
    <div 
      className="group relative bg-black border border-gray-800 rounded-lg p-3"
      style={!isExpanded ? { maxHeight: '80px', overflow: 'hidden' } : {}}
    >
      {/* Prompt text display */}
      <div 
        className="w-full text-sm text-gray-300 whitespace-pre-wrap pr-8"
        style={
          !isExpanded 
            ? { 
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              } 
            : {}
        }
      >
        {promptText}
      </div>
      
      {/* Model, temperature, and name info */}
      <div className="mt-6">
        <div className="text-xs text-gray-500 flex items-center gap-3">
          <input
            type="text"
            value={item.name}
            onChange={(e) => onEditName?.(e.target.value)}
            className="bg-transparent border border-gray-800 rounded px-2 py-1 focus:outline-none focus:ring-0 focus:border-gray-700 text-xs text-gray-300 min-w-0 flex-shrink-0"
            placeholder="Prompt name"
            style={{ width: `${Math.max(item.name.length * 0.6 + 3, 12)}ch` }}
          />
          <span>•</span>
          <span>{item.llm.model}</span>
          <span>•</span>
          <span>temp: {item.llm.temperature}</span>
        </div>
      </div>
      
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute cursor-pointer top-2 right-2 w-6 h-6 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-lg"
        >
          ×
        </button>
      )}
    </div>
  );
};
