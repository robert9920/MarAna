import { useRef, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState(null);
  const timerRef = useRef();

  function showToast(text, type = "success") {
    setMessage({ text, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(null), 4000);
  }

  return { message, showToast };
}
