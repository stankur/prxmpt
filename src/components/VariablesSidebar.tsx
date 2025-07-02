interface VariablesSidebarProps {
  availableVariables: string[];
  inputType: 'string' | 'object' | null;
  isVisible: boolean;
  onVariableClick: (variable: string) => void;
}

export function VariablesSidebar({
  availableVariables,
  inputType,
  isVisible,
  onVariableClick
}: VariablesSidebarProps) {
  if (!isVisible) return null;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-300">
          Variables
        </h3>
      </div>
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {inputType === 'string' ? (
          <div>
            <button
              onClick={() => onVariableClick('{content}')}
              className="text-left text-md text-gray-300 hover:text-white transition-colors font-mono"
            >
              + content
            </button>
            <div className="mt-2 mb-2 text-xs text-gray-500">
              Each string input will be available as {'{content}'}
            </div>
          </div>
        ) : (
          availableVariables.map((variable) => (
            <button
              key={variable}
              onClick={() => onVariableClick(`{${variable}}`)}
              className="block w-full text-left text-md text-gray-300 hover:text-white transition-colors font-mono"
            >
              + {variable}
            </button>
          ))
        )}
      </div>
    </div>
  );
}