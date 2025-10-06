# Technical Documentation

##  Technology Stack

### Backend Technologies

#### Core Framework
**Express.js (v4.18.2)**
- Role: RESTful API server
- Why: Fast, minimalist web framework for Node.js
- Features Used:
  - Middleware pipeline
  - Route handling
  - Error handling
  - JSON parsing

**Node.js (v18+)**
- Role: Runtime environment
- Why: JavaScript on server, event-driven, non-blocking I/O
- Features Used:
  - File system operations (fs/promises)
  - Path manipulation
  - Child processes for command execution

#### Database
**MongoDB (v6+)**
- Role: Primary database
- Why: Flexible schema, JSON-like documents, scalability
- Collections:
  - `users`: User accounts and profiles
  - `projects`: Project information
  - `modules`: Task/module assignments

**Mongoose (v8+)**
- Role: MongoDB ODM
- Why: Schema validation, middleware hooks, query building
- Features Used:
  - Schema definitions
  - Virtual properties
  - Population (joins)
  - Middleware hooks

#### Real-time Communication
**Socket.IO (v4.6.0)**
- Role: WebSocket server
- Why: Real-time bidirectional communication
- Use Cases:
  - File change notifications
  - Terminal output streaming
  - Merge request updates
  - Execution status updates

#### Authentication
**jsonwebtoken (v9+)**
- Role: JWT token generation and verification
- Why: Stateless authentication, scalable
- Implementation:
  - Token generation on login
  - Token verification middleware
  - Payload: userId, role, username

**bcryptjs (v2+)**
- Role: Password hashing
- Why: Secure password storage
- Configuration: 10 salt rounds

#### CORS & Security
**cors (v2.8.5)**
- Role: Cross-Origin Resource Sharing
- Configuration:
  - Allowed origins: Frontend URL
  - Credentials: true
  - Methods: GET, POST, PUT, DELETE

**dotenv (v16+)**
- Role: Environment variable management
- Variables:
  - PORT
  - MONGODB_URI
  - JWT_SECRET

### Frontend Technologies

#### Core Framework
**React (v18.2.0)**
- Role: UI library
- Why: Component-based, virtual DOM, hooks
- Patterns Used:
  - Functional components
  - Custom hooks
  - Context API
  - React Router

**Vite (v5.0.8)**
- Role: Build tool and dev server
- Why: Fast HMR, optimized builds
- Features:
  - Lightning-fast dev server
  - Optimized production builds
  - Plugin ecosystem

#### Styling
**Tailwind CSS (v3.4.0)**
- Role: Utility-first CSS framework
- Why: Rapid UI development, consistent design
- Configuration:
  - Custom colors
  - Responsive breakpoints
  - Custom utilities

**Custom CSS (dashboard.css)**
- Role: Complex layouts and animations
- Use Cases:
  - Workspace layout
  - Terminal styling
  - Resizable panels
  - Custom scrollbars

#### Code Editor
**@monaco-editor/react (v4.6.0)**
- Role: Code editor component
- Why: VS Code's editor, feature-rich
- Features Used:
  - Syntax highlighting
  - Auto-completion
  - Multi-language support
  - Keyboard shortcuts

#### HTTP Client
**Axios (v1.6.2)**
- Role: HTTP requests
- Why: Promise-based, interceptors, automatic JSON
- Configuration:
  - Base URL
  - Request interceptors (auth token)
  - Response interceptors (error handling)

#### Routing
**React Router DOM (v6.20.0)**
- Role: Client-side routing
- Why: Declarative routing, nested routes
- Routes:
  - `/login` - Login page
  - `/register` - Registration page
  - `/dashboard/teamlead` - Team Lead dashboard
  - `/dashboard/developer` - Developer dashboard

#### State Management
**React Context API**
- Role: Global state management
- Contexts:
  - AuthContext: User authentication state
- Why: Built-in, no additional libraries needed

#### Icons
**React Icons (v4.12.0)**
- Role: Icon library
- Icon Sets Used:
  - FontAwesome (Fa prefix)
  - Material Design
- Examples: FaFolder, FaFile, FaTerminal, etc.

##  Architecture Patterns

### Backend Architecture

#### MVC Pattern
```bash
Routes (Entry Point)
↓
Middleware (Auth, Validation)
↓
Controllers (Business Logic)
↓
Models (Data Layer)
↓
Database/File System
```

#### Middleware Stack
1. CORS
2. JSON Parser
3. Authentication (JWT verification)
4. Authorization (Role check)
5. Controller function

### Frontend Architecture

#### Component Structure
```bash
App (Root)
├── AuthProvider (Context)
├── Router
│ ├── Login
│ ├── Register
│ ├── TeamLeadDashboard
│ │ └── ProjectWorkspace
│ │ ├── FileManager
│ │ │ ├── FileTree
│ │ │ └── CodeEditor
│ │ ├── Terminal
│ │ └── BrowserPreview
│ └── DeveloperDashboard
│ └── ProjectWorkspace (same)
```

## Data Flow Diagrams

### Authentication Flow

```bash
User enters credentials

Frontend sends POST /api/auth/login

Backend validates credentials

Generate JWT token

Return token + user info

Frontend stores token in Context

Token included in all subsequent requests
```

### File Edit Flow

```bash
User enters credentials

Frontend sends POST /api/auth/login

Backend validates credentials

Generate JWT token

Return token + user info

Frontend stores token in Context

Token included in all subsequent requests
```

### File Edit Flow

```bash
User selects file from FileTree

GET /api/files/read?projectId=X&filePath=Y

Load content in Monaco Editor

User edits and saves

POST /api/files/write {projectId, filePath, content}

Backend writes to file system

WebSocket broadcast: fileChanged

Other clients receive update
```

### Merge Request Flow
```bash
Developer clicks "Request Merge"

POST /api/merge/request {moduleId, message}

Update module.mergeRequestPending = true

WebSocket emit: mergeRequested

Team Lead sees notification

Team Lead reviews code

POST /api/merge/approve or /api/merge/reject

Copy files from branch to main (if approved)

Update module status

WebSocket emit: mergeApproved/mergeRejected

Developer receives notification
```


##  API Endpoints

### Authentication
```bash
POST /api/auth/register
POST /api/auth/login
GET /api/auth/developers (Team Lead only)
```


### Projects
``` bash
GET /api/projects
POST /api/projects (Team Lead only)
GET /api/projects/:id
DELETE /api/projects/:id (Team Lead only)
```


### Modules
```bash
GET /api/modules
POST /api/modules (Team Lead only)
GET /api/modules/my-modules
PUT /api/modules/:id/status
POST /api/modules/clone
```

### Files
```bash
GET /api/files?projectId=X&branch=Y
GET /api/files/read?projectId=X&filePath=Y
POST /api/files/write
DELETE /api/files/delete
POST /api/files/create-folder
GET /api/files/search?projectId=X&searchTerm=Y
POST /api/files/bat (Team Lead only)
```


### Merge Requests
```bash
POST /api/merge/request
GET /api/merge/requests (Team Lead only)
POST /api/merge/approve (Team Lead only)
POST /api/merge/reject (Team Lead only)
```

### Execution
```bash
POST /api/execution/execute (Team Lead only)
POST /api/execution/stop (Team Lead only)
```

### Terminal
```bash
POST /api/terminal/execute
```

##  WebSocket Events

### Server → Client
```bash
'executionOutput' // Terminal/execution output
'executionComplete' // Process finished
'executionStopped' // Process stopped
'fileChanged' // File modified/created/deleted
'mergeRequested' // New merge request
'mergeApproved' // Merge approved
'mergeRejected' // Merge rejected
'serverStarted' // Development server started
```

### Client → Server
```bash
'joinProject' // Join project room
'fileUpdate' // File modification event
'disconnect' // Client disconnected
```

## Database Schemas

### User Schema
```bash
{
username: String (required, unique),
email: String (required, unique),
password: String (required, hashed),
role: String (enum: ['teamlead', 'developer']),
createdAt: Date,
updatedAt: Date
}
```

### Project Schema
```bash
{
name: String (required),
description: String,
rootPath: String (required),
createdBy: ObjectId (ref: 'User'),
batFiles: [String],
createdAt: Date,
updatedAt: Date
}
```

### Module Schema
```bash
{
name: String (required),
projectId: ObjectId (ref: 'Project'),
assignedTo: ObjectId (ref: 'User'),
description: String,
status: String (enum),
files: [String],
branch: String (required),
mergeRequestPending: Boolean,
mergeRequestMessage: String,
merged: Boolean,
cloned: Boolean,
allowDeveloperToCreateFiles: Boolean,
createdAt: Date,
updatedAt: Date
}
```

## Configuration Files

### Backend (.env)
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/project-collab
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### Frontend (vite.config.js)
```bash
export default defineConfig({
plugins: [react()],
server: {
port: 5173,
proxy: {
'/api': 'http://localhost:5000'
}
}
})
```

##  Best Practices Implemented

1. **Code Organization**
   - MVC pattern
   - Separation of concerns
   - Modular code structure

2. **Security**
   - JWT authentication
   - Password hashing
   - Input validation
   - CORS configuration

3. **Error Handling**
   - Try-catch blocks
   - Centralized error handling
   - Meaningful error messages

4. **Code Quality**
   - Consistent naming conventions
   - Comments for complex logic
   - Reusable components

5. **Performance**
   - Database indexing
   - Efficient queries
   - Code splitting
   - Lazy loading

##  Debugging & Logging

### Backend Logging
```bash
console.log('Server running on port', PORT);
console.error('Error:', error.message);
```

### Frontend Debugging
- React DevTools
- Console logging
- Network tab inspection
- WebSocket message monitoring

## Deployment Considerations

### Environment Variables
- Production MongoDB URI
- Strong JWT secret
- CORS origins

### Build Process
```bash
Frontend
cd frontend
npm run build

Backend
cd backend
npm install --production
```

### Hosting Recommendations
- **Backend**: Heroku, AWS EC2, DigitalOcean
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: MongoDB Atlas, AWS DocumentDB

