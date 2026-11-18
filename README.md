# 🚀 Collabrix – Project Management & Team Collaboration Platform

**Work Together. Achieve More.**

Collabrix is a full-stack project management and team collaboration platform designed to help teams organize projects, manage tasks, track progress, and collaborate efficiently through a centralized workspace.

The application provides an intuitive dashboard, project management tools, task tracking, and a Kanban board to make team workflows easier to manage.

---

## 🌟 Features

### 🔐 User Authentication
- User registration and login
- Secure password handling
- JWT-based authentication
- Protected API routes

### 📊 Dashboard
- Centralized workspace overview
- Project and task statistics
- Quick access to important information
- Task progress overview

### 📁 Project Management
- Create new projects
- View and manage projects
- Update project information
- Delete projects
- Organize project deadlines

### ✅ Task Management
- Create, update, and delete tasks
- Assign tasks to users
- Set task priorities
- Configure start and end dates
- Track task status

### 📌 Kanban Board
- Organize tasks into workflow columns
- Drag and drop tasks between columns
- Track tasks across different stages
- Save task status changes to MongoDB

### 👥 Team Management
- View users
- Assign team members to tasks
- Manage task ownership

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and responsive layouts |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Express.js | REST API development |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| JWT | Authentication |

---

## 📂 Project Structure

```text
Collabrix/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── userController.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── Comment.js
│   │   ├── Notification.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── stats.js
│   │   ├── taskRoutes.js
│   │   └── userRoutes.js
│   │
│   └── server.js
│
├── app.js
├── index.html
├── style.css
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## ⚙️ Installation and Setup

Follow these steps to run Collabrix locally.

### 1. Clone the repository

```bash
git clone https://github.com/Kampamallavarshitha/Collabrix.git
```

### 2. Navigate to the project directory

```bash
cd Collabrix
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `backend` folder.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Replace the MongoDB connection string with your own MongoDB connection string and configure a secure JWT secret.

### 5. Start the application

```bash
npm run dev
```

### 6. Open the application

Visit:

```text
http://localhost:5000
```

---

## 🔗 API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api` | API welcome message |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in a user |
| GET | `/api/projects` | Retrieve projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/tasks` | Retrieve tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id/status` | Update task status |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

*Note: Authentication and API access depend on the configured authorization middleware.*

---

## 🗄️ Database

Collabrix uses MongoDB to store application data.

Mongoose models define the structure of:

- Users
- Projects
- Tasks
- Comments
- Notifications

Task records include information such as task name, description, assigned user, project, priority, dates, and status.

---

## 🔒 Security

- JWT-based authentication
- Protected backend routes
- Environment variables for sensitive configuration
- User-specific project and task access

---

## 📸 Application Screenshots

Add screenshots of your application here to showcase the interface.

Suggested screenshots:

1. Login and Registration
2. Dashboard
3. Projects Page
4. Task Management
5. Kanban Board
6. Team Management

You can create a `screenshots` folder and add your images there.

Example:

```markdown
![Collabrix Dashboard](screenshots/dashboard.png)
```

---

## 🎯 Project Objective

The objective of Collabrix is to simplify project and task management by providing teams with a centralized platform to organize work, assign responsibilities, monitor progress, and manage their workflows efficiently.

This project demonstrates practical implementation of frontend development, REST API development, database integration, authentication, and full-stack application architecture.

---

## 👩‍💻 Developer

**Kampamalla Varshitha**

- GitHub: [@Kampamallavarshitha](https://github.com/Kampamallavarshitha)
- Project Repository: [Collabrix](https://github.com/Kampamallavarshitha/Collabrix)

---

⭐ If you find this project interesting, consider giving the repository a star!

**Built with  using JavaScript, Node.js, Express.js, and MongoDB.**
