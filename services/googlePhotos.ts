import { GOOGLE_PHOTOS_SCOPE } from '../constants';

// FALLBACK DEFAULT CONFIGURATION
// These are used if the user hasn't provided their own keys in Settings.
const DEFAULT_API_KEY = 'AIzaSyCC5dEUVkE2PqdetWqatRxNUo5ucs6L2z8'; 
const DEFAULT_CLIENT_ID = '211968092452-42nl0tsg1ub14j62vu19aishqn2ur7u3.apps.googleusercontent.com'; 
const APP_ID_PREFIX = '211968092452'; // Only used for the default ID

const STORAGE_KEY_CLIENT_ID = 'photoday_google_client_id';
const STORAGE_KEY_API_KEY = 'photoday_google_api_key';

// Type definitions for the global google object
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

let pickerApiLoaded = false;
let oauthToken: string | null = null;
let tokenClient: any = null;

/**
 * Get current credentials (User provided > Default)
 */
export const getCredentials = () => {
  const storedClientId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CLIENT_ID) : null;
  const storedApiKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_API_KEY) : null;

  return {
    clientId: (storedClientId || DEFAULT_CLIENT_ID).trim(),
    apiKey: (storedApiKey || DEFAULT_API_KEY).trim()
  };
};

/**
 * Save new credentials and reset state
 */
export const setCredentials = (clientId: string, apiKey: string) => {
  if (typeof window === 'undefined') return;
  
  if (clientId) localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId);
  else localStorage.removeItem(STORAGE_KEY_CLIENT_ID);

  if (apiKey) localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
  else localStorage.removeItem(STORAGE_KEY_API_KEY);

  // Reset internal state to force re-initialization
  pickerApiLoaded = false;
  oauthToken = null;
  tokenClient = null;
};

/**
 * Loads the Google Picker API and Identity Services
 */
export const loadGoogleApis = async (): Promise<boolean> => {
  const { clientId, apiKey } = getCredentials();
  
  console.log("Google Auth - Initializing with Origin:", window.location.origin);

  if (!clientId || !apiKey) {
    console.warn('Google Client ID or API Key missing. Picker will default to mock.');
    return false;
  }

  return new Promise((resolve) => {
    const checkGapi = () => {
      // Ensure both gapi (for Picker) and google.accounts (for Auth) are loaded
      if (window.gapi && window.google && window.google.accounts) {
        window.gapi.load('picker', { callback: () => {
          pickerApiLoaded = true;
          resolve(true);
        }});
      } else {
        setTimeout(checkGapi, 100);
      }
    };
    checkGapi();
  });
};

/**
 * Trigger authentication to get an access token
 */
export const authenticateGoogle = async (): Promise<string | null> => {
  if (!window.google || !window.google.accounts) return null;

  const { clientId } = getCredentials();

  // Return existing token if we have one (and it's likely still valid - simplified check)
  if (oauthToken) return oauthToken;

  return new Promise((resolve, reject) => {
    try {
      // Always init a new client to ensure it picks up the latest Client ID if changed
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_PHOTOS_SCOPE,
        // Using 'select_account' helps clear stuck "storagerelay" states by forcing a user interaction
        prompt: 'select_account', 
        callback: (response: any) => {
          if (response.access_token) {
            oauthToken = response.access_token;
            resolve(oauthToken);
          } else {
            console.error("Auth Response Error:", response);
            reject(new Error('Failed to get access token: ' + (response.error || 'Unknown error')));
          }
        },
        error_callback: (err: any) => {
             // 'popup_closed' is expected if user clicks X
             if (err.type === 'popup_closed') {
                 console.warn("User closed the Google Auth popup.");
                 reject(new Error('popup_closed'));
             } else {
                 console.error("Auth Error Callback:", err);
                 // The 'storagerelay' error often appears here or as a timeout
                 reject(err);
             }
        }
      });
      
      // Trigger the popup
      tokenClient.requestAccessToken();

    } catch (e) {
      console.error("Auth Exception:", e);
      reject(e);
    }
  });
};

interface PickerResult {
  url: string;
  id: string;
}

/**
 * Open the Google Picker
 */
export const openGooglePicker = async (
  query: string | undefined,
  onSelect: (files: PickerResult[]) => void,
  onCancel?: () => void
) => {
  try {
    const { apiKey, clientId } = getCredentials();
    
    // Derive App ID (Project Number) if possible, otherwise rely on internal Google logic
    // Usually the first numeric part of the Client ID is the Project Number (App ID)
    const appIdMatch = clientId.match(/^(\d+)/);
    const appId = appIdMatch ? appIdMatch[1] : APP_ID_PREFIX;

    if (!pickerApiLoaded || !oauthToken) {
      const loaded = await loadGoogleApis();
      if (!loaded) throw new Error('Google APIs not configured');
      
      const token = await authenticateGoogle();
      if (!token) throw new Error('Authentication failed');
    }

    const pickerCallback = (data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const docs = data.docs;
        const results: PickerResult[] = docs.map((doc: any) => {
          const fileUrl = doc[window.google.picker.Document.URL];
          const fileId = doc[window.google.picker.Document.ID];
          const thumbUrl = doc[window.google.picker.Document.THUMBNAILS]?.[0]?.url || fileUrl;
          
          // Optimize resolution
          const baseUrl = doc.thumbnails?.[0]?.url?.split('=')[0]; 
          const finalUrl = baseUrl ? `${baseUrl}=w1920-h1080` : thumbUrl;
          
          return { url: finalUrl, id: fileId };
        });
        
        onSelect(results);
      } else if (data.action === window.google.picker.Action.CANCEL) {
        if (onCancel) onCancel();
      }
    };

    const view = new window.google.picker.PhotosView();
    if (query) {
      view.setQuery(query);
    }

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(oauthToken!)
      .setDeveloperKey(apiKey)
      .setCallback(pickerCallback)
      .setAppId(appId)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .build();

    picker.setVisible(true);
  } catch (err) {
    throw err; 
  }
};