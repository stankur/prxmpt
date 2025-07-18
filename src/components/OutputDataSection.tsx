'use client';

import { useState, useEffect } from 'react';
import { PromptItem } from './PromptItem';
import { JsonViewer } from './JsonViewer';

interface OutputResult {
  inputIndex: number;
  result: string;
}

type InputData = string | Record<string, unknown>;

interface OutputDataSectionProps {
  results: Record<string, OutputResult[]>;
  inputData: InputData[];
  promptData: Array<{ name: string; prompt: string; llm: { model: string; temperature: number } }>;
}

export function OutputDataSection({
  results,
  inputData,
  promptData
}: OutputDataSectionProps) {
  const [showCustomView, setShowCustomView] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [customViewData, setCustomViewData] = useState<unknown>(null);
  const [customViewLoading, setCustomViewLoading] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load saved API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('customQueryApiKey');
    if (savedApiKey) {
      setCustomApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage whenever it changes
  useEffect(() => {
    if (customApiKey) {
      localStorage.setItem('customQueryApiKey', customApiKey);
    }
  }, [customApiKey]);

  // Convert results to flat array for querying
  const flatResults = Object.entries(results).flatMap(([promptName, promptResults]) =>
    promptResults.map(result => ({
      promptName,
      inputIndex: result.inputIndex,
      input: inputData[result.inputIndex],
      output: result.result
    }))
  );

  const totalItems = flatResults.length;

  const handleCustomQuery = async (query: string) => {
    if (!customApiKey) {
      setShowApiKeySettings(true);
      return;
    }

    setCustomViewLoading(true);
    try {
      const response = await fetch('/api/custom-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          data: flatResults,
          apiKey: customApiKey
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setCustomViewData(result.data);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCustomViewLoading(false);
    }
  };

  if (totalItems === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500">
          No results to display
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs - Centered */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCustomView(false)}
            className={`text-sm font-medium transition-colors ${
              !showCustomView 
                ? 'text-white' 
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            {totalItems} items
          </button>
          <button
            onClick={() => setShowCustomView(true)}
            className={`text-sm font-medium transition-colors ${
              showCustomView 
                ? 'text-white' 
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            custom view
          </button>
        </div>
      </div>

      {showCustomView ? (
        <div className="space-y-6 mt-8">
          {/* Modern Query Input Section */}
          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center border border-gray-800 rounded-full bg-black/20 focus-within:border-gray-700 transition-colors">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-white placeholder-gray-400 text-sm"
                placeholder="Enter your query (e.g., 'group by promptName', 'filter by output length > 100')"
                disabled={customViewLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (customQuery.trim()) {
                      handleCustomQuery(customQuery.trim());
                    }
                  }
                }}
              />
              
              {/* API Key Settings Button */}
              <button
                onClick={() => setShowApiKeySettings(!showApiKeySettings)}
                className="px-3 py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors border-r border-gray-800"
                title="API Key Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Send Button */}
              <button
                onClick={() => {
                  if (customQuery.trim()) {
                    handleCustomQuery(customQuery.trim());
                  }
                }}
                disabled={!customQuery.trim() || customViewLoading}
                className="px-4 py-3 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Send Query"
              >
                {customViewLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Collapsible API Key Settings */}
            {showApiKeySettings && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-lg z-10">
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-gray-700 text-white text-sm font-mono"
                    placeholder="sk-or-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-400"
                  >
                    {showApiKey ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* JSON Display - Interactive viewer */}
          <JsonViewer 
            data={customViewData !== null ? customViewData : flatResults} 
            className="text-sm"
          />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(results).map(([promptName, promptResults]) => {
            // Find the corresponding prompt data
            const promptItem = promptData.find(p => p.name === promptName);
            
            return (
              <div key={promptName}>
                {/* Display the full prompt details */}
                {promptItem && (
                  <div className="mb-6">
                    <PromptItem
                      item={promptItem}
                      index={0}
                      isExpanded={true}
                    />
                  </div>
                )}
                
                {/* Display the results */}
                <div className="ml-4 border-l border-gray-700 pl-4">
                  <div className="space-y-3">
                    {promptResults.map((result, index) => (
                      <div
                        key={index}
                        className="bg-black border border-gray-800 rounded-lg p-3"
                      >
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                          {JSON.stringify(
                            {
                              input: inputData[result.inputIndex],
                              output: result.result
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}