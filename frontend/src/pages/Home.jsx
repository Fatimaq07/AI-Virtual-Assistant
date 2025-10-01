// Home.jsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse: geminiRaw } = useContext(userDataContext);
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const [ham, setHam] = useState(false);
  const isRecognizingRef = useRef(false);
  const synth = window.speechSynthesis;

  // Safe wrapper for Gemini response
  const getGeminiResponse = async (command) => {
    setAiText("Thinking...");
    try {
      const raw = await geminiRaw(command, userData.assistantName, userData.name);
      let data;
      if (typeof raw === "string") {
        try {
          data = JSON.parse(raw);
        } catch {
          // If not JSON, treat as simple response
          data = { type: "general", userInput: command, response: raw };
        }
      } else {
        data = raw;
      }
      return data;
    } catch (err) {
      console.error("Error calling Gemini:", err);
      return { type: "general", userInput: command, response: "I'm having trouble, try again." };
    }
  };

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.log(error);
    }
  };

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
      } catch (error) {
        if (error.name !== "InvalidStateError") console.error(error);
      }
    }
  };

  const speak = (text) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang === 'hi-IN');
      if (hindiVoice) utterance.voice = hindiVoice;
    };
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = loadVoices;

    isSpeakingRef.current = true;
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setTimeout(startRecognition, 500);
    };
    synth.cancel();
    synth.speak(utterance);
  };

  const handleCommand = (data) => {
    speak(data.response);

    const { type, userInput } = data;
    switch (type) {
      case 'google-search':
        window.open(`https://www.google.com/search?q=${encodeURIComponent(userInput)}`, '_blank');
        break;
      case 'youtube-search':
      case 'youtube-play':
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`, '_blank');
        break;
      case 'calculator-open':
        window.open('https://www.google.com/search?q=calculator', '_blank');
        break;
      case 'instagram-open':
        window.open('https://www.instagram.com/', '_blank');
        break;
      case 'facebook-open':
        window.open('https://www.facebook.com/', '_blank');
        break;
      case 'weather-show':
        window.open('https://www.google.com/search?q=weather', '_blank');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return console.error("Speech Recognition not supported");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    let isMounted = true;

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (isMounted && !isSpeakingRef.current) setTimeout(startRecognition, 500);
    };

    recognition.onerror = (e) => {
      console.warn("Recognition error:", e.error);
      isRecognizingRef.current = false;
      setListening(false);
      if (isMounted && !isSpeakingRef.current) setTimeout(startRecognition, 500);
    };

    recognition.onresult = async (e) => {
      const result = e.results[e.results.length - 1];
      const transcript = result[0].transcript.trim();
      setUserText(transcript);

      if (result.isFinal && transcript) {
        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);

        const data = await getGeminiResponse(transcript);
        setAiText(data.response);
        handleCommand(data);
      }
    };

    // Greeting
    setTimeout(() => speak(`Hello ${userData.name}, what can I help you with?`), 500);
    setTimeout(() => startRecognition(), 1000);

    return () => {
      isMounted = false;
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
    };
  }, []);

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'>
      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(true)} />
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <RxCross1 className='text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(false)} />
        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full' onClick={handleLogOut}>Log Out</button>
        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full' onClick={() => navigate("/customize")}>Customize</button>
        <div className='w-full h-[2px] bg-gray-400'></div>
        <h1 className='text-white font-semibold text-[19px]'>History</h1>
        <div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
          {userData.history?.map((his, idx) => <div key={idx} className='text-gray-200 text-[18px]'>{his}</div>)}
        </div>
      </div>

      <button className='min-w-[150px] h-[60px] text-black font-semibold absolute top-[20px] right-[20px] bg-white rounded-full hidden lg:block' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] text-black font-semibold absolute top-[100px] right-[20px] bg-white rounded-full hidden lg:block' onClick={() => navigate("/customize")}>Customize</button>

      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
        <img src={userData?.assistantImage} alt="" className='h-full object-cover' />
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="" className='w-[200px]' />}
      {aiText && <img src={aiImg} alt="" className='w-[200px]' />}

      <div className="flex flex-col gap-2 mt-4 text-center">
        {userText && <h1 className='text-white text-[18px] font-semibold'>{userText}</h1>}
        {aiText && <h1 className='text-green-300 text-[18px] font-semibold'>{aiText}</h1>}
      </div>
    </div>
  );
}

export default Home;
