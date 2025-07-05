import React, { useState } from 'react';

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

interface JsonNodeProps {
  data: unknown;
  keyName?: string;
  level?: number;
}

function JsonNode({ data, keyName, level = 0 }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (data === null) {
    return (
      <div className="text-gray-500">
        {keyName && <span className="text-gray-300">{keyName}: </span>}
        <span>null</span>
      </div>
    );
  }
  
  if (typeof data === 'string') {
    return (
      <div className="text-gray-200">
        {keyName && <span className="text-gray-400">{keyName}: </span>}
        <span>&quot;{data}&quot;</span>
      </div>
    );
  }
  
  if (typeof data === 'number') {
    return (
      <div className="text-gray-200">
        {keyName && <span className="text-gray-400">{keyName}: </span>}
        <span className="text-blue-300">{data}</span>
      </div>
    );
  }
  
  if (typeof data === 'boolean') {
    return (
      <div className="text-gray-200">
        {keyName && <span className="text-gray-400">{keyName}: </span>}
        <span className="text-amber-300">{data ? 'true' : 'false'}</span>
      </div>
    );
  }
  
  if (Array.isArray(data)) {
    const isEmpty = data.length === 0;
    
    return (
      <div>
        <div className="text-gray-200">
          {keyName && <span className="text-gray-400">{keyName}: </span>}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center text-gray-500 hover:text-gray-300 focus:outline-none transition-colors mr-1"
          >
            <svg 
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-gray-500">
            [{isEmpty ? '' : `${data.length} item${data.length === 1 ? '' : 's'}`}]
          </span>
        </div>
        
        {isExpanded && !isEmpty && (
          <div className="ml-4 border-l border-gray-700 pl-2 mt-1">
            {data.map((item, index) => (
              <div key={index} className="mb-2">
                <JsonNode 
                  data={item} 
                  keyName={index.toString()} 
                  level={level + 1} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (typeof data === 'object') {
    const objectData = data as Record<string, unknown>;
    const keys = Object.keys(objectData);
    const isEmpty = keys.length === 0;
    
    return (
      <div>
        <div className="text-gray-200">
          {keyName && <span className="text-gray-400">{keyName}: </span>}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center text-gray-500 hover:text-gray-300 focus:outline-none transition-colors mr-1"
          >
            <svg 
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-gray-500">
            {'{' + (isEmpty ? '' : `${keys.length} key${keys.length === 1 ? '' : 's'}`) + '}'}
          </span>
        </div>
        
        {isExpanded && !isEmpty && (
          <div className="ml-4 border-l border-gray-700 pl-2 mt-1">
            {keys.map((key) => (
              <div key={key} className="mb-2">
                <JsonNode 
                  data={objectData[key]} 
                  keyName={key} 
                  level={level + 1} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="text-gray-300">
      {keyName && <span>{keyName}: </span>}
      <span>{String(data)}</span>
    </div>
  );
}

export function JsonViewer({ data, className = '' }: JsonViewerProps) {
  return (
    <div className={`font-mono text-sm leading-relaxed ${className}`}>
      <JsonNode data={data} />
    </div>
  );
}