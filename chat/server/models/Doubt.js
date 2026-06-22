const mongoose = require("mongoose");

const doubtSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },

  username: {
    type: String,
    required: true,
  },

  room: {
    type: String,
    required: true,
  },

  solved: {
    type: Boolean,
    default: false,
  },

  replies: [
    {
      username: String,
      message: String,
    },
  ],

  timestamp: {
    type: String,
    default: () =>
      new Date().toLocaleTimeString(),
  },
});

module.exports = mongoose.model(
  "Doubt",
  doubtSchema
);