# 100 行で作る Firebase Genkit の Slack ボットアプリ

生成 AI を学び始めたエンジニアにとって、次の課題は「実際にどうやって実用的なアプリを作るか？」だと思います。今回のテーマの Slack ボットアプリはその 1 つの実用例です。多くのエンジニアが Slack を普段の仕事で使っており、コミュニケーションツールとして慣れ親しんでいることを考えると、Slack ボットという形態でアプリを提供することは生成 AI の用途として自然なものです。しかも、100 行以内で！

Firebase Genkit の説明や Firebase Functions へのデプロイなどは以前のブログで詳細に説明しているので、今回は省略します。

https://medium.com/@yukinagae/your-first-guide-to-getting-started-with-firebase-genkit-6948d88e8a92
https://medium.com/@yukinagae/deploying-your-firebase-genkit-application-with-firebase-functions-99c7d0044964

今回のブログ記事では、主に Firebase Genkit で Slack ボットアプリを作る際の手順や注意点について書きます。

最終的には以下のように、slack ボットにメンションすると回答してくれるアプリが作れます。

![slack](https://raw.githubusercontent.com/yukinagae/genkit-firebase-functions-slack-bolt-sample/main/docs/slack.png)

コードや詳細手順は以下のレポジトリを見てください。

https://github.com/yukinagae/genkit-firebase-functions-slack-bolt-sample

事前にローカルに git clone しておいてください。このコードをそのまま使えばハマることなく Slack ボットアプリが作れるはずです。

```bash
$ git clone https://github.com/yukinagae/genkit-firebase-functions-slack-bolt-sample.git
```

## 事前セットアップ

以下がインストールされていることを前提としています。

- **Node.js** version 22 or later
- **npm**
- **Genkit**
- **Firebase CLI**
- **ngrok**

また、事前に Firebase Project を作っておいてください。Firebase Functions を使うので、Blaze プラン（有料）に変更しておくのも忘れずに。

## Slack ボットアプリを作る

以下の手順で Slack の管理画面からアプリを作ります。

[Slack - Your Apps](https://api.slack.com/apps) にアクセスし、 manifest ベースでアプリを作ります。もちろん、スクラッチからでも作れますが、manifest から作るのが楽です。

以下の JSON の `[your_app_name]` のみを置き換えて、それをコピペするだけで作れます。`"request_url": "http://dummy/events",` 部分は後で置き換えますが、初期値としてダミーを設定しているので、このままで大丈夫です。

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

あなたのワークスペースに Slack アプリをインストールしたあとに

- `Bot User OAuth Token`（左サイドバーの `Features -> OAuth & Permissions` にあります）※後の手順の `SLACK_BOT_TOKEN` として使います。
- `Signing Secret`（左サイドバーの `Settings -> Basic Information` にあります）※後の手順の `SLACK_SIGNING_SECRET` として使います。

作成した Slack アプリを対象のワークスペース内の任意のチャンネルに招待しておきます。

```bash
/invite @[your_app_name]

# アプリ名が `gpt-test` の場合
/invite @gpt-test
```

## ローカル Emulator から Slack ボットアプリに接続

Firebase Functions を使う一つの理由は、Emulator がローカル開発に便利だからです。わざわざデプロイしなくても、Emulator から Slack アプリと接続することで効率的に開発することができます。

まずは `functions/.secret.local` の秘密情報を適宜置き換えてください。

```bash
$ cp -p ./.secret.local.example ./secret.local
$ vim ./secret.local
OPENAI_API_KEY=your_api_key
SLACK_BOT_TOKEN=your_bot_token
SLACK_SIGNING_SECRET=your_signing_secret
```

あとは Emulator を起動するだけです。

```bash
$ npm run emulator
✔  functions[us-central1-slack]: http function initialized (http://127.0.0.1:5001/[your_project_name]/us-central1/slack).
```

このままだとローカルで起動しているだけで、Slack アプリとは接続されていません。ngrok でローカルの `5001` を公開 URL にポートフォワードします。

```bash
$ ngrok http 5001
Forwarding https://[your_ngrok_id].ngrok-free.app -> http://localhost:5001
```

`[your_ngrok_id]` は実際には ngrok が自動的に割り振ったランダムな英数字になっているはずです。

この公開 URL `https://[your_ngrok_id].ngrok-free.app` を Slack の管理画面から設定して、ローカルと Slack アプリを接続します。

Slack 管理画面の `Event Subscriptions` にアクセスし、`Request URL` に以下のように入力します。少し待って、 `Request URL Verified` と表示されれば接続が成功です。`Save changes` で設定を保存しましょう。

- `https://[your_ngrok_id].ngrok.io/[your_project_name]/us-central1/slack/events`

早速 Slack チャンネル上でテストしてみましょう。

```bash
@[your_app_name] hello
```

以下のようにメッセージ返信があれば成功です！

```text
Hello! How can I assist you today?
```

## Firebas Functions にデプロイ

開発時には Emulator と ngrok を使い試行錯誤しますが、実際に運用する際には Firebase Functions にデプロイしてみましょう。

以下 3 つの秘密情報については、それぞれ `firebase functions:secrets:set` コマンドを使って Firebase Functions に設定します。

- OPENAI_API_KEY
- SLACK_BOT_TOKEN
- SLACK_SIGNING_SECRET

実際にはこんな感じです。

```bash
$ firebase functions:secrets:set OPENAI_API_KEY
? Enter a value for OPENAI_API_KEY [input is hidden]
$ firebase functions:secrets:set SLACK_BOT_TOKEN
? Enter a value for SLACK_BOT_TOKEN [input is hidden]
$ firebase functions:secrets:set SLACK_SIGNING_SECRET
```

設定した秘密情報は以下のように `functions:secrets:access` コマンドで確認できます。タイポしたり、コピペミスなどもあり得るので、念の為確認しておくとよいでしょう。

```bash
$ firebase functions:secrets:access OPENAI_API_KEY
your_api_key
$ firebase functions:secrets:access SLACK_BOT_TOKEN
your_bot_token
$ firebase functions:secrets:access SLACK_SIGNING_SECRET
your_signing_secret
```

では、デプロイしてみましょう！

```bash
$ npm run deploy
```

デプロイした Firebase Functions の URL と、先程の ngrok の公開 URL を置き換えます。

Slack 管理画面から `Event Subscriptions` の `Request URL` を変更することは一緒ですが、その値を以下のように設定します。

- `https://slack-[your_function_id]-uc.a.run.app/events`

`[your_function_id]` は Firebase 管理画面の `Build -> Functions` から確認できます。

再度 Slack チャンネル上でボットにメッセージを送ってみましょう！

```bash
@[your_app_name] hello
```

![slack](https://raw.githubusercontent.com/yukinagae/genkit-firebase-functions-slack-bolt-sample/main/docs/slack.png)
