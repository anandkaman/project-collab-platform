import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaFolder, FaFile } from 'react-icons/fa';
import api from '../../services/api';
import FileTree from './FileTree';
import CodeEditor from './CodeEditor';

const FileManager = ({ projectId, branch, isTeamLead, allowExecution = false, onExecute }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, target: null });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('file');
  const [newItemName, setNewItemName] = useState('');
  const [currentFolder, setCurrentFolder] = useState('');

  useEffect(() => {
    loadFiles();
  }, [projectId, branch]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu({ visible: false, x: 0, y: 0, target: null });
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/files', {
        params: { projectId, branch }
      });
      setFiles(response.data.files);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file) => {
    if (file.type === 'file') {
      // Immediately set the selected file and clear content
      setSelectedFile(file);
      setFileContent('');
      setLoadingContent(true);
      
      try {
        const response = await api.get('/api/files/read', {
          params: {
            projectId,
            filePath: file.path,
            branch
          }
        });
        
        // Only update if this file is still the selected one
        setSelectedFile(currentFile => {
          if (currentFile && currentFile.path === file.path) {
            setFileContent(response.data.content);
            return currentFile;
          }
          return currentFile;
        });
      } catch (error) {
        console.error('Error reading file:', error);
        setFileContent('// Error loading file content');
      } finally {
        setLoadingContent(false);
      }
    }
  };

  const handleSaveFile = async (content) => {
    if (!selectedFile) return;

    try {
      await api.post('/api/files/write', {
        projectId,
        filePath: selectedFile.path,
        content,
        branch
      });
      setFileContent(content);
      alert('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Error saving file');
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      target: item
    });
  };

  const handleCreateNew = (type) => {
    setCreateType(type);
    setShowCreateModal(true);
    setContextMenu({ visible: false, x: 0, y: 0, target: null });
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    
    try {
      const fullPath = currentFolder ? `${currentFolder}/${newItemName}` : newItemName;
      
      if (createType === 'file') {
        await api.post('/api/files/write', {
          projectId,
          filePath: fullPath,
          content: '',
          branch
        });
      } else {
        await api.post('/api/files/create-folder', {
          projectId,
          folderPath: fullPath,
          branch
        });
      }
      
      setShowCreateModal(false);
      setNewItemName('');
      setCurrentFolder('');
      loadFiles();
      alert(`${createType === 'file' ? 'File' : 'Folder'} created successfully`);
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Error creating item');
    }
  };

  const handleDeleteFile = async (filePath) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await api.delete('/api/files/delete', {
        data: {
          projectId,
          filePath: filePath || selectedFile.path,
          branch
        }
      });
      
      if (selectedFile?.path === filePath) {
        setSelectedFile(null);
        setFileContent('');
      }
      
      loadFiles();
      alert('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target.result;
        await api.post('/api/files/write', {
          projectId,
          filePath: file.name,
          content,
          branch
        });
        loadFiles();
        alert('File uploaded successfully');
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-100 p-2 border-b flex gap-2 items-center">
        <button
          onClick={() => handleCreateNew('file')}
          className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          title="New File"
        >
          <FaFile size={12} />
          New File
        </button>
        
        <button
          onClick={() => handleCreateNew('folder')}
          className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          title="New Folder"
        >
          <FaFolder size={12} />
          New Folder
        </button>

        <label className="flex items-center gap-1 bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 cursor-pointer">
          <FaPlus size={12} />
          Upload
          <input
            type="file"
            onChange={handleUploadFile}
            className="hidden"
          />
        </label>
      </div>

      {/* File Explorer */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-gray-700 bg-gray-800 overflow-auto">
          <div className="p-2 border-b border-gray-700">
            <h3 className="text-white font-semibold text-sm">Files</h3>
            <p className="text-xs text-gray-400">Branch: {branch || 'main'}</p>
          </div>
          
          {loading ? (
            <div className="text-gray-400 text-center p-4">Loading...</div>
          ) : (
            <div onContextMenu={(e) => handleContextMenu(e, null)}>
              <FileTree 
                files={files} 
                onFileClick={handleFileClick}
                onContextMenu={handleContextMenu}
              />
            </div>
          )}
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              <div className="bg-gray-800 px-4 py-2 flex justify-between border-b border-gray-700">
                <span className="text-white text-sm">{selectedFile.path}</span>
                <button
                  onClick={() => handleDeleteFile(selectedFile.path)}
                  className="text-red-400 hover:text-red-300"
                  title="Delete file"
                >
                  <FaTrash />
                </button>
              </div>
              
              <div className="flex-1">
                {loadingContent ? (
                  <div className="h-full flex items-center justify-center bg-gray-900">
                    <div className="text-gray-400">Loading file content...</div>
                  </div>
                ) : (
                  <CodeEditor
                    key={selectedFile.path}
                    file={selectedFile}
                    content={fileContent}
                    onSave={handleSaveFile}
                    readOnly={!isTeamLead && branch === 'main'}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="text-gray-500 text-center">
                <FaFile size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No file selected</p>
                <p className="text-sm">Select a file from the tree to view and edit</p>
                <p className="text-xs mt-4">Or create a new file to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white-50 shadow-lg rounded border z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="py-1">
            <button
              onClick={() => handleCreateNew('file')}
              className="w-full text-left px-4 py-2 hover:bg-gray text-sm"
            >
              New File 
            </button>
            <button
              onClick={() => handleCreateNew('folder')}
              className="w-full text-left px-4 py-2 hover:bg-gray text-sm"
            >
              New Folder
            </button>
            {contextMenu.target && (
              <>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    handleDeleteFile(contextMenu.target.path);
                    setContextMenu({ visible: false, x: 0, y: 0, target: null });
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray text-sm text-red-600"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create File/Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">
              Create New {createType === 'file' ? 'File' : 'Folder'}
            </h3>
            <form onSubmit={handleCreateItem}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                  placeholder={createType === 'file' ? 'index.js' : 'components'}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Location (optional)</label>
                <input
                  type="text"
                  value={currentFolder}
                  onChange={(e) => setCurrentFolder(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                  placeholder="src/components"
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
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewItemName('');
                    setCurrentFolder('');
                  }}
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
  );
};



export default FileManager;