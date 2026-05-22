const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    username: {
      type: String,
      required: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "low"
    },

    status: {
      type: String,
      default: "pending"
    },

    history: {
      type: [String],
      default: ["ticket created"]
    },

    comments: {
      type: [commentSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);