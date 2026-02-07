import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const initSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST'],
        },
    });

    // Authentication Middleware for Sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (err) return next(new Error('Authentication error'));
            (socket as any).user = user;
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${(socket as any).user.id}`);

        socket.on('joinAuction', (auctionId: string) => {
            socket.join(`auction:${auctionId}`);
            console.log(`User ${(socket as any).user.id} joined auction ${auctionId}`);
        });

        socket.on('leaveAuction', (auctionId: string) => {
            socket.leave(`auction:${auctionId}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });

    return io;
};
