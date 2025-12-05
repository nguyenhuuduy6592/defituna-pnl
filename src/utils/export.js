/**
 * Export and sharing utilities.
 * This module provides functions to export DOM elements as images
 * and share content through the Web Share API.
 */

import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';

// Default canvas options
const DEFAULT_CANVAS_OPTIONS = {
  scale: 2,
  useCORS: true,
  backgroundColor: null,
  logging: false,
};

/**
 * Generates a PNG image from a DOM element
 * @param {HTMLElement} element - DOM element to capture
 * @returns {Promise<string>} Data URL of the generated image
 */
const generateImage = async (element) => {
  return await toPng(element, {
    quality: 1.0,
    pixelRatio: 2,
    skipAutoScale: true,
  });
};

/**
 * Exports a DOM element as an image file
 * @param {React.RefObject} elementRef - React ref to the DOM element to capture (e.g., the modal container)
 * @param {string} fileName - Name for the downloaded file
 * @returns {Promise<boolean>} Whether the export was successful
 */
export const exportChartAsImage = async (elementRef, fileName) => {
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
 * Exports a DOM element as an image file
 * @param {React.RefObject} contentRef - React ref to the specific DOM element containing the content to export
 * @param {string} fileName - Name for the downloaded file
 * @returns {Promise<boolean>} Whether the export was successful
 */
export const exportCardAsImage = async (contentRef, fileName) => {
  try {
    if (!contentRef || !contentRef.current) {
      console.error('[exportCardAsImage] Invalid content element reference');
      return false;
    }

    if (!fileName) {
      fileName = `export-${new Date().toISOString().slice(0, 10)}.png`;
      console.warn('[exportCardAsImage] No file name provided, using default:', fileName);
    }

    const dataUrl = await generateImage(contentRef.current);

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
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

    // Find the content element that has the data-export-content attribute
    const contentElement = elementRef.current.querySelector('[data-export-content]');
    if (!contentElement) {
      console.error('[shareCard] Could not find content element with data-export-content attribute');
      return false;
    }

    const dataUrl = await generateImage(contentElement);

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

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
      text: text || 'Check out this image',
    });

    return true;
  } catch (error) {
    console.error('[shareCard] Error sharing card:', error);
    return false;
  }
};