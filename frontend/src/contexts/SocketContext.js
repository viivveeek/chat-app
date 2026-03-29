import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const SocketContextProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef();

  useEffect(() => {
    if (token) {
      socketRef.current = io("http://localhost:5000", {
        auth: {
          token: token,
        },
      });

      socketRef.current.on("connect", () => {
        setSocket(socketRef.current);
      });

      socketRef.current.on("message", (message) => {
        // Handle incoming encrypted message (decrypt client-side)
        console.log("New message:", message);
      });

      socketRef.current.on("typing", (data) => {
        console.log("Typing:", data);
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [token]);

  const value = {
    socket,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContextProvider;
