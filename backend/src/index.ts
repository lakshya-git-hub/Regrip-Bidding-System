import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket } from './services/socketService.js';
import { register, login } from './controllers/authController.js';
import { createAuction, startAuction, getAuctions, closeAuction } from './controllers/auctionController.js';
import { authenticateJWT, authorize } from './middleware/auth.js';
import { placeBid } from './services/bidService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
export const io = initSocket(httpServer);

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(express.json());

// Auth Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// Auction Routes
app.get('/api/auctions', getAuctions);
app.post('/api/auctions', authenticateJWT, authorize(['ADMIN']), createAuction);
app.post('/api/auctions/:id/start', authenticateJWT, authorize(['ADMIN']), startAuction);
app.post('/api/auctions/:id/close', authenticateJWT, authorize(['ADMIN']), closeAuction);

// Bidding Route (Rest for initial submission, Socket for real-time)
app.post('/api/auctions/:id/bid', authenticateJWT, async (req: any, res) => {
    const { amount } = req.body;
    const auctionId = req.params.id;
    const userId = (req as any).user.id;

    try {
        const { bid, updatedAuction } = await placeBid(userId, auctionId, amount);

        // Broadcast update via Socket.io
        io.to(`auction:${auctionId}`).emit('bidUpdated', {
            auctionId,
            currentPrice: updatedAuction.currentPrice,
            leadingBidder: bid.user.name || bid.user.email
        });

        res.json({ bid, updatedAuction });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
