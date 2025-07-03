'use client';

import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { PreviewContainer } from '../components/PreviewContainer';
import { InputItem } from '../components/InputItem';
import { PromptItem } from '../components/PromptItem';
import { VariablesSidebar } from '../components/VariablesSidebar';
// import { PromptInput } from '../components/PromptInput';

// Cast to fix React 19 JSX.Element vs ReactNode compatibility
const MonacoEditor = Editor as unknown as React.FC<{
  value?: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  theme?: string;
  height?: string;
  options?: Record<string, unknown>;
}>;

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
  const [showInputHelp, setShowInputHelp] = useState(false);
  const [expandedInput, setExpandedInput] = useState<number | null>(null);
  const [expandAllInputs, setExpandAllInputs] = useState(true);
  
  // Prompt data
  const [prompt, setPrompt] = useState('');
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);
  const [promptData, setPromptData] = useState<Array<{ prompt: string; llm: { model: string; temperature: number } }>>([]);
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);
  const [expandAllPrompts, setExpandAllPrompts] = useState(true);
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [showCurrentPrompts, setShowCurrentPrompts] = useState(true);
  const [showVariablesSidebar, setShowVariablesSidebar] = useState(true);
//   const [showContentHelp, setShowContentHelp] = useState(false);
  
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
      // Parse as JSON - this handles quoted strings, objects, and arrays properly
      const parsedInput: InputData = JSON.parse(inputText.trim());

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


  const handleRemoveInput = (index: number) => {
    const newInputData = inputData.filter((_, i) => i !== index);
    setInputData(newInputData);
    
    // Reset input type if no data left
    if (newInputData.length === 0) {
      setInputType(null);
    }
  };

  const handleEditInput = (index: number, newValue: string) => {
    try {
      const parsedInput: InputData = JSON.parse(newValue.trim());
      const newInputData = [...inputData];
      newInputData[index] = parsedInput;
      setInputData(newInputData);
    } catch {
      // Invalid JSON - could show error or just ignore
    }
  };

  const handleAddPrompt = () => {
    if (!prompt.trim()) return;
    
    if (!model) {
      setShowModelSettings(true);
      return;
    }
    
    const newPrompt = {
      prompt: prompt.trim(),
      llm: {
        model: model,
        temperature: temperature
      }
    };
    
    setPromptData([...promptData, newPrompt]);
    setPrompt('');
    setShowModelSettings(false);
  };

  const validatePromptSchema = (prompt: {prompt: unknown, llm: {model: unknown, temperature: unknown}}): { isValid: boolean; error?: string } => {
    if (!prompt || typeof prompt !== 'object') {
      return { isValid: false, error: 'Must be a valid object' };
    }
    
    if (!prompt.prompt || typeof prompt.prompt !== 'string') {
      return { isValid: false, error: 'Missing or invalid "prompt" field (must be string)' };
    }
    
    if (!prompt.llm || typeof prompt.llm !== 'object') {
      return { isValid: false, error: 'Missing or invalid "llm" field (must be object)' };
    }
    
    if (!prompt.llm.model || typeof prompt.llm.model !== 'string') {
      return { isValid: false, error: 'Missing or invalid "llm.model" field (must be string)' };
    }
    
    if (typeof prompt.llm.temperature !== 'number' || prompt.llm.temperature < 0) {
      return { isValid: false, error: 'Invalid "llm.temperature" field (must be number >= 0)' };
    }
    
    // Check if model exists in available models
    if (models.length > 0 && !models.some(m => m.id === prompt.llm.model)) {
      return { isValid: false, error: `Model "${prompt.llm.model}" not found in available models` };
    }
    
    return { isValid: true };
  };

  const handleEditPrompt = (index: number, newValue: string) => {
    // Just update without validation during editing
    try {
      const parsedPrompt = JSON.parse(newValue.trim());
      const newPromptData = [...promptData];
      newPromptData[index] = parsedPrompt;
      setPromptData(newPromptData);
    } catch {
      // Invalid JSON during editing - ignore, let them continue typing
    }
  };

  const handlePromptBlur = (index: number, newValue: string) => {
    try {
      const parsedPrompt = JSON.parse(newValue.trim());
      const validation = validatePromptSchema(parsedPrompt);
      
      if (!validation.isValid) {
        alert(`Invalid prompt: ${validation.error}`);
        return;
      }
      
      const newPromptData = [...promptData];
      newPromptData[index] = parsedPrompt;
      setPromptData(newPromptData);
    } catch {
      alert('Invalid JSON format');
    }
  };

  const handleRemovePrompt = (index: number) => {
    const newPromptData = promptData.filter((_, i) => i !== index);
    setPromptData(newPromptData);
  };


  const handleRun = async () => {
    if (!apiKey || promptData.length === 0 || inputData.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate all prompts before running
    for (const [index, prompt] of promptData.entries()) {
      const validation = validatePromptSchema(prompt);
      if (!validation.isValid) {
        alert(`Invalid prompt ${index + 1}: ${validation.error}`);
        return;
      }
    }

    setLoading(true);
    setIsRunComplete(false);
    setResults([]);
    setActiveTab('output');

    try {
      const promises = [];
      
      // Create a promise for each input × prompt combination
      for (const [inputIndex, inputItem] of inputData.entries()) {
        for (const [promptIndex, promptItem] of promptData.entries()) {
          let processedPrompt = promptItem.prompt;
          
          if (typeof inputItem === 'object') {
            availableVariables.forEach(variable => {
              const value = variable.split('.').reduce((obj: unknown, key: string) => {
                if (obj && typeof obj === 'object' && key in obj) {
                  return (obj as Record<string, unknown>)[key];
                }
                return undefined;
              }, inputItem as unknown);
              processedPrompt = processedPrompt.replace(new RegExp(`{${variable}}`, 'g'), String(value || ''));
            });
          } else {
            // Handle string inputs with {content} variable
            processedPrompt = processedPrompt.replace(new RegExp(`{content}`, 'g'), String(inputItem));
          }

          promises.push(
            fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                apiKey,
                model: promptItem.llm.model,
                prompt: processedPrompt,
                temperature: promptItem.llm.temperature,
              }),
            }).then(async (response) => {
              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
              }

              return {
                inputIndex,
                promptIndex,
                result: data.result,
                prompt: promptItem.prompt,
                model: promptItem.llm.model
              };
            })
          );
        }
      }

      const results = await Promise.all(promises);
      setResults(results.map(r => r.result)); // For now, just set simple results array
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
						onClick={() => setActiveTab("input")}
						className={`text-sm cursor-pointer font-medium transition-all ${
							activeTab === "input"
								? "text-white"
								: "text-gray-500 hover:text-gray-400"
						}`}
					>
						Inputs
					</button>
					<span className="text-gray-600 text-xl">×</span>
					<button
						onClick={() => setActiveTab("prompt")}
						className={`text-sm cursor-pointer font-medium transition-all ${
							activeTab === "prompt"
								? "text-white"
								: "text-gray-500 hover:text-gray-400"
						}`}
					>
						Prompts
					</button>
					<span className="text-gray-600 text-xl">=</span>
					<button
						onClick={() => setActiveTab("output")}
						className={`text-sm cursor-pointer font-medium transition-all ${
							activeTab === "output"
								? "text-white"
								: "text-gray-500 hover:text-gray-400"
						}`}
					>
						Outputs
					</button>
				</div>

				{/* Input Tab */}
				{activeTab === "input" && (
					<div className="max-w-4xl mx-auto space-y-6">
						<div>
							<div className="flex items-center gap-2 mb-3">
								<label className="text-sm font-medium ">
									Input Data
								</label>
								<button
									onClick={() =>
										setShowInputHelp(!showInputHelp)
									}
									className="w-4 h-4 rounded-full border border-gray-500 text-gray-500 hover:text-gray-300 hover:border-gray-300 flex items-center justify-center text-xs transition-colors"
								>
									?
								</button>
							</div>
							{showInputHelp && (
								<div className="mb-6 mt-6 text-sm text-gray-500 space-y-4">
									<div>Enter valid JSON:</div>
									<div className="space-y-1 space-x-4">
										<div className="bg-black border inline-block border-gray-800 rounded px-2 py-1 text-xs font-mono text-gray-300">
											&quot;Hello world&quot;
										</div>
										<div className="bg-black border inline-block border-gray-800 rounded px-2 py-1 text-xs font-mono text-gray-300">{`{"name": "John", "age": 25}`}</div>
										<div className="bg-black border inline-block border-gray-800 rounded px-2 py-1 text-xs font-mono text-gray-300">{`["item1", "item2"]`}</div>
									</div>
								</div>
							)}
							<div className="border border-gray-800 rounded-lg bg-[#1e1e1e] p-3 flex flex-col">
								<div className="h-32">
									<MonacoEditor
										value={inputText}
										onChange={(value: string | undefined) =>
											setInputText(value || "")
										}
										language="json"
										theme="vs-dark"
										height="128px"
										options={{
											minimap: { enabled: false },
											scrollBeyondLastLine: false,
											fontSize: 14,
											fontFamily:
												'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
											lineNumbers: "off",
											glyphMargin: false,
											folding: false,
											lineDecorationsWidth: 0,
											lineNumbersMinChars: 0,
											wordWrap: "on",
											automaticLayout: true,
											contextmenu: false,
											renderLineHighlight: "none",
											hideCursorInOverviewRuler: true,
											overviewRulerBorder: false,
											scrollbar: {
												vertical: "hidden",
												horizontal: "hidden",
											},
										}}
									/>
								</div>
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

						{inputData.length > 0 ? (
							<div>
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-sm font-medium text-gray-300">
										Current Data ({inputData.length} items)
									</h3>
									<div className="flex items-center gap-3">
										<button
											onClick={() =>
												setExpandAllInputs(
													!expandAllInputs
												)
											}
											className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
										>
											{expandAllInputs
												? "Collapse All"
												: "Expand All"}
										</button>
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
								</div>
								<div className="space-y-3">
									{inputData.map((item, index) => (
										<InputItem
											key={index}
											item={item}
											index={index}
											isExpanded={
												expandAllInputs ||
												expandedInput === index
											}
											onEdit={(value) =>
												handleEditInput(index, value)
											}
											onRemove={() =>
												handleRemoveInput(index)
											}
											onToggleExpand={() =>
												setExpandedInput(
													expandedInput === index
														? null
														: index
												)
											}
										/>
									))}
								</div>
							</div>
						) : (
							<PreviewContainer
								items={[
									{
										date: "2024-03-15",
										title: "How to Build React Apps in 2024",
										description:
											"Complete tutorial covering modern React development with hooks, state management, and best practices.",
										account: "TechChannel",
										transcript:
											"Welcome to this comprehensive React tutorial. Today we'll cover everything you need to know about building modern React applications. We'll start with the basics of components and hooks, then move on to advanced state management patterns. First, let's talk about functional components...",
									},
									{
										date: "2024-03-14",
										title: "JavaScript ES6+ Features You Must Know",
										description:
											"Essential modern JavaScript features that every developer should master in 2024.",
										account: "CodeMaster",
										transcript:
											"In this video, we'll explore the most important ES6 and beyond features that have revolutionized JavaScript development. Arrow functions, destructuring, template literals, and async/await are just the beginning...",
									},
									{
										date: "2024-03-13",
										title: "CSS Grid vs Flexbox - When to Use Which",
										description:
											"A detailed comparison of CSS Grid and Flexbox with practical examples and use cases.",
										account: "WebDesignPro",
										transcript:
											"CSS layout has evolved tremendously over the years. Today we have powerful tools like CSS Grid and Flexbox. But when should you use each one? In this tutorial, we'll break down the differences...",
									},
									{
										date: "2024-03-12",
										title: "Node.js Performance Optimization Tips",
										description:
											"Learn how to optimize your Node.js applications for better performance and scalability.",
										account: "BackendExpert",
										transcript:
											"Performance is crucial for Node.js applications. In this comprehensive guide, we'll explore various optimization techniques including memory management, event loop optimization, clustering, and caching strategies...",
									},
								]}
							/>
						)}
					</div>
				)}

				{/* Prompt Tab */}
				{activeTab === "prompt" && (
					<div className="max-w-4xl mx-auto">
						{availableVariables.length > 0 ||
						inputType === "string" ? (
							<div
								className={`grid gap-6 ${
									showVariablesSidebar
										? "grid-cols-1 lg:grid-cols-4"
										: "grid-cols-1"
								}`}
							>
								<VariablesSidebar
									availableVariables={availableVariables}
									inputType={inputType}
									isVisible={showVariablesSidebar}
									onVariableClick={(variable) =>
										setPrompt((prev) => prev + variable)
									}
								/>

								<div
									className={
										showVariablesSidebar
											? "lg:col-span-3"
											: "col-span-1"
									}
								>
									<div className="mb-3">
										<label className="text-sm font-medium text-gray-300">
											Prompt
										</label>
									</div>
									{/* Prompt Input Section */}
									<div className="border border-gray-800 rounded-lg bg-[#1e1e1e] p-3 flex flex-col">
										<div className="flex-1">
											<textarea
												value={prompt}
												onChange={(e) =>
													setPrompt(e.target.value)
												}
												className="w-full h-32 bg-transparent border-none outline-none resize-none text-white placeholder-gray-500 text-sm"
												placeholder="Enter your prompt here..."
											/>
										</div>

										{/* Model Settings Toggle and Add Button */}
										<div className="flex justify-between items-center mt-2">
											<div className="flex items-center gap-3">
												<button
													onClick={() =>
														setShowModelSettings(
															!showModelSettings
														)
													}
													className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
												>
													{showModelSettings
														? "Hide LLM settings"
														: "Show LLM settings"}{" "}
													{showModelSettings
														? "−"
														: "+"}
												</button>
												{(availableVariables.length >
													0 ||
													inputType === "string") && (
													<button
														onClick={() =>
															setShowVariablesSidebar(
																!showVariablesSidebar
															)
														}
														className="text-xs cursor-pointer text-gray-400 hover:text-gray-300 transition-colors"
													>
														{showVariablesSidebar
															? "Hide variables −"
															: "Show variables +"}
													</button>
												)}
											</div>

											<button
												onClick={handleAddPrompt}
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
															type={
																showApiKey
																	? "text"
																	: "password"
															}
															value={apiKey}
															onChange={(e) =>
																setApiKey(
																	e.target
																		.value
																)
															}
															className="w-full px-3 py-2 pr-10 bg-black border border-gray-800 rounded-lg focus:outline-none text-white text-sm font-mono"
															placeholder="sk-or-..."
														/>
														<button
															type="button"
															onClick={() =>
																setShowApiKey(
																	!showApiKey
																)
															}
															className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-400"
														>
															{showApiKey ? (
																<svg
																	className="h-4 w-4"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={
																			2
																		}
																		d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
																	/>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={
																			2
																		}
																		d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
																	/>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={
																			2
																		}
																		d="M3 3l18 18"
																	/>
																</svg>
															) : (
																<svg
																	className="h-4 w-4"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={
																			2
																		}
																		d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
																	/>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={
																			2
																		}
																		d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
																	/>
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
																value={
																	modelSearch
																}
																onChange={(e) =>
																	handleModelSearchChange(
																		e.target
																			.value
																	)
																}
																onFocus={() =>
																	setShowModelDropdown(
																		true
																	)
																}
																onBlur={() =>
																	setTimeout(
																		() =>
																			setShowModelDropdown(
																				false
																			),
																		200
																	)
																}
																className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none text-white text-sm"
																placeholder="Search models..."
															/>
															{showModelDropdown &&
																filteredModels.length >
																	0 && (
																	<div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
																		{filteredModels
																			.slice(
																				0,
																				20
																			)
																			.map(
																				(
																					modelItem
																				) => (
																					<div
																						key={
																							modelItem.id
																						}
																						onClick={() =>
																							handleModelSelect(
																								modelItem.id,
																								modelItem.name
																							)
																						}
																						className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-800 last:border-b-0"
																					>
																						<div className="font-medium text-white text-sm">
																							{
																								modelItem.name
																							}
																						</div>
																						<div className="text-xs text-gray-400">
																							{
																								modelItem.id
																							}
																						</div>
																					</div>
																				)
																			)}
																	</div>
																)}
														</div>
													) : (
														<input
															type="text"
															value={model}
															onChange={(e) =>
																setModel(
																	e.target
																		.value
																)
															}
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
														onChange={(e) =>
															setTemperature(
																parseFloat(
																	e.target
																		.value
																) || 0
															)
														}
														className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none text-white text-sm"
													/>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						) : (
							<div>
								<div className="mb-3">
									<label className="text-sm font-medium text-gray-300">
										Prompt
									</label>
								</div>
								<div className="border border-gray-800 rounded-lg bg-[#1e1e1e] p-3 flex flex-col">
									<div className="flex-1">
										<textarea
											value={prompt}
											onChange={(e) =>
												setPrompt(e.target.value)
											}
											className="w-full h-32 bg-transparent border-none outline-none resize-none text-white placeholder-gray-500 text-sm"
											placeholder="Enter your prompt here..."
										/>
									</div>

									{/* Model Settings Toggle and Add Button */}
									<div className="flex justify-between items-center mt-2">
										<button
											onClick={() =>
												setShowModelSettings(
													!showModelSettings
												)
											}
											className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors"
										>
											{showModelSettings
												? "Hide LLM settings"
												: "Show LLM settings"}{" "}
											{showModelSettings ? "−" : "+"}
										</button>

										<button
											onClick={handleAddPrompt}
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
														type={
															showApiKey
																? "text"
																: "password"
														}
														value={apiKey}
														onChange={(e) =>
															setApiKey(
																e.target.value
															)
														}
														className="w-full px-3 py-2 pr-10 bg-black border border-gray-800 rounded-lg focus:outline-none text-white text-sm font-mono"
														placeholder="sk-or-..."
													/>
													<button
														type="button"
														onClick={() =>
															setShowApiKey(
																!showApiKey
															)
														}
														className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-400"
													>
														{showApiKey ? (
															<svg
																className="h-4 w-4"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={
																		2
																	}
																	d="M15 12a3 3 0 11-6 0 3 3 0 616 0z"
																/>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={
																		2
																	}
																	d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
																/>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={
																		2
																	}
																	d="M3 3l18 18"
																/>
															</svg>
														) : (
															<svg
																className="h-4 w-4"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={
																		2
																	}
																	d="M15 12a3 3 0 11-6 0 3 3 0 616 0z"
																/>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={
																		2
																	}
																	d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
																/>
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
															onChange={(e) =>
																handleModelSearchChange(
																	e.target
																		.value
																)
															}
															onFocus={() =>
																setShowModelDropdown(
																	true
																)
															}
															onBlur={() =>
																setTimeout(
																	() =>
																		setShowModelDropdown(
																			false
																		),
																	200
																)
															}
															className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none text-white text-sm"
															placeholder="Search models..."
														/>
														{showModelDropdown &&
															filteredModels.length >
																0 && (
																<div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
																	{filteredModels
																		.slice(
																			0,
																			20
																		)
																		.map(
																			(
																				modelItem
																			) => (
																				<div
																					key={
																						modelItem.id
																					}
																					onClick={() =>
																						handleModelSelect(
																							modelItem.id,
																							modelItem.name
																						)
																					}
																					className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-800 last:border-b-0"
																				>
																					<div className="font-medium text-white text-sm">
																						{
																							modelItem.name
																						}
																					</div>
																					<div className="text-xs text-gray-400">
																						{
																							modelItem.id
																						}
																					</div>
																				</div>
																			)
																		)}
																</div>
															)}
													</div>
												) : (
													<input
														type="text"
														value={model}
														onChange={(e) =>
															setModel(
																e.target.value
															)
														}
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
													onChange={(e) =>
														setTemperature(
															parseFloat(
																e.target.value
															) || 0
														)
													}
													className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none text-white text-sm"
												/>
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Prompts List */}
						<div className="mt-6">
							{promptData.length > 0 ? (
								<div>
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-2">
											<h3 className="text-sm font-medium text-gray-300">
												Current Prompts (
												{promptData.length} items)
											</h3>
											<button
												onClick={() =>
													setShowCurrentPrompts(
														!showCurrentPrompts
													)
												}
												className="text-gray-500 hover:text-gray-400 transition-colors"
											>
												{showCurrentPrompts ? (
													<svg
														className="h-4 w-4"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
												) : (
													<svg
														className="h-4 w-4"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M3 3l18 18"
														/>
													</svg>
												)}
											</button>
										</div>
										<div className="flex items-center gap-3">
											<button
												onClick={() => {
													setExpandAllPrompts(
														!expandAllPrompts
													);
													if (expandAllPrompts) {
														setExpandedPrompt(null);
													} else {
														promptData.forEach(
															(_, index) => {
																setExpandedPrompt(
																	index
																);
															}
														);
													}
												}}
												className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
											>
												{expandAllPrompts
													? "Collapse All"
													: "Expand All"}
											</button>
											<button
												onClick={() =>
													setPromptData([])
												}
												className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
											>
												Clear All
											</button>
										</div>
									</div>
									{showCurrentPrompts && (
										<div className="space-y-3">
											{promptData.map((item, index) => (
												<PromptItem
													key={index}
													item={item}
													index={index}
													isExpanded={
														expandedPrompt ===
															index ||
														expandAllPrompts
													}
													onEdit={(value) =>
														handleEditPrompt(
															index,
															value
														)
													}
													onBlur={(value) =>
														handlePromptBlur(
															index,
															value
														)
													}
													onRemove={() =>
														handleRemovePrompt(
															index
														)
													}
												/>
											))}
										</div>
									)}
								</div>
							) : (
								<PreviewContainer
									items={[
										{
											prompt: "Summarize this content in 3 bullet points",
											llm: {
												model: "openai/gpt-4",
												temperature: 0.7,
											},
										},
										{
											prompt: "Translate the following to Spanish",
											llm: {
												model: "anthropic/claude-3-sonnet",
												temperature: 0.3,
											},
										},
										{
											prompt: "Extract the key themes from this text",
											llm: {
												model: "openai/gpt-3.5-turbo",
												temperature: 0.5,
											},
										},
										{
											prompt: "Write a professional email response to this message",
											llm: {
												model: "anthropic/claude-3-haiku",
												temperature: 0.8,
											},
										},
									]}
								/>
							)}
						</div>

						{/* Run Button */}
						{promptData.length > 0 && (
							<div className="mt-6">
								<button
									onClick={handleRun}
									disabled={
										loading ||
										!apiKey ||
										inputData.length === 0
									}
									className="w-full bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm transition-all"
								>
									{loading
										? "Processing..."
										: `Run Batch (${promptData.length} prompts × ${inputData.length} inputs)`}
								</button>
							</div>
						)}
					</div>
				)}

				{/* Output Tab */}
				{activeTab === "output" && (
					<div className="max-w-6xl mx-auto">
						{loading && (
							<div className="text-center py-16">
								<div className="inline-flex items-center justify-center w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mb-4"></div>
								<div className="text-gray-400">
									Processing {inputData.length} items...
								</div>
							</div>
						)}

						{!loading && !isRunComplete && (
							<div className="text-center py-16">
								<div className="text-gray-500">
									Add inputs and prompts first, then run to
									see results
								</div>
							</div>
						)}

						{isRunComplete && results.length > 0 && (
							<div className="space-y-4">
								{inputData.map((input, index) => (
									<div
										key={index}
										className="bg-gray-900 rounded-lg border border-gray-800 p-6"
									>
										<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
											<div>
												<h4 className="text-xs font-medium text-gray-400 mb-3">
													Input {index + 1}
												</h4>
												<div className="bg-black border border-gray-800 rounded-lg p-4">
													<pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
														{typeof input ===
														"string"
															? input
															: JSON.stringify(
																	input,
																	null,
																	2
															  )}
													</pre>
												</div>
											</div>
											<div>
												<h4 className="text-xs font-medium text-gray-400 mb-3">
													Output {index + 1}
												</h4>
												<div className="bg-black border border-gray-800 rounded-lg p-4">
													<pre className="text-xs text-white whitespace-pre-wrap">
														{results[index]}
													</pre>
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
