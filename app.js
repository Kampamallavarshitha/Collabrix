
/* =====================================
   COLLABRIX - PROJECT MANAGEMENT APP
   Full Stack Application
===================================== */


/* =====================================
   1. API CONFIGURATION
===================================== */

const API_URL = "/api";

let authToken = localStorage.getItem("collabrixToken");


/* =====================================
   2. APPLICATION STATE
===================================== */

let currentUser = null;

let users = [];
let projects = [];
let tasks = [];

let authMode = "login";
let toastTimeout;
let draggedTaskId = null;


/* =====================================
   3. HTML ELEMENT REFERENCES
===================================== */

const homePage = document.getElementById("homePage");
const authPage = document.getElementById("authPage");
const appPage = document.getElementById("appPage");

const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authSubmit = document.getElementById("authSubmit");
const authSwitch = document.getElementById("authSwitch");
const authError = document.getElementById("authError");
const nameGroup = document.getElementById("nameGroup");

const projectModal = document.getElementById("projectModal");
const taskModal = document.getElementById("taskModal");


/* =====================================
   4. API HELPER
===================================== */

async function apiRequest(endpoint, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    if (options.body) {
        headers["Content-Type"] = "application/json";
    }

    if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const responseText = await response.text();

    let data = {};

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            throw new Error("Invalid server response.");
        }
    }

    if (!response.ok) {
        throw new Error(
            data.message || data.error || "Something went wrong."
        );
    }

    return data;
}


/* =====================================
   5. DATA HELPERS
===================================== */

function getUserId(user) {
    if (!user) return "";

    return String(user._id || user.id || "");
}


function getProjectId(project) {
    if (!project) return "";

    return String(project._id || project.id || "");
}


function getTaskId(task) {
    if (!task) return "";

    return String(task._id || task.id || "");
}


function getTaskProjectId(task) {
    if (!task || !task.projectId) {
        return "";
    }

    if (typeof task.projectId === "object") {
        return String(
            task.projectId._id || task.projectId.id || ""
        );
    }

    return String(task.projectId);
}


function getResponseList(data, property) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data[property])) {
        return data[property];
    }

    if (data.data && Array.isArray(data.data[property])) {
        return data.data[property];
    }

    return [];
}


function getUserName(userId) {
    if (!userId) return "None";

    if (typeof userId === "object") {
        if (userId.name) {
            return userId.name;
        }

        userId = getUserId(userId);
    }

    const id = String(userId);

    const user = users.find(function (item) {
        return getUserId(item) === id;
    });

    return user ? user.name : "Unknown user";
}


function getProjectName(projectId) {
    if (!projectId) return "None";

    if (typeof projectId === "object") {
        if (projectId.name) {
            return projectId.name;
        }

        projectId = getProjectId(projectId);
    }

    const id = String(projectId);

    const project = projects.find(function (item) {
        return getProjectId(item) === id;
    });

    return project ? project.name : "None";
}


function formatDate(date) {
    if (!date) return "Not set";

    const value = new Date(date);

    if (isNaN(value.getTime())) {
        return "Not set";
    }

    return value.toLocaleDateString("en-IN");
}


function getDateInputValue(date) {
    if (!date) return "";

    return String(date).substring(0, 10);
}


/* =====================================
   6. HOMEPAGE LIVE STATISTICS
===================================== */

function computeStats(projectList, taskList) {
    const finishedProjects = projectList.filter(function (project) {
        const id = getProjectId(project);

        const ownTasks = taskList.filter(function (task) {
            return getTaskProjectId(task) === id;
        });

        return ownTasks.length > 0 &&
            ownTasks.every(function (task) {
                return task.status === "Completed";
            });
    }).length;

    const todoTasks = taskList.filter(function (task) {
        return task.status === "To Do";
    });

    return {
        totalProjects: projectList.length,
        finishedProjects: finishedProjects,
        todoTasks: todoTasks.length,
        highPriorityTasks: todoTasks.filter(function (task) {
            return task.priority === "High";
        }).length
    };
}


function animateNumber(element, target) {
    if (!element) return;

    const start = Number(element.dataset.value || 0);

    if (start === target) {
        element.textContent = target;
        element.dataset.value = target;
        return;
    }

    const duration = 800;
    const startTime = performance.now();

    function step(now) {
        const progress = Math.min(
            (now - startTime) / duration,
            1
        );

        const eased = 1 - Math.pow(1 - progress, 3);

        element.textContent = Math.round(
            start + (target - start) * eased
        );

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.dataset.value = target;
        }
    }

    requestAnimationFrame(step);
}


function setHeroStats(stats) {
    animateNumber(
        document.getElementById("heroTotalProjects"),
        Number(stats.totalProjects) || 0
    );

    animateNumber(
        document.getElementById("heroFinishedProjects"),
        Number(stats.finishedProjects) || 0
    );

    animateNumber(
        document.getElementById("heroTodoTasks"),
        Number(stats.todoTasks) || 0
    );

    animateNumber(
        document.getElementById("heroHighPriorityTasks"),
        Number(stats.highPriorityTasks) || 0
    );
}


async function loadHeroStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);

        if (!response.ok) {
            throw new Error("Stats unavailable.");
        }

        const data = await response.json();

        setHeroStats(data.stats || data);

    } catch (error) {
        if (projects.length > 0 || tasks.length > 0) {
            setHeroStats(computeStats(projects, tasks));
        }
    }
}


setInterval(function () {
    if (
        homePage &&
        !homePage.classList.contains("hidden")
    ) {
        loadHeroStats();
    }
}, 30000);


/* =====================================
   7. PAGE NAVIGATION
===================================== */

function showPage(page) {
    homePage.classList.add("hidden");
    authPage.classList.add("hidden");
    appPage.classList.add("hidden");

    if (page === "home") {
        homePage.classList.remove("hidden");
        window.scrollTo(0, 0);
    }

    if (page === "auth") {
        authPage.classList.remove("hidden");
        window.scrollTo(0, 0);
    }

    if (page === "app") {
        appPage.classList.remove("hidden");
        window.scrollTo(0, 0);
    }
}


function openHomePage() {
    showPage("home");
    loadHeroStats();
}


function openAuthPage(mode) {
    authMode = mode;
    updateAuthForm();
    showPage("auth");
}


async function openDashboard() {
    if (!currentUser || !authToken) {
        openAuthPage("login");
        return;
    }

    showPage("app");

    await loadWorkspaceData();

    showView("dashboard");
}


/* =====================================
   8. LOAD WORKSPACE DATA
===================================== */

async function loadWorkspaceData() {
    try {
        const [
            userResponse,
            projectResponse,
            taskResponse
        ] = await Promise.all([
            apiRequest("/users"),
            apiRequest("/projects"),
            apiRequest("/tasks")
        ]);

        users = getResponseList(userResponse, "users");
        projects = getResponseList(projectResponse, "projects");
        tasks = getResponseList(taskResponse, "tasks");

        renderDashboard();
        renderProjects();
        renderTasks();
        renderKanbanBoard();
        renderTeam();

    } catch (error) {
        console.error("Workspace loading failed:", error);

        showToast(error.message);

        users = [];
        projects = [];
        tasks = [];

        renderDashboard();
        renderProjects();
        renderTasks();
        renderKanbanBoard();
        renderTeam();
    }
}


/* =====================================
   9. AUTHENTICATION FORM
===================================== */

function updateAuthForm() {
    authError.textContent = "";
    authForm.reset();

    if (authMode === "register") {
        authTitle.textContent = "Create your account";

        authDescription.textContent =
            "Create an account to start using Collabrix.";

        authSubmit.textContent = "Create Account";

        nameGroup.classList.remove("hidden");

        authSwitch.innerHTML = `
            Already have an account?
            <button type="button" id="switchAuth">
                Login
            </button>
        `;
    } else {
        authTitle.textContent = "Welcome back";

        authDescription.textContent =
            "Log in to continue to your workspace.";

        authSubmit.textContent = "Login";

        nameGroup.classList.add("hidden");

        authSwitch.innerHTML = `
            Don't have an account?
            <button type="button" id="switchAuth">
                Create an account
            </button>
        `;
    }

    document.getElementById("switchAuth")
        .addEventListener("click", function () {
            openAuthPage(
                authMode === "login" ? "register" : "login"
            );
        });
}


/* =====================================
   10. AUTHENTICATION SUBMISSION
===================================== */

async function handleAuthentication(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();

    const email = document.getElementById("email")
        .value.trim().toLowerCase();

    const password = document.getElementById("password").value;

    authError.textContent = "";

    if (!email || !password) {
        authError.textContent =
            "Please enter your email and password.";
        return;
    }

    if (authMode === "register" && !name) {
        authError.textContent =
            "Please enter your full name.";
        return;
    }

    if (password.length < 8) {
        authError.textContent =
            "Password must contain at least 8 characters.";
        return;
    }

    authSubmit.disabled = true;
    authSubmit.textContent = "Please wait...";

    try {
        if (authMode === "register") {
            await registerUser(name, email, password);
        } else {
            await loginUser(email, password);
        }
    } catch (error) {
        authError.textContent = error.message;
    } finally {
        authSubmit.disabled = false;

        authSubmit.textContent =
            authMode === "register"
                ? "Create Account"
                : "Login";
    }
}


/* =====================================
   11. REGISTER USER
===================================== */

async function registerUser(name, email, password) {
    const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            name,
            email,
            password
        })
    });

    authToken = data.token;
    currentUser = data.user;

    if (!authToken || !currentUser) {
        throw new Error("Registration response is incomplete.");
    }

    localStorage.setItem("collabrixToken", authToken);

    showToast("Account created successfully!");

    await openDashboard();
}


/* =====================================
   12. LOGIN USER
===================================== */

async function loginUser(email, password) {
    const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password
        })
    });

    authToken = data.token;
    currentUser = data.user;

    if (!authToken || !currentUser) {
        throw new Error("Login response is incomplete.");
    }

    localStorage.setItem("collabrixToken", authToken);

    showToast("Login successful!");

    await openDashboard();
}


/* =====================================
   13. LOGOUT
===================================== */

function logoutUser() {
    currentUser = null;
    authToken = null;

    users = [];
    projects = [];
    tasks = [];

    localStorage.removeItem("collabrixToken");

    closeAllModals();

    showToast("You have logged out.");

    openHomePage();
}


/* =====================================
   14. DASHBOARD NAVIGATION
===================================== */

function showView(viewName) {
    document.querySelectorAll(".app-view").forEach(
        function (view) {
            view.classList.add("hidden");
        }
    );

    const selectedView =
        document.getElementById(viewName + "View");

    if (selectedView) {
        selectedView.classList.remove("hidden");
    }

    document.querySelectorAll(".nav-link").forEach(
        function (button) {
            button.classList.remove("active");

            if (button.dataset.view === viewName) {
                button.classList.add("active");
            }
        }
    );

    const titles = {
        dashboard: "Dashboard",
        projects: "Projects",
        tasks: "Tasks",
        board: "Kanban Board",
        team: "Team"
    };

    const viewTitle = document.getElementById("viewTitle");

    if (viewTitle) {
        viewTitle.textContent =
            titles[viewName] || "Dashboard";
    }

    if (viewName === "dashboard") renderDashboard();
    if (viewName === "projects") renderProjects();
    if (viewName === "tasks") renderTasks();
    if (viewName === "board") renderKanbanBoard();
    if (viewName === "team") renderTeam();
}


/* =====================================
   15. DASHBOARD
===================================== */

function renderDashboard() {
    if (!currentUser) return;

    const completedCount = tasks.filter(function (task) {
        return task.status === "Completed";
    }).length;

    const pendingCount = tasks.length - completedCount;

    const firstLetter =
        (currentUser.name || "U").charAt(0).toUpperCase();

    document.getElementById("dashboardName").textContent =
        currentUser.name || "";

    document.getElementById("welcomeName").textContent =
        currentUser.name || "";

    document.getElementById("sidebarUserName").textContent =
        currentUser.name || "";

    document.getElementById("sidebarUserRole").textContent =
        "Account";

    document.getElementById("sidebarAvatar").textContent =
        firstLetter;

    document.getElementById("headerAvatar").textContent =
        firstLetter;

    document.getElementById("totalProjects").textContent =
        projects.length;

    document.getElementById("totalTasks").textContent =
        tasks.length;

    document.getElementById("completedTasks").textContent =
        completedCount;

    document.getElementById("pendingTasks").textContent =
        pendingCount;

    renderRecentProjects();
    renderRecentTasks();
}


/* =====================================
   16. PROJECT PROGRESS CALCULATION
===================================== */

function getProjectProgress(project) {
    const projectId = getProjectId(project);

    const projectTasks = tasks.filter(function (task) {
        return getTaskProjectId(task) === projectId;
    });

    const totalTasks = projectTasks.length;

    const completedTasks = projectTasks.filter(function (task) {
        return task.status === "Completed";
    }).length;

    const percentage = totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    let status = "Not Started";

    if (totalTasks > 0 && percentage === 100) {
        status = "Completed";
    } else if (totalTasks > 0) {
        status = "In Progress";
    }

    return {
        totalTasks,
        completedTasks,
        percentage,
        status
    };
}


function createProjectProgressHTML(project) {
    const progress = getProjectProgress(project);

    let statusClass = "";

    if (progress.status === "Completed") {
        statusClass = "completed";
    } else if (progress.status === "Not Started") {
        statusClass = "not-started";
    }

    return `
        <div class="project-progress">

            <div class="progress-info">
                <span>Project Progress</span>
                <strong>${progress.percentage}%</strong>
            </div>

            <div class="progress-track">
                <div
                    class="progress-fill"
                    style="width: ${progress.percentage}%">
                </div>
            </div>

            <div class="progress-details">
                <span>${progress.completedTasks} completed</span>
                <span>${progress.totalTasks} total tasks</span>
            </div>

            <span class="project-progress-status ${statusClass}">
                ${progress.status}
            </span>

        </div>
    `;
}


/* =====================================
   17. RECENT PROJECTS
===================================== */

function renderRecentProjects() {
    const container = document.getElementById("recentProjects");

    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = `
            <p class="empty-state">No projects created yet.</p>
        `;
        return;
    }

    container.innerHTML = projects.slice(0, 3).map(
        function (project) {
            return `
                <div class="project-row">
                    <div>
                        <h4>${escapeHTML(project.name)}</h4>
                        <p>${escapeHTML(project.description || "")}</p>
                    </div>

                    <span class="status status-progress">
                        Project
                    </span>
                </div>
            `;
        }
    ).join("");
}


/* =====================================
   18. RECENT TASKS
===================================== */

function renderRecentTasks() {
    const container = document.getElementById("recentTasks");

    if (!container) return;

    if (tasks.length === 0) {
        container.innerHTML = `
            <p class="empty-state">No tasks created yet.</p>
        `;
        return;
    }

    container.innerHTML = tasks.slice(0, 4).map(
        function (task) {
            return createTaskHTML(task, false);
        }
    ).join("");
}


/* =====================================
   19. PROJECT MANAGEMENT
===================================== */

function renderProjects() {
    const container = document.getElementById("allProjects");

    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = `
            <p class="empty-state">
                No projects available. Create your first project.
            </p>
        `;
        return;
    }

    container.innerHTML = projects.map(function (project) {
        return `
            <article class="project-card">

                <span class="status status-progress">Project</span>

                <h3>${escapeHTML(project.name)}</h3>

                <p>${escapeHTML(project.description || "")}</p>

                <small>
                    <strong>Assigned By:</strong>
                    ${escapeHTML(getUserName(project.assignedBy))}
                </small>

                <small>
                    <strong>Created By:</strong>
                    ${escapeHTML(getUserName(project.createdBy))}
                </small>

                <small>
                    Deadline: ${escapeHTML(formatDate(project.deadline))}
                </small>

                ${createProjectProgressHTML(project)}

            </article>
        `;
    }).join("");
}


/* =====================================
   20. USER DROPDOWN HELPER
===================================== */

function populateUserDropdown(elementId, placeholder) {
    const select = document.getElementById(elementId);

    if (!select) return;

    select.innerHTML = `
        <option value="">${escapeHTML(placeholder)}</option>
    `;

    users.forEach(function (user) {
        select.innerHTML += `
            <option value="${escapeHTML(getUserId(user))}">
                ${escapeHTML(user.name)}
            </option>
        `;
    });
}


/* =====================================
   21. OPEN PROJECT MODAL
===================================== */

function openProjectModal() {
    const form = document.getElementById("projectForm");

    form.reset();

    populateUserDropdown(
        "projectAssignedBy",
        "Select assigned by"
    );

    populateUserDropdown(
        "projectCreatedBy",
        "Select created by"
    );

    const createdBy =
        document.getElementById("projectCreatedBy");

    if (createdBy && currentUser) {
        createdBy.value = getUserId(currentUser);
    }

    projectModal.classList.remove("hidden");
}


/* =====================================
   22. CREATE PROJECT
===================================== */

async function createProject(event) {
    event.preventDefault();

    const name =
        document.getElementById("projectName").value.trim();

    const description =
        document.getElementById("projectDescription").value.trim();

    const assignedBy =
        document.getElementById("projectAssignedBy").value;

    const createdBy =
        document.getElementById("projectCreatedBy").value;

    const deadline =
        document.getElementById("projectDeadline").value;

    if (!name || !assignedBy || !createdBy) {
        showToast("Please complete all required project fields.");
        return;
    }

    const submitButton = document.querySelector(
        "#projectForm button[type='submit']"
    );

    submitButton.disabled = true;
    submitButton.textContent = "Creating...";

    try {
        const data = await apiRequest("/projects", {
            method: "POST",

            body: JSON.stringify({
                name,
                description,
                assignedBy,
                createdBy,
                deadline: deadline || null
            })
        });

        if (data.project) {
            projects.unshift(data.project);
        } else {
            await loadProjects();
        }

        closeModal("projectModal");

        renderProjects();
        renderDashboard();

        showToast("Project created successfully!");

    } catch (error) {
        console.error("Project creation failed:", error);
        showToast(error.message);

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Create Project";
    }
}


/* =====================================
   23. LOAD PROJECTS
===================================== */

async function loadProjects() {
    const data = await apiRequest("/projects");

    projects = getResponseList(data, "projects");
}


/* =====================================
   24. TASK MANAGEMENT
===================================== */

function renderTasks() {
    const container = document.getElementById("allTasks");

    if (!container) return;

    if (tasks.length === 0) {
        container.innerHTML = `
            <p class="empty-state">
                No tasks available. Create your first task.
            </p>
        `;
        return;
    }

    container.innerHTML = tasks.map(function (task) {
        return createTaskHTML(task, true);
    }).join("");
}


/* =====================================
   25. TASK HTML
===================================== */

function getPriorityBadge(priority) {
    if (!priority) return "";

    const safePriority = escapeHTML(priority);
    const priorityClass = escapeHTML(priority.toLowerCase());

    return `
        <span class="status priority-${priorityClass}">
            ${safePriority}
        </span>
    `;
}


function createTaskHTML(task, showStatusSelect) {
    const projectName = getProjectName(task.projectId);
    const assignedTo = getUserName(task.assignedTo);

    const taskDetails = `
        <h4>
            ${escapeHTML(task.name)}
            ${getPriorityBadge(task.priority)}
        </h4>

        <p>Project: ${escapeHTML(projectName)}</p>

        <p>Assigned To: ${escapeHTML(assignedTo)}</p>

        <small>
            Start: ${escapeHTML(formatDate(task.startDate))}
            |
            End: ${escapeHTML(formatDate(task.endDate))}
        </small>
    `;

    if (showStatusSelect) {
        return `
            <div class="task-row">

                <div>
                    ${taskDetails}
                </div>

                <select
                    data-task-id="${escapeHTML(getTaskId(task))}"
                    class="task-status-select">

                    <option value="To Do"
                        ${task.status === "To Do" ? "selected" : ""}>
                        To Do
                    </option>

                    <option value="In Progress"
                        ${task.status === "In Progress" ? "selected" : ""}>
                        In Progress
                    </option>

                    <option value="Completed"
                        ${task.status === "Completed" ? "selected" : ""}>
                        Completed
                    </option>

                </select>

            </div>
        `;
    }

    return `
        <div class="task-row">

            <div>${taskDetails}</div>

            <span class="status ${getStatusClass(task.status)}">
                ${escapeHTML(task.status)}
            </span>

        </div>
    `;
}


/* =====================================
   26. OPEN TASK MODAL
===================================== */

function openTaskModal() {
    const form = document.getElementById("taskForm");

    form.reset();

    populateUserDropdown(
        "taskAssignedTo",
        "Select team member"
    );

    const projectSelect =
        document.getElementById("taskProject");

    projectSelect.innerHTML = `
        <option value="">None</option>
    `;

    projects.forEach(function (project) {
        projectSelect.innerHTML += `
            <option value="${escapeHTML(getProjectId(project))}">
                ${escapeHTML(project.name)}
            </option>
        `;
    });

    const today = new Date().toISOString().split("T")[0];

    const startDate =
        document.getElementById("taskStartDate");

    const endDate =
        document.getElementById("taskEndDate");

    startDate.min = today;
    endDate.min = today;

    taskModal.classList.remove("hidden");
}


/* =====================================
   27. CREATE TASK
===================================== */

async function createTask(event) {
    event.preventDefault();

    const name =
        document.getElementById("taskName").value.trim();

    const description =
        document.getElementById("taskDescription").value.trim();

    const assignedTo =
        document.getElementById("taskAssignedTo").value;

    const projectId =
        document.getElementById("taskProject").value;

    const startDate =
        document.getElementById("taskStartDate").value;

    const endDate =
        document.getElementById("taskEndDate").value;

    const priority =
        document.getElementById("taskPriority").value;

    const status =
        document.getElementById("taskStatus").value;

    if (!name || !assignedTo) {
        showToast("Please enter a task name and assigned member.");
        return;
    }

    if (startDate && endDate && endDate < startDate) {
        showToast("End date cannot be before start date.");
        return;
    }

    const submitButton = document.querySelector(
        "#taskForm button[type='submit']"
    );

    submitButton.disabled = true;
    submitButton.textContent = "Creating...";

    try {
        const data = await apiRequest("/tasks", {
            method: "POST",

            body: JSON.stringify({
                name,
                description,
                assignedTo,
                projectId: projectId || null,
                startDate: startDate || null,
                endDate: endDate || null,
                priority,
                status
            })
        });

        if (data.task) {
            tasks.unshift(data.task);
        } else {
            await loadTasks();
        }

        closeModal("taskModal");

        renderTasks();
        renderDashboard();
        renderKanbanBoard();
        renderProjects();

        showToast("Task created successfully!");

    } catch (error) {
        console.error("Task creation failed:", error);
        showToast(error.message);

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Create Task";
    }
}


/* =====================================
   28. LOAD TASKS
===================================== */

async function loadTasks() {
    const data = await apiRequest("/tasks");

    tasks = getResponseList(data, "tasks");
}


/* =====================================
   29. UPDATE TASK STATUS IN MONGODB
===================================== */

async function updateTaskStatus(taskId, newStatus) {
    const validStatuses = [
        "To Do",
        "In Progress",
        "Completed"
    ];

    if (!taskId || !validStatuses.includes(newStatus)) {
        showToast("Invalid task or status.");
        return;
    }

    // Find the task in the current application data
    const existingTask = tasks.find(function (task) {
        return getTaskId(task) === String(taskId);
    });

    if (!existingTask) {
        showToast("Task not found.");
        return;
    }

    // Avoid unnecessary database requests
    if (existingTask.status === newStatus) {
        return;
    }

    try {
        showToast("Saving task status...");

        // Send the new status to the backend.
        // The backend must save this change in MongoDB.
        const response = await apiRequest(
            `/tasks/${encodeURIComponent(taskId)}/status`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        // Update local task data using the saved response
        if (response.task) {
            const updatedTask = response.task;

            tasks = tasks.map(function (task) {
                return getTaskId(task) === String(taskId)
                    ? updatedTask
                    : task;
            });
        }

        // Fetch the latest database records
        await loadTasks();

        // Refresh all related sections
        renderTasks();
        renderDashboard();
        renderKanbanBoard();
        renderProjects();

        showToast("Task status saved to MongoDB!");

    } catch (error) {
        console.error("MongoDB task status update failed:", error);

        // Restore the board using the actual database data
        try {
            await loadTasks();

            renderTasks();
            renderDashboard();
            renderKanbanBoard();
            renderProjects();

        } catch (reloadError) {
            console.error(
                "Could not reload tasks:",
                reloadError
            );
        }

        showToast(
            error.message || "Unable to save task status."
        );
    }
}


/* =====================================
   30. TASK STATUS CLASS
===================================== */

function getStatusClass(status) {
    if (status === "Completed") {
        return "status-done";
    }

    if (status === "In Progress") {
        return "status-progress";
    }

    return "status-pending";
}


/* =====================================
   31. KANBAN BOARD
===================================== */

function createKanbanCard(task) {
    const taskId = getTaskId(task);

    return `
        <article
            class="kanban-card"
            draggable="true"
            data-task-id="${escapeHTML(taskId)}">

            <div class="kanban-card-top">
                ${getPriorityBadge(task.priority)}

                <span class="kanban-card-drag">
                    <i class="fas fa-grip-vertical"></i>
                </span>
            </div>

            <h4>${escapeHTML(task.name)}</h4>

            <p class="kanban-description">
                ${escapeHTML(task.description || "No description provided.")}
            </p>

            <div class="kanban-card-info">

                <span>
                    <i class="fas fa-folder"></i>
                    ${escapeHTML(getProjectName(task.projectId))}
                </span>

                <span>
                    <i class="fas fa-user"></i>
                    ${escapeHTML(getUserName(task.assignedTo))}
                </span>

                <span>
                    <i class="fas fa-calendar"></i>
                    ${escapeHTML(formatDate(task.endDate))}
                </span>

            </div>

        </article>
    `;
}


function renderKanbanBoard() {
    const todoContainer =
        document.getElementById("boardTodo");

    const progressContainer =
        document.getElementById("boardInProgress");

    const completedContainer =
        document.getElementById("boardCompleted");

    if (
        !todoContainer ||
        !progressContainer ||
        !completedContainer
    ) {
        return;
    }

    const todoTasks = tasks.filter(function (task) {
        return task.status === "To Do";
    });

    const inProgressTasks = tasks.filter(function (task) {
        return task.status === "In Progress";
    });

    const completedTasks = tasks.filter(function (task) {
        return task.status === "Completed";
    });

    todoContainer.innerHTML = todoTasks.length
        ? todoTasks.map(createKanbanCard).join("")
        : `<p class="kanban-empty">No tasks here yet</p>`;

    progressContainer.innerHTML = inProgressTasks.length
        ? inProgressTasks.map(createKanbanCard).join("")
        : `<p class="kanban-empty">No tasks here yet</p>`;

    completedContainer.innerHTML = completedTasks.length
        ? completedTasks.map(createKanbanCard).join("")
        : `<p class="kanban-empty">No tasks here yet</p>`;

    updateKanbanCounts();
}


function updateKanbanCounts() {
    const todoCount = document.getElementById("todoCount");

    const progressCount =
        document.getElementById("progressCount") ||
        document.getElementById("inProgressCount");

    const completedCount =
        document.getElementById("completedCount");

    if (todoCount) {
        todoCount.textContent = tasks.filter(function (task) {
            return task.status === "To Do";
        }).length;
    }

    if (progressCount) {
        progressCount.textContent = tasks.filter(function (task) {
            return task.status === "In Progress";
        }).length;
    }

    if (completedCount) {
        completedCount.textContent = tasks.filter(function (task) {
            return task.status === "Completed";
        }).length;
    }
}


/* =====================================
   32. KANBAN DRAG AND DROP
===================================== */

// Start dragging a task
document.addEventListener("dragstart", function (event) {
    const card = event.target.closest(".kanban-card");

    if (!card) return;

    draggedTaskId = card.dataset.taskId;

    card.classList.add("dragging");

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
        "text/plain",
        draggedTaskId
    );
});


// Allow task cards to be dropped into columns
document.addEventListener("dragover", function (event) {
    const column = event.target.closest(".kanban-column");

    if (!column || !draggedTaskId) return;

    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    column.classList.add("drag-over");
});


// Remove the highlighted column when leaving it
document.addEventListener("dragleave", function (event) {
    const column = event.target.closest(".kanban-column");

    if (!column) return;

    if (!column.contains(event.relatedTarget)) {
        column.classList.remove("drag-over");
    }
});


// Save the new task status when dropped
document.addEventListener("drop", async function (event) {
    const column = event.target.closest(".kanban-column");

    if (!column) return;

    event.preventDefault();

    column.classList.remove("drag-over");

    const taskId =
        event.dataTransfer.getData("text/plain") ||
        draggedTaskId;

    const newStatus = column.dataset.status;

    // Reset the dragging variable
    draggedTaskId = null;

    if (!taskId || !newStatus) return;

    const task = tasks.find(function (item) {
        return getTaskId(item) === String(taskId);
    });

    if (!task) {
        showToast("Task not found.");
        return;
    }

    // Don't update if dropped into the same column
    if (task.status === newStatus) {
        return;
    }

    // Update the database through the backend
    await updateTaskStatus(taskId, newStatus);
});


// Finish dragging
document.addEventListener("dragend", function (event) {
    const card = event.target.closest(".kanban-card");

    if (card) {
        card.classList.remove("dragging");
    }

    document.querySelectorAll(".kanban-card").forEach(
        function (item) {
            item.classList.remove("dragging");
        }
    );

    document.querySelectorAll(".kanban-column").forEach(
        function (column) {
            column.classList.remove("drag-over");
        }
    );

    draggedTaskId = null;
});

document.addEventListener("dragend", function (event) {
    const card = event.target.closest(".kanban-card");

    if (card) {
        card.classList.remove("dragging");
    }

    document.querySelectorAll(".kanban-column").forEach(
        function (column) {
            column.classList.remove("drag-over");
        }
    );

    draggedTaskId = null;
});


document.addEventListener("dragover", function (event) {
    const column = event.target.closest(".kanban-column");

    if (!column) return;

    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    column.classList.add("drag-over");
});


document.addEventListener("dragleave", function (event) {
    const column = event.target.closest(".kanban-column");

    if (!column) return;

    if (!column.contains(event.relatedTarget)) {
        column.classList.remove("drag-over");
    }
});


document.addEventListener("drop", async function (event) {
    const column = event.target.closest(".kanban-column");

    if (!column) return;

    event.preventDefault();

    column.classList.remove("drag-over");

    const taskId =
        event.dataTransfer.getData("text/plain") ||
        draggedTaskId;

    const newStatus = column.dataset.status;

    if (!taskId || !newStatus) return;

    const task = tasks.find(function (item) {
        return getTaskId(item) === taskId;
    });

    if (!task || task.status === newStatus) return;

    await updateTaskStatus(taskId, newStatus);
});


/* =====================================
   33. TEAM VIEW
===================================== */

function renderTeam() {
    const container = document.getElementById("teamMembers");

    if (!container) return;

    if (users.length === 0) {
        container.innerHTML = `
            <p class="empty-state">No team members available.</p>
        `;
        return;
    }

    container.innerHTML = users.map(function (user) {
        const letter =
            (user.name || "U").charAt(0).toUpperCase();

        return `
            <div class="team-card">

                <div class="avatar">
                    ${escapeHTML(letter)}
                </div>

                <div>
                    <h3>${escapeHTML(user.name)}</h3>
                    <p>${escapeHTML(user.email || "")}</p>
                </div>

            </div>
        `;
    }).join("");
}


/* =====================================
   34. MODAL FUNCTIONS
===================================== */

function closeModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.add("hidden");
    }
}


function closeAllModals() {
    if (projectModal) {
        projectModal.classList.add("hidden");
    }

    if (taskModal) {
        taskModal.classList.add("hidden");
    }
}


/* =====================================
   35. TOAST NOTIFICATIONS
===================================== */

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(function () {
        toast.classList.remove("show");
    }, 2500);
}


/* =====================================
   36. HTML ESCAPING
===================================== */

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        function (character) {
            const replacements = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return replacements[character];
        }
    );
}


/* =====================================
   37. HOMEPAGE EVENTS
===================================== */

document.getElementById("showLogin")
    .addEventListener("click", function () {
        openAuthPage("login");
    });


document.getElementById("showRegister")
    .addEventListener("click", function () {
        openAuthPage("register");
    });


document.getElementById("heroGetStarted")
    .addEventListener("click", function () {
        openAuthPage("register");
    });


document.getElementById("heroLogin")
    .addEventListener("click", function () {
        openAuthPage("login");
    });


document.getElementById("aboutGetStarted")
    .addEventListener("click", function () {
        openAuthPage("register");
    });


/* =====================================
   38. BACK TO HOMEPAGE
===================================== */

document.getElementById("backToHome")
    .addEventListener("click", function (event) {
        event.preventDefault();
        openHomePage();
    });


document.getElementById("authBackHome")
    .addEventListener("click", openHomePage);


/* =====================================
   39. AUTHENTICATION EVENTS
===================================== */

authForm.addEventListener("submit", handleAuthentication);


/* =====================================
   40. SIDEBAR EVENTS
===================================== */

document.querySelectorAll(".nav-link").forEach(
    function (button) {
        button.addEventListener("click", function () {
            showView(button.dataset.view);
        });
    }
);


/* =====================================
   41. DASHBOARD NAVIGATION EVENTS
===================================== */

document.querySelectorAll("[data-go-view]").forEach(
    function (button) {
        button.addEventListener("click", function () {
            showView(button.dataset.goView);
        });
    }
);


/* =====================================
   42. LOGOUT EVENT
===================================== */

document.getElementById("logoutButton")
    .addEventListener("click", logoutUser);


/* =====================================
   43. PROJECT EVENTS
===================================== */

document.getElementById("addProjectButton")
    .addEventListener("click", openProjectModal);


document.getElementById("dashboardNewProject")
    .addEventListener("click", openProjectModal);


document.getElementById("projectForm")
    .addEventListener("submit", createProject);


/* =====================================
   44. TASK EVENTS
===================================== */

document.getElementById("addTaskButton")
    .addEventListener("click", openTaskModal);


document.getElementById("boardNewTask")
    .addEventListener("click", openTaskModal);


document.getElementById("taskForm")
    .addEventListener("submit", createTask);


/* =====================================
   45. TASK STATUS EVENT
===================================== */

document.getElementById("allTasks")
    .addEventListener("change", function (event) {
        if (
            event.target.classList.contains("task-status-select")
        ) {
            updateTaskStatus(
                event.target.dataset.taskId,
                event.target.value
            );
        }
    });


/* =====================================
   46. TASK DATE VALIDATION
===================================== */

document.getElementById("taskStartDate")
    .addEventListener("change", function () {
        const endDate =
            document.getElementById("taskEndDate");

        endDate.min = this.value || "";

        if (endDate.value && this.value > endDate.value) {
            endDate.value = "";
        }
    });


/* =====================================
   47. CLOSE MODAL EVENTS
===================================== */

document.querySelectorAll("[data-close]").forEach(
    function (button) {
        button.addEventListener("click", function () {
            closeModal(button.dataset.close);
        });
    }
);


/* =====================================
   48. CLICK OUTSIDE MODAL
===================================== */

document.querySelectorAll(".modal").forEach(
    function (modal) {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    }
);


/* =====================================
   49. INITIALIZE APPLICATION
===================================== */

async function initializeApp() {
    if (!authToken) {
        openHomePage();
        return;
    }

    try {
        const data = await apiRequest("/auth/me");

        currentUser = data.user;

        if (!currentUser) {
            throw new Error("Unable to verify your account.");
        }

        await openDashboard();

    } catch (error) {
        console.error("Authentication check failed:", error);

        authToken = null;
        currentUser = null;

        users = [];
        projects = [];
        tasks = [];

        localStorage.removeItem("collabrixToken");

        openHomePage();
    }
}


/* =====================================
   50. START APPLICATION
===================================== */

initializeApp();
