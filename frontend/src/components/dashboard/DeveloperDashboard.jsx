import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ProjectWorkspace from '../project/ProjectWorkspace';
import TaskList from '../tasks/TaskList';
import { FaCodeBranch, FaCheckCircle, FaFile, FaExclamationTriangle } from 'react-icons/fa';


const DeveloperDashboard = () => {
  const { user, logout } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeMessage, setMergeMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const response = await api.get('/api/modules/my-modules');
      setModules(response.data.modules || []);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneModule = async (module) => {
    if (module.cloned) {
      handleModuleClick(module);
      return;
    }

    if (!window.confirm(`Clone project "${module.projectId?.name}" to your branch?\n\nThis will create a copy of the main project in your branch: ${module.branch}`)) {
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/api/modules/clone', { moduleId: module._id });
      alert('Project cloned successfully! You can now start working.');
      loadModules();
    } catch (error) {
      console.error('Error cloning module:', error);
      alert('Error cloning project: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleModuleClick = (module) => {
    if (!module.cloned) {
      alert('Please clone the project first before opening the workspace.');
      return;
    }
    setSelectedModule(module);
    setWorkspaceOpen(true);
  };

  const handleRequestMerge = (module) => {
    if (!module.cloned) {
      alert('Please clone and work on the project first.');
      return;
    }
    setSelectedModule(module);
    setShowMergeDialog(true);
  };

  const handleSubmitMergeRequest = async () => {
    try {
      setActionLoading(true);
      await api.post('/api/merge/request', {
        moduleId: selectedModule._id,
        message: mergeMessage
      });
      setShowMergeDialog(false);
      setMergeMessage('');
      loadModules();
      alert('Merge request submitted successfully! Team lead will review your changes.');
    } catch (error) {
      console.error('Error requesting merge:', error);
      alert('Error submitting merge request: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = () => {
    loadModules();
  };

  const getStatusBadge = (module) => {
    if (module.mergeRequestPending) {
      return <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">Merge Pending</span>;
    }
    if (module.merged) {
      return <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full flex items-center gap-1"><FaCheckCircle /> Merged</span>;
    }
    if (module.mergeRejected) {
      return <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full flex items-center gap-1"><FaExclamationTriangle /> Rejected</span>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full">
      {/* Header */}
      <header className="bg-white shadow-md border-b w-full">
        <div className="w-full px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <FaCodeBranch className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Developer Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {user?.username}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">My Assigned Modules</h2>
          <p className="text-sm text-gray-600">
            Clone projects to start working, then request merge when completed
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading modules...</div>
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaCodeBranch className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No modules assigned yet</p>
            <p className="text-sm text-gray-400">
              Your team lead will assign modules to you soon
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {modules.map((module) => (
              <div key={module._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{module.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                        {module.projectId?.name}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        Branch: {module.branch}
                      </span>
                      {getStatusBadge(module)}
                    </div>
                  </div>
                </div>

                {/* Assigned Files */}
                {module.files && module.files.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <FaFile /> Assigned Files ({module.files.length}):
                    </p>
                    <div className="max-h-32 overflow-auto">
                      {module.files.map((filePath, index) => (
                        <div key={index} className="text-xs font-mono text-gray-600 py-1">
                          📄 {filePath}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {module.mergeRejected && module.mergeRejectionReason && (
                  <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
                    <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                    <p className="text-xs text-red-600">{module.mergeRejectionReason}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {!module.cloned ? (
                    <button
                      onClick={() => handleCloneModule(module)}
                      disabled={actionLoading}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <FaCodeBranch /> Clone Project
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleModuleClick(module)}
                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                      >
                        <FaCodeBranch /> Open Workspace
                      </button>
                      {!module.mergeRequestPending && !module.merged && (
                        <button
                          onClick={() => handleRequestMerge(module)}
                          className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition flex items-center justify-center gap-2"
                        >
                          <FaCheckCircle /> Request Merge
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Merge Request Dialog */}
      {showMergeDialog && selectedModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Request Merge</h3>
            <p className="text-sm text-gray-600 mb-4">
              Module: <span className="font-semibold">{selectedModule.name}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Message to Team Lead (optional)
              </label>
              <textarea
                value={mergeMessage}
                onChange={(e) => setMergeMessage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Describe what you've completed, any notes, or issues..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSubmitMergeRequest}
                disabled={actionLoading}
                className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition font-medium disabled:bg-gray-400"
              >
                {actionLoading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                onClick={() => {
                  setShowMergeDialog(false);
                  setMergeMessage('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Workspace */}
      {workspaceOpen && selectedModule && (
        <ProjectWorkspace
          project={selectedModule.projectId}
          module={selectedModule}
          onClose={() => {
            setWorkspaceOpen(false);
            setSelectedModule(null);
            loadModules();
          }}
        />
      )}
    </div>
  );
};

export default DeveloperDashboard;
