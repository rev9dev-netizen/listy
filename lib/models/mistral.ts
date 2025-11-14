// Mistral AI Client - uses OpenAI-compatible API
interface MistralMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface MistralChatRequest {
    model: string;
    messages: MistralMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
}

interface MistralChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

class MistralClient {
    private apiKey: string;
    private baseURL: string;

    constructor() {
        this.apiKey = process.env.MISTRAL_API_KEY || '';
        this.baseURL = 'https://api.mistral.ai/v1';

        if (!this.apiKey) {
            throw new Error('MISTRAL_API_KEY is not configured');
        }
    }

    async chat(request: MistralChatRequest): Promise<string> {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: request.model || 'mistral-large-latest',
                    messages: request.messages,
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.max_tokens ?? 4000,
                    top_p: request.top_p ?? 1,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Mistral API error: ${response.status} - ${error}`);
            }

            const data: MistralChatResponse = await response.json();
            return data.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Mistral API error:', error);
            throw error;
        }
    }
}

export const mistral = new MistralClient();
