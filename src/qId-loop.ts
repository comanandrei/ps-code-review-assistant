import { axiosApi } from "./axios";
import { URL } from "./config";

const TIMEOUT_MS = 1000; // Timeout duration in milliseconds

const filterMessages = (messages: Array<{ role: string }>) =>
  messages.filter((message) => message.role !== "system");

const getQ = async (qId: string): Promise<any> => {
  // Replace 'any' with a more specific type if possible
  try {
    while (qId) {
      const response = await axiosApi.get(`${URL}/api/q/${qId}`);
      if (response.data.status === "done") {
        return filterMessages(response.data.results.data.messages);
      }
      await new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));
    }
  } catch (error) {
    console.error("ERROR in getQ:", error);
    throw error; // Rethrow error for handling by the caller if needed
  }
};

export default getQ;
