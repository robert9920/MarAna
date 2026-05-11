import { createContext, createElement, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef();

  function showToast(text, type = "success") {
    setMessage({ text, type });
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(null), 4000);
  }

  return createElement(
    ToastContext.Provider,
    { value: { message, showToast } },
    children,
    message
      ? createElement(
          "div",
          {
            className: `fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-md rounded-xl border px-4 py-3 text-sm font-black shadow-xl sm:bottom-auto sm:left-auto sm:right-5 sm:top-5 ${
              message.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-green-200 bg-green-50 text-green-800"
            }`,
            role: "status"
          },
          message.text
        )
      : null
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  const [message, setMessage] = useState(null);
  const timerRef = useRef();

  if (context) {
    return { message: null, showToast: context.showToast };
  }

  function showToast(text, type = "success") {
    setMessage({ text, type });
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(null), 4000);
  }
  return { message, showToast };
}
