import { useState, useEffect } from 'react';
import api from '../../services/api';

const TaskList = ({ modules, onModuleClick, onStatusUpdate }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      'in-progress': 'bg-blue-500',
      completed: 'bg-green-500',
      submitted: 'bg-purple-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleStatusChange = async (moduleId, newStatus) => {
    try {
      await api.put(`/api/modules/${moduleId}/status`, { status: newStatus });
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-4">
      {modules.map((module) => (
        <div key={module._id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{module.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{module.description}</p>
              <p className="text-xs text-gray-500 mt-2">
                Project: <span className="font-medium">{module.projectId?.name}</span>
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(module.status)}`}>
              {module.status}
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={module.status}
              onChange={(e) => handleStatusChange(module._id, e.target.value)}
              className="text-sm border rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="submitted">Submitted</option>
            </select>

            <button
              onClick={() => onModuleClick(module)}
              className="flex-1 bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600"
            >
              Open Workspace
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
