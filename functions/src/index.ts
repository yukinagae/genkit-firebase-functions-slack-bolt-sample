import { genkit, z } from 'genkit'

import { App, ExpressReceiver } from '@slack/bolt'
import { onRequest } from 'firebase-functions/v2/https'
import { gpt4o, openAI } from 'genkitx-openai'
import { verifySignature } from './verification'

// Log debug output to the console.
import { logger } from 'genkit/logging'
logger.setLogLevel('debug')

// Configure Genkit with necessary plugins and settings
const ai = genkit({
  plugins: [openAI({ apiKey: process.env.OPENAI_API_KEY })], // Use the OpenAI plugin with the provided API key.
})

// Flow definition to answer a question
const answerFlow = ai.defineFlow(
  {
    name: 'answerFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (question: string) => {
    const llmResponse = await ai.generate({
      prompt: `You are a helpful AI assistant. You are asked: ${question}`,
      model: gpt4o, // Specify the model to use for generation
      tools: [],
      config: {
        temperature: 1, // Set the creativity/variation of the response
      },
    })
    return llmResponse.text
  },
)

// Create a slack receiver
function createReceiver() {
  const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    endpoints: '/events',
    processBeforeResponse: true,
  })

  const app = new App({
    receiver: receiver,
    token: process.env.SLACK_BOT_TOKEN,
    processBeforeResponse: true,
  })

  app.event('app_mention', async ({ event, context, client, say }) => {
    const { bot_id: botId, text: rawInput, channel } = event
    const { retryNum } = context
    const ts = event.thread_ts || event.ts

    if (retryNum) return // skip if retry
    if (botId) return // skip if bot mentions itself

    // thinking...
    const botMessage = await say({
      thread_ts: ts,
      text: 'typing...',
    })
    if (!botMessage.ts) return // skip if failed to send message

    const input = rawInput.replace(/<@.*?>/, '').trim() // delete mention
    const answer = await answerFlow(input) // run the flow to get the answer
    console.log('💖answer', answer)

    await client.chat.update({
      channel,
      ts: botMessage.ts as string,
      text: answer,
    })
  })
  return receiver
}

export const slack = onRequest(
  { secrets: ['OPENAI_API_KEY', 'SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET'] },
  async (req, res) => {
    // verify the request is from slack
    if (!verifySignature(req, process.env.SLACK_SIGNING_SECRET || '')) {
      res.status(400).send('Request verification failed')
      return
    }

    return createReceiver().app(req, res)
  },
)
