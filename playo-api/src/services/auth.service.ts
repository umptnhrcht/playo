import { OAuth2Client } from 'google-auth-library'
import type { PrismaClient } from '@prisma/client'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export interface GoogleUser {
    googleId: string
    email: string
    name: string
    avatar?: string
}

// Verify Google ID token (native flow)
export async function verifyGoogleToken(idToken: string): Promise<GoogleUser | null> {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        })
        const payload = ticket.getPayload()
        if (!payload?.sub || !payload.email) return null

        return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name ?? payload.email,
            avatar: payload.picture,
        }
    } catch {
        return null
    }
}

// Verify Google access token (web fallback — fetches userinfo)
export async function verifyGoogleAccessToken(accessToken: string): Promise<GoogleUser | null> {
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return null

        const data = await res.json() as {
            sub: string
            email: string
            name: string
            picture?: string
        }
        if (!data.sub || !data.email) return null

        return {
            googleId: data.sub,
            email: data.email,
            name: data.name,
            avatar: data.picture,
        }
    } catch {
        return null
    }
}

export async function upsertUser(prisma: PrismaClient, googleUser: GoogleUser) {
    return prisma.user.upsert({
        where: { googleId: googleUser.googleId },
        update: { name: googleUser.name, avatar: googleUser.avatar },
        create: {
            googleId: googleUser.googleId,
            email: googleUser.email,
            name: googleUser.name,
            avatar: googleUser.avatar,
        },
        select: { id: true, email: true, name: true, avatar: true },
    })
}