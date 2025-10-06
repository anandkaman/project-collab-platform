import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ file, content, onSave, readOnly = false }) => {
  const editorRef = useRef(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value) => {
    setHasChanges(true);
  };

  const handleSave = () => {
    const currentContent = editorRef.current.getValue();
    onSave(currentContent);
    setHasChanges(false);
  };

  const getLanguage = (filename) => {
    const extension = filename.split('.').pop();
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      sql: 'sql',
      sh: 'shell',
      bat: 'bat',
      md: 'markdown'
    };
    return languageMap[extension] || 'plaintext';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <span className="font-mono text-sm">{file?.name || 'Untitled'}</span>
        {!readOnly && (
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-blue-500 px-4 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {hasChanges ? 'Save' : 'Saved'}
          </button>
        )}
      </div>
      
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage={file ? getLanguage(file.name) : 'javascript'}
          defaultValue={content || '// Start coding...'}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            readOnly: readOnly,
            scrollBeyondLastLine: false,
            tabSize: 2
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;