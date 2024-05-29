import React, { ChangeEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// import { axiosOpen } from "../services/api/axios";

// if (bot.bot_status === "privet" && !user) {
//   return <NotFound />;
// }

export type BotData = {
  botName: string;
  bot_status: string;
  createdAt: string; // You might want to use a Date type here if you plan to work with dates
  fileName: string;
  is_deleted: boolean;
  updatedAt: string; // Again, consider using a Date type for dates
  user: string;
  __v: number;
  _id: string;
};

const PublicRoute = () => {
  const { botId } = useParams();
  const [selectedValue, setSelectedValue] = useState<string>("privet");
  const [bot, setBot] = useState<BotData>({
    botName: "",
    bot_status: "",
    createdAt: "",
    fileName: "",
    is_deleted: false,
    updatedAt: "",
    user: "",
    __v: 0,
    _id: "",
  });
  const url = window.location.hostname;
  const link = `http://${url}:3000/chat/${botId}`;
  const status = bot?.bot_status;

  // Function to handle the selection change
  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
  };

  // console.log(botId)
  //http://localhost:3000/
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

  // update bot status
  useEffect(() => {
    const patchData = async () => {
      const url = `${process.env.REACT_APP_BASE_URL}/api/v1/chatbots/${botId}`; // Replace with your endpoint
      const payload = { bot_status: selectedValue }; // Replace with your payload
      console.log("payload:", payload);
      try {
        const response = await fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            // Add any other headers if needed
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const updatedData = await response.json();
          console.log(updatedData);
        } else {
          console.error("Error:", response.status);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    patchData();
  }, [selectedValue, botId]);

  const copyToClipboard = () => {
    const tempInput = document.createElement("input");
    tempInput.value = link;
    document.body.appendChild(tempInput);

    // Select the input value
    tempInput.select();
    tempInput.setSelectionRange(0, 99999); // for mobile devices

    // Copy to clipboard
    document.execCommand("copy");

    // Remove the temporary input
    document.body.removeChild(tempInput);

    alert("Link copied to clipboard!");
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          minWidth: "300px",
          minHeight: "300px",
          // border: "2px solid gray",
          background: "white",
          padding: "10px",
          borderRadius: "20px",
          boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
        }}
      >
        {/* <h4>Current bot Status: {status}</h4> */}
        <div>
          <h2>Change your bot status</h2>
          <label>Select an option:</label>
          <select value={selectedValue} onChange={handleSelectChange}>
            <option value="privet">Private</option>
            <option value="public">Public</option>
          </select>
          {/* {selectedValue && <p>Selected value: {selectedValue}</p>} */}
        </div>
        {/* <p>BotId: {botId}</p> */}
        <p style={{ marginTop: "20px" }}>
          Copy this link and share with people
        </p>
        <p
          style={{
            color: "blue",
          }}
        >
          http://{url}:3000/chat/{botId}
        </p>
        <div>
          <button onClick={copyToClipboard}>Copy Link</button>
        </div>
      </div>
    </div>
  );
};

export default PublicRoute;
