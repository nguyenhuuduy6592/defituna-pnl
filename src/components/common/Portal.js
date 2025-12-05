import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal component that renders children into a DOM node outside
 * of the parent component's DOM hierarchy
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Content to render in the portal
 */
export const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted ? createPortal(children, document.body) : null;
};