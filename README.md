# Project Collaboration Platform

A real-time collaborative development platform for teams to manage projects, assign tasks, and work on isolated branches with merge request workflows.

## Features

- **Role-Based Access Control**: Team Lead and Developer roles
- **Project Management**: Create and manage multiple projects
- **Module Assignment**: Assign specific modules/tasks to developers
- **Branch Isolation**: Each developer works on their own isolated branch
- **File Search**: Search and select specific files for module assignment
- **Integrated Workspace**: Built-in code editor (Monaco Editor), terminal, and browser preview
- **Real-time Collaboration**: WebSocket-based real-time updates
- **Merge Request Workflow**: Developers request merge, team leads approve/reject
- **Resizable Panels**: Drag-to-resize code editor and preview panels
- **BAT File Execution**: Execute batch files to run projects

## Project Structure
```bash
project-collab-platform/
├── backend/
│ ├── config/
│ │ └── db.js # MongoDB connection
│ ├── controllers/
│ │ ├── authController.js # Authentication logic
│ │ ├── projectController.js # Project management
│ │ ├── moduleController.js # Module/task management
│ │ ├── fileController.js # File operations
│ │ ├── mergeController.js # Merge request handling
│ │ └── terminalController.js # Terminal command execution
│ ├── middleware/
│ │ └── auth.js # JWT authentication middleware
│ ├── models/
│ │ ├── User.js # User schema
│ │ ├── Project.js # Project schema
│ │ └── Module.js # Module schema
│ ├── routes/
│ │ ├── authRoutes.js # Auth endpoints
│ │ ├── projectRoutes.js # Project endpoints
│ │ ├── moduleRoutes.js # Module endpoints
│ │ ├── fileRoutes.js # File operation endpoints
│ │ ├── mergeRoutes.js # Merge request endpoints
│ │ └── terminalRoutes.js # Terminal endpoints
│ ├── .env.example # Environment variables template
│ ├── package.json
│ └── server.js # Entry point
├── frontend/
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ │ ├── auth/
│ │ │ │ ├── Login.jsx
│ │ │ │ └── Register.jsx
│ │ │ ├── dashboard/
│ │ │ │ ├── TeamLeadDashboard.jsx
│ │ │ │ └── DeveloperDashboard.jsx
│ │ │ ├── project/
│ │ │ │ ├── ProjectWorkspace.jsx
│ │ │ │ ├── FileManager.jsx
│ │ │ │ ├── FileTree.jsx
│ │ │ │ ├── CodeEditor.jsx
│ │ │ │ ├── BrowserPreview.jsx
│ │ │ │ ├── Terminal.jsx
│ │ │ │ └── OutputPanel.jsx
│ │ │ └── tasks/
│ │ │ └── TaskList.jsx
│ │ ├── contexts/
│ │ │ └── AuthContext.jsx
│ │ ├── hooks/
│ │ │ └── useWebSocket.js
│ │ ├── services/
│ │ │ └── api.js
│ │ ├── styles/
│ │ │ └── dashboard.css
│ │ ├── App.jsx
│ │ ├── main.jsx
│ │ └── index.css
│ ├── package.json
│ ├── vite.config.js
│ └── tailwind.config.js
├── .gitignore
├── README.md
├── ABOUT.md
└── TECHNICALDOC.md
```

## Technologies Used

### Backend
- **Node.js** & **Express.js** - Server and API
- **MongoDB** & **Mongoose** - Database
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editor
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.IO Client** - WebSocket client

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Git Bash or any terminal
- npm or yarn

## Installation & Setup

### 1. Clone the Repository

git clone https://github.com/anandkaman/project-collab-platform.git
cd project-collab-platform


### 2. Backend Setup

cd backend
npm install


Create `.env` file in backend folder:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/project-collab
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production


Start MongoDB service and run the backend:

npm run dev **or** npm start

Backend will run on `http://localhost:5000`


### 3.Frontend Setup

Open a new terminal:

cd frontend
npm install
npm run dev


Frontend will run on `http://localhost:5173`

##  Usage Guide

### Team Lead Workflow

1. **Register/Login** as Team Lead
2. **Create Project**: Add project name, description, and root path
3. **Assign Modules**: 
   - Select project
   - Search and select specific files (optional)
   - Assign to developer
   - Set permissions for file creation
4. **Review Merge Requests**: Approve or reject developer submissions
5. **Execute Projects**: Run BAT files to start projects

### Developer Workflow

1. **Register/Login** as Developer
2. **View Assigned Modules**: See all assigned tasks
3. **Clone Project**: Clone to your isolated branch (auto-named: `developer_project_module`)
4. **Work on Files**: 
   - Edit assigned files or create new ones
   - Use integrated terminal for commands
   - Preview in browser
5. **Request Merge**: Submit for team lead review
6. **Handle Feedback**: View rejection reasons and resubmit

## Default Credentials
NONE
After first setup, create accounts with these roles:

**Team Lead:**
- Role: `teamlead`

**Developer:**
- Role: `developer`

## Key Features Explained

### Resizable Panels
Drag the divider between code editor and browser/terminal to adjust sizes (20%-80%)

### Branch Naming
Automatic format: `developername_projectname_modulename`
Example: `johndoe_ecommerceapp_authentication`

### File Search
Search for files when assigning modules to help developers locate exact files

### Terminal Integration
Run commands directly in the project directory (npm install, npm start, etc.)

### Browser Preview
Live preview with navigation controls, refresh, and external open

## Troubleshooting

**MongoDB Connection Failed**
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

**Port Already in Use**
- Change port in backend `.env` and frontend `vite.config.js`

**WebSocket Connection Issues**
- Verify backend is running
- Check CORS settings in `server.js`

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact

Anand kaman - kamananand98@gmail.com

Project Link: [https://github.com/anandkaman/project-collab-platform](https://github.com/anandkaman/project-collab-platform)


