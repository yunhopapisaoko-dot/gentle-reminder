// Gemini service - API key optional, graceful degradation when missing

export const getCommunityChat = () => {
  // Return null - chat will show fallback message
  console.warn("Gemini API not configured. Chat will use fallback responses.");
  return null;
};

export const generateLatestFeed = async () => {
  // Return null - feed will use static content
  return null;
};
