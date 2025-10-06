import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'submitted'],
    default: 'pending'
  },
  files: [String],
  branch: String,
  mergeRequestPending: { type: Boolean, default: false },
  mergeRequestMessage: String,
  mergeRequestedAt: Date,
  merged: { type: Boolean, default: false },
  mergedAt: Date,
  mergedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mergeRejected: { type: Boolean, default: false },
  mergeRejectionReason: String,
  filesProvided: { type: Boolean, default: false },
  allowDeveloperToCreateFiles: { type: Boolean, default: true },
  cloned: { type: Boolean, default: false },
  clonedAt: Date
}, { timestamps: true });

export default mongoose.model('Module', moduleSchema);
