const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },

  room: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    default: "",
  },

  imageUrl: {
  type: String,
  default: "",
},
fileUrl: {
  type: String,
  default: "",
},

fileName: {
  type: String,
  default: "",
},
  fileType: {
    type: String,
    default: "",
  },
  audioUrl: {
    type: String,
    default: "",
  },
  audioDuration: {
    type: Number,
    default: 0,
  },

  timestamp: {
    type: String,
    required: true,
  },
  replyTo: {
    messageId: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  
    reactions: {
    type: Object,
    default: {},
  },
  edited: {
  type: Boolean,
  default: false,
},

deleted: {
  type: Boolean,
  default: false,
},
});

module.exports = mongoose.model("Message", messageSchema);
