import { Injectable, OnModuleInit } from "@nestjs/common";
import { OpenRouter } from '@openrouter/sdk';

@Injectable()
export class AiService implements OnModuleInit {
    private client: OpenRouter;

    async generateText(prompt: string): Promise<string | any[] | undefined | null> {
        try {
            const response = await this.client.chat.send({
                chatRequest: {
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                }
            });
            if (response instanceof ReadableStream) {
                throw new Error('Expected a non-streaming response');
            }
            return response.choices[0].message.content;
        } catch (error) {
            console.log(error)
            throw new Error('Failed to generate text');
        }
    }

    onModuleInit() {
        console.log("api key is ", process.env.OPENROUTER_API_KEY);
        this.client = new OpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY || '',
        });

        this.generateText('What are famous polls websites?').then((response) => {
            console.log('AI Service initialized. Sample response:', response);
        }).catch((error) => {
            console.error('Error during AI Service initialization:', error);
        });
    }
}