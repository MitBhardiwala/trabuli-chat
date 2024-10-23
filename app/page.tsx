"use client";
import React, { useState, useEffect, useRef } from 'react';
import { fetchInitialMessage, fetchCategory, fetchMakeup, fetchTrend,fetchProduct } from './api';
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
}
//product
interface Product {
  name: string;
  description: string;
  price: string;
  url: string;
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

  const getInitialMessage = async () => {
    try {
      console.log("Request: /initial");  // Added logging
      setIsLoading(true);
      setOptions([]);
      await delay(3000);
      const { message, options } = await fetchInitialMessage();
      console.log("Initial Response:", { message, options });  // Added logging
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
      await delay(3000);
  
      console.log("Selected Option:", option);
  
      // Check if it's one of the special options
      const specialOptions = [
        "I want to search for latest Trends",
        "I want to search for latest trends",
        "I want to buy for an Occasion",
        "I want to buy a product"
      ];
  
      if (specialOptions.includes(option)) {
        console.log("Request: /makeup with option:", option);
        const response = await fetchMakeup(option);
        console.log("Makeup Response:", response);
        handleMakeupResponse(response);
        return;
      }
  
      let response;
      if (currentStep === 'initial') {
        console.log("Request: /category with option:", option);
        response = await fetchCategory(option);
        console.log("Category Response:", response);
        const { message, options } = response;
        addMessage(message, "Trabuli");
        setCategoryOptions(options);
        setOptions(options);
        setCurrentStep('category');
      } else if (currentStep === 'category') {
        if (categoryOptions.includes(option)) {
          console.log("Request: /makeup with option:", option);
          response = await fetchMakeup(option);
          console.log("Makeup Response:", response);
          handleMakeupResponse(response);
        } else {
          addMessage("Invalid option selected. Please choose from the available options.", "Trabuli");
        }
      } else if (currentStep === 'makeup' || currentStep === 'trend') {
        console.log("Request: /trend with option:", option);
        response = await fetchTrend(option);
        console.log("Trend Response:", response);
        handleTrendResponse(response);
      } else if (currentStep === 'product') {
        console.log("Request: /product with option:", option);
        response = await fetchProduct(option);
        console.log("Product Response:", response);
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
        console.log("Request: /product with message:", messageInput);  // Added logging
        response = await fetchProduct(messageInput);
        console.log("Product Response:", response);  // Added logging
        handleProductResponse(response);
      } else {
        console.log("Request: /trend with message:", messageInput);  // Added logging
        response = await fetchTrend(messageInput);
        console.log("Trend Response:", response);  // Added logging
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
    console.log("Processing Makeup Response:", data);
    const { message, options, products } = data;
    addMessage(message, "Trabuli");
  
    if (options && options.length > 0) {
      // Handle options response
      setOptions(options);
      setCurrentStep('makeup');
      setIsFormEnabled(true);
      setProductsFetched(false); // Reset products state
    } else if (products !== undefined) {
      // Handle products response (like regular products)
      setProductList(products);
      setProductsFetched(true);
      setIsFormEnabled(true);
      setCurrentStep('product');
      setOptions([]);
    }
  };
  const handleTrendResponse = (data: { message: string; products?: string[]; options?: string[]; image_url?: string }) => {
    console.log("Processing Trend Response:", data);  // Added logging
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
    console.log("Processing Product Response:", data);  // Added logging
    const { message, products } = data;
    addMessage(message, "Trabuli");

    setProductList(products);
    setProductsFetched(true);
    setIsFormEnabled(true);
    setCurrentStep('product');
  };

  const handleProductSelection = (product: Product) => {
    addMessage(`Selected product: ${product.name}`, "User");
    setIsFormEnabled(false);
    setCurrentStep('initial');
    setOptions([]);
    setProductsFetched(false);
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
    <div className="h-screen flex flex-col bg-pink-50 text-gray-800">
      <header className="flex justify-between items-center py-4 px-8 bg-white shadow-sm border-b border-pink-100">
        <h1 className="text-2xl font-bold text-pink-600">Trabuli Chat</h1>
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
            {trendProductsFetched && trendProducts.length === 0 && (
              <div className="bg-white p-4 rounded-md shadow-sm border border-pink-100">
                <p className="text-gray-700">No products found for this trend.</p>
              </div>
            )}
            {productsFetched && productList.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {productList.map((product, index) => (
                  <div key={index} className="bg-white p-4 rounded-md shadow-sm border border-pink-100">
                    <h3 className="text-lg font-semibold mb-2 text-pink-600">{product.name}</h3>
                    <p className="text-gray-700 mb-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Buy Product</a>
                      <span className="text-green-600 font-semibold">{product.price}</span>
                    </div>
                    {/* <button
                      onClick={() => handleProductSelection(product)}
                      className="mt-2 w-full text-sm p-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                    >
                      Select Product
                    </button> */}
                  </div>
                ))}
              </div>
              
            )}
             {/* {productsFetched && productList.length === 0 && (
              <div className="bg-white p-4 rounded-md shadow-sm border border-pink-100">
                <p className="text-gray-700">No products found.</p>
              </div>
            )} */}
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