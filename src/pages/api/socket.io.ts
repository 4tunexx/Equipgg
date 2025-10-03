import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { Server as NetServer } from 'http'

interface ExtendedNextApiResponse extends NextApiResponse {
  socket: any & {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const extendedRes = res as ExtendedNextApiResponse
  
  if (!extendedRes.socket?.server?.io) {
    console.log('Setting up Socket.IO')
    const httpServer = extendedRes.socket.server
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket.io',
      addTrailingSlash: false,
      cors: {
        origin: ["http://localhost:3001", "https://www.equipgg.net"],
        methods: ["GET", "POST"]
      }
    })
    
    extendedRes.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id)
      
      // Join chat rooms
      socket.on('join-chat', (room) => {
        socket.join(room)
        console.log(`User ${socket.id} joined chat room: ${room}`)
      })
      
      // Handle chat messages
      socket.on('send-message', (data) => {
        socket.to(data.channel || 'arena').emit('new-message', data)
      })
      
      // Handle notifications
      socket.on('send-notification', (data) => {
        socket.broadcast.emit('notification', data)
      })
      
      // Handle XP updates
      socket.on('xp-update', (data) => {
        socket.broadcast.emit('user-xp-update', data)
      })
      
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
      })
    })
  }
  res.end()
}