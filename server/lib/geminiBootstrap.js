// Gemini bootstrap module with injectable client management
import { GoogleGenAI } from '@google/genai';
import { GoogleAuth } from 'google-auth-library';
import logger from '../../src/shared/lib/logger.js';

let ai;

async function initializeGeminiAPI() {
  try {
    const auth = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/generative-language.retriever'
      ],
    });

    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    if (accessToken.token) {
      ai = new GoogleGenAI({ credentials: authClient });
      logger.info('Google Gemini API initialized with OAuth2 credentials');
      return;
    }

    throw new Error('No access token obtained');
  } catch (oauthError) {
    logger.warn('OAuth2 initialization failed, trying API key fallback:', oauthError.message);

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        ai = new GoogleGenAI({ apiKey });
        logger.info('Google Gemini API initialized with API key (deprecated method)');
        return;
      } catch (apiKeyError) {
        logger.error('Both OAuth2 and API key initialization failed');
        logger.error('OAuth2 error:', oauthError.message);
        logger.error('API key error:', apiKeyError.message);
        throw apiKeyError;
      }
    } else {
      logger.error('No authentication method available for Gemini API');
      logger.error('Please run "gcloud auth application-default login" or set GOOGLE_API_KEY/GEMINI_API_KEY');
      throw oauthError;
    }
  }
}

function setClient(client) { ai = client; }
function getClient() { return ai; }

export default { initializeGeminiAPI, setClient, getClient };
export { initializeGeminiAPI, setClient, getClient };
