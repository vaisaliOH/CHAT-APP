require("dotenv").config();
// harcoded password in .env file for security
const cloudinary =require("./config/cloudinary"); //cloudinary config for image uploads

const multer = require("multer");//middleware for handling multipart/form-data (file uploads)

const {CloudinaryStorage,} = require("multer-storage-cloudinary");//integrates multer with cloudinary for direct uploads



const bcrypt = require("bcryptjs"); //byencrypt passwords for security
const jwt = require("jsonwebtoken");//creates jwt tokens
const User = require("./models/User");
const PrivateMessage =require("./models/PrivateMessage");
const Doubt = require("./models/Doubt");


// console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("API Key:", process.env.CLOUDINARY_API_KEY);
// console.log("API Secret:", process.env.CLOUDINARY_API_SECRET);

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {

    const ext = file.originalname
      .split(".")
      .pop()
      .toLowerCase();

    const documentFormats = [
      "pdf",
      "doc",
      "docx",
      "ppt",
      "pptx",
    ];
    const audioFormats = [
      "webm",
      "mp3",
      "wav",
      "m4a",
      "ogg",
    ];
    const isAudio =
      file.mimetype.startsWith("audio/") ||
      audioFormats.includes(ext);

    return {
      folder: "syncspace",

      resource_type:
        isAudio
          ? "video"
          : documentFormats.includes(ext)
          ? "raw"
          : "image",

      use_filename: true,
      unique_filename: true,
    };
  },
});

const upload =
  multer({
    storage,
  });

// require("dotenv").config();
// // harcoded password in .env file for security

const Message = require("./models/Message");
//to store messages
const express = require("express"); 
// helps create backend server easily

const http = require("http"); 
// used to create actual HTTP server

const { Server } = require("socket.io"); 
// imports Socket.IO WebSocket server

const cors = require("cors"); 
// allows frontend and backend communication

const connectDB = require("./config/db");

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN?.trim();
const corsOptions = clientOrigin
  ? { origin: clientOrigin, methods: ["GET", "POST"] }
  : { origin: true, methods: ["GET", "POST"] };

app.use(cors(corsOptions));

// allows backend to read JSON data from frontend requests
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


// creates actual HTTP server
// Socket.IO works on top of HTTP server
// needed for websocket upgrades + realtime transport
const server = http.createServer(app);


// creates websocket server
// attaches Socket.IO to HTTP server
const io = new Server(server, {
  cors: corsOptions,
});


// stores connected users
// socket.id -> username mapping
const users = {};

const emitOnlineUsers = (room) => {

  const roomUsers = Object.values(users)
    .filter((user) => user.room === room)
    .map((user) => user.username);

  io.to(room).emit("online_users", roomUsers);

};
// find socket id from username
const getSocketIdByUsername = (username) => {

  for (const socketId in users) {

    if (
      users[socketId].username === username
    ) {
      return socketId;
    }

  }

  return null;
};
// runs whenever new user connects
io.on("connection", (socket) => {
socket.on("send_private_message", async (data) => {

  console.log("DM Received:", data);

  console.log("Current Users:", users);

  try {

    const privateMessage =
      new PrivateMessage({

        sender: data.sender,
        receiver: data.receiver,
        message: data.message,
        timestamp: data.timestamp,
        seen: false,

      });

    await privateMessage.save();

    console.log("Private Message Saved");

  } catch (error) {

    console.log(error);

  }

  const receiverSocketId =
    getSocketIdByUsername(data.receiver);

  console.log(
    "Receiver Socket ID:",
    receiverSocketId
  );

  if (!receiverSocketId) return;

  io.to(receiverSocketId).emit(
    "receive_private_message",
    {
      sender: data.sender,
      message: data.message,
      timestamp: data.timestamp,
    }
  );

});
// marks messages as seen when receiver opens the chat
socket.on(
  "mark_messages_seen",
  async ({ sender, receiver }) => {

    try {

      await PrivateMessage.updateMany(
        {
          sender,
          receiver,
          seen: false,
        },
        {
          seen: true,
        }
      );

      console.log(
        "Messages marked seen"
      );

    } catch (error) {

      console.log(error);

    }

  }
);
socket.on(
  "load_private_messages",
  async ({ user1, user2 }) => {

    try {

      const messages =
        await PrivateMessage.find({

          $or: [

            {
              sender: user1,
              receiver: user2,
            },

            {
              sender: user2,
              receiver: user1,
            },

          ],

        });

      socket.emit(
        "private_messages_history",
        messages
      );

    } catch (error) {

      console.log(error);

    }

  }
);
  console.log("User Connected:", socket.id);

  // listens for typing event for frontend
  socket.on("typing", () => {
  const user = users[socket.id];
  if (!user) return;
  //send to everyone EXCEPT sender io.to(user.room).emit()-> send to everyone including sender
  socket.to(user.room).emit(    
    "user_typing",
    user.username
  );
});

  // listens for join_chat event
socket.on("join_chat", async ({ username, room }) => {
  console.log(
  "JOIN_CHAT RECEIVED:",
  room
);

  const previousRoom =
    users[socket.id]?.room;

  if (previousRoom) {
    socket.leave(previousRoom);
  }

  users[socket.id] = {
    username,
    room,
  };

  socket.join(room);

  try {

    const roomMessages =
      await Message.find({
        room: room,
      });
console.log("ROOM REQUESTED:", room);

console.log(
  "ROOM MESSAGES:",
  roomMessages.map(
    (msg) => msg.room
  )
);
    socket.emit(
      "chat_history",
      roomMessages
    );

    io.to(room).emit(
      "user_joined",
      `${username} joined ${room}`
    );

    emitOnlineUsers(room);

  } catch (error) {

    console.log(error);

  }

});
socket.on(
  "add_reaction",
  async ({ messageId, emoji }) => {

    try {

      const message =
        await Message.findById(messageId);

      if (!message) return;

      const reactions =
        message.reactions || {};

      reactions[emoji] =
        (reactions[emoji] || 0) + 1;

      message.reactions = reactions;

      await message.save();

      io.to(message.room).emit(
        "reaction_updated",
        {
          messageId,
          reactions,
        }
      );

    } catch (error) {

      console.log(error);

    }

  }
);
//pinned comments
socket.on(
  "toggle_pin",
  async ({ messageId }) => {

    try {

      const message =
        await Message.findById(messageId);

      if (!message) return;

      message.pinned =
        !message.pinned;

      await message.save();

      io.to(message.room).emit(
        "message_pinned",
        {
          messageId,
          pinned:
            message.pinned,
        }
      );

    } catch (error) {

      console.log(error);

    }

  }
);
// listens for delete message event
socket.on(
  "delete_message",
  async ({ messageId }) => {

    try {

      const message =
        await Message.findById(messageId);

      if (!message) return;

      message.deleted = true;

      await message.save();

      io.to(message.room).emit(
        "message_deleted",
        {
          messageId,
        }
      );

    } catch (error) {

      console.log(error);

    }

  }
);

// listens for edit message event
socket.on(
  "edit_message",
  async ({ messageId, newMessage }) => {

    try {

      const message =
        await Message.findById(messageId);

      if (!message) return;

      message.message = newMessage;

      message.edited = true;

      await message.save();

      io.to(message.room).emit(
        "message_edited",
        {
          messageId,
          newMessage,
        }
      );

    } catch (error) {

      console.log(error);

    }

  }
);


  // listens for send_message event
  socket.on("send_message", async (data) => {

  console.log(data);
//current user
  const user = users[socket.id];

  try {
      //new message document
    const newMessage = new Message({
  username: data.username,
  room: data.room,
  message: data.message || "",
  imageUrl: data.imageUrl || "",
  timestamp: data.timestamp,
  replyTo: data.replyTo || {},
  pinned: false,
  reactions: {},
  edited: false,
deleted: false,
fileUrl: data.fileUrl || "",
fileName: data.fileName || "",
fileType:data.fileType || "",
audioUrl: data.audioUrl || "",
audioDuration: data.audioDuration || 0,


});
    //saves in mongo
    await newMessage.save();

    console.log("Message Saved");
    //broadcast to eevryone in the room
    io.to(user.room).emit(
      "receive_message",
      newMessage
    );

    socket.broadcast.emit(
      "channel_activity",
      {
        room:
          newMessage.room,
        sender:
          newMessage.username,
      }
    );

  } catch (error) {

    console.log(error);

  }

});
// listens for reply to doubt event
socket.on("ask_doubt", async (data) => {
  try {

    const newDoubt = new Doubt({
      question: data.question,
      username: data.username,
      room: data.room,
      solved: false,
      replies: [],
    });

    await newDoubt.save();

    io.to(data.room).emit(
      "new_doubt",
      newDoubt
    );

  } catch (error) {

    console.log(error);

  }
});
//reply to doubt
socket.on(
  "reply_to_doubt",
  async (data) => {
    try {

      const doubt =
        await Doubt.findById(
          data.doubtId
        );

      doubt.replies.push({
        username:
          data.username,
        message:
          data.message,
      });

      await doubt.save();

      io.to(doubt.room).emit(
        "doubt_updated",
        doubt
      );

    } catch (error) {

      console.log(error);

    }
  }
);
//mark as solved
socket.on(
  "mark_doubt_solved",
  async (doubtId) => {

    try {

      const doubt =
        await Doubt.findByIdAndUpdate(
          doubtId,
          {
            solved: true,
          },
          {
            new: true,
          }
        );

      io.to(doubt.room).emit(
        "doubt_updated",
        doubt
      );

    } catch (error) {

      console.log(error);

    }
  }
);
// listens for reply to doubt event
socket.on("load_doubts", async (room) => {
  try {

    const doubts = await Doubt.find({
      room: room,
    });

    socket.emit(
      "doubts_loaded",
      doubts
    );

  } catch (error) {

    console.log(error);

  }
});

  // runs when user disconnects
  socket.on("disconnect", () => {

    // gets username using socket id
    const user = users[socket.id];

    // checks if user exists
    if (user) {

      // broadcasts leave notification
        io.to(user.room).emit(
    "user_left",
    `${user.username} left ${user.room}`
  );

      const room = user.room;
      // removes disconnected user from users object
      delete users[socket.id];

      emitOnlineUsers(room);
    }

    console.log("User Disconnected:", socket.id);
  });

});

connectDB();
app.post("/api/auth/signup", async (req, res) => {
  try {

    const { username, email, password } = req.body;

    // check if user already exists
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // hash password before saving
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created successfully",
      user,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });

  }
});
app.post("/api/auth/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    // find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // compare entered password with hashed password
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      username: user.username,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });

  }
});
app.post(
  "/upload-image",
  (req, res) => {

    upload.single("image")(req, res, (err) => {

      if (err) {
        console.log("UPLOAD ERROR:", err);
        return res.status(500).json({
          error: err.message,
        });
      }

      console.log("File:", req.file);

      res.json({
  fileUrl: req.file.path,
  fileName: req.file.originalname,
});

    });

  }
);
// user profile 
app.get(
  "/user-profile/:username",
  async (req, res) => {

    try {

      const user =
        await User.findOne({
          username:
            req.params.username,
        });

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "User not found",
          });
      }

      const messagesSent =
        await Message.countDocuments({
          username:
            user.username,
        });

      const channelsJoined =
        await Message.distinct(
          "room",
          {
            username:
              user.username,
          }
        );

      res.json({
        username:
          user.username,

        email:
          user.email,

        joined:
          user._id.getTimestamp(),

        messagesSent:
          messagesSent,

        channelsJoined:
          channelsJoined.length,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        message:
          "Server Error",
      });

    }

  }
);
// starts backend server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
/*

socket.emit()
→ sends event to ONE socket/user

io.emit()
→ broadcasts event to ALL connected users

socket.on()
→ listens for incoming events

=========================================
EVENT FLOW
=========================================

Frontend emit
↓
Backend receives
↓
Backend broadcasts
↓
Frontend listens
↓
UI updates instantly

=========================================
WHY socket.io-client?
=========================================

Backend:
socket.io

Frontend:
socket.io-client

Frontend needs client library
to connect to websocket server

socket.join(room)
Add user to room
io.to(room).emit()
Send event only to that room

*/
