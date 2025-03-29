import html2canvas from 'html2canvas';

export const exportCardAsImage = async (elementRef, fileName) => {
  try {
    const canvas = await html2canvas(elementRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#1E293B',
      width: elementRef.current.offsetWidth,
      height: elementRef.current.offsetHeight,
      logging: false,
      onclone: (clonedDoc) => {
        const clonedContent = clonedDoc.querySelector('[data-export-content]');
        if (clonedContent) {
          clonedContent.style.width = `${elementRef.current.offsetWidth}px`;
          clonedContent.style.height = `${elementRef.current.offsetHeight}px`;
          clonedContent.style.position = 'relative';
          clonedContent.style.transform = 'none';
        }
      }
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error exporting card:', error);
  }
};

export const shareCard = async (elementRef, fileName, title, text) => {
  try {
    const canvas = await html2canvas(elementRef.current, {
      scale: 2,
      backgroundColor: '#1a1a1a'
    });
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    const file = new File([blob], fileName, { type: 'image/png' });
    
    if (navigator.share) {
      await navigator.share({
        files: [file],
        title,
        text
      });
    }
  } catch (error) {
    console.error('Error sharing card:', error);
  }
}; 