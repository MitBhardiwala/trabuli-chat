"use client";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from "@uiw/react-markdown-preview";
import { Poppins } from "next/font/google";
import Image from 'next/image';
  
const font = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface Message {
  content: string;
  sender: string;
  timestamp: string;
}

interface Product {
  name: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormEnabled, setIsFormEnabled] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<'initial' | 'category' | 'makeup' | 'trend'>('initial');
  const [products, setProducts] = useState<Product[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [productsFetched, setProductsFetched] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialMessage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchInitialMessage = async () => {
    try {
      setIsLoading(true);
      setOptions([]);
      console.log("/start endpoint called");
      const response = await axios.get(`${apiUrl}/chat/start`);
      const { message, options } = response.data;
      setMessages([{ content: message, sender: "Trabuli", timestamp: new Date().toISOString() }]);
      setOptions(options);
      setCurrentStep('initial');
    } catch (error) {
      console.error("Error fetching initial message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = async (option: string) => {
    try {
      setIsLoading(true);
      setOptions([]);
      addMessage(option, "User");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let response;
      if (currentStep === 'initial') {
        console.log("/category endpoint called");
        console.log(option);
        response = await axios.post(`${apiUrl}/chat/category`, { choice: option });
        const { message, options } = response.data;
        addMessage(message, "Trabuli");
        setCategoryOptions(options);
        setOptions(options);
        setCurrentStep('category');
      } else if (currentStep === 'category') {
        if (categoryOptions.includes(option)) {
          console.log("/makeup endpoint called");
          console.log(option);
          response = await axios.post(`${apiUrl}/chat/makeup`, { choice: option });
          const { message, options } = response.data;
          addMessage(message, "Trabuli");
          setOptions(options);
          setCurrentStep('makeup');
          setIsFormEnabled(true);
        } else {
          addMessage("Invalid option selected. Please choose from the available options.", "Trabuli");
        }
      } else if (currentStep === 'makeup' || currentStep === 'trend') {
        console.log("/trend endpoint called");
        console.log(option);
        response = await axios.post(`${apiUrl}/chat/trend`, { choice: option });
        handleTrendResponse(response.data);
      }
    } catch (error) {
      console.error("Error handling option:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageSend = async () => {
    if (!messageInput || !isFormEnabled) return;

    setIsSending(true);
    setIsLoading(true);
    setOptions([]);
    addMessage(messageInput, "User");
    setMessageInput("");

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("/trend endpoint called");
      console.log(messageInput)
      const response = await axios.post(`${apiUrl}/chat/trend`, { choice: messageInput });
      handleTrendResponse(response.data);
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage("I'm sorry, but there was an error processing your message. Please try again later.", "Trabuli");
    } finally {
      setIsSending(false);
      setIsLoading(false);
    }
  };

  const handleTrendResponse = (data: { message: string; products?: string[]; options?: string[]; image_url?: string }) => {
    const { message, products, options, image_url } = data;
    addMessage(message, "Trabuli");
    
    if (options && options.length > 0) {
      setOptions(options);
      setCurrentStep('trend');
      setIsFormEnabled(true);
      setProductsFetched(false);
    } else {
      setProductsFetched(true);
      if (products && products.length > 0) {
        setProducts(products.map(name => ({ name })));
        setImageUrl(image_url || null);
      } else {
        setProducts([]);
        setImageUrl(null);
        // addMessage("No products found for this trend.", "Trabuli");
      }
      setIsFormEnabled(false);
      setCurrentStep('initial');
      setOptions([]);
    }
  };

  const addMessage = (content: string, sender: string) => {
    const newMessage: Message = {
      content,
      sender,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-white">
      <header className="flex justify-between items-center py-4 px-8 bg-zinc-800/25">
        <h1 className="text-2xl font-bold">Trabuli Chat</h1>
      </header>
      <div className="overflow-auto flex-grow">
        <div className="py-4 px-8">
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 ${
                  message.sender === "User" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "Trabuli" && (
                  <img src="/images/bot_image.png" alt="Bot" className="w-10 h-10 rounded-full" />
                )}
                <div
                  className={`markdown max-w-[70%] ${
                    message.sender === "User" ? "bg-zinc-700/25" : "bg-zinc-500/25"
                  } p-3 rounded-md`}
                >
                  <ReactMarkdown
                    className={font.className}
                    source={message.content}
                    style={{ background: "transparent" }}
                  />
                  <small className="text-sm">
                    {message.sender} - {new Date(message.timestamp).toLocaleTimeString()}
                  </small>
                </div>
                {message.sender === "User" && (
                  <img src="/images/user_image.png" alt="User" className="w-10 h-10 rounded-full" />
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            )}
            {/* {imageUrl && (
              <div className="flex justify-center">
                <Image src={imageUrl} alt="Look" width={300} height={300} />
              </div>
            )} */}
            {productsFetched && products.length > 0 && (
  <div className="bg-zinc-800/25 p-4 rounded-md">
    <h3 className="text-lg font-semibold mb-2">Recommended Products:</h3>
    <ul className="list-disc pl-5">
      {products.map((product, index) => (
        <li key={index}>{product.name}</li>
      ))}
    </ul>
  </div>
)}
{productsFetched && products.length === 0 && (
  <div className="bg-zinc-800/25 p-4 rounded-md">
    <p>No products found for this trend.</p>
  </div>
)}
            <div ref={messagesEndRef} />
          </div>
          {!isLoading && options.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className="text-sm p-2 bg-indigo-500 text-white rounded-md flex-grow sm:flex-grow-0"
                  disabled={isLoading}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); handleMessageSend(); }} className="flex px-8 pb-6 pt-4 items-stretch gap-2">
        <input
          type="text"
          placeholder="Type your message here..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          className="flex-grow p-2 text-sm border border-zinc-700 bg-zinc-800/25 text-white rounded-md h-full"
          disabled={!isFormEnabled}
        />
        <button
          type="submit"
          disabled={!messageInput || isSending || isLoading || !isFormEnabled}
          className="text-sm p-3 bg-indigo-500 text-white rounded-md w-32"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default Chat;