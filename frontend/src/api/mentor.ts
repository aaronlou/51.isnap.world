import { apiClient } from './client';

export interface MentorMessage {
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export interface MentorChatResponse {
  reply: string;
  remaining: number;
  messages: MentorMessage[];
}

export interface MentorChatHistory {
  messages: MentorMessage[];
  message_count: number;
}

export async function fetchMentorChat(photoId: string): Promise<MentorChatHistory> {
  const res = await apiClient.get<MentorChatHistory>(`/api/photos/${photoId}/mentor-chat`);
  return res.data;
}

export async function sendMentorMessage(photoId: string, message: string): Promise<MentorChatResponse> {
  const res = await apiClient.post<MentorChatResponse>(`/api/photos/${photoId}/mentor-chat`, { message });
  return res.data;
}
