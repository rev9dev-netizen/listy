/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@clerk/nextjs/server'
import { prisma } from './databse/prisma'

/**
 * Get or create a user in the database based on Clerk authentication.
 * Uses upsert to avoid race conditions and duplicate user creation.
 * 
 * @returns The user from the database
 * @throws Error if user is not authenticated
 */
export async function getOrCreateUser() {
    const { userId } = await auth()

    if (!userId) {
        throw new Error('Unauthorized')
    }

    // First, try to find user by clerkId
    // First, try to find user by clerkId
    console.log(`[AUTH] Checking for user with clerkId: ${userId}`)
    let user = await prisma.user.findUnique({
        where: { clerkId: userId },
    })

    // If user exists, return it
    if (user) {
        console.log(`[AUTH] Found existing user: ${user.id}`)
        return user
    }

    console.log(`[AUTH] User not found, creating new user for ${userId}`)

    // If user doesn't exist, try to create it
    const clerkUser = await auth()
    
    // Extract email safely with fallbacks
    let email = `${userId}@clerk.user` 
    
    if (clerkUser.sessionClaims?.email) {
             email = clerkUser.sessionClaims.email as string
        } else {
             // Safe access for nested structure
             const claims = clerkUser.sessionClaims as any
             if (claims?.user?.email) {
                 email = claims.user.email
             }
        }
    
    console.log(`[AUTH] Using email: ${email}`)

    try {
        user = await prisma.user.create({
            data: {
                clerkId: userId,
                email: email,
            },
        })
        console.log(`[AUTH] Created new user: ${user.id}`)
        return user
    } catch (error: unknown) {
        console.error('[AUTH] User creation failed, attempting recovery:', error)
        
        // If creation fails due to unique constraint (race condition or email conflict),
        // try to find the user one more time
        const prismaError = error as { code?: string }
        if (prismaError.code === 'P2002') {
            // Check if it was race condition on clerkId
            user = await prisma.user.findUnique({
                where: { clerkId: userId },
            })

            if (user) {
                console.log(`[AUTH] Recovered: Found user after race condition: ${user.id}`)
                return user
            }

            // If still not found, the email conflict is with another clerkId
            // Update the existing user with the new clerkId
            const existingUser = await prisma.user.findUnique({
                where: { email: email },
            })

            if (existingUser) {
                console.log(`[AUTH] Found email conflict with user ${existingUser.id}, linking to new Clerk ID`)
                // Update the clerkId of the existing user
                user = await prisma.user.update({
                    where: { email: email },
                    data: { clerkId: userId },
                })
                return user
            }
        }

        console.error('[AUTH] Fatal error creating user:', error)
        throw error
    }
}
