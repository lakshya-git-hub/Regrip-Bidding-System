import prisma from '../utils/prisma.js';

export const placeBid = async (userId: string, auctionId: string, amount: number) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Lock the auction row to handle race conditions
        const auction = await tx.$queryRaw<any[]>`
      SELECT * FROM "Auction" 
      WHERE id = ${auctionId} 
      FOR UPDATE
    `;

        if (!auction || auction.length === 0) {
            throw new Error('Auction not found');
        }

        const currentAuction = auction[0];

        // 2. Validate auction status
        if (currentAuction.status !== 'ACTIVE') {
            throw new Error('Auction is not active');
        }

        // 3. Validate bid amount
        if (amount <= currentAuction.currentPrice) {
            throw new Error('Bid must be higher than the current price');
        }

        // 4. Create the bid
        const bid = await tx.bid.create({
            data: {
                amount,
                auctionId,
                userId,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        // 5. Update the auction current price
        const updatedAuction = await tx.auction.update({
            where: { id: auctionId },
            data: {
                currentPrice: amount,
            },
        });

        return { bid, updatedAuction };
    });
};
