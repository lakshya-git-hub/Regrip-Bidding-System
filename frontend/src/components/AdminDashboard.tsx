'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Play } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminDashboard({ onAuctionCreated }: { onAuctionCreated: () => void }) {
    const { token, user } = useAuthStore();
    console.log('AdminDashboard Render - User Role:', user?.role);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startingPrice, setStartingPrice] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(
                `${API_URL}/api/auctions`,
                { title, description, startingPrice: parseFloat(startingPrice) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Auction created!');
            setTitle('');
            setDescription('');
            setStartingPrice('');
            onAuctionCreated();
        } catch (error) {
            toast.error('Failed to create auction');
        }
    };

    return (
        <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm mb-12">
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                    <Plus className="text-blue-600 w-6 h-6" />
                </div>
                Create New Auction
            </h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Auction Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Premium Grade A Tyres"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 text-slate-900 transition-all font-semibold"
                        required
                        suppressHydrationWarning
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Starting Price</label>
                    <input
                        type="number"
                        value={startingPrice}
                        onChange={(e) => setStartingPrice(e.target.value)}
                        placeholder="5000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 text-slate-900 transition-all font-semibold"
                        required
                        suppressHydrationWarning
                    />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Offer Details</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Condition, quantity, and logistics info..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 text-slate-900 transition-all font-semibold"
                        suppressHydrationWarning
                    />
                </div>
                <div className="flex items-end">
                    <button
                        type="submit"
                        className="w-full bg-slate-950 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-al transition-all shadow-lg active:scale-[0.98]"
                        suppressHydrationWarning
                    >
                        Publish Auction
                    </button>
                </div>
            </form>
        </div>
    );
}
