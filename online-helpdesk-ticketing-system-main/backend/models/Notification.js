const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: {
      type: String,
      required: true
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      default: null
    },

    message: {
      type: String,
      required: true
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Notification", notificationSchema);