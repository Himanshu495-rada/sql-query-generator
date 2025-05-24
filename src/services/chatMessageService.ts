import api from '../utils/api';

export interface ChatMessage {
  id: string;
  playgroundId: string;
  userId: string;
  sender: 'user' | 'ai';
  message: string;
  sql?: string;
  queryId?: string;
  results?: any[];
  createdAt: string;
  updatedAt: string;
}

export const chatMessageService = {
  async getAllForPlayground(playgroundId: string): Promise<ChatMessage[]> {
    const response = await api.get<{ data: { messages: ChatMessage[] } }>(`/chat-messages/playground/${playgroundId}`);
    return response.data.messages;
  },
  async addMessage(data: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMessage> {
    const response = await api.post<{ data: { chatMessage: ChatMessage } }>(`/chat-messages`, data);
    return response.data.chatMessage;
  },
}; 