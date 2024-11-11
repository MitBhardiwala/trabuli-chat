"use client";
import React, { useState, useEffect, useRef } from 'react';
import { fetchInitialMessage, fetchCategory, fetchMakeup, fetchTrend, fetchProduct } from './api';
import ReactMarkdown from "@uiw/react-markdown-preview";
import { Poppins } from "next/font/google";
import Image from 'next/image';

const font = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

interface Message {
  content: string;
  sender: string;
  timestamp: string;
  products?: Product[]; // Add products to message interface
}

interface Product {
  name: string;
  description: string;
  price: string;
  url: string;
  photo_url: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormEnabled, setIsFormEnabled] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<'initial' | 'category' | 'makeup' | 'trend' | 'product'>('initial');
  const [trendProducts, setTrendProducts] = useState<string[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [trendProductsFetched, setTrendProductsFetched] = useState<boolean>(false);
  const [productsFetched, setProductsFetched] = useState<boolean>(false);
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    getInitialMessage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Rest of the existing functions remain the same until handleProductResponse
  const getInitialMessage = async () => {
    try {
      setIsLoading(true);
      setOptions([]);
      await delay(3000);
      const { message, options } = await fetchInitialMessage();
      setMessages([{ content: message, sender: "Trabuli", timestamp: new Date().toISOString() }]);
      setOptions(options);
      setCurrentStep('initial');
      
    } catch (error) {
      console.error("Error fetching initial message:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const addMessage = (content: string, sender: string, products?: Product[]) => {
    const newMessage: Message = {
      content,
      sender,
      timestamp: new Date().toISOString(),
      products
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleOptionClick = async (option: string) => {
    try {
      setIsLoading(true);
      setOptions([]);
      addMessage(option, "User");
      await delay(3000);
  
      const specialOptions = [
        "I want to search for latest Trends",
        "I want to search for latest trends",
        "I want to buy for an Occasion",
        "I want to buy a product"
      ];
  
      if (specialOptions.includes(option)) {
        const response = await fetchMakeup(option);
        handleMakeupResponse(response);
        return;
      }
  
      let response;
      if (currentStep === 'initial') {
        response = await fetchCategory(option);
        const { message, options } = response;
        addMessage(message, "Trabuli");
        setCategoryOptions(options);
        setOptions(options);
        setCurrentStep('category');
      } else if (currentStep === 'category') {
        if (categoryOptions.includes(option)) {
          response = await fetchMakeup(option);
          handleMakeupResponse(response);
        } else {
          addMessage("Invalid option selected. Please choose from the available options.", "Trabuli");
        }
      } else if (currentStep === 'makeup' || currentStep === 'trend') {
        response = await fetchTrend(option);
        handleTrendResponse(response);
      } else if (currentStep === 'product') {
        response = await fetchProduct(option);
        handleProductResponse(response);
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
      await delay(3000);
      let response;
      if (currentStep === 'product') {
        response = await fetchProduct(messageInput);
        handleProductResponse(response);
      } else {
        response = await fetchTrend(messageInput);
        handleTrendResponse(response);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage("I'm sorry, but there was an error processing your message. Please try again later.", "Trabuli");
    } finally {
      setIsSending(false);
      setIsLoading(false);
    }
  };

  const handleMakeupResponse = (data: { message: string; options?: string[]; products?: Product[] }) => {

    
    const { message, options, products } = data;
    addMessage(message, "Trabuli");
      
    if (options && options.length > 0) {
      setOptions(options);
      setCurrentStep('makeup');
      setIsFormEnabled(true);
      setProductsFetched(false);
    } else if (products !== undefined) {
      handleProductResponse({ message, products });
    }
  };

  const handleTrendResponse = (data: { message: string; products?: string[]; options?: string[]; image_url?: string }) => {
    const { message, products, options, image_url } = data;
    addMessage(message, "Trabuli");

    if (options && options.length > 0) {
      setOptions(options);
      setCurrentStep('trend');
      setIsFormEnabled(true);
      setTrendProductsFetched(false);
    } else {
      setTrendProductsFetched(true);
      if (products && products.length > 0) {
        setTrendProducts(products);
        setImageUrl(image_url || null);
      } else {
        setTrendProducts([]);
        setImageUrl(null);
      }
      setIsFormEnabled(false);
      setCurrentStep('initial');
      setOptions([]);
    }
  };


  const handleProductResponse = (data: { message: string; products: Product[] }) => {
    const { message, products } = data;
    
    // Sort products: ones with photo_url first, then ones without
    const sortedProducts = [...products].sort((a, b) => {
        if (a.photo_url && !b.photo_url) return -1;
        if (!a.photo_url && b.photo_url) return 1;
        return 0;
    });

    // Add the message with products attached
    if(products.length>0){

    
    const newMessage: Message = {
      content: message,
      sender: "Trabuli",
      timestamp: new Date().toISOString(),
      products: sortedProducts // Attach products to the message
    };
    setMessages(prev => [...prev, newMessage]);
    setProductList(sortedProducts);
    


  }

  setProductsFetched(true);
    setIsFormEnabled(true);
    setCurrentStep('product');
  };

  return (
    <div className="h-screen flex flex-col bg-pink-50 text-gray-800">
      <header className="flex justify-between items-center py-4 px-8 bg-white shadow-sm border-b border-pink-100">
        <h1 className="text-2xl font-bold text-pink-600">Trabuli Chat</h1>
      </header>
      <div className="overflow-auto flex-grow">
        <div className="py-4 px-8">
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={`flex items-start space-x-2 ${
                    message.sender === "User" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "Trabuli" && (
                    <img src="/images/bot_image.png" alt="Bot" className="w-10 h-10 rounded-full" />
                  )}
                  <div
                    className={`markdown max-w-[70%] ${
                      message.sender === "User" ? "bg-pink-200" : "bg-pink-200"
                    } p-3 rounded-md shadow-sm`}
                  >
                    <div className="force-black-text">
                      <ReactMarkdown
                        className={`${font.className} message-content`}
                        source={message.content}
                        style={{ color: 'black !important', background: "transparent" }}
                      />
                    </div>
                    <small className="text-sm text-gray-500 font-medium">
                      {message.sender} - {new Date(message.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                  {message.sender === "User" && (
                    <img src="/images/user_image.png" alt="User" className="w-10 h-10 rounded-full" />
                  )}
                </div>
                {/* Display products if they exist in the message */}
                {message.products && message.products.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {message.products.map((product, productIndex) => (
                      <div key={productIndex} className="bg-white p-4 rounded-md shadow-sm border border-pink-100">
                        <h3 className="text-lg font-semibold mb-2 text-pink-600">{product.name}</h3>
                        {product.photo_url ? (
                          <div className="w-[200px] h-[200px] mx-auto mb-2">
                            <img 
                              src={product.photo_url} 
                              alt={product.name}
                              className="w-full h-full object-contain rounded-md"
                            />
                          </div>
                        ) : (
                          <p className="text-gray-700 mb-2">{product.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Buy Product</a>
                          <span className="text-green-600 font-semibold">{product.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
              </div>
            )}
            {trendProductsFetched && trendProducts.length > 0 && (
              <div className="bg-white p-4 rounded-md shadow-sm border border-pink-100">
                <h3 className="text-lg font-semibold mb-2 text-pink-600">Recommended Products:</h3>
                <ul className="list-disc pl-5 text-gray-700">
                  {trendProducts.map((product, index) => (
                    <li key={index}>{product}</li>
                  ))}
                </ul>
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
                  className="text-sm p-2 bg-pink-500 text-white rounded-md flex-grow sm:flex-grow-0 hover:bg-pink-600 transition-colors"
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
          className="flex-grow p-2 text-sm border border-pink-200 bg-white text-gray-800 rounded-md h-full focus:outline-none focus:ring-2 focus:ring-pink-300"
          disabled={!isFormEnabled}
        />
        <button
          type="submit"
          disabled={!messageInput || isSending || isLoading || !isFormEnabled}
          className="text-sm p-3 bg-pink-500 text-white rounded-md w-32 hover:bg-pink-600 transition-colors"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default Chat;