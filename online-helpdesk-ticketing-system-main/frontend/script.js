const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.protocol === "file:"
    ? "http://localhost:5000"
    : "/api";

let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let confirmAction = null;
let knownNotificationIds = [];
let notificationsInitialized = false;

function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  const themeSwitch = document.getElementById("themeSwitch");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");

    if (themeSwitch) {
      themeSwitch.checked = true;
    }
  }
}

function toggleTheme() {
  const themeSwitch = document.getElementById("themeSwitch");

  if (themeSwitch && themeSwitch.checked) {
    document.body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("theme", "light");
  }
}

function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop();
  const links = document.querySelectorAll(".sidebar nav a");

  links.forEach(link => {
    const linkPage = link.getAttribute("href");

    if (linkPage === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function showLiveNotification(message) {
  const box = document.getElementById("liveNotificationBox");

  if (!box) return;

  box.textContent = message;
  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
  }, 3500);
}

function showConfirmModal(message, callback) {
  document.getElementById("modalMessage").textContent = message;
  document.getElementById("confirmModal").style.display = "flex";
  confirmAction = callback;
}

function closeModal() {
  document.getElementById("confirmModal").style.display = "none";
}

function confirmYes() {
  if (confirmAction) {
    confirmAction();
  }

  closeModal();
}

function getNotificationQuery() {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user) return "";

  return `role=${user.role}&userId=${user.id}`;
}

async function loadNotifications() {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user) return;

  const notificationCount = document.getElementById("notificationCount");
  const notificationList = document.getElementById("notificationList");

  if (!notificationCount || !notificationList) return;

  try {
    const response = await fetch(`${API_URL}/notifications?${getNotificationQuery()}`);
    const notifications = await response.json();

    const unreadResponse = await fetch(`${API_URL}/notifications/unread-count?${getNotificationQuery()}`);
    const unreadData = await unreadResponse.json();

    notificationCount.textContent = unreadData.count;

    if (unreadData.count > 0) {
      notificationCount.style.display = "inline-flex";
    } else {
      notificationCount.style.display = "none";
    }

    notificationList.innerHTML = "";

    if (notifications.length === 0) {
      notificationList.innerHTML = `
        <li class="empty-notification">
          No notifications yet.
        </li>
      `;
    } else {
      notifications.forEach(notification => {
        const li = document.createElement("li");

        li.innerHTML = `
          <strong>${notification.isRead ? "" : "New: "}</strong>
          ${notification.message}
          <br>
          <small>${formatDate(notification.createdAt)}</small>
        `;

        notificationList.appendChild(li);
      });
    }

    const currentIds = notifications.map(notification => notification._id);

    if (!notificationsInitialized) {
      knownNotificationIds = currentIds;
      notificationsInitialized = true;
      return;
    }

    const newNotifications = notifications.filter(notification => {
      return !knownNotificationIds.includes(notification._id);
    });

    if (newNotifications.length > 0) {
      showLiveNotification(newNotifications[0].message);
    }

    knownNotificationIds = currentIds;
  } catch (error) {
    console.error(error);
  }
}

async function toggleNotifications() {
  const dropdown = document.getElementById("notificationDropdown");

  if (!dropdown) return;

  dropdown.classList.toggle("show");

  if (dropdown.classList.contains("show")) {
    await loadNotifications();

    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (user) {
      await fetch(`${API_URL}/notifications/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role: user.role,
          userId: user.id
        })
      });

      await loadNotifications();
    }
  }
}

function startNotificationPolling() {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user) return;

  loadNotifications();

  setInterval(() => {
    loadNotifications();
  }, 5000);
}

function getPriorityLabel(priority) {
  if (priority === "urgent") return "🔴 urgent";
  if (priority === "high") return "🟠 high";
  if (priority === "medium") return "🟡 medium";
  return "🟢 low";
}

async function loginUser() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "create-ticket.html";
      }
    } else {
      message.style.color = "salmon";
      message.textContent = data.message;
    }
  } catch (error) {
    message.style.color = "salmon";
    message.textContent = "backend server error";
    console.error(error);
  }
}

async function registerUser() {
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;
  const message = document.getElementById("registerMessage");

  if (username === "" || password === "") {
    message.style.color = "salmon";
    message.textContent = "please fill in all fields";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (response.ok) {
      message.style.color = "lightgreen";
      message.textContent = data.message + " you can now login";
    } else {
      message.style.color = "salmon";
      message.textContent = data.message;
    }
  } catch (error) {
    message.style.color = "salmon";
    message.textContent = "backend server error";
    console.error(error);
  }
}

function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

async function fetchUserTickets() {
  const ticketList = document.getElementById("ticketList");
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user || user.role !== "user") {
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tickets`);
    const tickets = await response.json();

    const myTickets = tickets.filter(ticket => String(ticket.userId) === String(user.id));

    ticketList.innerHTML = "";

    if (myTickets.length === 0) {
      ticketList.innerHTML = `
        <li class="empty-state">
          <strong>No tickets submitted yet.</strong>
          Create your first support ticket to start tracking your concern.
        </li>
      `;
      return;
    }

    myTickets.forEach(ticket => {
      const li = document.createElement("li");

      li.innerHTML = `
        <div class="ticket-title-row">
          <strong>${ticket.title}</strong>
          <span class="status ${getStatusClass(ticket.status)}">
            ${ticket.status}
          </span>
        </div>

        <p>${ticket.description}</p>

        <small>Submitted by: ${ticket.username}</small><br>
        <small>Created: ${formatDate(ticket.createdAt)}</small><br>

        <small>
          Priority:
          <span class="priority ${getPriorityClass(ticket.priority)}">
            ${getPriorityLabel(ticket.priority || "low")}
          </span>
        </small>

        <div class="comments-section">
          <strong>Replies</strong>

          <ul class="comments-list">
            ${(ticket.comments || []).length === 0 ? "<li>No replies yet.</li>" : ""}
            ${(ticket.comments || []).map(comment => `
              <li>
                <strong>${comment.sender}</strong>: ${comment.message}
              </li>
            `).join("")}
          </ul>

          <div class="comment-box">
            <input type="text" id="comment-${ticket.id}" placeholder="Write a reply...">
            <button class="send-btn" onclick="addComment('${ticket.id}')">Send</button>
          </div>
        </div>

        <div class="button-row">
          <button class="danger-btn" onclick="deleteOwnTicket('${ticket.id}')">
            Delete My Ticket
          </button>
        </div>
      `;

      ticketList.appendChild(li);
    });
  } catch (error) {
    ticketList.innerHTML = "<li>failed to load tickets</li>";
    console.error(error);
  }
}

async function fetchAdminTickets() {
  const ticketList = document.getElementById("ticketList");
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user || user.role !== "admin") {
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tickets`);
    let tickets = await response.json();

    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const priorityFilter = document.getElementById("priorityFilter");

    if (searchInput && statusFilter && priorityFilter) {
      const searchValue = searchInput.value.toLowerCase();
      const statusValue = statusFilter.value;
      const priorityValue = priorityFilter.value;

      tickets = tickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchValue);
        const matchesStatus = statusValue === "all" || ticket.status === statusValue;
        const matchesPriority = priorityValue === "all" || ticket.priority === priorityValue;

        return matchesSearch && matchesStatus && matchesPriority;
      });
    }

    ticketList.innerHTML = "";

    if (tickets.length === 0) {
      ticketList.innerHTML = `
        <li class="empty-state">
          <strong>No matching tickets found.</strong>
          Try changing the search or filter options.
        </li>
      `;
      return;
    }

    tickets.forEach(ticket => {
      const li = document.createElement("li");

      li.innerHTML = `
        <div class="ticket-title-row">
          <strong>${ticket.title}</strong>
          <span class="status ${getStatusClass(ticket.status)}">
            ${ticket.status}
          </span>
        </div>

        <p>${ticket.description}</p>

        <small>Submitted by: ${ticket.username}</small><br>
        <small>Created: ${formatDate(ticket.createdAt)}</small><br>

        <small>
          Priority:
          <span class="priority ${getPriorityClass(ticket.priority)}">
            ${getPriorityLabel(ticket.priority || "low")}
          </span>
        </small>

        <div class="history">
          <strong>History</strong>
          <ul>
            ${ticket.history.map(item => `<li>${item}</li>`).join("")}
          </ul>
        </div>

        <div class="comments-section">
          <strong>Replies</strong>

          <ul class="comments-list">
            ${(ticket.comments || []).length === 0 ? "<li>No replies yet.</li>" : ""}
            ${(ticket.comments || []).map(comment => `
              <li>
                <strong>${comment.sender}</strong>: ${comment.message}
              </li>
            `).join("")}
          </ul>

          <div class="comment-box">
            <input type="text" id="comment-${ticket.id}" placeholder="Write a reply...">
            <button class="send-btn" onclick="addComment('${ticket.id}')">Send</button>
          </div>
        </div>

        <div class="button-row">
          <button onclick="updateTicketStatus('${ticket.id}', 'in progress')">
            In Progress
          </button>

          <button onclick="updateTicketStatus('${ticket.id}', 'resolved')">
            Resolved
          </button>

          <button onclick="updateTicketStatus('${ticket.id}', 'closed')">
            Closed
          </button>

          <button class="danger-btn" onclick="deleteTicket('${ticket.id}')">
            Delete
          </button>
        </div>
      `;

      ticketList.appendChild(li);
    });
  } catch (error) {
    ticketList.innerHTML = "<li>failed to load tickets</li>";
    console.error(error);
  }
}

async function fetchUsers() {
  const userList = document.getElementById("userList");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();

    userList.innerHTML = "";

    users.forEach(user => {
      const userId = user._id || user.id;
      const isAdmin = user.role === "admin";
      const statusButtonText = user.status === "active" ? "Deactivate" : "Activate";
      const nextStatus = user.status === "active" ? "inactive" : "active";

      const li = document.createElement("li");

      li.innerHTML = `
        <strong>${user.username}</strong>

        <p>Role: ${user.role}</p>

        <p>
          Status:
          <span class="status ${user.status === "active" ? "resolved" : "closed"}">
            ${user.status}
          </span>
        </p>

        <div class="button-row">
          <button onclick="updateUserStatus('${userId}', '${nextStatus}')" ${isAdmin ? "disabled" : ""}>
            ${statusButtonText}
          </button>

          <button class="danger-btn" onclick="deleteUser('${userId}')" ${isAdmin ? "disabled" : ""}>
            Delete User
          </button>
        </div>
      `;

      userList.appendChild(li);
    });
  } catch (error) {
    userList.innerHTML = "<li>failed to load users</li>";
    console.error(error);
  }
}

async function createTicket() {
  const submitButton = document.querySelector("button[onclick='createTicket()']");
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const title = document.getElementById("ticketTitle").value;
  const description = document.getElementById("ticketDescription").value;
  const priority = document.getElementById("ticketPriority").value;

  if (!user || user.role !== "user") {
    window.location.href = "index.html";
    return;
  }

  if (title === "" || description === "") {
    alert("please fill in all ticket fields");
    return;
  }

  if (submitButton) {
    submitButton.textContent = "Submitting...";
    submitButton.classList.add("loading");
  }

  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user.id,
        username: user.username,
        title,
        description,
        priority
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);

      document.getElementById("ticketTitle").value = "";
      document.getElementById("ticketDescription").value = "";
      document.getElementById("ticketPriority").value = "low";

      window.location.href = "user.html";
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert("failed to create ticket");
    console.error(error);
  }

  if (submitButton) {
    submitButton.textContent = "Submit Ticket";
    submitButton.classList.remove("loading");
  }
}

async function updateTicketStatus(ticketId, newStatus) {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user || user.role !== "admin") {
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: newStatus
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      fetchAdminTickets();
      reloadDashboardIfNeeded();
      loadNotifications();
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert("failed to update ticket");
    console.error(error);
  }
}

async function addComment(ticketId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const input = document.getElementById(`comment-${ticketId}`);
  const message = input.value;

  if (message.trim() === "") {
    alert("comment cannot be empty");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender: currentUser.username,
        senderRole: currentUser.role,
        message
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);

      input.value = "";

      if (currentUser.role === "admin") {
        fetchAdminTickets();
      } else {
        fetchUserTickets();
      }

      loadNotifications();
    } else {
      alert(data.message);
    }
  } catch (error) {
    alert("failed to add comment");
    console.error(error);
  }
}

async function updateUserStatus(userId, newStatus) {
  showConfirmModal(`Set this user as ${newStatus}?`, async () => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUsers();
        updateTotalUsers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("failed to update user status");
      console.error(error);
    }
  });
}

async function deleteTicket(ticketId) {
  showConfirmModal("Delete this ticket?", async () => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchAdminTickets();
        reloadDashboardIfNeeded();
        loadNotifications();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("failed to delete ticket");
      console.error(error);
    }
  });
}

async function deleteOwnTicket(ticketId) {
  showConfirmModal("Delete your ticket?", async () => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUserTickets();
        loadNotifications();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("failed to delete ticket");
      console.error(error);
    }
  });
}

async function deleteUser(userId) {
  showConfirmModal("Delete this user?", async () => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUsers();
        updateTotalUsers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("failed to delete user");
      console.error(error);
    }
  });
}

function updateDashboardStats(tickets) {
  let total = tickets.length;
  let pending = 0;
  let inProgress = 0;
  let resolved = 0;
  let closed = 0;

  tickets.forEach(ticket => {
    if (ticket.status === "pending") pending++;
    else if (ticket.status === "in progress") inProgress++;
    else if (ticket.status === "resolved") resolved++;
    else if (ticket.status === "closed") closed++;
  });

  document.getElementById("totalCount").textContent = total;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("inProgressCount").textContent = inProgress;
  document.getElementById("resolvedCount").textContent = resolved;
  document.getElementById("closedCount").textContent = closed;

  updateStatusBars(total, pending, inProgress, resolved, closed);
}

function updateStatusBars(total, pending, inProgress, resolved, closed) {
  const pendingPercent = total === 0 ? 0 : Math.round((pending / total) * 100);
  const inProgressPercent = total === 0 ? 0 : Math.round((inProgress / total) * 100);
  const resolvedPercent = total === 0 ? 0 : Math.round((resolved / total) * 100);
  const closedPercent = total === 0 ? 0 : Math.round((closed / total) * 100);

  document.getElementById("pendingBar").style.width = pendingPercent + "%";
  document.getElementById("inProgressBar").style.width = inProgressPercent + "%";
  document.getElementById("resolvedBar").style.width = resolvedPercent + "%";
  document.getElementById("closedBar").style.width = closedPercent + "%";

  document.getElementById("pendingPercent").textContent = pendingPercent + "%";
  document.getElementById("inProgressPercent").textContent = inProgressPercent + "%";
  document.getElementById("resolvedPercent").textContent = resolvedPercent + "%";
  document.getElementById("closedPercent").textContent = closedPercent + "%";
}

function updatePriorityStats(tickets) {
  let low = 0;
  let medium = 0;
  let high = 0;
  let urgent = 0;

  tickets.forEach(ticket => {
    if (ticket.priority === "low" || !ticket.priority) low++;
    else if (ticket.priority === "medium") medium++;
    else if (ticket.priority === "high") high++;
    else if (ticket.priority === "urgent") urgent++;
  });

  document.getElementById("lowPriorityCount").textContent = low;
  document.getElementById("mediumPriorityCount").textContent = medium;
  document.getElementById("highPriorityCount").textContent = high;
  document.getElementById("urgentPriorityCount").textContent = urgent;
}

async function updateTotalUsers() {
  try {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();

    document.getElementById("totalUsers").textContent = users.length;
  } catch (error) {
    console.error(error);
  }
}

async function loadSystemActivity() {
  const activityList = document.getElementById("activityList");

  try {
    const response = await fetch(`${API_URL}/tickets`);
    const tickets = await response.json();

    activityList.innerHTML = "";

    const latestTickets = tickets.slice(0, 5);

    if (latestTickets.length === 0) {
      activityList.innerHTML = `
        <li class="empty-state">
          <strong>No recent activity yet.</strong>
          Ticket activity will appear here.
        </li>
      `;
      return;
    }

    latestTickets.forEach(ticket => {
      const li = document.createElement("li");
      li.textContent = `${ticket.username} submitted "${ticket.title}" (${ticket.status})`;
      activityList.appendChild(li);
    });
  } catch (error) {
    activityList.innerHTML = "<li>failed to load activity</li>";
    console.error(error);
  }
}

async function loadDashboardData() {
  const response = await fetch(`${API_URL}/tickets`);
  const tickets = await response.json();

  updateDashboardStats(tickets);
  updatePriorityStats(tickets);
  updateTotalUsers();
  loadSystemActivity();
}

function reloadDashboardIfNeeded() {
  if (window.location.pathname.includes("admin.html")) {
    loadDashboardData();
  }
}

function getStatusClass(status) {
  if (status === "pending") return "pending";
  if (status === "in progress") return "inprogress";
  if (status === "resolved") return "resolved";
  if (status === "closed") return "closed";
  return "";
}

function getPriorityClass(priority) {
  if (priority === "low") return "priority-low";
  if (priority === "medium") return "priority-medium";
  if (priority === "high") return "priority-high";
  if (priority === "urgent") return "priority-urgent";
  return "priority-low";
}

function formatDate(dateValue) {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);
  return date.toLocaleString();
}

window.onload = async function () {
  initializeTheme();
  setActiveNav();

  const user = JSON.parse(localStorage.getItem("currentUser"));
  const page = window.location.pathname.split("/").pop();

  if (
    page === "admin.html" ||
    page === "tickets.html" ||
    page === "users.html"
  ) {
    if (!user || user.role !== "admin") {
      window.location.href = "index.html";
      return;
    }
  }

  if (
    page === "create-ticket.html" ||
    page === "user.html"
  ) {
    if (!user || user.role !== "user") {
      window.location.href = "index.html";
      return;
    }
  }

  if (page === "admin.html") {
    loadDashboardData();
  }

  if (page === "tickets.html") {
    fetchAdminTickets();
  }

  if (page === "users.html") {
    fetchUsers();
  }

  if (page === "user.html") {
    fetchUserTickets();
  }

  startNotificationPolling();
};