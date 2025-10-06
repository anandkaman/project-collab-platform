import { useState } from 'react';
import { 
  FaFolder, 
  FaFolderOpen, 
  FaFile, 
  FaChevronRight, 
  FaChevronDown 
} from 'react-icons/fa';

const FileTreeItem = ({ item, onFileClick, onContextMenu, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDirectory = item.type === 'directory';

  const handleClick = () => {
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onFileClick(item);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, item);
    }
  };

  return (
    <div>
      <div
        className="flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {isDirectory && (
          <span className="mr-1 text-gray-400">
            {isOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
          </span>
        )}
        
        <span className="mr-2">
          {isDirectory ? (
            isOpen ? <FaFolderOpen className="text-yellow-500" /> : <FaFolder className="text-yellow-500" />
          ) : (
            <FaFile className="text-blue-400" />
          )}
        </span>
        
        <span className="text-sm text-gray-200">{item.name}</span>
      </div>
      
      {isDirectory && isOpen && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileTreeItem
              key={index}
              item={child}
              onFileClick={onFileClick}
              onContextMenu={onContextMenu}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ files, onFileClick, onContextMenu }) => {
  return (
    <div className="bg-gray-800 h-full overflow-auto">
      <div className="py-2">
        {files && files.length > 0 ? (
          files.map((file, index) => (
            <FileTreeItem
              key={index}
              item={file}
              onFileClick={onFileClick}
              onContextMenu={onContextMenu}
            />
          ))
        ) : (
          <div className="text-gray-500 text-center py-4 text-sm">
            No files yet
          </div>
        )}
      </div>
    </div>
  );
};

export default FileTree;
