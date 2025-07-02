import React from 'react';

interface PromptItemProps {
  item: {
    prompt: string;
    llm: {
      model: string;
      temperature: number;
    };
  };
  index: number;
  isExpanded?: boolean;
  onEdit?: (value: string) => void;
  onBlur?: (value: string) => void;
  onRemove?: () => void;
  onToggleExpand?: () => void;
}

export const PromptItem: React.FC<PromptItemProps> = ({ 
  item, 
  isExpanded = false,
  onEdit,
  onBlur,
  onRemove,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const jsonValue = JSON.stringify(item, null, 2);
  const rows = jsonValue.split('\n').length;

  React.useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isExpanded, jsonValue]);

  return (
    <div 
      className="group relative bg-black border border-gray-800 rounded-lg p-3"
      style={!isExpanded ? { maxHeight: '80px', overflow: 'hidden' } : {}}
    >
      <textarea
        ref={textareaRef}
        value={jsonValue}
        onChange={onEdit ? (e) => onEdit(e.target.value) : undefined}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
        readOnly={!onEdit}
        className="w-full bg-transparent text-xs text-gray-300 font-mono resize-none focus:outline-none pr-8"
        rows={!isExpanded ? Math.min(rows, 4) : undefined}
        style={
          !isExpanded 
            ? { overflow: 'hidden' } 
            : { 
                overflow: 'hidden',
                height: 'auto'
              }
        }
      />
      
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
