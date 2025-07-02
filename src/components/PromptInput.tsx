interface Model {
  id: string;
  name: string;
}

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onAddPrompt: () => void;
  showModelSettings: boolean;
  onToggleModelSettings: () => void;
  
  // Model settings props
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  showApiKey: boolean;
  onToggleShowApiKey: () => void;
  
  model: string;
  onModelChange: (value: string) => void;
  modelSearch: string;
  onModelSearchChange: (value: string) => void;
  onModelSelect: (modelId: string, modelName: string) => void;
  
  temperature: number;
  onTemperatureChange: (value: number) => void;
  
  models: Model[];
  loadingModels: boolean;
  filteredModels: Model[];
  showModelDropdown: boolean;
  onShowModelDropdown: (show: boolean) => void;
}

export function PromptInput({
  prompt,
  onPromptChange,
  onAddPrompt,
  showModelSettings,
  onToggleModelSettings,
  apiKey,
  onApiKeyChange,
  showApiKey,
  onToggleShowApiKey,
  model,
  onModelChange,
  modelSearch,
  onModelSearchChange,
  onModelSelect,
  temperature,
  onTemperatureChange,
  models,
  loadingModels,
  filteredModels,
  showModelDropdown,
  onShowModelDropdown
}: PromptInputProps) {
  return (
    <div className="border border-gray-800 rounded-lg bg-[#1e1e1e] p-3 flex flex-col">
      <div className="flex-1">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="w-full h-32 bg-transparent border-none outline-none resize-none text-white placeholder-gray-500 text-sm"
          placeholder="Enter your prompt here..."
        />
      </div>
      
      {/* Model Settings Toggle and Add Button */}
      <div className="flex justify-between items-center mt-2">
        <button
          onClick={onToggleModelSettings}
          className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
        >
          {showModelSettings ? 'Hide settings' : 'Show settings'} {showModelSettings ? '−' : '+'}
        </button>
        
        <button
          onClick={onAddPrompt}
          disabled={!prompt.trim()}
          className="w-8 h-8 bg-white text-black rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm transition-all flex items-center justify-center"
        >
          +
        </button>
      </div>

      {/* Collapsible Model Settings */}
      {showModelSettings && (
        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                className="w-full px-3 py-2 pr-10 bg-black border border-gray-800 rounded-lg focus:outline-none text-white text-sm font-mono"
                placeholder="sk-or-..."
              />
              <button
                type="button"
                onClick={onToggleShowApiKey}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
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
                  onChange={(e) => onModelSearchChange(e.target.value)}
                  onFocus={() => onShowModelDropdown(true)}
                  onBlur={() => setTimeout(() => onShowModelDropdown(false), 200)}
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none text-white text-sm"
                  placeholder="Search models..."
                />
                {showModelDropdown && filteredModels.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredModels.slice(0, 20).map((modelItem) => (
                      <div
                        key={modelItem.id}
                        onClick={() => onModelSelect(modelItem.id, modelItem.name)}
                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-800 last:border-b-0"
                      >
                        <div className="font-medium text-white text-sm">
                          {modelItem.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {modelItem.id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none text-white text-sm font-mono"
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
              step="0.1"
              value={temperature}
              onChange={(e) => onTemperatureChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none text-white text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}