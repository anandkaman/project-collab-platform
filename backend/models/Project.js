import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: String,
  developerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModified: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rootPath: String,
  mainBranch: { type: String, default: 'main' },
  branches: [branchSchema],
  envFiles: [String],
  batFiles: [String],
  isRunning: { type: Boolean, default: false },
  currentOutput: String
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
