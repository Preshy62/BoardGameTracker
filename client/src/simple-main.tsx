import { createRoot } from "react-dom/client";
import { useState } from "react";
import "./index.css";

function FreshApp() {
  const [counter, setCounter] = useState(0);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-lg max-w-md mx-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Big Boys Game
        </h1>
        <p className="text-gray-300 mb-6">
          Fresh React Application
        </p>
        <div className="mb-6">
          <p className="text-white text-xl mb-4">Counter: {counter}</p>
          <button
            onClick={() => setCounter(counter + 1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Increment ({counter})
          </button>
        </div>
        <div className="text-sm text-gray-400">
          React hooks are working correctly
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<FreshApp />);