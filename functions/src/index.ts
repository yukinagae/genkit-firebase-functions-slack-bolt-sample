import { defineTool, generate } from '@genkit-ai/ai'
import { configureGenkit } from '@genkit-ai/core'
import { defineFlow, runFlow } from '@genkit-ai/flow'
import { App, ExpressReceiver } from '@slack/bolt'
import * as cheerio from 'cheerio'
import { onRequest } from 'firebase-functions/v2/https'
import { gpt4o, openAI } from 'genkitx-openai'
import * as z from 'zod'

// Configure Genkit with necessary plugins and settings
configureGenkit({
  plugins: [openAI({ apiKey: process.env.OPENAI_API_KEY })], // Use the OpenAI plugin with the provided API key.
  logLevel: 'debug', // Log debug output to the console.
  enableTracingAndMetrics: true, // Perform OpenTelemetry instrumentation and enable trace collection.
})

// Tool definition for loading web content
const webLoader = defineTool(
  {
    name: 'webLoader',
    description: 'Loads a webpage and returns the textual content.',
    inputSchema: z.object({ url: z.string() }),
    outputSchema: z.string(),
  },
  async ({ url }) => {
    const res = await fetch(url) // Fetch the content from the provided URL
    const html = await res.text()
    const $ = cheerio.load(html) // Load the HTML content into Cheerio for parsing
    $('script, style, noscript').remove() // Remove unnecessary elements
    return $('article').length ? $('article').text() : $('body').text() // Prefer 'article' content, fallback to 'body' if not available
  },
)

// Flow definition for summarizing web content
const summarizeFlow = defineFlow(
  {
    name: 'summarizeFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (url: string) => {
    const llmResponse = await generate({
      prompt: `First, fetch this link: "${url}". Then, summarize the content within 20 words.`,
      model: gpt4o, // Specify the model to use for generation
      tools: [webLoader], // Include the webLoader tool defined earlier for fetching webpage content
      config: {
        temperature: 1, // Set the creativity/variation of the response
      },
    })
    return llmResponse.text()
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
    const answer = await runFlow(summarizeFlow, input) // run the flow to generate an answer
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
    return createReceiver().app(req, res)
  },
)
