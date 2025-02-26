// app/api/gemini/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
    try {
        // Parse the request body
        const body = await request.json();
        const { prompt, currentExplanation } = body;

        // Validate the request
        if (!prompt || !currentExplanation) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Initialize the model
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Create the complete prompt with context
        const fullPrompt = `
            Current explanation: "${currentExplanation}"
            
            Task: Rewrite the above explanation about token gating to be:
            1. Shorter and more concise
            2. More user-friendly and easier to understand
            3. Using simple, everyday language
            4. Keeping the core meaning intact
            
            Rules:
            - Maximum 2 sentences
            - Avoid technical terms when possible
            - Use analogies if helpful
            - Keep it engaging
            
            Please provide only the rewritten explanation with no additional text.
        `;

        // Generate the content
        const result = await model.generateContent(fullPrompt);
        // console.log({ result })
        const response = await result.response;
        // console.log({ result })
        const explanation = response.text();
        // console.log({ explanation })

        // Return the response
        return NextResponse.json({ explanation });
    } catch (error) {
        console.error('Gemini API error:', error);
        return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
    }
}
