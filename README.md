# F1GPT - AI Chatbot

F1GPT is a conversational AI chatbot built with Next.js and powered by the OpenAI API. It provides a modern, responsive interface for natural language interactions while leveraging advanced AI capabilities.

## Credit
This project was built following the tutorial Build a Full Stack AI Chatbot with Next js, LangChain, Astra DB, OpenAI APIs (2024) by Code With Antonio.
https://youtu.be/d-VKYF4Zow0?si=zsvfKV_dz1E7TaWs

## Features

- 🤖 AI-powered conversations using OpenAI
- ⚡️ Fast and responsive Next.js frontend 
- 🔄 Modular AI workflows with LangChain
- 💾 Persistent storage with Astra DB
- 🔍 Browser automation via Puppeteer
- 📱 Mobile-friendly responsive design
- 💪 Type-safe with TypeScript

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [React](https://react.dev) - UI library
- [OpenAI API](https://platform.openai.com) - AI/ML capabilities  
- [LangChain](https://js.langchain.com) - AI workflow automation
- [Astra DB](https://www.npmjs.com/package/@datastax/astra-db-ts) - Database
- [TypeScript](https://typescriptlang.org) - Type safety
- [Puppeteer](https://pptr.dev) - Browser automation
- [Vercel](https://vercel.com) - Deployment

## Getting Started

First, install the dependencies:

```bash
npm install
```

Create .env file at the same level with package.json and update the credential, these are the parameters:
ASTRA_DB_NAMESPACE = "your_namespace"
ASTRA_DB_COLLECTION = "your_db_name"
ASTRA_DB_API_ENDPOINT = "your_db_api_endpoint"
ASTRA_DB_APPLICATION_TOKEN = "your_db_token"
OPENAI_API_KEY = "your_openai_api_key


Run the script, but notice that the script is not efficient yet to scrape good data
for our prompt questions. Will need to optimized it to make the chatbot functional.
However, we have working prototype currently and the loadDb.ts will be updated.
P.S. Running current script will cost 0.02 $usd (by Dec 11, 2024)

```bash
npm run seed
```

Then, run the server:

```bash
npm run dev
```

for future production: 
```bash
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

```bash
dev - Start development server
build - Build for production
start - Start production server
lint - Run linter
seed - Seed database
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

## License
MIT License

Copyright (c) 2024 F1GPT

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.