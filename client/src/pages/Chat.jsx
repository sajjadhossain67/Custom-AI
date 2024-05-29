import React, { useEffect, useRef, useState } from "react";
import "../sass/pages/chat.css";
import { axiosOpen, axiosSecure } from "../services/api/axios";
import { useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import NotFound from "./NotFound";
const Chat = () => {
  const { botId } = useParams();
  const [bot, setBot] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFetchingChat, setIsFetchingChat] = useState(false);
  const [messageList, setMessageList] = useState([]);
  const user = localStorage.getItem("authToken")
    ? localStorage.getItem("authToken")
    : null;
  // console.log("messageList", messageList);
  useEffect(() => {
    if (botId) {
      fetchBotChatHistory();
    }
  }, [botId]);
  const fetchBotChatHistory = async () => {
    try {
      setIsFetchingChat(true);
      const response = await axiosSecure.get(`/chats?botId=${botId}`);
      console.log(response.data);
      if (response.data) {
        setMessageList(response.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsFetchingChat(false);
    }
  };
  const question = useRef();
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    const newMessage = {
      question: question.current.value, // Set your desired message
      matchId: uuidv4(),
    };
    setMessageList((prevList) => [...prevList, newMessage]);
    try {
      const response = await axiosSecure.post("/chats", {
        question: question.current.value,
        botId,
      });
      if (response.status === 200) {
        console.log(response);
        setMessageList((prevMessageList) =>
          prevMessageList.map((message) => {
            if (message.matchId === newMessage.matchId) {
              return {
                ...message,
                botResponse: response.data.chat.botResponse,
              };
            } else {
              return message;
            }
          })
        );
      }
    } catch (error) {}
  };

  // fetching bot data by ID
  useEffect(() => {
    const apiUrl = `${process.env.REACT_APP_BASE_URL}/api/v1/chatbots/${botId}`;
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        // Update the state with the fetched data
        setBot(data[0]);
        // console.log(data[0]);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, [botId]);

  if (bot.bot_status === "privet" && !user) {
    return <NotFound />;
  }
  return (
    <div>
      <h2>{bot?.botName}</h2>
      {/* Chats container  */}
      <div className="chat-container">
        {messageList.map((chat) => (
          <div key={chat._id || chat.matchId}>
            <div className="chat incoming">
              <div class="chat-content">
                <div class="chat-details">
                  <img
                    src="https://static.vecteezy.com/system/resources/previews/000/649/115/original/user-icon-symbol-sign-vector.jpg"
                    alt=""
                  />
                  <p>{chat.question}</p>
                </div>
                <span
                  onClick="copyResponse(this)"
                  class="material-symbols-rounded"
                >
                  copy
                </span>
              </div>
            </div>
            {!chat?.botResponse ? (
              <div className="chat incoming">
                <div class="chat-content">
                  <div class="chat-details">
                    <img
                      src="https://www.clipartkey.com/mpngs/m/315-3158064_vector-chatbot-icon.png"
                      alt=""
                    />
                    <p>chat is coming........</p>
                  </div>
                  <span
                    onClick="copyResponse(this)"
                    class="material-symbols-rounded"
                  >
                    copy
                  </span>
                </div>
              </div>
            ) : (
              <div className="chat outgoing">
                <div class="chat-content">
                  <div class="chat-details">
                    <img
                      src="https://www.clipartkey.com/mpngs/m/315-3158064_vector-chatbot-icon.png"
                      alt=""
                    />
                    <p> {chat.botResponse}</p>
                  </div>
                  <span
                    onClick="copyResponse(this)"
                    class="material-symbols-rounded"
                  >
                    copy
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* <!-- Typing container --> */}
      <div className="typing-container">
        <div className="typing-content">
          <div className="typing-textarea">
            <form
              style={{ display: "flex", gap: "10px", width: "100%" }}
              onSubmit={handleAskQuestion}
            >
              <input
                style={{
                  width: "70%",
                  height: "3.5rem",
                  paddingLeft: "1rem",
                }}
                id="question"
                spellCheck="false"
                placeholder="Enter a prompt here"
                required
                ref={question}
              />
              {/* <textarea
                id="question"
                spellCheck="false"
                placeholder="Enter a prompt here"
                required
                ref={question}
              ></textarea> */}
              <button
                type="submit"
                className="material-symbols-rounded send-btn"
              >
                send
              </button>
            </form>
          </div>
          {/* <div className="typing-controls">
            <button
              id="delete-btn"
              className="material-symbols-rounded delete-btn"
            >
              delete
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};
export default Chat;
