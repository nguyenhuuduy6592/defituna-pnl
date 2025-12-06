import { createPortal } from 'react-dom';

/**
 * Portal component that renders children into a DOM node outside
 * of the parent component's DOM hierarchy
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Content to render in the portal
 */
export const Portal = ({ children }) => {
  // For portal components, we can often render directly without mounted state
  // The createPortal function handles DOM access appropriately
  return createPortal(children, document.body);
};
