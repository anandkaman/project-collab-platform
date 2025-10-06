import { spawn } from 'child_process';
import path from 'path';

export const executeBatchFile = (batFilePath, projectId, io) => {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(batFilePath);
    const process = spawn('cmd.exe', ['/c', fullPath]);
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      io.to(projectId).emit('executionOutput', {
        type: 'stdout',
        data: chunk,
        timestamp: Date.now()
      });
    });
    
    process.stderr.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      io.to(projectId).emit('executionOutput', {
        type: 'stderr',
        data: chunk,
        timestamp: Date.now()
      });
    });
    
    process.on('close', (code) => {
      const result = {
        exitCode: code,
        output,
        errorOutput
      };
      
      io.to(projectId).emit('executionComplete', result);
      
      if (code === 0) {
        resolve(result);
      } else {
        reject(result);
      }
    });
    
    process.on('error', (error) => {
      io.to(projectId).emit('executionError', error.message);
      reject(error);
    });
  });
};
