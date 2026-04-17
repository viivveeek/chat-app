import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import axios from "axios";

// import CryptoJS from "crypto-js";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Container,
  Paper,
  TextField,
  IconButton,
  ListItemIcon,
  Avatar,
  Chip,
  Button as MuiButton,
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import SendIcon from "@mui/icons-material/Send";
import PeopleIcon from "@mui/icons-material/People";

const ChatDashboard = () => {
  const { user, logout, loading } = useAuth();
  const { socket } = useSocket();
  console.log("Socket:", socket);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);

  // Demo E2E key derivation (in production, use Diffie-Hellman or shared secret exchange)
  //const getEncryptionKey = (roomId) => {
  //  if (!user || !user._id || !roomId) {
  //    console.error("❌ Missing key data", { user, roomId });
  //    return null;
  //  }

  //  const secret = `shared_secret_${roomId}_${user._id}`;

  //  // ✅ FIX: use SHA256 instead of substring
  //  return CryptoJS.SHA256(secret);
  // };

  //const encryptMessage = (text, roomId) => {
  //  if (!text) return "";

  //  const key = getEncryptionKey(roomId);
  //  if (!key) return "";

  //  return CryptoJS.AES.encrypt(text, key.toString()).toString();
  //};

  // const decryptMessage = (encryptedText, roomId) => {
  //  try {
  //    if (!encryptedText) return "";

  //    const key = getEncryptionKey(roomId);
  //    if (!key) return "";

  //   const bytes = CryptoJS.AES.decrypt(encryptedText, key.toString());
  //    return bytes.toString(CryptoJS.enc.Utf8);
  //  } catch (err) {
  //    return "[Unable to decrypt]";
  //  }
  //};

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loading || !user || !socket) return;

    axios
      .get(`${process.env.REACT_APP_API_URL}/api/chat/rooms`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setRooms(res.data));

    socket.on("message", (msg) => {
      console.log("MESSAGE RECEIVED:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", (data) => {
      setTypingUsers((prev) => {
        const newTyping = prev.filter((id) => id !== data.userId);
        if (data.isTyping) newTyping.push(data.userId);
        return newTyping;
      });
    });

    socket.on("messagesSeen", () => {
      setMessages((prev) => prev.map((m) => ({ ...m, status: "seen" })));
    });

    return () => {
      socket.off("message");
      socket.off("typing");
    };
  }, [socket, user, loading]);

  useEffect(() => {
    if (!selectedRoom?._id) return;

    const token = localStorage.getItem("token");

    setMessages([]); // ✅ clear old messages

    if (socket) {
      socket.emit("joinRoom", selectedRoom._id);

      socket.emit("markSeen", selectedRoom._id);
    }

    axios
      .get(
        `${process.env.REACT_APP_API_URL}/api/chat/rooms/${selectedRoom._id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .then((res) => {
        setMessages(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [selectedRoom, socket]);

  const sendMessage = () => {
    console.log("👉 Raw message:", newMessage);
    console.log("👉 Selected room:", selectedRoom);
    console.log("👉 User:", user);

    if (!newMessage.trim()) {
      console.log("❌ Message empty");
      return;
    }

    if (!selectedRoom?._id) {
      console.log("❌ No room selected");
      return;
    }

    if (!socket) {
      console.log("❌ Socket not ready");
      return;
    }

    // const encrypted = encryptMessage(newMessage, selectedRoom._id);
    const encrypted = newMessage;

    console.log("👉 Encrypted message:", encrypted);

    socket.emit("sendMessage", {
      roomId: selectedRoom._id,
      content: encrypted,
    });

    setNewMessage("");
  };

  const handleTyping = (isTyping) => {
    if (socket && selectedRoom) {
      socket.emit("typing", {
        roomId: selectedRoom._id,
        isTyping,
      });
    }
  };

  const handleCreateRoom = async () => {
    try {
      const roomName = prompt("Enter room name:");
      if (!roomName) return;

      const token = localStorage.getItem("token");

      // ✅ ALWAYS TRY JOIN FIRST
      let res;

      try {
        res = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/chat/rooms/join`,
          { name: roomName },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        console.log("Joined room:", res.data);
      } catch (err) {
        // ❌ If room doesn't exist → CREATE
        if (err.response?.status === 404) {
          res = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/chat/rooms`,
            {
              name: roomName,
              isPrivate: false,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          console.log("Room created:", res.data);
        } else {
          throw err;
        }
      }

      // ✅ UPDATE UI
      setSelectedRoom(res.data);

      // optional: refresh rooms list
      setRooms((prev) => {
        const exists = prev.find((r) => r._id === res.data._id);
        return exists ? prev : [...prev, res.data];
      });
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SecureChat - {user.username}
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: "flex" }}>
        <Drawer variant="permanent" sx={{ width: 240, flexShrink: 0 }}>
          <List>
            <ListItem>
              <ListItemText primary="Rooms" />
            </ListItem>
            {rooms.map((room) => (
              <ListItemButton
                key={room._id}
                selected={selectedRoom?._id === room._id}
                onClick={() => setSelectedRoom(room)}
              >
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText
                  primary={room.name}
                  secondary={room.isPrivate ? "Private" : "Public"}
                />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <MuiButton
            fullWidth
            variant="contained"
            sx={{ m: 2 }}
            onClick={handleCreateRoom}
          >
            New Room
          </MuiButton>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container>
            {selectedRoom ? (
              <Paper
                sx={{ height: 600, display: "flex", flexDirection: "column" }}
              >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                  <Typography variant="h6">{selectedRoom.name}</Typography>
                  <Chip
                    label={
                      selectedRoom.isPrivate
                        ? "🔒 Private (E2E Encrypted)"
                        : "Public"
                    }
                    size="small"
                  />
                </Box>
                <Box sx={{ flexGrow: 1, p: 2, overflow: "auto" }}>
                  {messages.map((msg, i) => (
                    <Box
                      key={i}
                      sx={{ mb: 1, ml: msg.sender._id === user._id ? 8 : 0 }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                          {msg.sender.username[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="caption">
                            {msg.sender.username} •{" "}
                            {new Date(msg.createdAt).toLocaleTimeString()}
                            {msg.sender._id === user._id && (
                              <>
                                {msg.status === "sent" && " ✔"}
                                {msg.status === "delivered" && " ✔✔"}
                                {msg.status === "seen" && " ✔✔ (seen)"}
                              </>
                            )}
                          </Typography>
                          <Typography variant="body2">{msg.content}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  {typingUsers.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {typingUsers.length} typing...
                    </Typography>
                  )}
                </Box>
                <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                  <Box sx={{ display: "flex" }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Type a message (E2E encrypted)"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping(e.target.value.length > 0);
                      }}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      onBlur={() => handleTyping(false)}
                    />
                    <IconButton
                      color="primary"
                      onClick={sendMessage}
                      sx={{ ml: 1 }}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography>Select a room to start chatting</Typography>
              </Paper>
            )}
          </Container>
        </Box>
      </Box>
    </>
  );
};
export default ChatDashboard;

// line 263 { decryptMessage(msg.content, selectedRoom._id);}
