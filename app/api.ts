import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export const fetchInitialMessage = async () => {
  try {
    const response = await axios.get(`${apiUrl}/chat/start`);
    return response.data;
  } catch (error) {
    console.error("Error fetching initial message:", error);
    throw error;
  }
};

export const fetchCategory = async (choice: string) => {
  try {
    const response = await axios.post(`${apiUrl}/chat/category`, { choice });
    return response.data;
  } catch (error) {
    console.error("Error fetching category:", error);
    throw error;
  }
};

export const fetchMakeup = async (choice: string) => {
  try {
    const response = await axios.post(`${apiUrl}/chat/makeup`, { choice });
    return response.data;
  } catch (error) {
    console.error("Error fetching makeup:", error);
    throw error;
  }
};

export const fetchTrend = async (choice: string) => {
  try {
    const response = await axios.post(`${apiUrl}/chat/trend`, { choice });
    return response.data;
  } catch (error) {
    console.error("Error fetching trend:", error);
    throw error;
  }
};
export const fetchProduct = async (choice: string) => {
  try {
    const response = await axios.post(`${apiUrl}/chat/product`, { choice });
    return response.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};