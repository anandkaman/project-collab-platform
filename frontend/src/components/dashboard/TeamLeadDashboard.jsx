import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ProjectWorkspace from '../project/ProjectWorkspace';
import { 
  FaProjectDiagram, 
  FaUsers, 
  FaTasks, 
  FaPlus,
  FaFolder,
  FaCode,
  FaCheckCircle,
  FaSearch,
  FaFile,
  FaTimes,
  FaCodeBranch
} from 'react-icons/fa';

const TeamLeadDashboard = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [modules, setModules] = useState([]);
  const [mergeRequests, setMergeRequests] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDevelopers: 0,
    totalModules: 0,
    completedModules: 0
  });
  
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAssignModule, setShowAssignModule] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [workspaceProject, setWorkspaceProject] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  
  // File search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    rootPath: ''
  });

  const [newModule, setNewModule] = useState({
    name: '',
    description: '',
    assignedTo: '',
    files: [],
    allowDeveloperToCreateFiles: true
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    await Promise.all([
      loadProjects(),
      loadDevelopers(),
      loadAllModules(),
      loadMergeRequests()
    ]);
  };

  const loadProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      const projectList = response.data.projects || [];
      setProjects(projectList);
      updateStats({ totalProjects: projectList.length });
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadDevelopers = async () => {
    try {
      const response = await api.get('/api/auth/developers');
      const devList = response.data.developers || [];
      setDevelopers(devList);
      updateStats({ totalDevelopers: devList.length });
    } catch (error) {
      console.error('Error loading developers:', error);
    }
  };

  const loadAllModules = async () => {
    try {
      const response = await api.get('/api/modules');
      const moduleList = response.data.modules || [];
      setModules(moduleList);
      const completed = moduleList.filter(m => m.status === 'completed' || m.status === 'submitted').length;
      updateStats({ 
        totalModules: moduleList.length,
        completedModules: completed
      });
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const loadMergeRequests = async () => {
    try {
      const response = await api.get('/api/merge/requests');
      setMergeRequests(response.data.mergeRequests || []);
    } catch (error) {
      console.error('Error loading merge requests:', error);
    }
  };

  const updateStats = (newStats) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/projects', newProject);
      setShowCreateProject(false);
      setNewProject({ name: '', description: '', rootPath: '' });
      loadDashboardData();
      alert('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error.response?.data?.error || 'Error creating project');
    }
  };

  const handleSearchFiles = async () => {
    if (!searchTerm.trim() || !selectedProject) return;
    
    try {
      setSearching(true);
      const response = await api.get('/api/files/search', {
        params: {
          projectId: selectedProject._id,
          searchTerm: searchTerm.trim()
        }
      });
      setSearchResults(response.data.files || []);
    } catch (error) {
      console.error('Error searching files:', error);
      alert('Error searching files');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFiles(prev => {
      const exists = prev.find(f => f.path === file.path);
      if (exists) {
        return prev.filter(f => f.path !== file.path);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleRemoveFile = (filePath) => {
    setSelectedFiles(prev => prev.filter(f => f.path !== filePath));
  };

  const handleAssignModule = async (e) => {
    e.preventDefault();
    
    if (!newModule.assignedTo) {
      alert('Please select a developer');
      return;
    }
    
    try {
      await api.post('/api/modules', {
        ...newModule,
        projectId: selectedProject._id,
        files: selectedFiles.map(f => f.path)
      });
      setShowAssignModule(false);
      setNewModule({ 
        name: '', 
        description: '', 
        assignedTo: '', 
        files: [],
        allowDeveloperToCreateFiles: true
      });
      setSelectedFiles([]);
      setSearchResults([]);
      setSearchTerm('');
      loadDashboardData();
      alert('Module assigned successfully!');
    } catch (error) {
      console.error('Error assigning module:', error);
      alert(error.response?.data?.error || 'Error assigning module');
    }
  };

  const handleOpenProject = (project) => {
    setWorkspaceProject(project);
  };

  const handleAssignModuleToProject = (project) => {
    setSelectedProject(project);
    setShowAssignModule(true);
    setSelectedFiles([]);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await api.delete(`/api/projects/${projectId}`);
      loadDashboardData();
      alert('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    }
  };

  const handleApproveMerge = async (moduleId) => {
    if (!window.confirm('Approve this merge request? This will merge changes to main branch.')) return;
    
    try {
      await api.post('/api/merge/approve', { moduleId });
      alert('Merge approved successfully!');
      loadDashboardData();
    } catch (error) {
      console.error('Error approving merge:', error);
      alert('Error approving merge: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRejectMerge = async (moduleId) => {
    const reason = prompt('Enter rejection reason (developer will see this):');
    if (!reason) return;
    
    try {
      await api.post('/api/merge/reject', { moduleId, reason });
      alert('Merge rejected');
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting merge:', error);
      alert('Error rejecting merge: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      'in-progress': 'text-blue-600 bg-blue-100',
      completed: 'text-green-600 bg-green-100',
      submitted: 'text-purple-600 bg-purple-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FaProjectDiagram className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Team Lead Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.username}</p>
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

      {/* Stats Cards */}
      <div className="dashboard-main">
        <div className="stats-grid">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaFolder className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Developers</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalDevelopers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaUsers className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Modules</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalModules}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaTasks className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.completedModules}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="border-b border-gray-200">
            <div className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 border-b-2 font-medium transition ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaProjectDiagram className="inline mr-2" />
                Projects
              </button>
              <button
                onClick={() => setActiveTab('developers')}
                className={`py-4 border-b-2 font-medium transition ${
                  activeTab === 'developers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaUsers className="inline mr-2" />
                Developers
              </button>
              <button
                onClick={() => setActiveTab('modules')}
                className={`py-4 border-b-2 font-medium transition ${
                  activeTab === 'modules'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaTasks className="inline mr-2" />
                All Modules
              </button>
              <button
                onClick={() => setActiveTab('merges')}
                className={`py-4 border-b-2 font-medium transition relative ${
                  activeTab === 'merges'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaCodeBranch className="inline mr-2" />
                Merge Requests
                {mergeRequests.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {mergeRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
                  <button
                    onClick={() => setShowCreateProject(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2 shadow-sm"
                  >
                    <FaPlus /> Create Project
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaFolder className="mx-auto text-6xl mb-4 opacity-20" />
                    <p>No projects yet. Create your first project!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <div key={project._id} className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                          <FaFolder className="text-blue-500 text-xl" />
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenProject(project)}
                            className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-600 transition"
                          >
                            <FaCode className="inline mr-1" /> Open
                          </button>
                          <button
                            onClick={() => handleAssignModuleToProject(project)}
                            className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-600 transition"
                          >
                            <FaTasks className="inline mr-1" /> Assign
                          </button>
                        </div>
                        <button
                          onClick={() => handleDeleteProject(project._id)}
                          className="w-full mt-2 bg-red-50 text-red-600 py-2 px-3 rounded-lg text-sm hover:bg-red-100 transition"
                        >
                          Delete Project
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Developers Tab */}
            {activeTab === 'developers' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Developers Team</h2>
                {developers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaUsers className="mx-auto text-6xl mb-4 opacity-20" />
                    <p>No developers registered yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {developers.map((dev) => (
                      <div key={dev._id} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {dev.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{dev.username}</h3>
                            <p className="text-sm text-gray-500">{dev.email}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-3">
                          Joined: {new Date(dev.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modules Tab */}
            {activeTab === 'modules' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">All Modules</h2>
                {modules.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaTasks className="mx-auto text-6xl mb-4 opacity-20" />
                    <p>No modules assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {modules.map((module) => (
                      <div key={module._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{module.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Project: {module.projectId?.name}</span>
                            <span>Developer: {module.assignedTo?.username}</span>
                            {module.files && module.files.length > 0 && (
                              <span>Files: {module.files.length}</span>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(module.status)}`}>
                          {module.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Merge Requests Tab */}
            {activeTab === 'merges' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Pending Merge Requests</h2>
                {mergeRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaCodeBranch className="mx-auto text-6xl mb-4 opacity-20" />
                    <p>No pending merge requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mergeRequests.map((request) => (
                      <div key={request._id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-lg">{request.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <span className="text-gray-600">
                                <strong>Developer:</strong> {request.assignedTo?.username}
                              </span>
                              <span className="text-gray-600">
                                <strong>Project:</strong> {request.projectId?.name}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
                                Branch: {request.branch}
                              </span>
                            </div>
                            {request.mergeRequestMessage && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs font-semibold text-blue-700 mb-1">Message from Developer:</p>
                                <p className="text-sm text-blue-800">{request.mergeRequestMessage}</p>
                              </div>
                            )}
                            {request.files && request.files.length > 0 && (
                              <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-2">
                                  <FaFile className="inline mr-1" />
                                  Modified Files ({request.files.length}):
                                </p>
                                <div className="max-h-24 overflow-auto">
                                  {request.files.map((file, idx) => (
                                    <div key={idx} className="text-xs font-mono text-gray-600 py-1">
                                      📄 {file}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleApproveMerge(request._id)}
                            className="flex-1 bg-green-500 text-white py-2.5 rounded-lg hover:bg-green-600 transition font-medium flex items-center justify-center gap-2"
                          >
                            <FaCheckCircle /> Approve & Merge
                          </button>
                          <button
                            onClick={() => handleRejectMerge(request._id)}
                            className="flex-1 bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 transition font-medium flex items-center justify-center gap-2"
                          >
                            <FaTimes /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Awesome Project"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Project description..."
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">Root Path (optional)</label>
                <input
                  type="text"
                  value={newProject.rootPath}
                  onChange={(e) => setNewProject({ ...newProject, rootPath: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="C:\Projects\my-project"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Module Modal with File Search */}
      {showAssignModule && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              Assign Module - {selectedProject.name}
            </h3>
            
            {developers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">No developers available. Please register developers first.</p>
                <button
                  onClick={() => setShowAssignModule(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleAssignModule}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Module Name</label>
                  <input
                    type="text"
                    value={newModule.name}
                    onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Authentication Module"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                  <textarea
                    value={newModule.description}
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Implement user authentication..."
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Assign To Developer ({developers.length} available)
                  </label>
                  <select
                    value={newModule.assignedTo}
                    onChange={(e) => setNewModule({ ...newModule, assignedTo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Developer</option>
                    {developers.map((dev) => (
                      <option key={dev._id} value={dev._id}>
                        {dev.username} ({dev.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* File Search Section */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    <FaSearch className="inline mr-2" />
                    Search and Select Files (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Search for specific files to assign to this module. Developer will know exact file paths.
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchFiles())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Search files (e.g., auth, login.js, .jsx)"
                    />
                    <button
                      type="button"
                      onClick={handleSearchFiles}
                      disabled={searching || !searchTerm.trim()}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      {searching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  
                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Selected Files ({selectedFiles.length}):</p>
                      <div className="max-h-32 overflow-auto bg-white rounded border border-gray-300 p-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded text-xs">
                            <div className="flex items-center gap-2 flex-1">
                              <FaFile className="text-blue-500" size={12} />
                              <span className="font-mono text-gray-700">{file.path}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(file.path)}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Search Results ({searchResults.length}):</p>
                      <div className="max-h-48 overflow-auto bg-white rounded border border-gray-300">
                        {searchResults.map((file, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectFile(file)}
                            className={`flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-blue-50 text-xs ${
                              selectedFiles.find(f => f.path === file.path) ? 'bg-blue-100' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedFiles.find(f => f.path === file.path)}
                              onChange={() => {}}
                              className="w-4 h-4"
                            />
                            <FaFile className="text-blue-500" size={12} />
                            <span className="font-mono text-gray-700">{file.path}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {searchTerm && searchResults.length === 0 && !searching && (
                    <p className="text-xs text-gray-500 text-center py-4">
                      No files found. Try a different search term.
                    </p>
                  )}
                </div>
                
                {/* File Creation Permission */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newModule.allowDeveloperToCreateFiles}
                      onChange={(e) => setNewModule({ 
                        ...newModule, 
                        allowDeveloperToCreateFiles: e.target.checked 
                      })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700 block">
                        Allow developer to create their own files
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {newModule.allowDeveloperToCreateFiles 
                          ? 'Developer can create, edit, and manage any files needed for this module' 
                          : 'Developer can only work with the files selected above'}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                  >
                    Assign Module
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModule(false);
                      setSelectedFiles([]);
                      setSearchResults([]);
                      setSearchTerm('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Project Workspace */}
      {workspaceProject && (
        <ProjectWorkspace
          project={workspaceProject}
          module={null}
          onClose={() => setWorkspaceProject(null)}
        />
      )}
    </div>
  );
};

export default TeamLeadDashboard;