/**
 * Progressive Web App (PWA) utilities.
 * 
 * Scalability Design:
 * - Handles app installation prompts (BeforeInstallPromptEvent).
 * - Implements detection of standalone mode (installed app) across Chrome, Android, Safari, and iOS.
 * - Detects iOS devices to show Safari-specific instructions.
 */

let deferredPrompt = null;
const promptListeners = new Set();

// Listen to the beforeinstallprompt event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Notify listeners
    promptListeners.forEach((listener) => listener(deferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    // Clear the prompt
    deferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
    console.log('PWA was installed successfully');
  });
}

/**
 * Checks if the application is currently running in standalone mode (installed).
 * Compatibility for Chrome, Android, Safari, and iOS.
 * @returns {boolean} True if running inside an installed PWA.
 */
export function isAppInstalled() {
  if (typeof window === 'undefined') return false;
  
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isNavigatorStandalone = !!window.navigator.standalone;
  
  return isStandalone || isNavigatorStandalone;
}

/**
 * Checks if the device is iOS.
 * @returns {boolean} True if the device is an iPhone, iPad, or iPod.
 */
export function isIOS() {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
}

/**
 * Subscribes to the deferred prompt event availability.
 * @param {function} callback - Callback function receiving the prompt event or null.
 * @returns {function} Cleanup function to unsubscribe.
 */
export function subscribeToInstallPrompt(callback) {
  promptListeners.add(callback);
  // Immediately call with the current event
  callback(deferredPrompt);
  return () => {
    promptListeners.delete(callback);
  };
}

/**
 * Triggers the native installation prompt.
 * @returns {Promise<boolean>} True if the user accepted the installation.
 */
export async function triggerInstallPrompt() {
  if (!deferredPrompt) return false;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`PWA installation outcome: ${outcome}`);
  
  deferredPrompt = null;
  promptListeners.forEach((listener) => listener(null));
  
  return outcome === 'accepted';
}

/**
 * Checks if the browser is currently online.
 * @returns {boolean} Current online status.
 */
export function isOnline() {
  if (typeof window === 'undefined') return true;
  return window.navigator.onLine;
}

/**
 * Listen to network connectivity changes.
 * @param {function} callback - Receives true for online, false for offline.
 * @returns {function} Clean up listener function.
 */
export function monitorConnectivity(callback) {
  if (typeof window === 'undefined') return () => {};
  
  const goOnline = () => callback(true);
  const goOffline = () => callback(false);

  window.addEventListener('online', goOnline);
  window.addEventListener('offline', goOffline);

  return () => {
    window.removeEventListener('online', goOnline);
    window.removeEventListener('offline', goOffline);
  };
}
