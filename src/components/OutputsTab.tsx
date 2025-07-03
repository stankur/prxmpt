interface OutputResult {
  inputIndex: number;
  result: string;
}

type InputData = string | Record<string, unknown>;

interface OutputsTabProps {
  loading: boolean;
  isRunComplete: boolean;
  results: Record<string, OutputResult[]>;
  inputData: InputData[];
}

export function OutputsTab({ loading, isRunComplete, results, inputData }: OutputsTabProps) {
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mb-4"></div>
        <div className="text-gray-400">
          Processing {inputData.length} items...
        </div>
      </div>
    );
  }

  if (!loading && !isRunComplete) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500">
          Add inputs and prompts first, then run to see results
        </div>
      </div>
    );
  }

  if (isRunComplete && Object.keys(results).length > 0) {
    return (
      <div className="space-y-6">
        {Object.entries(results).map(([promptName, promptResults]) => (
          <div key={promptName}>
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              {promptName}
            </h3>
            <div className="space-y-3">
              {promptResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-black border border-gray-800 rounded-lg p-3"
                  style={{ maxHeight: '80px', overflow: 'hidden' }}
                >
                  <textarea
                    value={JSON.stringify(
                      {
                        input: inputData[result.inputIndex],
                        output: result.result
                      },
                      null,
                      2
                    )}
                    readOnly
                    className="w-full bg-transparent text-xs text-gray-300 font-mono resize-none focus:outline-none"
                    rows={4}
                    style={{ overflow: 'hidden' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}