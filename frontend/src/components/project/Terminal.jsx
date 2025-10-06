import { useState, useEffect, useRef } from 'react';
import { FaTerminal, FaTimes, FaTrash } from 'react-icons/fa';
import useWebSocket from '../../hooks/useWebSocket';
import api from '../../services/api';
import '../../styles/dashboard.css';

const Terminal = ({ projectId, branch, onClose }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalBodyRef = useRef(null);
  const inputRef = useRef(null);
  
  const { socket, connected } = useWebSocket(projectId);

  useEffect(() => {
    if (socket) {
      socket.on('terminalOutput', (data) => {
        addToHistory({ type: 'output', text: data.output, timestamp: Date.now() });
      });

      socket.on('terminalError', (data) => {
        addToHistory({ type: 'error', text: data.error, timestamp: Date.now() });
      });

      socket.on('commandComplete', (data) => {
        addToHistory({ 
          type: data.exitCode === 0 ? 'success' : 'error', 
          text: `Process exited with code ${data.exitCode}`,
          timestamp: Date.now() 
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('terminalOutput');
        socket.off('terminalError');
        socket.off('commandComplete');
      }
    };
  }, [socket]);

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [history]);

  const addToHistory = (entry) => {
    setHistory(prev => [...prev, entry]);
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    
    if (!command.trim()) return;

    addToHistory({ type: 'command', text: command, timestamp: Date.now() });
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    try {
      await api.post('/api/terminal/execute', {
        projectId,
        command: command.trim(),
        branch
      });
    } catch (error) {
      addToHistory({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to execute command',
        timestamp: Date.now() 
      });
    }

    setCommand('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    }
  };

  const clearTerminal = () => {
    setHistory([]);
  };

  const getLineClass = (type) => {
    switch (type) {
      case 'command':
        return 'terminal-command';
      case 'error':
        return 'terminal-error';
      case 'success':
        return 'terminal-success';
      default:
        return 'terminal-output';
    }
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="flex items-center gap-2">
          <FaTerminal className="text-blue-400" />
          <span className="font-semibold">Terminal - {branch || 'main'}</span>
          <span className={`text-xs px-2 py-1 rounded ${connected ? 'bg-green-600' : 'bg-red-600'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearTerminal}
            className="text-gray-400 hover:text-white transition"
            title="Clear terminal"
          >
            <FaTrash size={14} />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            title="Close terminal"
          >
            <FaTimes size={16} />
          </button>
        </div>
      </div>

      <div ref={terminalBodyRef} className="terminal-body">
        {history.length === 0 ? (
          <div className="text-gray-500">
            <p>Welcome to the integrated terminal!</p>
            <p className="text-sm mt-2">Type commands to execute in the project directory.</p>
            <p className="text-sm">Examples: npm install, npm start, git status</p>
          </div>
        ) : (
          history.map((entry, index) => (
            <div key={index} className={`terminal-line ${getLineClass(entry.type)}`}>
              {entry.type === 'command' && <span className="terminal-prompt">$</span>}
              {entry.text}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleCommand} className="terminal-input-container">
        <span className="terminal-prompt">$</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="terminal-input"
          placeholder="Type a command..."
          autoFocus
        />
      </form>
    </div>
  );
};

export default Terminal;