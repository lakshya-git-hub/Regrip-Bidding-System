'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Gavel, DollarSign, User as UserIcon, Play } from 'lucide-react';
import AdminDashboard from './AdminDashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Auction {
    id: string;
    title: string;
    description: string;
    currentPrice: number;
    leadingBidder?: string;
    status: 'PENDING' | 'ACTIVE' | 'CLOSED';
}

export default function DealerDashboard() {
    const { user, token } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [bidAmounts, setBidAmounts] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        setMounted(true);
    }, []);

    const formatBidderName = (name: string | null | undefined) => {
        if (!name) return 'None';
        // Fail-safe: If the name is the hardcoded default, or looks like it, use email logic
        if (name === 'Dealer John' || name === 'Admin User' || name.includes('@')) {
            const emailPart = name.includes('@') ? name : user?.email || name;
            return emailPart.split('@')[0].charAt(0).toUpperCase() + emailPart.split('@')[0].slice(1);
        }
        return name;
    };

    const fetchAuctions = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/auctions`);
            setAuctions(response.data);
        } catch (error) {
            toast.error('Failed to fetch auctions');
        }
    }, []);

    const handleStartAuction = async (id: string) => {
        try {
            await axios.post(
                `${API_URL}/api/auctions/${id}/start`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Auction started!');
            fetchAuctions();
        } catch (error) {
            toast.error('Failed to start auction');
        }
    };

    const handleCloseAuction = async (id: string) => {
        try {
            await axios.post(
                `${API_URL}/api/auctions/${id}/close`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Auction closed and deal finalized!');
            fetchAuctions();
        } catch (error) {
            toast.error('Failed to close auction');
        }
    };

    useEffect(() => {
        fetchAuctions();

        if (token) {
            const socket = getSocket(token);

            socket.on('bidUpdated', (data: { auctionId: string, currentPrice: number, leadingBidder: string }) => {
                setAuctions((prev) =>
                    prev.map((a) =>
                        a.id === data.auctionId
                            ? { ...a, currentPrice: data.currentPrice, leadingBidder: data.leadingBidder }
                            : a
                    )
                );
            });

            socket.on('auctionStatusUpdated', (data: { auctionId: string, status: 'ACTIVE' | 'CLOSED' | 'PENDING' }) => {
                setAuctions((prev) =>
                    prev.map((a) =>
                        a.id === data.auctionId
                            ? { ...a, status: data.status }
                            : a
                    )
                );
                if (data.status === 'CLOSED') {
                    toast.success('An auction has just been finalized!');
                }
            });

            auctions.forEach(a => socket.emit('joinAuction', a.id));

            return () => {
                socket.off('bidUpdated');
            };
        }
    }, [token, fetchAuctions, auctions.length]);

    const handleBid = async (auctionId: string) => {
        const amount = parseFloat(bidAmounts[auctionId]);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Enter a valid bid amount');
            return;
        }

        try {
            await axios.post(
                `${API_URL}/api/auctions/${auctionId}/bid`,
                { amount },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Bid placed successfully!');
            setBidAmounts(prev => ({ ...prev, [auctionId]: '' }));
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to place bid');
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight">
                            {user?.role === 'ADMIN' ? 'Admin Panel v5' : 'Marketplace Dashboard v5'}
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Real-time bidding environment</p>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Authenticated</span>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            {formatBidderName(user?.name)}
                        </div>
                    </div>
                </header>

                {user?.role === 'ADMIN' && (
                    <AdminDashboard onAuctionCreated={fetchAuctions} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {auctions.map((auction) => (
                        <div
                            key={auction.id}
                            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all relative overflow-hidden group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-bold text-slate-900">{auction.title}</h3>
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${auction.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${auction.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{auction.status}</span>
                                </div>
                            </div>

                            <p className="text-slate-500 text-sm mb-8 leading-relaxed line-clamp-2">{auction.description}</p>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                            <DollarSign className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <span className="text-slate-600 font-medium">Current</span>
                                    </div>
                                    <span className="text-2xl font-black text-slate-900">${auction.currentPrice}</span>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <UserIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="text-slate-600 font-medium">Bidder</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-600 truncate max-w-[120px]">
                                        {formatBidderName(auction.leadingBidder)}
                                    </span>
                                </div>
                            </div>

                            {user?.role === 'DEALER' && auction.status === 'ACTIVE' && (
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={bidAmounts[auction.id] || ''}
                                        onChange={(e) => setBidAmounts({ ...bidAmounts, [auction.id]: e.target.value })}
                                        placeholder="Amount"
                                        className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 text-slate-900 transition-all font-bold placeholder:font-normal"
                                        suppressHydrationWarning
                                    />
                                    <button
                                        onClick={() => handleBid(auction.id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
                                        suppressHydrationWarning
                                    >
                                        <Gavel className="w-4 h-4" />
                                        Bid
                                    </button>
                                </div>
                            )}

                            {user?.role === 'ADMIN' && auction.status === 'PENDING' && (
                                <button
                                    onClick={() => handleStartAuction(auction.id)}
                                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                                    suppressHydrationWarning
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    Launch Auction
                                </button>
                            )}

                            {user?.role === 'ADMIN' && auction.status === 'ACTIVE' && (
                                <button
                                    onClick={() => handleCloseAuction(auction.id)}
                                    className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95"
                                    suppressHydrationWarning
                                >
                                    <Gavel className="w-4 h-4" />
                                    Close & Settle Deal
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-12 text-center text-slate-400 text-xs font-medium">
                Connected to secure bidding gateway: {API_URL}
            </div>
        </div>
    );
}
