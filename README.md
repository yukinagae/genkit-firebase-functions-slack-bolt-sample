# genkit-firebase-functions-slack-bolt-sample

`genkit-firebase-functions-slack-bolt-sample` serves as an introductory guide to Firebase Genkit, an innovative open-source framework designed to empower developers in building AI-driven applications. This example project provides a comprehensive walkthrough on leveraging Genkit, alongside demonstrating the integration of Firebase Functions with a Slack Bolt application.

- [Requirements](#requirements)
- [Setup](#setup)
- [Usage](#usage)
- [Making Changes](#making-changes)
- [License](#license)

## Requirements

Before you start, make sure you have these installed:

- **Node.js** version 22 or later
- **npm**
- **Genkit**
- **Firebase CLI**

For Genkit installation, see the [Firebase Genkit - Get started](https://firebase.google.com/docs/genkit/get-started).
For Firebase CLI installation, see the [Firebase - Firebase CLI reference](https://firebase.google.com/docs/cli).

Check your installations by running:

```bash
$ node --version # the below version is on my environment
v22.4.1
$ npm --version # the below version is on my environment
10.7.0
$ genkit --version # the below version is on my environment
0.5.4
$ firebase --version # the below version is on my environment
13.13.0
```

**Important**: Ensure all subsequent commands are executed within the `functions` directory. To navigate to this directory, use the command `cd functions` and verify your current working directory if necessary.

## Setup

Install Project Dependencies: Open your terminal, navigate to this project's `functions` folder, and run:

```bash
$ npm install
```

## Usage

### Running Genkit Locally

Before running the project locally, you need to provide your OpenAI API key. This key allows your application to communicate with OpenAI's services. Replace `your_api_key` with the actual API key you obtained from OpenAI.

```bash
$ export OPENAI_API_KEY=your_api_key
```

To start the Genkit server on your local machine and automatically open your default web browser to http://localhost:4000, execute the following command in your terminal:

```bash
$ npm run genkit
```

### Firebase Functions Quickstart

- **Setup**: Initialize your project with Firebase.
- **Local Emulator**: Test functions locally.
- **Deploy**: Publish your functions.

#### Setup

Before deploying your application, complete the following preparatory steps:

1. **Create a Firebase project**:

Navigate to the Firebase Console. Click on `Create a project` and follow the prompts to create a new Firebase project.

2. **Switch to the Blaze plan**:

Firebase Functions require the `Blaze (Pay as you go) plan` for deployment. In the Firebase Console, select your project, then navigate to the left side bar section to change your plan.

3. **Configure your Firebase project locally**:

Update the .firebaserc file in your project's root directory to include your Firebase project name:

```json
{
  "projects": {
    "default": "your_project_name"
  }
}
```

#### Local Emulator

To facilitate local development and testing of Firebase Functions, use the Firebase Emulator Suite. Follow these steps to run your functions locally:

To run Firebase Functions locally using the emulator, set your OpenAI API key as an environment variable and start the emulator:

TODO: `functions/.secret.local`

```bash
$ npm run emulator
```

TODO: slack integration

#### Deploy

To authenticate with Firebase and access your projects, use the Firebase CLI login command:

```bash
$ firebase login
```

To keep your OpenAI API key safe when using Firebase Functions, store it as a secret in GCP Secret Manger:

```bash
$ firebase functions:secrets:set OPENAI_API_KEY
? Enter a value for OPENAI_API_KEY [input is hidden]
$ firebase functions:secrets:set SLACK_BOT_TOKEN
? Enter a value for SLACK_BOT_TOKEN [input is hidden]
$ firebase functions:secrets:set SLACK_SIGNING_SECRET
? Enter a value for SLACK_SIGNING_SECRET [input is hidden]
```

To confirm your OpenAI API key is correctly stored as a secret, use the following command:

```bash
$ firebase functions:secrets:access OPENAI_API_KEY
your_api_key
$ firebase functions:secrets:access SLACK_BOT_TOKEN
your_bot_token
$ firebase functions:secrets:access SLACK_SIGNING_SECRET
your_signing_secret
```

After securing your API key, you're ready to deploy your application to Firebase Functions:

```bash
$ npm run deploy
```

To monitor the behavior and troubleshoot your deployed functions, view the logs:

```bash
$ npm run logs
```

TODO: slack integration

## Making Changes

### Building the Project

After making changes, you might need to build the project to see your changes in action:

```bash
$ npm run build
```

### Formatting and Linting

To ensure your code follows the project's coding standards, run the formatting and linting tools:

```bash
$ npm run typecheck # type check without modifying files
$ npm run check     # scan without modifying files
$ npm run fix       # modify files
```

## License

MIT
