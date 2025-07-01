'use client';

import { useState, useEffect, useCallback } from 'react';

interface Model {
  id: string;
  name: string;
}

type InputData = string | Record<string, unknown>;

export default function Home() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'input' | 'prompt' | 'output'>('input');
  
  // Input data
  const [inputData, setInputData] = useState<InputData[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<'string' | 'object' | null>(null);
  
  // Prompt data
  const [prompt, setPrompt] = useState('');
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);
  
  // Run configuration
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Models
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  
  // Output data
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRunComplete, setIsRunComplete] = useState(false);

  // Load saved API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openrouterApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage whenever it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openrouterApiKey', apiKey);
    }
  }, [apiKey]);

  const fetchModels = useCallback(async () => {
    if (!apiKey) return;
    
    setLoadingModels(true);
    try {
      const response = await fetch(`/api/models?apiKey=${encodeURIComponent(apiKey)}`);
      const data = await response.json();
      
      if (response.ok) {
        setModels(data.data || []);
        setFilteredModels(data.data || []);
      } else {
        console.error('Failed to fetch models:', data.error);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoadingModels(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey) {
      fetchModels();
    } else {
      setModels([]);
      setFilteredModels([]);
      setModel('');
      setModelSearch('');
    }
  }, [apiKey, fetchModels]);

  useEffect(() => {
    if (modelSearch) {
      const filtered = models.filter(model => 
        model.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        model.id.toLowerCase().includes(modelSearch.toLowerCase())
      );
      setFilteredModels(filtered);
    } else {
      setFilteredModels(models);
    }
  }, [modelSearch, models]);

  // Extract variables from input data
  const extractVariables = useCallback((data: InputData[]): string[] => {
    const variables: Set<string> = new Set();
    
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        const extractFromObject = (obj: Record<string, unknown>, prefix = '') => {
          Object.keys(obj).forEach(key => {
            const currentPath = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              extractFromObject(value as Record<string, unknown>, currentPath);
            } else {
              // Only add leaf values (non-objects)
              variables.add(currentPath);
            }
          });
        };
        extractFromObject(item);
      }
    });
    
    return Array.from(variables).sort();
  }, []);

  // Update available variables when input data changes
  useEffect(() => {
    if (inputData.length > 0 && inputType === 'object') {
      setAvailableVariables(extractVariables(inputData));
    } else {
      setAvailableVariables([]);
    }
  }, [inputData, inputType, extractVariables]);

  const handleModelSelect = (modelId: string, modelName: string) => {
    setModel(modelId);
    setModelSearch(`${modelName} - ${modelId}`);
    setShowModelDropdown(false);
  };

  const handleModelSearchChange = (value: string) => {
    setModelSearch(value);
    setShowModelDropdown(true);
    if (!value) {
      setModel('');
    }
  };

  const handleAddInput = () => {
    try {
      let parsedInput: InputData;
      
      if (inputText.trim().startsWith('[') || inputText.trim().startsWith('{')) {
        parsedInput = JSON.parse(inputText);
      } else {
        parsedInput = inputText;
      }

      // Determine input type
      const newType = typeof parsedInput === 'string' ? 'string' : 'object';
      
      // Validate type consistency
      if (inputType && inputType !== newType) {
        alert(`Cannot mix ${inputType} and ${newType} inputs`);
        return;
      }

      if (Array.isArray(parsedInput)) {
        setInputData(prev => [...prev, ...parsedInput]);
      } else {
        setInputData(prev => [...prev, parsedInput]);
      }

      if (!inputType) {
        setInputType(newType);
      }

      setInputText('');
    } catch {
      alert('Invalid JSON format');
    }
  };

  const handleVariableClick = (variable: string) => {
    setPrompt(prev => prev + `{${variable}}`);
  };

  const handleRun = async () => {
    if (!apiKey || !model || !prompt || inputData.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setIsRunComplete(false);
    setResults([]);
    setActiveTab('output');

    try {
      const promises = inputData.map(async (item) => {
        let processedPrompt = prompt;
        
        if (typeof item === 'object') {
          availableVariables.forEach(variable => {
            const value = variable.split('.').reduce((obj: unknown, key: string) => {
              if (obj && typeof obj === 'object' && key in obj) {
                return (obj as Record<string, unknown>)[key];
              }
              return undefined;
            }, item as unknown);
            processedPrompt = processedPrompt.replace(new RegExp(`{${variable}}`, 'g'), String(value || ''));
          });
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey,
            model,
            prompt: processedPrompt,
            temperature,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to get response');
        }

        return data.result;
      });

      const results = await Promise.all(promises);
      setResults(results);
      setIsRunComplete(true);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Batch Processor
          </h1>
          <p className="text-sm text-gray-400">
            Process multiple inputs through OpenRouter models
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-4 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('input')}
            className={`text-sm font-medium transition-all ${
              activeTab === 'input'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            Inputs
          </button>
          <span className="text-gray-600 text-sm">×</span>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`text-sm font-medium transition-all ${
              activeTab === 'prompt'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            Prompts
          </button>
          <span className="text-gray-600 text-sm">=</span>
          <button
            onClick={() => setActiveTab('output')}
            className={`text-sm font-medium transition-all ${
              activeTab === 'output'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            Outputs
          </button>
        </div>

        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Input Data
              </label>
              <div className="border border-gray-800 rounded-lg bg-black p-3 flex flex-col">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-transparent focus:outline-none resize-none text-white placeholder-gray-500 font-mono text-sm h-24"
                  placeholder='Enter JSON array: [{"name": "John", "age": 25}] or single string/object'
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddInput}
                    disabled={!inputText.trim()}
                    className="w-8 h-8 bg-white text-black rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm transition-all flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            {inputData.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-300">
                    Current Data ({inputData.length} items)
                  </h3>
                  <button
                    onClick={() => {
                      setInputData([]);
                      setInputType(null);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="bg-black border border-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                    {JSON.stringify(inputData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt Tab */}
        {activeTab === 'prompt' && (
          <div className="max-w-6xl mx-auto">
            {availableVariables.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-4">
                    Variables
                  </h3>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {availableVariables.map((variable) => (
                      <button
                        key={variable}
                        onClick={() => handleVariableClick(variable)}
                        className="block w-full text-left text-md text-gray-300 hover:text-white transition-colors font-mono"
                      >
                        + {variable}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="lg:col-span-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Prompt Template
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none h-80 resize-none text-white placeholder-gray-500 text-sm"
                      placeholder={inputType === 'string' ? "Enter your prompt here. This prompt will be run for each string in your input data." : "Enter your prompt here. Use {variableName} to insert variables from your input data."}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Prompt Template
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none  h-80 resize-none text-white placeholder-gray-500 text-sm"
                  placeholder={inputType === 'string' ? "Enter your prompt here. This prompt will be run for each string in your input data." : "Enter your prompt here. Use {variableName} to insert variables from your input data."}
                />
              </div>
            )}
            
            {/* Run Configuration */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-300 mb-6">
                Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3 py-2 pr-10 bg-black border border-gray-800 rounded-lg focus:outline-none  text-white text-sm font-mono"
                      placeholder="sk-or-..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-400"
                    >
                      {showApiKey ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Model
                  </label>
                  {loadingModels ? (
                    <div className="w-full px-3 py-2 bg-gray-800 border border-gray-800 rounded-lg text-gray-500 text-sm">
                      Loading...
                    </div>
                  ) : models.length > 0 ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => handleModelSearchChange(e.target.value)}
                        onFocus={() => setShowModelDropdown(true)}
                        onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                        className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none  text-white text-sm"
                        placeholder="Search models..."
                      />
                      {showModelDropdown && filteredModels.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {filteredModels.slice(0, 20).map((modelItem) => (
                            <div
                              key={modelItem.id}
                              onClick={() => handleModelSelect(modelItem.id, modelItem.name)}
                              className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-800 last:border-b-0"
                            >
                              <div className="font-medium text-white text-sm">{modelItem.name}</div>
                              <div className="text-xs text-gray-400">{modelItem.id}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none  text-white text-sm font-mono"
                      placeholder="openai/gpt-4"
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Temperature
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none  text-white text-sm"
                  />
                </div>
              </div>
              
              <button
                onClick={handleRun}
                disabled={loading || !apiKey || !model || !prompt || inputData.length === 0}
                className="w-full bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm transition-all"
              >
                {loading ? 'Processing...' : 'Run Batch'}
              </button>
            </div>
          </div>
        )}

        {/* Output Tab */}
        {activeTab === 'output' && (
          <div className="max-w-6xl mx-auto">
            {loading && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mb-4"></div>
                <div className="text-gray-400">Processing {inputData.length} items...</div>
              </div>
            )}
            
            {!loading && !isRunComplete && (
              <div className="text-center py-16">
                <div className="text-gray-500">Add inputs and prompts first, then run to see results</div>
              </div>
            )}
            
            {isRunComplete && results.length > 0 && (
              <div className="space-y-4">
                {inputData.map((input, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-3">Input {index + 1}</h4>
                        <div className="bg-black border border-gray-800 rounded-lg p-4">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                            {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 mb-3">Output {index + 1}</h4>
                        <div className="bg-black border border-gray-800 rounded-lg p-4">
                          <pre className="text-xs text-white whitespace-pre-wrap">{results[index]}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
