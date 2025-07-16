
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import ACTIONS from './client/Action.js';
import cors from 'cors';
import dotenv from 'dotenv';

import askRouter from  './routes/askRouter.js'


dotenv.config();
console.log('✅ .env file loaded');
console.log('🔐 OpenAI Key starts with:', process.env.OPENAI_API_KEY?.slice(0, 5) + '...');
console.log('❓ Is OpenAI key undefined?', process.env.OPENAI_API_KEY === undefined);

const app = express(); 
const server = http.createServer(app);

app.use(cors());

app.use(express.json());


app.use('/api/ai',askRouter)

const userSocketMap = {};      // socketId -> username
const socketRoomMap = {};      // socketId -> roomId

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});



function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
    return {
      socketId,
      username: userSocketMap[socketId],
    };
  });
}




io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socketRoomMap[socket.id] = roomId;

    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });

    console.log(`[JOINED] ${username} joined room ${roomId}`);
  });

  socket.on(ACTIONS.SYNC_CODE,({socketId,code})=>{
     
    io.to(socketId).emit(ACTIONS.SYNC_CODE,{code})

  })
  socket.on(ACTIONS.CHAT_MESSAGE, ({ roomId, message }) => {
  const sender = userSocketMap[socket.id];
  
  if (!sender) {
    console.warn(`[WARNING] Unknown sender for socket ${socket.id}`);
    return;
  }

  io.in(roomId).emit(ACTIONS.CHAT_MESSAGE, { username: sender, message });
});

  socket.on(ACTIONS.CODE_CHANGE,({roomId,code})=>{

    // send to all the clients except the one who write changes
     
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE,{code})
          
  })

  socket.on('disconnect', () => {
    const username = userSocketMap[socket.id];
    const roomId = socketRoomMap[socket.id];

    delete userSocketMap[socket.id];
    delete socketRoomMap[socket.id];

    if (roomId) {
      socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username,
      });

      console.log(`[DISCONNECTED] ${username} (${socket.id}) from room ${roomId}`);
    } else {
      console.log(`[DISCONNECTED] ${username} (${socket.id}) but no room`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
