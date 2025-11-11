import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

// Example Supabase-based project list (parallel to Prisma version)
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Assuming a "projects" table exists in Supabase mirroring Prisma schema
        const { data, error } = await supabase
            .from('projects')
            .select('id, marketplace, brand, productType, createdAt')
            .eq('userId', userId)
            .order('createdAt', { ascending: false })

        if (error) {
            console.error('Supabase error fetching projects', error)
            return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
        }

        return NextResponse.json({ projects: data ?? [] })
    } catch (e) {
        console.error('Unexpected error fetching projects', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
