import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

// Create socket connection
const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5
});

function App() {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;

    // Socket event listeners
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('draw', (data) => {
      console.log('Received draw event:', data);
      ctx.beginPath();
      ctx.moveTo(data.lastPos.x, data.lastPos.y);
      ctx.lineTo(data.pos.x, data.pos.y);
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });

    socket.on('cursor', (data) => {
      setCursors((prev) => ({ ...prev, [data.id]: data }));
    });

    socket.on('clear', () => {
      console.log('Received clear event');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('draw');
      socket.off('cursor');
      socket.off('clear');
    };
  }, []);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    setLastPos({ x: offsetX, y: offsetY });
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    
    // Draw locally
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Emit draw event
    const drawData = {
      lastPos,
      pos: { x: offsetX, y: offsetY },
      color,
      size
    };
    console.log('Emitting draw event:', drawData);
    socket.emit('draw', drawData);

    setLastPos({ x: offsetX, y: offsetY });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Emitting clear event');
    socket.emit('clear');
  };

  return (
    <div className="App">
      <h1>Collaborative Whiteboard</h1>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          style={{ border: '1px solid black' }}
        />
      </div>
      <div className="controls">
        <div className="control-group">
          <label>Color:</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className="control-group">
          <label>Size:</label>
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={size} 
            onChange={(e) => setSize(Number(e.target.value))} 
          />
          <span>{size}px</span>
        </div>
        <button onClick={clearCanvas}>Clear Canvas</button>
      </div>
    </div>
  );
}

export default App; 