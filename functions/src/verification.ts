import * as crypto from 'node:crypto'
import type { Request } from 'firebase-functions/lib/v2/providers/https'

/**
 * Verify the signature of the incoming request from Slack
 * see: [slack api - Verifying requests from Slack](https://api.slack.com/authentication/verifying-requests-from-slack)
 * see: https://github.com/howdyai/botkit/blob/main/packages/botbuilder-adapter-slack/src/slack_adapter.ts#L469
 * @param req
 * @param res
 * @returns
 */
function verifySignature(req: Request, clientSigningSecret: string): boolean {
  const timestamp = req.header('X-Slack-Request-Timestamp')
  const body = req.rawBody

  const signature = [
    'v0',
    timestamp, // slack request timestamp
    body, // request body
  ]
  const basestring = signature.join(':')

  const hash = `v0=${crypto
    .createHmac('sha256', clientSigningSecret)
    .update(basestring)
    .digest('hex')}`
  const retrievedSignature = req.header('X-Slack-Signature') || ''

  // Compare the hash of the computed signature with the retrieved signature with a secure hmac compare function
  const validSignature = (): boolean => {
    const slackSigBuffer = Buffer.from(retrievedSignature)
    const compSigBuffer = Buffer.from(hash)

    return crypto.timingSafeEqual(slackSigBuffer, compSigBuffer)
  }

  return validSignature()
}

export { verifySignature }
