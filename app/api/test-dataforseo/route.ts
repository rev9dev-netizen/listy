import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const login = process.env.DATAFORSEO_LOGIN
        const password = process.env.DATAFORSEO_PASSWORD

        if (!login || !password) {
            return NextResponse.json({
                error: 'Credentials not found in environment',
                hasLogin: !!login,
                hasPassword: !!password,
            }, { status: 500 })
        }

        const auth = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64')

        // Test 1: Check account info endpoint (always available)
        console.log('Testing DataForSEO account access...')
        const accountResponse = await fetch('https://api.dataforseo.com/v3/appendix/user_data', {
            method: 'GET',
            headers: {
                'Authorization': auth,
            },
        })

        const accountText = await accountResponse.text()
        let accountData
        try {
            accountData = JSON.parse(accountText)
        } catch {
            accountData = { raw: accountText }
        }

        // Test 2: Try Labs Amazon endpoint
        console.log('Testing Labs Amazon endpoint...')
        const labsResponse = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/amazon/bulk_search_volume/live', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth,
            },
            body: JSON.stringify([{
                keywords: ['test keyword'],
                amazon_domain: 'amazon.com',
            }]),
        })

        const labsText = await labsResponse.text()
        let labsData
        try {
            labsData = JSON.parse(labsText)
        } catch {
            labsData = { raw: labsText }
        }

        return NextResponse.json({
            credentials: {
                login: login,
                passwordLength: password.length,
                authHeader: auth.substring(0, 20) + '...',
            },
            accountCheck: {
                success: accountResponse.ok,
                status: accountResponse.status,
                statusText: accountResponse.statusText,
                data: accountData,
            },
            labsCheck: {
                success: labsResponse.ok,
                status: labsResponse.status,
                statusText: labsResponse.statusText,
                data: labsData,
            },
        })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({
            error: msg,
            stack: error instanceof Error ? error.stack : undefined,
        }, { status: 500 })
    }
}