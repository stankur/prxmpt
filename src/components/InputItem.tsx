import React from 'react';

interface InputItemProps {
  item: string | Record<string, unknown>;
  index: number;
  isPreview?: boolean;
  isExpanded?: boolean;
  onEdit?: (value: string) => void;
  onRemove?: () => void;
  onToggleExpand?: () => void;
}

export const InputItem: React.FC<InputItemProps> = ({ 
  item, 
  isPreview = false,
  isExpanded = false,
  onEdit,
  onRemove,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // For preview items, show truncated transcript if not expanded
  const displayItem = isPreview && !isExpanded && typeof item === 'object' && item !== null && 'transcript' in item
    ? {
        ...item,
        transcript: typeof item.transcript === 'string' 
          ? item.transcript.slice(0, 100) + '...'
          : item.transcript
      }
    : item;

  const jsonValue = typeof displayItem === 'string' 
    ? JSON.stringify(displayItem) 
    : JSON.stringify(displayItem, null, 2);

  const rows = typeof displayItem === 'string' ? 1 : jsonValue.split('\n').length;

  React.useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isExpanded, jsonValue]);

  return (
    <div 
      className={`group relative bg-black border border-gray-800 rounded-lg p-3 ${isPreview ? 'opacity-60' : ''}`}
      style={!isExpanded ? { maxHeight: '80px', overflow: 'hidden' } : {}}
    >
      <textarea
        ref={textareaRef}
        value={jsonValue}
        onChange={onEdit ? (e) => onEdit(e.target.value) : undefined}
        readOnly={isPreview || !onEdit}
        className={`w-full bg-transparent text-xs text-gray-300 font-mono resize-none focus:outline-none pr-8 ${isPreview ? 'pointer-events-none select-none' : ''}`}
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
      
      {/* Remove button for actual items */}
      {!isPreview && onRemove && (
        <button
          onClick={onRemove}
          className="absolute cursor-pointer top-2 right-2 w-6 h-6 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-lg"
        >
          ×
        </button>
      )}
      
      {/* Expand/collapse button for preview items */}
      {/* { onToggleExpand && (
        <button
          onClick={onToggleExpand}
          className="absolute bottom-2 cursor-pointer right-2 w-5 h-5 text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center"
        >
          {isExpanded ? '-' : '+'}
        </button>
      )} */}
    </div>
  );
};
