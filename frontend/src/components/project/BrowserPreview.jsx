import { useState, useEffect } from 'react';
import { FaSync, FaExternalLinkAlt, FaChevronLeft, FaChevronRight, FaHome, FaTimes } from 'react-icons/fa';
import useWebSocket from '../../hooks/useWebSocket';

const BrowserPreview = ({ projectId, initialUrl = 'http://localhost:3000', onClose }) => {
  const [url, setUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [history, setHistory] = useState([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const { socket, connected } = useWebSocket(projectId);

  useEffect(() => {
    if (socket) {
      socket.on('executionOutput', (data) => {
        const urlMatch = data.data.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          const detectedUrl = urlMatch[0];
          setUrl(detectedUrl);
          setCurrentUrl(detectedUrl);
          addToHistory(detectedUrl);
        }
      });

      socket.on('serverStarted', (data) => {
        if (data.url) {
          setUrl(data.url);
          setCurrentUrl(data.url);
          addToHistory(data.url);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('executionOutput');
        socket.off('serverStarted');
      }
    };
  }, [socket]);

  const addToHistory = (newUrl) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newUrl);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  const handleNavigate = () => {
    setCurrentUrl(url);
    addToHistory(url);
    setLoading(true);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setUrl(history[newIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setUrl(history[newIndex]);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    const iframe = document.getElementById('preview-iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleHome = () => {
    setUrl(initialUrl);
    setCurrentUrl(initialUrl);
    addToHistory(initialUrl);
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Browser Controls */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${connected ? 'bg-green-600' : 'bg-red-600'} text-white`}>
              <div className="w-2 h-2 rounded-full bg-white" />
              {connected ? 'Connected' : 'Disconnected'}
            </div>
            <span className="text-white text-xs font-semibold">Browser Preview</span>
          </div>
          
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-gray-700"
              title="Close browser"
            >
              <FaTimes size={16} />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Navigation Buttons */}
          <button
            onClick={handleBack}
            disabled={historyIndex === 0}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Back"
          >
            <FaChevronLeft />
          </button>
          
          <button
            onClick={handleForward}
            disabled={historyIndex === history.length - 1}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Forward"
          >
            <FaChevronRight />
          </button>
          
          <button
            onClick={handleRefresh}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            title="Refresh"
          >
            <FaSync />
          </button>
          
          <button
            onClick={handleHome}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            title="Home"
          >
            <FaHome />
          </button>
          
          {/* URL Bar */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
            placeholder="Enter URL..."
          />
          
          <button
            onClick={handleNavigate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Go
          </button>
          
          <button
            onClick={handleOpenExternal}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            title="Open in new tab"
          >
            <FaExternalLinkAlt />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 relative bg-white">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
            <div className="text-white">Loading...</div>
          </div>
        )}
        <iframe
          id="preview-iframe"
          src={currentUrl}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title="Preview"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
};

export default BrowserPreview;
