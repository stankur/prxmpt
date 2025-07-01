'use client';

import { useState, useEffect, useCallback } from 'react';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  interface Model {
    id: string;
    name: string;
  }

  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          model,
          prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setResult(data.result);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
		<div className="min-h-screen p-8 bg-gray-50">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
					OpenRouter API Test
				</h1>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label
							htmlFor="apiKey"
							className="block text-sm font-medium text-gray-900 mb-2"
						>
							OpenRouter API Key
						</label>
						<div className="relative">
							<input
								type={showApiKey ? "text" : "password"}
								id="apiKey"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
								placeholder="Enter your OpenRouter API key"
								required
							/>
							<button
								type="button"
								onClick={() => setShowApiKey(!showApiKey)}
								className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
							>
								{showApiKey ? (
									<svg
										className="h-5 w-5"
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
								) : (
									<svg
										className="h-5 w-5"
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
								)}
							</button>
						</div>
					</div>

					{apiKey && (
						<>
							<div>
								<label
									htmlFor="model"
									className="block text-sm font-medium text-gray-900 mb-2"
								>
									Model Name
								</label>
								{loadingModels ? (
									<div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
										Loading models...
									</div>
								) : models.length > 0 ? (
									<div className="relative">
										<input
											type="text"
											id="model"
											value={modelSearch}
											onChange={(e) =>
												handleModelSearchChange(
													e.target.value
												)
											}
											onFocus={() =>
												setShowModelDropdown(true)
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
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
											placeholder="Search models..."
											required
										/>
										{showModelDropdown &&
											filteredModels.length > 0 && (
												<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
													{filteredModels
														.slice(0, 20)
														.map((modelItem) => (
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
																className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
															>
																<div className="font-medium text-gray-900">
																	{
																		modelItem.name
																	}
																</div>
																<div className="text-sm text-gray-500">
																	{
																		modelItem.id
																	}
																</div>
															</div>
														))}
												</div>
											)}
									</div>
								) : (
									<input
										type="text"
										id="model"
										value={model}
										onChange={(e) =>
											setModel(e.target.value)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
										placeholder="e.g., openai/gpt-3.5-turbo"
										required
									/>
								)}
							</div>

							<div>
								<label
									htmlFor="prompt"
									className="block text-sm font-medium text-gray-900 mb-2"
								>
									Prompt
								</label>
								<textarea
									id="prompt"
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-vertical text-gray-900"
									placeholder="Enter your prompt here"
									required
								/>
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{loading ? "Processing..." : "Submit"}
							</button>
						</>
					)}
				</form>

				{result && (
					<div className="mt-8">
						<h2 className="text-xl font-semibold mb-4 text-gray-900">
							Result:
						</h2>
						<div className="bg-white p-4 border border-gray-300 rounded-md whitespace-pre-wrap text-gray-900">
							{result}
						</div>
					</div>
				)}
			</div>
		</div>
  );
}
