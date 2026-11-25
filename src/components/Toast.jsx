/*
  Transient status toast ("Locked in. Next victim?", clipboard failures…).
  ToastProvider owns the message and the auto-dismiss timer; any component
  can call `useToast().showToast(message)`. Rendering nothing when there is
  no message replaces the original hidden/is-visible class toggling.
*/

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 3200;

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(0);

  const hideToast = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setMessage(null);
  }, []);

  const showToast = useCallback((text) => {
    window.clearTimeout(timerRef.current);
    setMessage(text);
    timerRef.current = window.setTimeout(() => setMessage(null), AUTO_DISMISS_MS);
  }, []);

  // Do not leave a pending timer behind when the provider unmounts.
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message != null && (
        <aside className={styles.toast} role="status">
          <span>{message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={hideToast}>
            ×
          </button>
        </aside>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
