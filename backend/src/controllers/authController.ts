import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const register = async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'DEALER',
            },
        });
        res.status(201).json({ message: 'User created' });
    } catch (error) {
        res.status(400).json({ error: 'User already exists' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
};
