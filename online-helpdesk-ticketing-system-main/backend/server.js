require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const connectDB = require("./db");
const User = require("./models/User");
const Ticket = require("./models/Ticket");
const Notification = require("./models/Notification");


const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (req.url.startsWith("/api/")) {
    req.url = req.url.replace("/api", "");
  }
  next();
});

console.log("starting database connection...");
connectDB();

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Online Helpdesk API",
      version: "1.0.0",
      description: "API documentation for the Online Helpdesk Ticketing System"
    },
    servers: [
      {
        url: "https://online-helpdesk-ticketing-system.vercel.app/api"
      }
    ],
    paths: {
      "/login": {
        post: {
          summary: "User login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    username: { type: "string", example: "morriz" },
                    password: { type: "string", example: "12345678" }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: "Login successful" },
            401: { description: "Invalid username or password" }
          }
        }
      },

      "/register": {
        post: {
          summary: "Register new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    username: { type: "string", example: "newuser" },
                    password: { type: "string", example: "User12345" }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: "User registered" },
            400: { description: "Username already exists" }
          }
        }
      },

      "/tickets": {
        get: {
          summary: "Get all tickets",
          responses: {
            200: { description: "List of tickets" }
          }
        },
        post: {
          summary: "Create new ticket",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: { type: "string", example: "USER_ID_HERE" },
                    username: { type: "string", example: "morriz" },
                    title: { type: "string", example: "Cannot login" },
                    description: { type: "string", example: "I cannot access my account." },
                    priority: { type: "string", example: "low" }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: "Ticket created" }
          }
        }
      },

      "/tickets/{id}/status": {
        put: {
          summary: "Update ticket status",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "resolved" }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: "Ticket status updated" }
          }
        }
      },

      "/tickets/{id}/comment": {
        post: {
          summary: "Add ticket comment",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sender: { type: "string", example: "admin" },
                    senderRole: { type: "string", example: "admin" },
                    message: { type: "string", example: "Your ticket has been checked." }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: "Comment added" }
          }
        }
      },

      "/tickets/{id}": {
        delete: {
          summary: "Delete ticket",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            200: { description: "Ticket deleted" }
          }
        }
      },

      "/users": {
        get: {
          summary: "Get all users",
          responses: {
            200: { description: "List of users" }
          }
        }
      },

      "/users/{id}/status": {
        put: {
          summary: "Update user status",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "inactive" }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: "User status updated" }
          }
        }
      },

      "/users/{id}": {
        delete: {
          summary: "Delete user",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            200: { description: "User deleted" }
          }
        }
      },

      "/notifications": {
        get: {
          summary: "Get notifications",
          responses: {
            200: { description: "List of notifications" }
          }
        }
      },

      "/notifications/unread-count": {
        get: {
          summary: "Get unread notification count",
          responses: {
            200: { description: "Unread notification count" }
          }
        }
      },

      "/notifications/read": {
        put: {
          summary: "Mark notifications as read",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    role: { type: "string", example: "admin" },
                    userId: { type: "string", example: "USER_ID_HERE" }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: "Notifications marked as read" }
          }
        }
      },

      "/seed-users": {
        get: {
          summary: "Create default users",
          responses: {
            200: { description: "Default users created" }
          }
        }
      }
    }
  },
  apis: ["./server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.get("/swagger.json", (req, res) => {
  res.json(swaggerSpec);
});

app.get("/api-docs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Online Helpdesk API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: "/swagger.json",
            dom_id: "#swagger-ui"
          });
        </script>
      </body>
    </html>
  `);
});
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true
  })
);

function cleanText(value) {
  return String(value || "").trim();
}

function isStrongPassword(password) {
  return password && password.length >= 8;
}

async function notifyAdmins(message, ticketId) {
  await Notification.create({
    recipientRole: "admin",
    recipientId: null,
    ticketId,
    message
  });
}

async function notifyUser(userId, message, ticketId) {
  await Notification.create({
    recipientRole: "user",
    recipientId: userId,
    ticketId,
    message
  });
}

app.get("/", (req, res) => {
  res.send("helpdesk backend is running with MongoDB");
});

app.get("/seed-users", async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ username: "morriz" });

    if (existingAdmin) {
      return res.json({ message: "default users already exist" });
    }

    const adminPassword = await bcrypt.hash("12345678", 10);
    const userPassword = await bcrypt.hash("User@12345", 10);

    await User.create([
      { username: "admin", password: adminPassword, role: "admin", status: "active" },
      { username: "user", password: userPassword, role: "user", status: "active" }
    ]);

    res.json({ message: "default users created" });
  } catch (error) {
    res.status(500).json({
      message: "failed to seed users",
      error: error.message
    });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "failed to fetch users",
      error: error.message
    });
  }
});

app.post("/register", async (req, res) => {
  try {
    const username = cleanText(req.body.username);
    const password = cleanText(req.body.password);

    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }

    if (username.length < 4) {
      return res.status(400).json({ message: "username must be at least 4 characters" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: "password must be at least 8 characters" });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: "username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: "user",
      status: "active"
    });

    res.json({
      message: "registration successful",
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "failed to register user",
      error: error.message
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const username = cleanText(req.body.username);
    const password = cleanText(req.body.password);

    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }

    const foundUser = await User.findOne({ username });

    if (!foundUser) {
      return res.status(401).json({ message: "invalid username or password" });
    }

    const passwordMatches = await bcrypt.compare(password, foundUser.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "invalid username or password" });
    }

    if (foundUser.status !== "active") {
      return res.status(403).json({ message: "account is inactive" });
    }

    res.json({
      message: "login successful",
      user: {
        id: foundUser._id,
        username: foundUser.username,
        role: foundUser.role,
        status: foundUser.status
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "login failed",
      error: error.message
    });
  }
});

app.get("/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });

    res.json(
      tickets.map(ticket => ({
        id: ticket._id,
        userId: ticket.userId,
        username: ticket.username,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        history: ticket.history,
        comments: ticket.comments,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      }))
    );
  } catch (error) {
    res.status(500).json({
      message: "failed to fetch tickets",
      error: error.message
    });
  }
});

app.post("/tickets", async (req, res) => {
  try {
    const userId = cleanText(req.body.userId);
    const username = cleanText(req.body.username);
    const title = cleanText(req.body.title);
    const description = cleanText(req.body.description);
    const priority = cleanText(req.body.priority) || "low";

    const allowedPriority = ["low", "medium", "high", "urgent"];

    if (!userId || !username || !title || !description) {
      return res.status(400).json({ message: "all fields are required" });
    }

    if (!allowedPriority.includes(priority)) {
      return res.status(400).json({ message: "invalid priority value" });
    }

    const newTicket = await Ticket.create({
      userId,
      username,
      title,
      description,
      priority,
      status: "pending",
      history: ["ticket created"],
      comments: []
    });

    await notifyAdmins(`${username} submitted a new ticket: "${title}".`, newTicket._id);

    res.json({
      message: "ticket created successfully",
      ticket: newTicket
    });
  } catch (error) {
    res.status(500).json({
      message: "failed to create ticket",
      error: error.message
    });
  }
});

app.put("/tickets/:id/status", async (req, res) => {
  try {
    const status = cleanText(req.body.status);
    const allowedStatus = ["pending", "in progress", "resolved", "closed"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "invalid ticket status" });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "ticket not found" });
    }

    ticket.status = status;
    ticket.history.push(`status changed to ${status}`);

    await ticket.save();

    await notifyUser(
      ticket.userId,
      `Your ticket "${ticket.title}" status was changed to ${status}.`,
      ticket._id
    );

    res.json({
      message: "ticket status updated",
      ticket
    });
  } catch (error) {
    res.status(500).json({
      message: "failed to update ticket",
      error: error.message
    });
  }
});

app.post("/tickets/:id/comment", async (req, res) => {
  try {
    const sender = cleanText(req.body.sender);
    const senderRole = cleanText(req.body.senderRole);
    const message = cleanText(req.body.message);

    if (!sender || !senderRole || !message) {
      return res.status(400).json({ message: "sender, sender role, and message are required" });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "ticket not found" });
    }

    ticket.comments.push({ sender, message });
    ticket.history.push(`${sender} added a reply`);

    await ticket.save();

   if (senderRole === "admin") {
  await notifyUser(
    ticket.userId,
    `Admin replied to your ticket "${ticket.title}": ${message}`,
    ticket._id
  );
}

   if (senderRole === "user") {
  await notifyAdmins(
    `${sender} replied to ticket "${ticket.title}": ${message}`,
    ticket._id
  );
}

    res.json({
      message: "comment added successfully",
      ticket
    });
  } catch (error) {
    res.status(500).json({
      message: "failed to add comment",
      error: error.message
    });
  }
});

app.delete("/tickets/:id", async (req, res) => {
  try {
    const deletedTicket = await Ticket.findByIdAndDelete(req.params.id);

    if (!deletedTicket) {
      return res.status(404).json({ message: "ticket not found" });
    }

    await Notification.deleteMany({ ticketId: req.params.id });

    res.json({ message: "ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "failed to delete ticket",
      error: error.message
    });
  }
});

app.put("/users/:id/status", async (req, res) => {
  try {
    const status = cleanText(req.body.status);
    const allowedStatus = ["active", "inactive"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "invalid user status" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "admin account status cannot be changed" });
    }

    user.status = status;
    await user.save();

    res.json({
      message: `user ${status} successfully`,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "failed to update user status",
      error: error.message
    });
  }
});

app.put("/users/:id/password", async (req, res) => {
  try {
    const newPassword = cleanText(req.body.newPassword);

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: "new password must be at least 8 characters" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "password updated successfully" });
  } catch (error) {
    res.status(500).json({
      message: "failed to update password",
      error: error.message
    });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "admin cannot be deleted" });
    }

    await User.findByIdAndDelete(req.params.id);
    await Notification.deleteMany({ recipientId: req.params.id });

    res.json({ message: "user deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "failed to delete user",
      error: error.message
    });
  }
});

app.get("/notifications", async (req, res) => {
  try {
    const role = cleanText(req.query.role);
    const userId = cleanText(req.query.userId);

    let filter = {};

    if (role === "admin") {
      filter = { recipientRole: "admin" };
    } else {
      filter = {
        recipientRole: "user",
        recipientId: userId
      };
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "failed to fetch notifications",
      error: error.message
    });
  }
});

app.get("/notifications/unread-count", async (req, res) => {
  try {
    const role = cleanText(req.query.role);
    const userId = cleanText(req.query.userId);

    let filter = { isRead: false };

    if (role === "admin") {
      filter.recipientRole = "admin";
    } else {
      filter.recipientRole = "user";
      filter.recipientId = userId;
    }

    const count = await Notification.countDocuments(filter);

    res.json({ count });
  } catch (error) {
    res.status(500).json({
      message: "failed to fetch unread count",
      error: error.message
    });
  }
});

app.put("/notifications/read", async (req, res) => {
  try {
    const role = cleanText(req.body.role);
    const userId = cleanText(req.body.userId);

    let filter = { isRead: false };

    if (role === "admin") {
      filter.recipientRole = "admin";
    } else {
      filter.recipientRole = "user";
      filter.recipientId = userId;
    }

    await Notification.updateMany(filter, { isRead: true });

    res.json({ message: "notifications marked as read" });
  } catch (error) {
    res.status(500).json({
      message: "failed to mark notifications as read",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
  });
}

module.exports = app;