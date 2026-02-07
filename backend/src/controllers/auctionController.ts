import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { io } from '../index.js';

export const createAuction = async (req: AuthRequest, res: Response) => {
    const { title, description, startingPrice } = req.body;
    const auction = await prisma.auction.create({
        data: {
            title,
            description,
            startingPrice,
            currentPrice: startingPrice,
            createdBy: req.user?.id as string,
        },
    });
    res.status(201).json(auction);
};

export const startAuction = async (req: Request, res: Response) => {
    const { id } = req.params;
    const auction = await prisma.auction.update({
        where: { id: id as string },
        data: {
            status: 'ACTIVE',
            startTime: new Date()
        },
    });
    res.json(auction);
    io.emit('auctionStatusUpdated', { auctionId: id, status: 'ACTIVE' });
};

export const getAuctions = async (req: Request, res: Response) => {
    const auctions = await prisma.auction.findMany({
        include: {
            creator: {
                select: { name: true }
            },
            bids: {
                orderBy: { amount: 'desc' },
                take: 1,
                include: {
                    user: {
                        select: { name: true, email: true }
                    }
                }
            }
        }
    });

    const formattedAuctions = auctions.map(auction => {
        const topBid = auction.bids[0];
        return {
            ...auction,
            leadingBidder: topBid ? (topBid.user.name || topBid.user.email) : null
        };
    });

    res.json(formattedAuctions);
};
export const closeAuction = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const auction = await prisma.auction.update({
            where: { id: id as string },
            data: {
                status: 'CLOSED',
                endTime: new Date()
            },
        });
        res.json(auction);
        io.emit('auctionStatusUpdated', { auctionId: id, status: 'CLOSED' });
    } catch (error) {
        res.status(400).json({ error: 'Failed to close auction' });
    }
};
