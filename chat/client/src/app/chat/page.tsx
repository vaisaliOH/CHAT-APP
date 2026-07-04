"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { API_BASE_URL, apiUrl } from "@/lib/api";

// creates frontend websocket connection to backend server
const socket = io(API_BASE_URL);

// structure of each chat message object
type Message = {
  _id?: string;
  username: string;
  room?: string;
  message: string;
  imageUrl?: string;
  timestamp: string;
  sender?: string;
  seen?: boolean;
  replyTo?: {
    messageId?: string;
    username?: string;
    message?: string;
  };
  pinned?: boolean;
  reactions?: {
  [key: string]: number;
};
edited?: boolean;
deleted?: boolean;
fileUrl?: string;
fileName?: string;
fileType?: string;
audioUrl?: string;
audioDuration?: number;
};

type PrivateMessage = {
 username?: string;
  sender?: string;
  receiver?: string;
  message: string;
  timestamp: string;
  seen?: boolean;
};
//user profile 
type UserProfile = {
  username: string;
  email: string;
  status: string;
  joined: string;
  messagesSent: number;
  channelsJoined: number;
};

type Doubt = {
  question: string;
  username: string;
  solved: boolean;
  replies: any[];
};
const workspaceChannels = ["frontend", "backend", "placements", "general"];

const channelIcons: Record<string, string> = {
  frontend: "💻",
  backend: "⚙️",
  placements: "🎯",
  general: "🌍",
};

export default function Home() {
  // stores current message input
  const [message, setMessage] = useState<string>("");

  // stores all chat messages
  const [messages, setMessages] = useState<Message[]>([]);
  // for private dm's stores private messages separately
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);

  // stores username
  const [username, setUsername] = useState<string>("");

  // checks whether user joined chat or not
  const [joined, setJoined] = useState<boolean>(false);

  //for rooms
  const [room, setRoom] = useState<string>("");
  // stores the user who is currently typing basically typing indicator
  const [typingUser, setTypingUser] = useState<string>("");
  // stores list of online users
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  // for private dm's for storing selected user to dm
  const [selectedUser, setSelectedUser] = useState<string>("");
  // for private dm's
  const [dmMessage, setDmMessage] = useState<string>("");
  //scrollbar useref: directly access an HTML element without causing a React re-render.
  const chatEndRef = useRef<HTMLDivElement>(null);
  //dm notifcations when user not avaible
 const [dmNotifications, setDmNotifications] =useState<{ [key: string]: number }>({});

  const selectedChannel = room || "general";
  const visibleTeamMembers = onlineUsers.filter((user) => user !== username);
  const selectedUserIsOnline =
    selectedUser ? onlineUsers.includes(selectedUser) : false;
const [selectedFile, setSelectedFile] =useState<File | null>(null);
  // function to get initial letter 
  const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";
  // for search functionality 
  const [searchTerm, setSearchTerm] =useState("");
  //user profile 
  const [selectedProfile, setSelectedProfile] =useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] =useState(false);
  const [profileError, setProfileError] =useState("");
  //profile
  const isProfileOnline =selectedProfile? onlineUsers.includes(selectedProfile.username): false;
  //replying to messages
  const [replyingTo, setReplyingTo] =useState<Message | null>(null);
  //unread counts
  const [unreadCounts, setUnreadCounts] =useState<{ [key: string]: number }>({});
  const [isRecording, setIsRecording] =useState(false);
  const [recordingError, setRecordingError] =useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number>(0);
  const [activeTab, setActiveTab] =useState("chat");
  //for doubt section
  const [doubts, setDoubts] = useState<any[]>([]);
const [newDoubt, setNewDoubt] = useState("");
//to see doubts
const [expandedDoubt, setExpandedDoubt] =useState<string | null>(null);
    const filteredMessages = messages.filter((msg) =>
  msg.message
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);
const resourceFiles = Array.from(
  new Map(
    messages
      .filter((msg) => msg.fileUrl)
      .map((msg) => [msg.fileUrl, msg])
  ).values()
);
  const pinnedMessages = messages.filter((msg) => msg.pinned && !msg.deleted);
// for editing messages
const [editingMessageId, setEditingMessageId] =useState<string | null>(null);
// for storing edited message text
const [editedText, setEditedText] =useState("");

  // NEW useEffect for authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  //connecting the login user automatically
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");

    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  //for scroll bar it chnages the messages to autoscroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, privateMessages]);

  useEffect(() => {
    if (selectedUser && !onlineUsers.includes(selectedUser)) {
      setSelectedUser("");
      setPrivateMessages([]);
      setDmMessage("");
    }
  }, [onlineUsers, selectedUser]);
  

  useEffect(() => {
    //typing indicator function
    const typingHandler = (typingUsername: string) => {
      setTypingUser(typingUsername);
      setTimeout(() => {
        setTypingUser("");
      }, 2000);
    };

    //online users
    const onlineUsersHandler = (users: string[]) => {
      setOnlineUsers(users);
    };

    // receives normal chat messages from backend
    const receiveMessageHandler = (data: Message) => {
      setMessages((prev) => [...prev, data]);
    };

    const channelActivityHandler = (data: { room: string; sender: string }) => {
      if (data.sender === username || data.room === selectedChannel) return;

      setUnreadCounts((prev) => ({
        ...prev,
        [data.room]: (prev[data.room] || 0) + 1,
      }));
    };

    // receives join notification messages
    const userJoinedHandler = (data: string) => {
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: data,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    };
const newDoubtHandler = (doubt: any) => {
  setDoubts((prev) => [...prev, doubt]);
};
const doubtsLoadedHandler = (loadedDoubts: any) => {
  console.log("DOUBTS LOADED:", loadedDoubts);
  setDoubts(loadedDoubts);
};
    // receives leave notification messages
    const userLeftHandler = (data: string) => {
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: data,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    };

const chatHistoryHandler = (historyMessages: Message[]) => {

  console.log(
    "NEW HISTORY:",
    historyMessages
  );

  setMessages(historyMessages);

};

    //for private dm's
    const privateMessageHandler = (data: {
      sender: string;
      message: string;
      timestamp: string;
    }) => {
      setPrivateMessages((prev) => [
        ...prev,
        {
          username: `(DM) ${data.sender}`,
          sender: data.sender,
          message: data.message,
          timestamp: data.timestamp,
        },
      ]);

      if (data.sender !== selectedUser) {

  setDmNotifications((prev) => ({

    ...prev,

    [data.sender]:
      (prev[data.sender] || 0) + 1,

  }));

}
    };

    //for loading private dm history
    const privateHistoryHandler = (historyMessages: PrivateMessage[]) => {
      console.log(historyMessages);
      setPrivateMessages(historyMessages);
    };

    // listens for user_typing event from backend
    socket.on("user_typing", typingHandler);
    // listens for receive_message event from backend
    socket.on("receive_message", receiveMessageHandler);
    //doubt
    socket.on("new_doubt", newDoubtHandler);
    socket.on("doubts_loaded", doubtsLoadedHandler);
    // listens for user_joined event
    socket.on("user_joined", userJoinedHandler);
    // listens for user_left event
    socket.on("user_left", userLeftHandler);
    //for online users
    socket.on("online_users", onlineUsersHandler);
    //chat history
    socket.on("chat_history", chatHistoryHandler);
    //for private dm's
    socket.on("receive_private_message", privateMessageHandler);
    
    //for loading private dm history
    socket.on("private_messages_history", privateHistoryHandler);
    socket.on("channel_activity", channelActivityHandler);
    socket.on("message_deleted", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                deleted: true,
              }
            : msg
        )
      );
    });
    socket.on("message_edited", ({ messageId, newMessage }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                message: newMessage,
                edited: true,
              }
            : msg
        )
      );
    });
    socket.on(
  "doubt_updated",
  (updatedDoubt) => {

    setDoubts((prev) =>
      prev.map((d) =>
        d._id === updatedDoubt._id
          ? updatedDoubt
          : d
      )
    );

  }
);
    socket.on(
  "reaction_updated",
  ({ messageId, reactions }) => {

    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId
          ? {
              ...msg,
              reactions,
            }
          : msg
      )
    );

  }
);
    socket.on(
  "message_pinned",
  ({ messageId, pinned }) => {

    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId
          ? {
              ...msg,
              pinned,
            }
          : msg
      )
    );

  }
);

    // cleanup function removes listeners
    // prevents duplicate socket listeners
    return () => {
      socket.off("receive_message", receiveMessageHandler);
      socket.off("user_joined", userJoinedHandler);
      socket.off("user_left", userLeftHandler);
      socket.off("user_typing", typingHandler);
      socket.off("online_users", onlineUsersHandler);
      socket.off("chat_history", chatHistoryHandler);
      socket.off("receive_private_message", privateMessageHandler);
      socket.off("new_doubt", newDoubtHandler);
      socket.off("doubts_loaded", doubtsLoadedHandler);
      socket.off("private_messages_history", privateHistoryHandler);
      socket.off("channel_activity", channelActivityHandler);
      socket.off("message_deleted");
      socket.off("message_edited");
      socket.off("reaction_updated");
      socket.off("message_pinned");
    };
  }, [selectedUser, selectedChannel, username]);

  // sends message to backend
  const sendMessage = () => {
    // prevents empty message
    if (!message.trim()) return;

    // sends structured object instead of plain string
    socket.emit("send_message", {
      username,
      room,
      message,
      replyTo: replyingTo
        ? {
            messageId: replyingTo._id || "",
            username: replyingTo.username,
            message: replyingTo.message || replyingTo.fileName || "Attachment",
          }
        : undefined,
      timestamp: new Date().toLocaleTimeString(),
    });

    // clears input field
    setMessage("");
    setReplyingTo(null);
  };

  const formatJoinedDate = (dateValue: string) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const loadUserProfile = async (profileUsername: string) => {
    setProfileLoading(true);
    setProfileError("");
    setSelectedProfile({
      username: profileUsername,
      email: "Loading...",
      status: "Online",
      joined: "Loading...",
      messagesSent: 0,
      channelsJoined: 0,
    });

    try {
      const response = await fetch(
        apiUrl(`/user-profile/${encodeURIComponent(profileUsername)}`)
      );

      if (!response.ok) {
        throw new Error("Profile not found");
      }

      const profile = await response.json();

      setSelectedProfile({
        username: profile.username,
        email: profile.email,
        status: "Online",
        joined: formatJoinedDate(profile.joined),
        messagesSent: profile.messagesSent || 0,
        channelsJoined: profile.channelsJoined || 0,
      });
    } catch (error) {
      console.log(error);
      setProfileError("Could not load this user profile.");
      setSelectedProfile({
        username: profileUsername,
        email: "Not available",
        status: "Online",
        joined: "Not available",
        messagesSent: 0,
        channelsJoined: 0,
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const sendDM = () => {
    if (!selectedUser) return;

    if (!dmMessage.trim()) return;

    socket.emit("send_private_message", {
      sender: username,
      receiver: selectedUser,
      message: dmMessage,
      timestamp: new Date().toLocaleTimeString(),
    });

    setPrivateMessages((prev) => [
      ...prev,
      {
        username: `(DM) Me`,
        sender: username,
        message: dmMessage,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    setDmMessage("");
  };

  // handles joining chat
  const joinChat = () => {
    // prevents empty username
    if (!username.trim()) return;

    const joinedRoom = room || "general";

    // sends join_chat event to backend
    socket.emit("join_chat", {
      username,
      room: joinedRoom,
    });

    setRoom(joinedRoom);

    // opens chat screen
    setJoined(true);
  };

  const switchChannel = (channelName: string) => {
    setMessages([]);
    setRoom(channelName);
    setSelectedUser("");
    setReplyingTo(null);
    setUnreadCounts((prev) => ({
      ...prev,
      [channelName]: 0,
    }));

    socket.emit("join_chat", {
      username,
      room: channelName,
    });
    socket.emit("load_doubts", channelName);
  };
  const uploadImage = async () => {

  if (!selectedFile) return;

  const formData = new FormData();

  formData.append(
    "image",
    selectedFile
  );

  try {

    const response =
      await fetch(
        apiUrl("/upload-image"),
        {
          method: "POST",
          body: formData,
        }
      );

    const data =
      await response.json();

socket.emit("send_message", {
  username,
  room,
  replyTo: replyingTo
    ? {
        messageId: replyingTo._id || "",
        username: replyingTo.username,
        message: replyingTo.message || replyingTo.fileName || "Attachment",
      }
    : undefined,

  fileUrl: data.fileUrl,
  fileName: data.fileName,

  fileType:
    selectedFile.name
      .split(".")
      .pop()
      ?.toLowerCase(),

  timestamp:
    new Date().toLocaleTimeString(),
});

    setSelectedFile(null);
    setReplyingTo(null);

  } catch (error) {

    console.log(error);

  }

};

  const uploadVoiceNote = async (audioBlob: Blob, duration: number) => {
    const formData = new FormData();

    formData.append(
      "image",
      audioBlob,
      `voice-note-${Date.now()}.webm`
    );

    try {
      const response =
        await fetch(
          apiUrl("/upload-image"),
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      socket.emit("send_message", {
        username,
        room,
        message: "",
        replyTo: replyingTo
          ? {
              messageId: replyingTo._id || "",
              username: replyingTo.username,
              message: replyingTo.message || replyingTo.fileName || "Voice note",
            }
          : undefined,
        audioUrl: data.fileUrl,
        fileName: data.fileName || "Voice note",
        fileType: "webm",
        audioDuration: duration,
        timestamp:
          new Date().toLocaleTimeString(),
      });

      setReplyingTo(null);
    } catch (error) {
      console.log(error);
      setRecordingError("Could not upload voice note.");
    }
  };

  const startVoiceRecording = async () => {
    setRecordingError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder =
        new MediaRecorder(stream);

      audioChunksRef.current = [];
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob =
          new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
        const duration =
          Math.max(
            1,
            Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
          );

        recordingStreamRef.current
          ?.getTracks()
          .forEach((track) => track.stop());

        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];

        if (audioBlob.size > 0) {
          uploadVoiceNote(audioBlob, duration);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.log(error);
      setRecordingError("Microphone permission is needed to record a voice note.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

{/* <button
  onClick={uploadImage}
  className="bg-green-500 text-white px-4 py-2 rounded"
>
  Upload Image
</button> */}
//for the mentions
  const renderMessageText = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);

    return parts.map((part, index) => {
      if (!part.startsWith("@")) return part;

      const mentionedUser = part.slice(1);
      const isCurrentUser =
        mentionedUser.toLowerCase() === username.toLowerCase();

      return (
        <span
          key={`${part}-${index}`}
          className={`rounded px-1 font-semibold ${
            isCurrentUser
              ? "bg-amber-400/20 text-amber-100"
              : "bg-sky-400/15 text-sky-200"
          }`}
        >
          {part}
        </span>
      );
    });
  };

  const renderMessageCard = (
    msg: Message,
    align: "left" | "right" | "center" = "left"
    , messageKey?: string
  ) => {
    const isSystem = msg.username === "System";
    const initial = getInitial(msg.username);
    const mentionsCurrentUser =
      username.trim().length > 0 &&
      msg.message.toLowerCase().includes(`@${username.toLowerCase()}`);
    const cardClass = isSystem
      ? "mx-auto border border-amber-400/20 bg-amber-500/10 text-amber-100"
      : align === "right"
      ? "ml-auto border border-cyan-300/20 bg-linear-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-cyan-950/25"
      : "mr-auto border border-white/10 bg-slate-700 text-slate-100 shadow-lg shadow-slate-950/20";

    return (
      <div
        key={messageKey}
        className={`group mb-3 w-fit max-w-[85%] rounded-2xl px-4 py-3 transition-all duration-200 hover:scale-[1.01] ${
          mentionsCurrentUser ? "ring-2 ring-amber-300/50" : ""
        } ${cardClass}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${
              isSystem
                ? "bg-amber-400/20 text-amber-100"
                : align === "right"
                ? "bg-white/20 text-white"
                : "bg-slate-900 text-slate-100"
            }`}
          >
            {isSystem ? "!" : initial}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4">
              <strong className="text-sm font-semibold">{msg.username}</strong>
              <div className="flex items-center gap-2">
                {msg.username === username && !isSystem && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!msg._id) return;

                        setEditingMessageId(msg._id);
                        setEditedText(msg.message);
                      }}
                      className="text-xs hover:text-cyan-300"
                    >
                      ✏
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        socket.emit("delete_message", {
                          messageId: msg._id,
                        })
                      }
                      className="text-xs hover:text-red-400"
                    >
                      🗑
                    </button>
                  </>
                )}
                {!isSystem && (
                  <>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(msg)}
                      className="text-xs hover:text-sky-300"
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!msg._id) return;

                        socket.emit("toggle_pin", {
                          messageId: msg._id,
                        });
                      }}
                      className="text-xs hover:text-amber-300"
                    >
                      {msg.pinned ? "Unpin" : "Pin"}
                    </button>
                  </>
                )}
                <span
                  className={`text-[11px] uppercase tracking-[0.18em] ${
                    align === "right" || !isSystem
                      ? "text-white/70"
                      : "text-amber-100/70"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
            <div className="mt-2">

{editingMessageId === msg._id ? (
  <div className="flex flex-col gap-2">
    <input
      autoFocus
      value={editedText}
      onChange={(e) => setEditedText(e.target.value)}
      className="flex-1 rounded border border-white/10 bg-slate-800 px-2 py-1 text-sm text-white outline-none"
    />
    <button
      type="button"
      onClick={() => {
        if (!msg._id) return;

        socket.emit("edit_message", {
          messageId: msg._id,
          newMessage: editedText,
        });

        setEditingMessageId(null);
      }}
      className="w-fit rounded bg-cyan-500 px-2 py-1 text-xs text-white hover:bg-cyan-400"
    >
      Save
    </button>
  </div>
) : (
  <>
    {msg.replyTo?.username && (
      <div className="mb-2 rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-xs">
        <p className="font-semibold text-sky-200">
          Replying to {msg.replyTo.username}
        </p>
        <p className="mt-1 line-clamp-2 text-white/70">
          {msg.replyTo.message}
        </p>
      </div>
    )}
    {msg.audioUrl ? (
      <div className="rounded-xl border border-white/10 bg-black/15 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
          Voice Note {msg.audioDuration ? `(${msg.audioDuration}s)` : ""}
        </p>
        <audio
          controls
          src={msg.audioUrl}
          className="w-full"
        />
      </div>
    ) : (
      <p className="text-sm leading-6">
        {msg.deleted ? "This message was deleted" : renderMessageText(msg.message)}
        {msg.edited && !msg.deleted && <span className="ml-1 text-xs text-white/60">(edited)</span>}
      </p>
    )}

    {(msg.sender === username ||
  msg.username?.includes("ME")) && (
  <div className="mt-1 text-right text-xs text-white/70">
    {msg.seen ? "✓✓ Seen" : "✓ Sent"}
  </div>
)}
  </>
)}

{msg.fileUrl && !msg.imageUrl && (
  msg.audioUrl ? null : (
  <a
  href={`${msg.fileUrl}?download=false`}
  target="_blank"
  rel="noreferrer"
  className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800 p-3 hover:bg-slate-700"
>
  <span>📄</span>
  <span>{msg.fileName}</span>
</a>
  )
)}

{!isSystem && (
  <div className="mt-3 flex gap-2 opacity-100 transition-opacity duration-200 sm:opacity-0 group-hover:opacity-100">
    {["👍", "❤️", "😂"].map((emoji) => {
      const reactionCount = msg.reactions?.[emoji] || 0;

      return (
        <button
          key={emoji}
          onClick={() =>
            socket.emit("add_reaction", {
              messageId: msg._id,
              emoji,
            })
          }
         className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs transition hover:bg-white/15"
        >
          {emoji}
          {reactionCount > 0 && ` ${reactionCount}`}
        </button>
      );
    })}
  </div>
)}

</div>
          </div>
        </div>
      </div>
      
    );
  };

  if (!joined) {
    return (
      <main className="h-dvh overflow-hidden px-4 py-4 text-slate-100 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto flex h-full w-full max-w-400 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(15,23,42,0.84)] shadow-2xl shadow-black/35 backdrop-blur-xl">
          <header className="border-b border-white/10 px-5 py-4 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-300/90">
                  SyncSpace
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Real-Time Team Collaboration Platform
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  Choose a channel and enter the workspace feed.
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("username");
                  window.location.href = "/login";
                }}
                className="inline-flex items-center justify-center rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 gap-4 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:px-5">
            <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#111b2d] p-4 shadow-lg shadow-slate-950/20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Workspace Channels
              </p>
              <p className="mt-2 text-sm text-slate-300">Welcome, {username}</p>

                <div className="mt-4 space-y-2">
                  {workspaceChannels.map((channelName) => (
                    <button
                      key={channelName}
                     onClick={() => switchChannel(channelName)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200 hover:scale-[1.02] ${
                      room === channelName
                        ? "border-sky-300/40 bg-sky-500/15 text-white shadow-[0_0_24px_rgba(56,189,248,0.18)]"
                        : "border-white/10 bg-white/4 text-slate-200 hover:bg-white/8"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <span>{channelIcons[channelName] || "•"}</span>
                      <span className="capitalize">{channelName}</span>
                    </span>
                    {room === channelName && (
                      <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Selected Channel
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {room ? `# ${room}` : "Choose a channel"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Channels replace the old room input for a cleaner experience.
                </p>
              </div>

              <button
                onClick={joinChat}
                className="mt-6 w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Enter Workspace
              </button>
            </section>

            <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#111827] p-5 text-slate-100 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                    Workspace Feed
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    Public Chat Preview
                  </h2>
                </div>
                <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200">
                  Live
                </span>
              </div>

              <div className="mt-5 flex flex-1 flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-white/10 bg-slate-700 px-4 py-3 text-slate-100 shadow-sm transition-all duration-200 hover:scale-[1.01]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {getInitial("vaisali")}
                    </span>
                    <p className="text-sm font-semibold text-white">vaisali</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    Hey team, I’m setting up the dashboard for SyncSpace.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">10:45 PM</p>
                </div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md border border-cyan-300/20 bg-linear-to-br from-blue-500 to-cyan-500 px-4 py-3 text-white shadow-sm transition-all duration-200 hover:scale-[1.01]">
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-sm font-semibold">Me</p>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                      {getInitial(username || "Me")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-cyan-50">
                    Working on the backend and placement flow.
                  </p>
                  <p className="mt-2 text-xs text-cyan-100">10:46 PM</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                This panel will show your live conversation after you enter a
                channel.
              </div>
            </section>

            <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#111b2d] p-4 shadow-lg shadow-slate-950/20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Team Members
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-100">
                <div className="flex items-center justify-between rounded-2xl border border-sky-400/20 bg-sky-500/10 px-3 py-3 transition-all duration-200 hover:scale-[1.02]">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-100">
                      {getInitial(username)}
                    </span>
                    <span>{username}</span>
                  </span>
                  <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
                    You
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/4 px-3 py-3 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                      S
                    </span>
                    <span>Suguna</span>
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/4 px-3 py-3 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                      N
                    </span>
                    <span>Nair</span>
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/4 px-3 py-3 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-xs font-bold text-rose-100">
                      !
                    </span>
                    <span>notif</span>
                  </span>
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-rose-200">
                    Alert
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh overflow-x-hidden overflow-y-auto px-3 py-3 text-slate-100 sm:px-4 sm:py-4 lg:px-8 lg:py-6">
      <div className="mx-auto flex min-h-full w-full max-w-400 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(15,23,42,0.84)] shadow-2xl shadow-black/35 backdrop-blur-xl sm:rounded-[28px] lg:h-full">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/85 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-300/90">
                SyncSpace
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-3xl">
                Real-Time Team Collaboration Platform
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Welcome, {username}. You are in{" "}
                <span className="font-semibold text-sky-300"># {selectedChannel}</span>.
              </p>
              <p className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                Workspace: {selectedChannel === "general" ? "General Team" : `${selectedChannel} Team`}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("username");
                window.location.href = "/login";
              }}
              className="inline-flex self-start items-center justify-center rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 sm:self-auto"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-3 py-3 sm:px-4 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:px-5">
          <aside className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#111b2d] p-4 shadow-lg shadow-slate-950/20 lg:overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Workspace Channels
              </p>
              <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200">
                {workspaceChannels.length}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {workspaceChannels.map((channelName) => (
                <button
                  key={channelName}
                  onClick={() => switchChannel(channelName)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedChannel === channelName
                      ? "border-sky-400/30 bg-sky-500/15 text-white"
                      : "border-white/10 bg-white/4 text-slate-200 hover:bg-white/8"
                  }`}
                >
                  <span className="font-medium"># {channelName}</span>
                  <span className="flex items-center gap-2">
                    {(unreadCounts[channelName] || 0) > 0 && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                        {unreadCounts[channelName]}
                      </span>
                    )}
                    {selectedChannel === channelName && (
                      <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
                        Active
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Team Members
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-100">
                {visibleTeamMembers.map((user, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      loadUserProfile(user);
                      setSelectedUser(user);
                      setDmNotifications((prev) => ({
  ...prev,
  [user]: 0,
}));
                      socket.emit("load_private_messages", {
                        user1: username,
                        user2: user,
                      });
                      socket.emit("mark_messages_seen", {
  sender: user,
  receiver: username,
});
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                      selectedUser === user
                        ? "border-sky-400/30 bg-sky-500/15 text-white"
                        : "border-white/5 bg-white/4 text-slate-100 hover:bg-white/8"
                    }`}
                  >
                    <span className="font-medium">🟢 {user}</span>
                    {dmNotifications[user] > 0 && (
  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
    {dmNotifications[user]}
  </span>
)}
                  </button>
                ))}

                {visibleTeamMembers.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/4 px-3 py-4 text-sm text-slate-400">
                    No teammates online right now.
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm text-slate-400">
                DM To: <span className="font-semibold text-white">{selectedUser || "None"}</span>
              </p>
            </div>
          </aside>

          <section className="flex min-h-[60dvh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111827] text-slate-100 shadow-xl shadow-black/20 lg:min-h-0">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
    Workspace Feed
  </p>

  <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
    # {selectedChannel}
  </h2>

  <div className="mt-3 flex flex-wrap gap-2">
    <button
      onClick={() => setActiveTab("chat")}
      className={`rounded-xl px-3 py-1 text-xs sm:text-sm ${
        activeTab === "chat"
          ? "bg-sky-500 text-white"
          : "bg-slate-800 text-slate-300"
      }`}
    >
      💬 Chat
    </button>

    <button
      onClick={() => setActiveTab("doubts")}
      className={`rounded-xl px-3 py-1 text-xs sm:text-sm ${
        activeTab === "doubts"
          ? "bg-sky-500 text-white"
          : "bg-slate-800 text-slate-300"
      }`}
    >
      📚 Doubts
    </button>

    <button
      onClick={() => setActiveTab("resources")}
      className={`rounded-xl px-3 py-1 text-xs sm:text-sm ${
        activeTab === "resources"
          ? "bg-sky-500 text-white"
          : "bg-slate-800 text-slate-300"
      }`}
    >
      📂 Resources
    </button>
  </div>
                  </div>
                  <span className="self-start rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200 sm:self-auto">
                  Live
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden px-3 py-3 sm:px-5 sm:py-5">
              <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-sm">
              
              {pinnedMessages.length > 0 && (
                <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                    Pinned Messages
                  </p>
                  <div className="mt-2 space-y-2">
                    {pinnedMessages.slice(0, 3).map((pinnedMsg) => (
                      <div
                        key={pinnedMsg._id || `${pinnedMsg.username}-${pinnedMsg.timestamp}`}
                        className="rounded-xl bg-black/15 px-3 py-2 text-sm text-amber-50"
                      >
                        <span className="font-semibold">{pinnedMsg.username}: </span>
                        <span>{pinnedMsg.message || pinnedMsg.fileName || "Attachment"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-4">
  <input
    type="text"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="🔍 Search messages..."
    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"
  />
                </div>
                {activeTab === "chat" && (
                <div className="flex-1 overflow-y-auto pr-1">
                  {filteredMessages.map((msg, index) => {
                    const isSystem = msg.username === "System";
                    const isOwnMessage = msg.username === username;
                    const messageKey = msg._id || `${msg.timestamp}-${index}`;

                    return renderMessageCard(
                      msg,
                      isSystem ? "center" : isOwnMessage ? "right" : "left",
                      messageKey
                    );
                  })}

                  {filteredMessages.length === 0 && (
                    <div className="flex min-h-75 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/60 text-center text-sm text-slate-400">
                      {messages.length === 0
                        ? "Start the conversation in this workspace channel."
                        : "No messages match your search."}
                    </div>
                  )}

                  <div ref={chatEndRef}></div>
                </div>
                )}
{activeTab === "doubts" && (
  <div className="h-full overflow-y-auto space-y-3 py-4 pr-2">

                  <div className="flex flex-col gap-2 sm:flex-row">
      <input
        value={newDoubt}
        onChange={(e) =>
          setNewDoubt(e.target.value)
        }
        placeholder="Ask a doubt..."
        className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
      />

      <button
        onClick={() => {
  if (!newDoubt.trim()) return;

  socket.emit("ask_doubt", {
    question: newDoubt,
    username,
    room,
  });

  setNewDoubt("");
}}
        className="rounded-xl bg-sky-500 px-4 py-2 text-white"
      >
        Ask
      </button>
    </div>

    {doubts.map((doubt, index) => (
      <div
        key={index}
        className="rounded-xl border border-white/10 bg-slate-800 p-4"
      >
        <div className="flex justify-between">
          <p className="font-semibold text-white">
            {doubt.question}
          </p>

          {doubt.solved ? (
            <span className="text-green-400">
              ✅ Solved
            </span>
          ) : (
            <span className="text-yellow-400">
              ⏳ Open
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Asked by {doubt.username}
        </p>
        <p className="mt-2 text-sm text-sky-300">
  💬 {doubt.replies.length} Replies
</p>
<button

  className="mt-2 text-xs text-sky-400"
  onClick={() =>
    setExpandedDoubt(
      expandedDoubt === doubt._id
        ? null
        : doubt._id
    )
  }
>
  {expandedDoubt === doubt._id
    ? "Hide Replies"
    : "View Replies"}
</button>
{expandedDoubt === doubt._id && (
  <div className="mt-3 space-y-2">
    {doubt.replies.map((reply: any, i: number) => (
      <div
        key={i}
        className="rounded-lg bg-slate-900 p-3"
      >
        <p className="font-semibold text-sky-300">
          {reply.username}
        </p>

        <p className="text-sm text-slate-200">
          {reply.message}
        </p>
      </div>
    ))}
  </div>
)}
{doubt.username === username &&
 !doubt.solved && (
  <button
    onClick={() =>
      socket.emit(
        "mark_doubt_solved",
        doubt._id
      )
    }
    className="mt-3 rounded-lg bg-green-500 px-3 py-1 text-sm text-white"
  >
    ✅ Mark Solved
  </button>
)}
{doubt.username !== username && (
  <button
    onClick={() => {
      const reply = prompt("Enter reply");

      if (!reply) return;

      socket.emit("reply_to_doubt", {
        doubtId: doubt._id,
        username,
        message: reply,
      });
    }}
    className="mt-3 rounded-lg bg-sky-500 px-3 py-1 text-sm text-white"
  >
    Reply
  </button>
)}
      </div>
    ))}
  </div>
)}

{activeTab === "resources" && (
  <div className="space-y-3 py-4">
    <h2 className="text-2xl font-bold text-white">
      📂 Resources
    </h2>

    {resourceFiles.map((file) => (
      <a
        key={file._id}
        href={`${file.fileUrl}.${file.fileType}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-800 p-4 hover:bg-slate-700"
      >
        <span>📄</span>
        <span>{file.fileName}</span>
         <p className="text-xs text-slate-400">
    Uploaded: {file.timestamp}
  </p>
      </a>
    ))}

    {resourceFiles.length === 0 && (
      <p className="text-slate-400">
        No resources uploaded yet.
      </p>
    )}
  </div>
)}
                {activeTab === "chat" && (
                <div className="mt-4 border-t border-white/10 pt-4">
               
                  {typingUser && (
                    <p className="mb-3 text-sm font-medium text-slate-400">
                      {typingUser} is typing...
                    </p>
                  )}

                  {replyingTo && (
                    <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-50">
                      <div className="min-w-0">
                        <p className="font-semibold">Replying to {replyingTo.username}</p>
                        <p className="mt-1 truncate text-sky-100/75">
                          {replyingTo.message || replyingTo.fileName || "Attachment"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="rounded-full border border-white/10 px-2 py-1 text-xs text-sky-100 hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {visibleTeamMembers.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {visibleTeamMembers.map((user) => (
                        <button
                          key={`mention-${user}`}
                          type="button"
                          onClick={() => setMessage((prev) => `${prev}${prev.endsWith(" ") || prev.length === 0 ? "" : " "}@${user} `)}
                          className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/20"
                        >
                          @{user}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        socket.emit("typing");
                      }}
                      placeholder="Message the workspace..."
                      className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-sky-500 focus:bg-slate-950/90"
                    />
<input
  id="file-upload"
  type="file"
  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
  className="hidden"
  onChange={(e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }}
/>

  <label
    htmlFor="file-upload"
    className="cursor-pointer rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-700"
  >
    📎 Add File
  </label>
  {selectedFile&& (
  <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-800 px-4 py-2">
    <span className="truncate text-sm text-slate-300">
      🖼 {selectedFile.name}
    </span>

    <button
      onClick={() => setSelectedFile(null)}
      className="text-red-400 hover:text-red-300"
    >
      ✕
    </button>
  </div>
)}
                    
                    <button
                      onClick={sendMessage}
                      className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-sky-500"
                    >
                      Send
                    </button>

                    <button
  onClick={uploadImage}
  className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-400"
>
  Upload Image
</button>
                  </div>
                </div>
                )}
              
              </div>
            </div>
          </section>

          <aside className="flex min-h-[60dvh] flex-col rounded-2xl border border-white/10 bg-[#111b2d] p-4 shadow-lg shadow-slate-950/20 lg:min-h-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Direct Messages
            </p>
            <div className="mt-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-slate-100">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">
                DM To
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-100">
                  {getInitial(selectedUser || "?")}
                </span>
                <div>
                  <p className="text-base font-semibold">
                    {selectedUser || "Select a teammate"}
                  </p>
                  <p className="text-xs text-sky-200/80">
                    {selectedUser
                      ? selectedUserIsOnline
                        ? "Online"
                        : "Offline"
                      : "Choose a user"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1220] p-4">
              {privateMessages.map((msg, index) => {
                const label = msg.username
                  ? msg.username
                  : msg.sender === username
                  ? "Me"
                  : msg.sender || "DM";

                return (
                  <div
                    key={`${label}-${msg.timestamp}-${index}`}
                    className={`mb-3 rounded-2xl border px-4 py-3 transition-all duration-200 hover:scale-[1.01] ${
                      label === "Me"
                        ? "ml-auto border-cyan-300/20 bg-linear-to-br from-blue-500 to-cyan-500 text-white"
                        : "border-white/10 bg-slate-700 text-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                      <strong className={label === "Me" ? "text-white" : "text-slate-100"}>
                        {label}
                      </strong>
                      <span className={label === "Me" ? "text-cyan-100" : "text-slate-300"}>
                        {msg.timestamp}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6">{msg.message}</p>
                    {label === "Me" && (
  <div className="mt-1 text-right text-xs text-cyan-100">
    {msg.seen ? "✓✓ Seen" : "✓ Sent"}
  </div>
)}
                  </div>
                );
              })}

              {privateMessages.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/4 px-3 py-4 text-sm text-slate-400">
                  Select a team member to load a direct message thread.
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-[#0b1220] p-4">
              <input
                type="text"
                value={dmMessage}
                onChange={(e) => setDmMessage(e.target.value)}
                placeholder={selectedUser ? `Message ${selectedUser}...` : "Select a teammate first"}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-sky-500 focus:bg-slate-950/90"
              />
              <button
                onClick={sendDM}
                className="w-full rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:scale-[1.02] hover:bg-white"
              >
                Send DM
              </button>
            </div>
          </aside>
        </div>
      </div>

      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111b2d] p-5 text-slate-100 shadow-2xl shadow-black/40 sm:max-h-[90dvh] sm:overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20 text-lg font-bold text-sky-100">
                  {getInitial(selectedProfile.username)}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                    User Profile
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    {selectedProfile.username}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                X
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3">
                <span className="text-slate-400">Username</span>
                <span className="font-semibold text-white">{selectedProfile.username}</span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3">
                <span className="text-slate-400">Email</span>
                <span className="truncate font-semibold text-white">{selectedProfile.email}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3">
                <span className="text-slate-400">Status</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                    isProfileOnline
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-slate-500/15 text-slate-300"
                  }`}
                >
                  {isProfileOnline ? "Online" : "Offline"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3">
                <span className="text-slate-400">Joined</span>
                <span className="font-semibold text-white">{selectedProfile.joined}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3">
                <span className="text-sky-100/80">Messages Sent</span>
                <span className="text-2xl font-semibold text-white">
                  {selectedProfile.messagesSent}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3">
                <span className="text-cyan-100/80">Channels Joined</span>
                <span className="text-2xl font-semibold text-white">
                  {selectedProfile.channelsJoined}
                </span>
              </div>
            </div>

            {profileLoading && (
              <p className="mt-4 text-sm text-slate-400">Loading profile...</p>
            )}

            {profileError && (
              <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {profileError}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
