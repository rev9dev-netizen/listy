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
    let user = await prisma.user.findUnique({
        where: { clerkId: userId },
    })

    // If user exists, return it
    if (user) {
        return user
    }

    // If user doesn't exist, try to create it
    const clerkUser = await auth()
    const email = (clerkUser.sessionClaims?.email as string) || `${userId}@clerk.user`

    try {
        user = await prisma.user.create({
            data: {
                clerkId: userId,
                email: email,
            },
        })
        return user
    } catch (error: unknown) {
        // If creation fails due to unique constraint (race condition or email conflict),
        // try to find the user one more time
        const prismaError = error as { code?: string }
        if (prismaError.code === 'P2002') {
            user = await prisma.user.findUnique({
                where: { clerkId: userId },
            })

            if (user) {
                return user
            }

            // If still not found, the email conflict is with another clerkId
            // Update the existing user with the new clerkId
            const existingUser = await prisma.user.findUnique({
                where: { email: email },
            })

            if (existingUser) {
                // Update the clerkId of the existing user
                user = await prisma.user.update({
                    where: { email: email },
                    data: { clerkId: userId },
                })
                return user
            }
        }

        throw error
    }
}
