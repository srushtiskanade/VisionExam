import React, { useState, useEffect } from "react";
import './Bot.css'; 

const EnhancedChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [testData, setTestData] = useState(null);
  const [subjectsData, setSubjectsData] = useState(null);
  const [userRegistrations, setUserRegistrations] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true
  
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join("");
    setInputText(transcript);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock data for now
      const mockData = {
        tests: [
          { _id: "1", title: "Maths Tests", status: "REGISTRATION_STARTED", startTime: "2024-12-01T10:00:00Z", duration: 120, regEndTime: "2024-11-30T23:59:59Z", subjects: ["1", "2"] },
          { _id: "2", title: "Science Tests", status: "CREATED", startTime: "2024-12-15T14:00:00Z", duration: 90, regEndTime: "2024-12-14T23:59:59Z", subjects: ["3"] }
        ],
        subjects: [
          { _id: "1", name: "Maths" },
          { _id: "2", name: "Science" },
        ],
        registrations: [
        ]
      };
      setTestData(mockData.tests);
      setSubjectsData(mockData.subjects);
      setUserRegistrations(mockData.registrations);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getPredefinedResponse = (text) => {
    const lowerCaseText = text.toLowerCase().trim();

    if (isLoading) {
      return "I'm still loading the test information. Please wait a moment...";
    }

    if (error) {
      return "I'm having trouble accessing the test information right now. Please try again later.";
    }

    if (lowerCaseText.includes("help")) {
      return `
        Here are some commands you can try:
        - 'available tests' or 'what tests' to see the active tests.
        - 'schedule' or 'when' to know the test schedule.
        - 'result' or 'score' to view your completed test results.
        - 'hello' or 'hey' to start the conversation.
        - 'test registration' to know the registration periods for tests.
        You can also type your query directly, and I'll help you out!
      `;
    }
  
    if (lowerCaseText.includes("hey") || lowerCaseText.includes("hello")) {
      return "Hello! I can help you with information about tests, subjects, and your registrations. What would you like to know?";
    }
    if (lowerCaseText.includes("registration periods") || lowerCaseText.includes("periods") || lowerCaseText.includes("registration")) {
      if (testData) {
        const registrationPeriods = testData.map(test => {
          const registrationEnd = new Date(test.regEndTime).toLocaleString();
          return `${test.title} registration ends on ${registrationEnd}`;
        }).join('\n');
    
        if (registrationPeriods) {
          return `Here are the registration periods for the available tests:\n${registrationPeriods}`;
        } else {
          return "There are no registration periods available at the moment.";
        }
      }
    
      return "I'm unable to retrieve registration information right now. Please try again later.";
    }
    
    if (testData) {
      if (lowerCaseText.includes("available tests") || lowerCaseText.includes("what tests") || lowerCaseText.includes("tests") || lowerCaseText.includes("test")) {
        const activeTests = testData.filter(test => test.status !== 'CANCELLED');
        const testList = activeTests.map(test => test.title).join(', ');
        return `There are ${activeTests.length} active tests: ${testList}`;
      }

      if (lowerCaseText.includes("schedule") || lowerCaseText.includes("when") || lowerCaseText.includes("tests schedule") ) {
        const upcomingTests = testData.filter(test => new Date(test.startTime) > new Date());
        if (upcomingTests.length === 0) return "There are no upcoming tests scheduled at the moment.";
        return upcomingTests.map(test => 
          `${test.title} starts on ${new Date(test.startTime).toLocaleDateString()} at ${new Date(test.startTime).toLocaleTimeString()}`
        ).join('\n');
      }

      if (lowerCaseText.includes("result") || lowerCaseText.includes("score") || lowerCaseText.includes("test results")) {
        if (!userRegistrations || userRegistrations.length === 0) {
          return "Results are not decalred yet.";
        }
        const completedTests = userRegistrations.filter(reg => reg.completed);
        if (completedTests.length === 0) {
          return "You haven't completed any tests yet.";
        }
        const testResults = completedTests.map(reg => {
          const test = testData.find(t => t._id === reg.testId);
          return `${test.title}: ${reg.score}%`;
        });
        return `Here are your completed test results:\n${testResults.join('\n')}`;
      }
    }

    return "I'm not sure about that. Try asking about 'available tests', 'test schedule', or 'my results'. You can also type 'help' to see what I can do.";
  };

  const startListening = () => {
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  };

  const speakText = (text) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (isListening) {
        startListening();
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = () => {
    if (!inputText.trim()) return;

    const userMessage = { text: inputText, sender: "user" };
    setMessages(prev => [...prev, userMessage]);

    const response = getPredefinedResponse(inputText);
    const aiMessage = { text: response, sender: "ai" };
    setMessages(prev => [...prev, aiMessage]);
    
    speakText(response);
    setInputText("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span className="bot-icon">🤖</span>
        <h1 className="header-title">Educational Assistant</h1>
        {isLoading && <div className="loading-indicator">Loading data...</div>}
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="initial-message">
            <p>👋 Hello! I'm your educational assistant. You can ask me about:</p>
            <ul>
              <li>Available tests</li>
              <li>Test schedules</li>
              <li>Your test results</li>
              <li>Registration periods</li>
              <li>Upcoming Tests</li>
            </ul>
            <p>Type 'help' to see all available commands.</p>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-wrapper ${
              message.sender === "user" ? "user-message" : "ai-message"
            }`}
          >
            <div className="message-content">
              <span className="message-icon">
                {message.sender === "ai" ? "🤖" : "👤"}
              </span>
              <p className="message-text">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="input-container">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`mic-button ${isListening ? "listening" : ""}`}
          title={isListening ? "Stop Listening" : "Start Listening"}
        >
          {isListening ? "🔴" : "🎤"}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type or speak your message..."
          className="text-input"
          onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
        />

        <button onClick={handleSubmit} className="send-button" title="Send">
          ➤
        </button>

        {isSpeaking && (
          <div className="speaking-indicator">
            <span className="volume-icon">🔊</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatbot;
