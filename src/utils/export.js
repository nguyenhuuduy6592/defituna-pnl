/**
 * Export and sharing utilities.
 * This module provides functions to export DOM elements as images
 * and share content through the Web Share API.
 */

import html2canvas from 'html2canvas';

// Default canvas options
const DEFAULT_CANVAS_OPTIONS = {
  scale: 2,
  useCORS: true,
  backgroundColor: null,
  logging: false
};

/**
 * Exports a DOM element as an image file
 * @param {React.RefObject} elementRef - React ref to the DOM element to capture (e.g., the modal container)
 * @param {string} fileName - Name for the downloaded file
 * @returns {Promise<boolean>} Whether the export was successful
 */
export const exportCardAsImage = async (elementRef, fileName) => {
  try {
    // Input validation
    if (!elementRef || !elementRef.current) {
      console.error('[exportCardAsImage] Invalid element reference');
      return false;
    }

    if (!fileName) {
      fileName = `export-${new Date().toISOString().slice(0, 10)}.png`;
      console.warn('[exportCardAsImage] No file name provided, using default:', fileName);
    }

    const canvas = await html2canvas(elementRef.current, {
      ...DEFAULT_CANVAS_OPTIONS,
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    return true;
  } catch (error) {
    console.error('[exportCardAsImage] Error exporting card:', error);
    return false;
  }
};

/**
 * Shares a DOM element as an image using the Web Share API
 * @param {React.RefObject} elementRef - React ref to the DOM element
 * @param {string} fileName - Name for the shared file
 * @param {string} title - Title for the share dialog
 * @param {string} text - Description text for the share
 * @returns {Promise<boolean>} Whether the share was successful
 */
export const shareCard = async (elementRef, fileName, title, text) => {
  try {
    // Input validation
    if (!elementRef || !elementRef.current) {
      console.error('[shareCard] Invalid element reference');
      return false;
    }

    if (!fileName) {
      fileName = `share-${new Date().toISOString().slice(0, 10)}.png`;
      console.warn('[shareCard] No file name provided, using default:', fileName);
    }

    const canvas = await html2canvas(elementRef.current, {
      ...DEFAULT_CANVAS_OPTIONS,
      backgroundColor: '#1a1a1a'
    });
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    
    if (!blob) {
      throw new Error('Failed to create image blob');
    }
    
    const file = new File([blob], fileName, { type: 'image/png' });
    
    if (!navigator.share) {
      console.warn('[shareCard] Web Share API not supported');
      // Fallback: download the image instead
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return true;
    }
    
    await navigator.share({
      files: [file],
      title: title || 'Shared Image',
      text: text || 'Check out this image'
    });
    
    return true;
  } catch (error) {
    console.error('[shareCard] Error sharing card:', error);
    return false;
  }
}; 