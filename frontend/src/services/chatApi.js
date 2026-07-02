import axios from 'axios';

// Create a central Axios instance for standard JSON REST operations
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true, // Crucial for cross-domain cookie validation on separately deployed services
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

/**
 * Fetch all sessions for a user
 */
export const getSessions = async (userId) => {
  const response = await api.get(`/sessions?userId=${userId}`);
  return response.data.data?.sessions || [];
};

/**
 * Create or initialize a session on the server
 */
export const createSession = async (sessionId, userId, title = 'New Conversation') => {
  const response = await api.post('/sessions', { sessionId, userId, title });
  return response.data.data?.session;
};

/**
 * Get history of messages for a session
 */
export const getHistory = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/history`);
  return response.data.data?.messages || [];
};

/**
 * Delete a session and its message logs
 */
export const clearHistory = async (sessionId) => {
  const response = await api.delete(`/sessions/${sessionId}`);
  return response.data.data;
};

/**
 * Send chat message and stream the response in real time (using native fetch API)
 * @param {Object} params - parameters
 * @param {string} params.message - Latest user input message
 * @param {Array} params.messages - Fallback full conversation array if DB is offline
 * @param {string} params.sessionId - Current session ID
 * @param {string} params.userId - Current user ID
 * @param {Function} params.onChunk - Callback invoked as soon as a text fragment arrives: (text) => {}
 * @param {Function} params.onComplete - Callback when stream finishes successfully
 * @param {Function} params.onError - Callback when an error occurs
 * @param {AbortSignal} params.signal - Signal to stop/abort stream generation
 */
export const streamChatCompletion = async ({
  message,
  messages,
  sessionId,
  userId,
  onChunk,
  onComplete,
  onError,
  signal
}) => {
  try {
    const payload = {
      message,
      messages,
      sessionId,
      userId,
      stream: true
    };

    const response = await fetch(`${import.meta.env.VITE_API_URL}/chat-with-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal,
      credentials: 'include' // Crucial for cross-domain cookie validation on separately deployed services
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedErr = parsed.error || errText;
      } catch (e) {}
      throw new Error(parsedErr || `Server returned code ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep last partial line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine === '') continue;
        if (cleanLine === 'data: [DONE]') continue;

        if (cleanLine.startsWith('data: ')) {
          try {
            const dataStr = cleanLine.slice(6);
            const data = JSON.parse(dataStr);
            
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.content) {
              onChunk(data.content);
            }
          } catch (e) {
            // Ignore JSON parsing errors for partial stream chunks
            if (e.message.includes('NVIDIA NIM API Error') || e.message.includes('Stream interrupted')) {
              throw e;
            }
          }
        }
      }
    }
    
    // Process final buffer if any
    if (buffer.trim().startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
      try {
        const data = JSON.parse(buffer.trim().slice(6));
        if (data.content) {
          onChunk(data.content);
        }
      } catch (e) {}
    }

    onComplete();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream request was aborted.');
    } else {
      onError(error);
    }
  }
};
