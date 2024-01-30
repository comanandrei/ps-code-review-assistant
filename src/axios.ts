import axios from "axios";
import { PS_CHAT_TOKEN } from "./config";

export const axiosApi = axios.create({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${PS_CHAT_TOKEN}`,
  },
});
