// Centralized user connections store with DI-friendly getter
// Keeps state in-memory for dev; can be wired to Redis or DB later

const userConnections = new Map();

export function getUserConnections(userId) {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, {
      github: null,
      notion: null,
      figma: null,
      googleDrive: null,
      googlePhotos: null,
      googleCalendar: null,
      gmail: null,
      openai: null,
      claude: null,
      gemini: null,
      ollama: null,
      drawthings: null,
      university: null,
    });
  }
  return userConnections.get(userId);
}

export default { getUserConnections };
