import React, { useState, useRef } from "react";
import axios from "axios";
import { flushSync } from "react-dom";
import "./App.css";

import ConversationDisplayArea from "./components/ConversationDisplayArea.js";
import Header from "./components/Header.js";
import MessageInput from "./components/MessageInput.js";

function App() {
  const inputRef = useRef();
  const host = "http://localhost:9000";
  const url = host + "/chat";
  const streamUrl = host + "/stream";
  const [data, setData] = useState([]);
  const [answer, setAnswer] = useState("");
  const [streamdiv, showStreamdiv] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const is_stream = toggled;

  function executeScroll() {
    const element = document.getElementById("checkpoint");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  function validationCheck(str) {
    return str === null || str.match(/^\s*$/) !== null;
  }

  const handleClick = () => {
    if (validationCheck(inputRef.current.value)) {
      console.log("Empty or invalid entry");
    } else {
      if (!is_stream) {
        handleNonStreamingChat();
      } else {
        handleStreamingChat();
      }
    }
  };

  const handleNonStreamingChat = async () => {
    const chatData = {
      chat: inputRef.current.value,
      history: data,
    };

    const ndata = [
      ...data,
      { role: "user", parts: [{ text: inputRef.current.value }] },
    ];

    flushSync(() => {
      setData(ndata);
      inputRef.current.value = "";
      inputRef.current.placeholder = "Waiting for model's response";
      setWaiting(true);
    });

    executeScroll();

    let headerConfig = {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
      },
    };

    const fetchData = async () => {
      var modelResponse = "";
      try {
        const response = await axios.post(url, chatData, headerConfig);
        modelResponse = response.data.text;
      } catch (error) {
        modelResponse = "Error occurred";
      } finally {
        const updatedData = [
          ...ndata,
          { role: "model", parts: [{ text: modelResponse }] },
        ];

        flushSync(() => {
          setData(updatedData);
          inputRef.current.placeholder = "Enter a message.";
          setWaiting(false);
        });
        executeScroll();
      }
    };

    fetchData();
  };

  const handleStreamingChat = async () => {
    const chatData = {
      chat: inputRef.current.value,
      history: data,
    };

    const ndata = [
      ...data,
      { role: "user", parts: [{ text: inputRef.current.value }] },
    ];

    flushSync(() => {
      setData(ndata);
      inputRef.current.value = "";
      inputRef.current.placeholder = "Waiting for model's response";
      setWaiting(true);
    });

    executeScroll();
    let headerConfig = {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    };

    const fetchStreamData = async () => {
      try {
        setAnswer("");
        const response = await fetch(streamUrl, {
          method: "post",
          headers: headerConfig,
          body: JSON.stringify(chatData),
        });

        if (!response.ok || !response.body) {
          throw response.statusText;
        }

        const reader = response.body.getReader();
        const txtdecoder = new TextDecoder();
        const loop = true;
        var modelResponse = "";
        showStreamdiv(true);

        while (loop) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          const decodedTxt = txtdecoder.decode(value, { stream: true });
          setAnswer((answer) => answer + decodedTxt);
          modelResponse = modelResponse + decodedTxt;
          executeScroll();
        }
      } catch (err) {
        modelResponse = "Error occurred";
      } finally {
        setAnswer("");
        const updatedData = [
          ...ndata,
          { role: "model", parts: [{ text: modelResponse }] },
        ];
        flushSync(() => {
          setData(updatedData);
          inputRef.current.placeholder = "Enter a message.";
          setWaiting(false);
        });
        showStreamdiv(false);
        executeScroll();
      }
    };
    fetchStreamData();
  };

  return (
    <center>
      <div className="chat-app">
        <Header toggled={toggled} setToggled={setToggled} />
        <ConversationDisplayArea
          data={data}
          streamdiv={streamdiv}
          answer={answer}
        />
        <MessageInput
          inputRef={inputRef}
          waiting={waiting}
          handleClick={handleClick}
        />
      </div>
    </center>
  );
}

export default App;
