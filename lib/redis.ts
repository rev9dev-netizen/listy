import { Redis } from '@upstash/redis'

// Use Upstash Redis REST API (works perfectly with Next.js serverless)
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache helpers
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await redis.get<string>(key)
            if (!value) return null
            if (typeof value === 'string' && value.trim() === '') return null
            return JSON.parse(value)
        } catch (error) {
            // Silently handle parse errors for empty/invalid cache
            if (error instanceof SyntaxError) {
                return null
            }
            console.error('Redis GET error:', error)
            return null
        }
    },

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value)
            if (ttlSeconds) {
                await redis.setex(key, ttlSeconds, serialized)
            } else {
                await redis.set(key, serialized)
            }
        } catch (error) {
            console.error('Redis SET error:', error)
        }
    },

    async del(key: string): Promise<void> {
        try {
            await redis.del(key)
        } catch (error) {
            console.error('Redis DEL error:', error)
        }
    },

    async invalidatePattern(pattern: string): Promise<void> {
        try {
            const keys = await redis.keys(pattern)
            if (keys.length > 0) {
                await redis.del(...keys)
            }
        } catch (error) {
            console.error('Redis invalidate pattern error:', error)
        }
    },
}
