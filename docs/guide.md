# Build a Slack Bot App with Firebase Genkit in Just 100 Lines

For engineers who have started learning generative AI, the next challenge is "How do I actually create a practical application?" This Slack bot app is one practical example. Considering that many engineers use Slack in their daily work and are familiar with it as a communication tool, providing an app in the form of a Slack bot is a natural use case for generative AI. And it's all within 100 lines of code!

Details about Firebase Genkit and deploying to Firebase Functions have been explained in previous blog posts, so they will be omitted here.

https://medium.com/@yukinagae/your-first-guide-to-getting-started-with-firebase-genkit-6948d88e8a92
https://medium.com/@yukinagae/deploying-your-firebase-genkit-application-with-firebase-functions-99c7d0044964

In this blog post, I will mainly cover the steps and points to consider when creating a Slack bot app with Firebase Genkit.

Ultimately, you will be able to create an app that responds when you mention the Slack bot, as shown below.

![slack](https://raw.githubusercontent.com/yukinagae/genkit-firebase-functions-slack-bolt-sample/main/docs/slack.png)

For the code and detailed steps, please refer to the following repository.

https://github.com/yukinagae/genkit-firebase-functions-slack-bolt-sample

Please clone the repository locally in advance. By using this code as is, you should be able to create a Slack bot app without any issues.

```bash
$ git clone https://github.com/yukinagae/genkit-firebase-functions-slack-bolt-sample.git
```

## Prerequisites

Ensure the following are installed:

- **Node.js** version 22 or later
- **npm**
- **Genkit**
- **Firebase CLI**
- **ngrok**

Also, make sure to create a Firebase Project in advance. Since we will be using Firebase Functions, don't forget to switch to the Blaze plan (paid).

## Creating a Slack Bot App

Follow these steps to create an app from the Slack management screen.

Access [Slack - Your Apps](https://api.slack.com/apps) and create an app based on a manifest. While you can create it from scratch, using a manifest is easier.

Replace only `[your_app_name]` in the JSON below and copy-paste it. The `"request_url": "http://dummy/events",` part will be replaced later, but for now, it's set to a dummy value, so you can leave it as is.

```json
{
  "display_information": {
    "name": "[your_app_name]"
  },
  "features": {
    "bot_user": {
      "display_name": "[your_app_name]",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "chat:write",
        "files:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "http://dummy/events",
      "bot_events": ["app_mention"]
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": false,
    "token_rotation_enabled": false
  }
}
```

After installing the Slack app in your workspace:

- Find the `Bot User OAuth Token` (located in the left sidebar under `Features -> OAuth & Permissions`). This will be used later as `SLACK_BOT_TOKEN`.
- Find the `Signing Secret` (located in the left sidebar under `Settings -> Basic Information`). This will be used later as `SLACK_SIGNING_SECRET`.

Invite the created Slack app to any channel in the target workspace:

```bash
/invite @[your_app_name]

# For example, if the app name is [`gpt-test`]
/invite @gpt-test
```

## Connecting the Slack Bot App from the Local Emulator

One reason to use Firebase Functions is the convenience of the Emulator for local development. You can efficiently develop by connecting to the Slack app from the Emulator without deploying.

First, replace the secret information in `functions/.secret.local` as needed.

```bash
$ cp -p ./.secret.local.example ./secret.local
$ vim ./secret.local
OPENAI_API_KEY=your_api_key
SLACK_BOT_TOKEN=your_bot_token
SLACK_SIGNING_SECRET=your_signing_secret
```

Now, just start the Emulator.

```bash
$ npm run emulator
✔  functions[us-central1-slack]: http function initialized (http://127.0.0.1:5001/[your_project_name]/us-central1/slack).
```

At this point, it is only running locally and not connected to the Slack app. Use ngrok to port forward the local `5001` to a public URL.

```bash
$ ngrok http 5001
Forwarding https://[your_ngrok_id].ngrok-free.app -> http://localhost:5001
```

`[your_ngrok_id]` will be a random alphanumeric string automatically assigned by ngrok.

Set this public URL `https://[your_ngrok_id].ngrok-free.app` in the Slack management screen to connect the local environment with the Slack app.

Access `Event Subscriptions` in the Slack management screen and enter the following in the `Request URL` field. Wait a moment, and if `Request URL Verified` is displayed, the connection is successful. Save the settings with `Save changes`.

- `https://[your_ngrok_id].ngrok.io/[your_project_name]/us-central1/slack/events`

Let's test it on the Slack channel.

```bash
@[your_app_name] hello
```

If you receive a message reply like the one below, it is successful!

```bash
Hello! How can I assist you today?
```

## Deploying to Firebase Functions

During development, you can experiment using the Emulator and ngrok, but for actual operation, let's deploy to Firebase Functions.

Set the following three secret information in Firebase Functions using the `firebase functions:secrets:set` command.

- OPENAI_API_KEY
- SLACK_BOT_TOKEN
- SLACK_SIGNING_SECRET

Here's how it looks in practice:

```bash
$ firebase functions:secrets:set OPENAI_API_KEY
? Enter a value for OPENAI_API_KEY [input is hidden]
$ firebase functions:secrets:set SLACK_BOT_TOKEN
? Enter a value for SLACK_BOT_TOKEN [input is hidden]
$ firebase functions:secrets:set SLACK_SIGNING_SECRET
```

You can verify the secret information you set using the `functions:secrets:access` command. It's a good idea to double-check for typos or copy-paste errors.

```bash
$ firebase functions:secrets:access OPENAI_API_KEY
your_api_key
$ firebase functions:secrets:access SLACK_BOT_TOKEN
your_bot_token
$ firebase functions:secrets:access SLACK_SIGNING_SECRET
your_signing_secret
```

Now, let's deploy!

```bash
$ npm run deploy
```

Replace the URL of the deployed Firebase Functions with the public URL from ngrok.

In the Slack management screen, change the `Request URL` under `Event Subscriptions` to the following:

- `https://slack-[your_function_id]-uc.a.run.app/events`

You can find `[your_function_id]` in the Firebase Console under `Build -> Functions`.

Let's send a message to the bot on the Slack channel again!

```bash
@[your_app_name] hello
```

![slack](https://raw.githubusercontent.com/yukinagae/genkit-firebase-functions-slack-bolt-sample/main/docs/slack.png)
