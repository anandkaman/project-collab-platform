import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import FileManager from './FileManager';
import BrowserPreview from './BrowserPreview';
import Terminal from './Terminal';
import useWebSocket from '../../hooks/useWebSocket';
import { FaTerminal, FaTimes, FaPlay, FaStop, FaPlus, FaGlobe } from 'react-icons/fa';
import '../../styles/dashboard.css';

const ProjectWorkspace = ({ project, module, onClose }) => {
  const { user } = useAuth();
  const [batFiles, setBatFiles] = useState([]);
  const [selectedBatFile, setSelectedBatFile] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showBrowser, setShowBrowser] = useState(true);
  const [showCreateBat, setShowCreateBat] = useState(false);
  const [newBatFile, setNewBatFile] = useState({ name: '', content: '' });
  const [previewUrl, setPreviewUrl] = useState('http://localhost:3000');
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef(null);
  const { socket, connected } = useWebSocket(project._id);
  const isTeamLead = user?.role === 'teamlead';
  const currentBranch = module ? module.branch : 'main';

  useEffect(() => {
    loadBatFiles();
    
    if (socket) {
      socket.on('executionComplete', () => {
        setIsRunning(false);
      });

      socket.on('executionStopped', () => {
        setIsRunning(false);
      });

      socket.on('executionOutput', (data) => {
        const urlMatch = data.data?.match(/(?:http|https):\/\/localhost:\d+/);
        if (urlMatch) {
          setPreviewUrl(urlMatch[0]);
          setShowBrowser(true);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('executionComplete');
        socket.off('executionStopped');
        socket.off('executionOutput');
      }
    };
  }, [socket]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      
      if (newPosition >= 20 && newPosition <= 80) {
        setSplitPosition(newPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('dragging');
    } else {
      document.body.classList.remove('dragging');
    }
  }, [isDragging]);

  const loadBatFiles = async () => {
    try {
      const response = await api.get(`/api/projects/${project._id}`);
      setBatFiles(response.data.project.batFiles || []);
      if (response.data.project.batFiles?.length > 0) {
        setSelectedBatFile(response.data.project.batFiles[0]);
      }
    } catch (error) {
      console.error('Error loading bat files:', error);
    }
  };

  const handleExecute = async () => {
    if (!selectedBatFile) {
      alert('Please select a batch file to execute');
      return;
    }

    try {
      setIsRunning(true);
      setShowBrowser(true);
      await api.post('/api/execution/execute', {
        projectId: project._id,
        batFileName: selectedBatFile
      });
    } catch (error) {
      console.error('Error executing batch file:', error);
      alert('Failed to execute batch file');
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    try {
      await api.post('/api/execution/stop', { projectId: project._id });
      setIsRunning(false);
    } catch (error) {
      console.error('Error stopping execution:', error);
    }
  };

  const handleCreateBatFile = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/files/bat', {
        projectId: project._id,
        fileName: newBatFile.name.endsWith('.bat') ? newBatFile.name : `${newBatFile.name}.bat`,
        content: newBatFile.content
      });
      setShowCreateBat(false);
      setNewBatFile({ name: '', content: '' });
      loadBatFiles();
      alert('Batch file created successfully');
    } catch (error) {
      console.error('Error creating batch file:', error);
      alert('Failed to create batch file');
    }
  };

  const handleToggleTerminal = () => {
    if (!showTerminal) {
      setShowTerminal(true);
      setShowBrowser(false);
    } else {
      setShowTerminal(false);
    }
  };

  const handleToggleBrowser = () => {
    if (!showBrowser) {
      setShowBrowser(true);
      setShowTerminal(false);
    } else {
      setShowBrowser(false);
    }
  };

  return (
    <div className="workspace-container">
      <div className="workspace-inner">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-xl font-bold">{project.name}</h2>
              <p className="text-sm text-gray-300">
                {module ? `Module: ${module.name}` : 'Main Project'} | Branch: {currentBranch}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleToggleTerminal}
                className={`px-4 py-2 rounded transition flex items-center gap-2 ${
                  showTerminal ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <FaTerminal /> Terminal
              </button>
              
              <button
                onClick={handleToggleBrowser}
                className={`px-4 py-2 rounded transition flex items-center gap-2 ${
                  showBrowser ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <FaGlobe /> Browser
              </button>
              
              <div className={`flex items-center gap-2 px-3 py-1 rounded ${connected ? 'bg-green-600' : 'bg-red-600'}`}>
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="text-xs">{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <button
                onClick={onClose}
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
              >
                <FaTimes /> Close
              </button>
            </div>
          </div>

          {/* Execution Controls - Only for Team Lead */}
          {isTeamLead && (
            <div className="flex items-center gap-3 bg-gray-700 p-3 rounded-lg">
              <label className="text-sm font-medium">Execute:</label>
              <select
                value={selectedBatFile}
                onChange={(e) => setSelectedBatFile(e.target.value)}
                className="bg-gray-600 border border-gray-500 text-white px-3 py-1.5 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Select BAT File</option>
                {batFiles.map((file, index) => (
                  <option key={index} value={file}>{file}</option>
                ))}
              </select>

              <button
                onClick={handleExecute}
                disabled={isRunning || !selectedBatFile}
                className="bg-green-500 text-white px-4 py-1.5 rounded hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2 transition"
              >
                <FaPlay size={12} />
                {isRunning ? 'Running...' : 'Run'}
              </button>

              {isRunning && (
                <button
                  onClick={handleStop}
                  className="bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600 flex items-center gap-2 transition"
                >
                  <FaStop size={12} />
                  Stop
                </button>
              )}

              <button
                onClick={() => setShowCreateBat(true)}
                className="bg-blue-500 text-white px-4 py-1.5 rounded hover:bg-blue-600 ml-auto flex items-center gap-2 transition"
              >
                <FaPlus size={12} />
                New BAT File
              </button>
            </div>
          )}
        </div>

        {/* Main Workspace with Resizable Panels */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
          {/* File Manager Panel */}
          <div 
            style={{ width: (showTerminal || showBrowser) ? `${splitPosition}%` : '100%' }}
            className="h-full"
          >
            <FileManager
              projectId={project._id}
              branch={currentBranch}
              isTeamLead={isTeamLead}
            />
          </div>

          {/* Resizable Divider */}
          {(showTerminal || showBrowser) && (
            <div
              onMouseDown={() => setIsDragging(true)}
              className={`w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors relative group ${
                isDragging ? 'bg-blue-500' : ''
              }`}
              style={{ cursor: 'col-resize' }}
            >
              <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
                <div className="w-1 h-12 bg-gray-600 rounded-full group-hover:bg-blue-400 transition-colors" />
              </div>
            </div>
          )}

          {/* Right Panel - Terminal or Browser */}
          {(showTerminal || showBrowser) && (
            <div 
              style={{ width: `${100 - splitPosition}%` }}
              className="h-full"
            >
              {showTerminal ? (
                <Terminal
                  projectId={project._id}
                  branch={currentBranch}
                  onClose={() => setShowTerminal(false)}
                />
              ) : (
                <BrowserPreview
                  projectId={project._id}
                  initialUrl={previewUrl}
                  onClose={() => setShowBrowser(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Create Batch File Modal */}
        {showCreateBat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-auto">
              <h3 className="text-lg font-bold mb-4">Create Batch File</h3>
              <form onSubmit={handleCreateBatFile}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">File Name</label>
                  <input
                    type="text"
                    value={newBatFile.name}
                    onChange={(e) => setNewBatFile({ ...newBatFile, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                    placeholder="startup.bat"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    value={newBatFile.content}
                    onChange={(e) => setNewBatFile({ ...newBatFile, content: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 font-mono text-sm"
                    rows="12"
                    placeholder="@echo off&#10;echo Starting application...&#10;cd backend&#10;npm start"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateBat(false)}
                    className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectWorkspace;