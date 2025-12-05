/**
 * Utility for displaying notifications and interacting with the clipboard.
 * This module provides functions to show toast-style notifications and
 * copy text to the clipboard with proper feedback.
 */

// Constants for notification settings
const NOTIFICATION_DURATION = 3000; // 3 seconds
const NOTIFICATION_FADE_OUT = 300; // 0.3 seconds

// Background colors for different notification types
const COLORS = {
  success: 'rgba(16, 185, 129, 0.95)',
  error: 'rgba(239, 68, 68, 0.95)',
  warning: 'rgba(245, 158, 11, 0.95)',
  info: 'rgba(59, 130, 246, 0.95)',
};

/**
 * Shows a toast-style notification
 * @param {string} message - The message to display
 * @param {string} [type='success'] - Type of notification ('success', 'error', 'warning', 'info')
 * @returns {HTMLElement} The notification element
 */
export const showNotification = (message, type = 'success') => {
  try {
    // Input validation
    if (!message) {
      console.warn('[showNotification] Empty message provided');
      message = 'Notification';
    }

    if (!COLORS[type]) {
      console.warn(`[showNotification] Invalid notification type: ${type}, defaulting to success`);
      type = 'success';
    }

    // Create notification element
    const notification = document.createElement('div');

    // Set attributes for accessibility
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      border-radius: 8px;
      background: ${COLORS[type]};
      color: white;
      font-size: 14px;
      backdrop-filter: blur(10px);
      z-index: 1000;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      opacity: 0;
      max-width: 80%;
      text-align: center;
      word-break: break-word;
    `;
    notification.textContent = message;

    // Add to DOM
    document.body.appendChild(notification);

    // Trigger reflow for animation
    notification.offsetHeight;
    notification.style.opacity = '1';

    // Remove after duration
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, NOTIFICATION_FADE_OUT);
    }, NOTIFICATION_DURATION);

    return notification;
  } catch (error) {
    console.error('[showNotification] Error showing notification:', error);
    return null;
  }
};

/**
 * Copies text to clipboard and shows a notification
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Whether the copy operation succeeded
 */
export const copyToClipboard = async (text) => {
  try {
    // Input validation
    if (!text) {
      console.warn('[copyToClipboard] Empty text provided');
      showNotification('Nothing to copy', 'error');
      return false;
    }

    // Try using the Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for iOS and other browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // Make the textarea invisible but accessible to screen readers
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('aria-hidden', 'true');
      document.body.appendChild(textArea);

      // Select and copy the text
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      if (!successful) {
        throw new Error('execCommand copy failed');
      }

      // Clean up
      textArea.remove();
    }

    showNotification('Copied to clipboard!', 'success');
    return true;
  } catch (error) {
    console.error('[copyToClipboard] Failed to copy text:', error);
    showNotification('Failed to copy to clipboard', 'error');
    return false;
  }
};