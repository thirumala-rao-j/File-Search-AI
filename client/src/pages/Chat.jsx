import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../pages/Chat.module.css";

function Chat() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! How can I assist you today?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const location = useLocation();
  const vector_id = location.state;

  useEffect(() => {
    if (vector_id === null) {
      navigate("/");
    }
  }, [vector_id, navigate]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    let temp = inputText;

    // Add user message
    const newMessage = { text: temp, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputText("");
    setIsLoading(true);

    const botResponse = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/api/v1/filesearch/upload`,
      {
        method: "POST",
        body: JSON.stringify({
          prompt: temp,
          vector_id: vector_id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await botResponse.json();
    const responseMessage = {
      text: response.data,
      sender: "bot",
    };

    setMessages((prevMessages) => [...prevMessages, responseMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // useEffect(() => {
  //   // Automatically scroll to bottom when new messages are added
  //   const chatContainer = document.querySelector(".chat-messages");
  //   if (chatContainer) {
  //     chatContainer.scrollTop = chatContainer.scrollHeight;
  //   }
  // }, [messages]);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>File Search AI</div>
      <div className={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${styles[msg.sender + "Message"]}`}
          >
            <div className={styles.messageContent}>{msg.text}</div>
          </div>
        ))}
        {isLoading && <div className={styles.loading}>Loading...</div>}
      </div>
      <div className={styles.chatInputBox}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>
          {/* <img src="send.png" /> */}
          send
        </button>
      </div>
    </div>
  );
}

export default Chat;
