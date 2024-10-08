'use client'

import React from 'react';
import { useState, useEffect, KeyboardEvent, useMemo } from 'react'
import { X, ThumbsUp, ThumbsDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RemoteRunnable } from '@langchain/core/runnables/remote'

interface ChatButtonProps {
  logoSrc: string
  chatInterfaceColor?: string
  chatbotId: string
}

interface ChatbotResponse {
  messages: { content: string }[];
}

const CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'http://localhost:8000/chatbot/';

export function ChatButton({ logoSrc, chatInterfaceColor = '#FFFFFF', chatbotId }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [isPopupHovered, setIsPopupHovered] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Bonjour! Comment puis-je vous aider aujourd'hui?", timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [threadId] = useState(`${Date.now()}-${Math.random().toString(36).substring(2, 11)}`)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const chatbotChain = useMemo(() => {
    const baseUrl = CHATBOT_API_URL;
    const chatbotUrl = `${baseUrl.replace(/\/+$/, '')}/${chatbotId}`;
    return new RemoteRunnable({
      url: chatbotUrl,
    });
  }, [chatbotId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        setShowPopup(true)
        setTimeout(() => {
          if (!isPopupHovered) {
            setShowPopup(false)
          }
        }, 5000)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isOpen, isPopupHovered])

  const handleSend = async () => {
    if (input.trim()) {
      setMessages(prev => [...prev, { role: 'user', content: input, timestamp: new Date() }])
      setInput('')
      setIsTyping(true)
      try {
        const response = await chatbotChain.invoke(
          { messages: [{ type: "human", content: input.trim() }]},
          { configurable: { thread_id: threadId }, version: "v1" } as any
        )
        const typedResponse = response as ChatbotResponse
        const botMessage = typedResponse.messages[typedResponse.messages.length - 1].content
        setMessages(prev => [...prev, { role: 'bot', content: botMessage, timestamp: new Date() }])
      } catch (error) {
        // console.error('Error:', error)
        setMessages(prev => [...prev, { role: 'bot', content: "Je suis désolé, une erreur s'est produite. Veuillez réessayer.", timestamp: new Date() }])
      } finally {
        setIsTyping(false)
      }
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const formatMessage = (content: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line.split(boldRegex).map((part, i) => 
          i % 2 === 1 ? (
            <strong key={i}>{part}</strong>
          ) : (
            part.split(urlRegex).map((subPart, j) => 
              urlRegex.test(subPart) ? (
                <a key={j} href={subPart} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {subPart}
                </a>
              ) : subPart
            )
          )
        )}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(prevFeedback => prevFeedback === type ? null : type);
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 flex flex-col items-end z-[999]">
        <AnimatePresence>
          {showPopup && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="mb-2 bg-white bg-opacity-90 text-black p-3 rounded-lg shadow-lg z-[999] relative"
              style={{
                width: '250px',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={() => setIsPopupHovered(true)}
              onMouseLeave={() => setIsPopupHovered(false)}
            >
              <span className="text-center">👋 Bonjour ! Comment puis-je vous aider aujourd'hui ?! 💪</span>
              {isPopupHovered && (
                <button 
                  onClick={() => setShowPopup(false)}
                  className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-300 transition-colors overflow-hidden flex-shrink-0 z-[999]"
        >
          <img 
            src={logoSrc} 
            alt="Chat" 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
            }} 
          />
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed bottom-4 right-4 w-full max-w-sm rounded-2xl overflow-hidden z-[999]" 
          style={{ 
            backgroundColor: chatInterfaceColor,
            boxShadow: '0 -10px 40px -15px rgba(0, 0, 0, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: chatInterfaceColor }}>
            <div className="flex items-center space-x-2">
              <img src={logoSrc} alt="C" className="w-10 h-10 rounded-full" />
              <div>
                <h2 className="font-bold text-lg text-black" style={{ fontFamily: 'Cursive, sans-serif' }}>ChatBot</h2>
                <p className="text-sm text-gray-500">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <div className="h-96 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#e9edf3' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                onMouseEnter={() => setHoveredMessage(index)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                <div
                  className={`relative max-w-xs px-4 py-2 rounded-lg ${
                    message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                  }`}
                >
                  {message.role === 'bot' && (
                    <img 
                      src={logoSrc} 
                      alt="C" 
                      className="absolute -top-2 -left-2 w-6 h-6 rounded-full border-2 border-white"
                    />
                  )}
                  <p className={message.role === 'bot' ? 'ml-4' : ''}>
                    {formatMessage(message.content)}
                  </p>
                  {hoveredMessage === index && (
                    <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-700 text-white text-xs rounded">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2">
                  <motion.div
                    className="flex space-x-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.span
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                    >
                      •
                    </motion.span>
                    <motion.span
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.2 }}
                    >
                      •
                    </motion.span>
                    <motion.span
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.4 }}
                    >
                      •
                    </motion.span>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t p-4" style={{ backgroundColor: chatInterfaceColor }}>
            <div className="flex items-center bg-gray-100 rounded-full">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Saisissez votre message ici"
                className="flex-grow px-4 py-2 bg-transparent focus:outline-none text-black"
              />
              <button
                onClick={handleSend}
                className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex-grow"></div>
              <a href="https://www.prestige-webb.fr" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-blue-500">
                Powered by PrestigeWebb
              </a>
              <div className="flex-grow flex justify-end">
                <div className="flex space-x-2">
                  <button 
                    className={`p-1 rounded-full transition-colors ${feedback === 'up' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-blue-500'}`}
                    onClick={() => handleFeedback('up')}
                  >
                    <ThumbsUp size={16} />
                  </button>
                  <button 
                    className={`p-1 rounded-full transition-colors ${feedback === 'down' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-red-500'}`}
                    onClick={() => handleFeedback('down')}
                  >
                    <ThumbsDown size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}