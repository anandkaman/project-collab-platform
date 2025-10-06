import { useEffect, useRef } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

const OutputPanel = ({ projectId }) => {
  const { output, connected } = useWebSocket(projectId);
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const getOutputColor = (type) => {
    switch (type) {
      case 'stderr':
        return 'text-red-400';
      case 'stdout':
        return 'text-green-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
        <span className="text-white font-semibold">Output</span>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div
        ref={outputRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm"
      >
        {output.length === 0 ? (
          <div className="text-gray-500 text-center mt-8">
            No output yet. Run the project to see results.
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} className={`mb-1 ${getOutputColor(line.type)}`}>
              <span className="text-gray-600 mr-2">
                [{new Date(line.timestamp).toLocaleTimeString()}]
              </span>
              {line.data}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OutputPanel;