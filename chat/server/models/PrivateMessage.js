const mongoose = require("mongoose");

const privateMessageSchema = new mongoose.Schema({

  sender: {
    type: String,
    required: true,
  },

  receiver: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  timestamp: {
    type: String,
    required: true,
  },

  seen: {
    type: Boolean,
    default: false,
  },

});

module.exports =
  mongoose.model(
    "PrivateMessage",
    privateMessageSchema
  );