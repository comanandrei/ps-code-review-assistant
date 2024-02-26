import { axiosApi } from "./axios";
import getQ from "./qId-loop";
import { URL } from "./config";

interface PSAIResponseData {
  message: string;
  async: boolean;
  options: {
    model: string;
    assistant: string;
    contexts: any[];
    parameters: {
      max_tokens: number;
      temperature: number;
    };
    source: string;
  };
}

export async function getPSChatbotResponse(prompt: string) {
  try {
    const requestData: PSAIResponseData = {
      message: prompt,
      async: true,
      options: {
        model: "gpt35turbo",
        assistant: "Assistant",
        contexts: [],
        parameters: {
          max_tokens: 1000,
          temperature: 0,
        },
        source: "pschat",
      },
    };

    const response = await axiosApi.post(`${URL}/api/chat`, requestData);
    console.log("====response QID", response?.data?.qid);
    if (response.data?.qid) {
      const messages = await getQ(response.data.qid);
      console.log("====messages", messages);
      const messageContent = messages[1]?.content?.trim() ?? "{}";
      return JSON.parse(messageContent).reviews;
    }
  } catch (error) {
    console.error("Error in getPSChatbotResponse:", error);
    throw error; // Allow for further handling upstream
  }
}
