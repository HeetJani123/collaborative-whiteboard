import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// Create socket connection with dynamic server URL
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'https://curious-macaron-c3adb0.netlify.app/';
const socket = io(SERVER_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  autoConnect: true
});

// Predefined colors for the palette
const COLORS = [
  '#000000',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#FFA500',
  '#800080',
  '#008000'
];

function App() {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [cursors, setCursors] = useState({});
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [username, setUsername] = useState('');
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDrawer, setCurrentDrawer] = useState(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = Math.min(800, window.innerHeight * 0.7);
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      //ctx.strokeStyle = color;
      //ctx.lineWidth = size;
      setColor(ctx.strokeStyle)
      setSize(ctx.lineWidth)
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [color, size]);

  // Socket connection and event handling
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('Connected to server with ID:', socket.id);
      setIsConnected(true);
      if (username) {
        console.log('Reconnecting with username:', username);
        socket.emit('setUsername', username);
      }
    };

    const handleDisconnect = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    };

    const handleDraw = (data) => {
      console.log('Received draw event from server:', data);
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(data.lastPos.x, data.lastPos.y);
      ctx.lineTo(data.pos.x, data.pos.y);
      ctx.stroke();

      setCurrentDrawer(data.username);
    };

    const handleCursor = (data) => {
      console.log('Received cursor event:', data);
      setCursors((prev) => {
        const newCursors = { ...prev };
        if (data.username) {
          newCursors[data.id] = data;
        } else {
          delete newCursors[data.id];
        }
        return newCursors;
      });
    };

    const handleClear = () => {
      console.log('Received clear event from server');
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setCurrentDrawer(null);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('draw', handleDraw);
    socket.on('cursor', handleCursor);
    socket.on('clear', handleClear);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('draw', handleDraw);
      socket.off('cursor', handleCursor);
      socket.off('clear', handleClear);
    };
  }, [username]);

  const startDrawing = (e) => {
    if (!username || !isConnected) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDrawing(true);
    setLastPos({ x, y });
    setCurrentDrawer(username);
  };

  const draw = (e) => {
    if (!isDrawing || !username || !isConnected) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    const drawData = {
      lastPos,
      pos: { x, y },
      color,
      size,
      username
    };
    socket.emit('draw', drawData);

    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setCurrentDrawer(null);
  };

  const clearCanvas = () => {
    if (!isConnected) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear');
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setShowUsernamePrompt(false);
      socket.emit('setUsername', username);
    }
  };

  if (showUsernamePrompt) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center z-50">
        <form onSubmit={handleUsernameSubmit} className="bg-white p-12 rounded-2xl shadow-2xl text-center w-[400px] transform transition-all">
          <h2 className="text-4xl font-bold text-gray-800 mb-8">Welcome to Whiteboard</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            required
            className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mb-8 transition-all"
          />
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg py-4 px-8 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Join Whiteboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center">
      <div className="w-full max-w-[1200px] px-4 py-12">
        <h1 className="text-5xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Collaborative Whiteboard
        </h1>
        
        {/* Main Canvas Area */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="relative flex justify-center">
            {currentDrawer && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-full text-sm font-semibold animate-fade-in shadow-lg">
                {currentDrawer} is drawing...
              </div>
            )}
            <div className="w-full">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full border border-gray-200 rounded-lg"
              />
            </div>
            {Object.entries(cursors).map(([id, cursor]) => (
              <div
                key={id}
                className="absolute pointer-events-none text-sm font-bold text-shadow-white"
                style={{
                  left: cursor.x,
                  top: cursor.y - 30,
                  color: cursor.color
                }}
              >
                {cursor.username}
              </div>
            ))}
          </div>
        </div>

        {/* Controls Area */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex flex-col items-center gap-8">
            <div className="w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Size Control */}
              <div className="flex flex-col items-center bg-gray-50 p-4 rounded-xl">
                <label className="text-base font-semibold text-gray-700 mb-2">Brush Size</label>
                <div className="w-full max-w-xs flex items-center gap-2">
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={size} 
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="flex-1 accent-blue-500 h-1.5 rounded-lg"
                  />
                  <span className="text-gray-600 font-medium min-w-[40px] text-center bg-white px-2 py-0.5 rounded-lg shadow-sm text-sm">
                    {size}px
                  </span>
                </div>
              </div>

              {/* Color Control */}
              <div className="flex flex-col items-center bg-gray-50 p-4 rounded-xl">
                <label className="text-base font-semibold text-gray-700 mb-2">Brush Color</label>
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-300 hover:border-gray-400 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    style={{ backgroundColor: color }}
                    onClick={() => setShowColorPalette(!showColorPalette)}
                  />
                  {showColorPalette && (
                    <div className="absolute mt-2 bg-white p-3 rounded-xl shadow-xl grid grid-cols-5 gap-2 z-50 border border-gray-200">
                      {COLORS.map((colorOption) => (
                        <div
                          key={colorOption}
                          className="w-6 h-6 rounded-lg cursor-pointer border border-gray-300 hover:scale-110 transition-all shadow-sm hover:shadow-md"
                          style={{ backgroundColor: colorOption }}
                          onClick={() => {
                            setColor(colorOption);
                            setShowColorPalette(false);
                          }}
                        />
                      ))}
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-6 h-6 p-0 border-0 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clear Button */}
            <div className="w-full flex justify-center pt-4">
              <button 
                onClick={clearCanvas}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-12 py-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg transform hover:-translate-y-0.5"
              >
                Clear Canvas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 