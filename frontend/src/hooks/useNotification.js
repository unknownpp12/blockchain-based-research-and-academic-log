import { useState, useEffect } from "react";

export function useNotification() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Auto-clear notifications after 4 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [message, error]);

  return { message, setMessage, error, setError };
}
