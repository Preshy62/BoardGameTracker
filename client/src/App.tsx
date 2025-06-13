import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-lg max-w-md mx-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          Big Boys Game
        </h1>
        <p className="text-gray-300 mb-6">
          Application is loading properly!
        </p>
        <p className="text-white mb-4">Count: {count}</p>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Click me: {count}
        </button>
      </div>
    </div>
  );
}

export default App;