
# GPT-INSTAGRAM

A GPT-based autonomous multi-agent AI app using Next.js, LangChain.js, and LangGraph.js to research and recommend Instagram posts based on user queries and personalities extracted from user’s historical Instagram data via Instagram Basic Display API.


## Video

https://github.com/user-attachments/assets/ac1850e2-0119-4531-9f9c-2422ac40f48d

## INITIAL SETUP

1. Since GPT-Instagram works with your historical Instagram Posts
    Information to extract your style you need to follow this guide to
    get your Instagram Access Token to extract data via Instagram Basic
    Display API.

Follow these guide to setup your Facebook App to get access to Instagram Basic Display API.

 - https://www.youtube.com/watch?v=Wn5ur1PYfio

You can generate Your token from facebook app dashboard at now at 'Instagram Basic Display > Basic Display'. It should look something like this.

![token](https://github.com/user-attachments/assets/bb7f29e6-6a2f-4fa7-bb6b-6fe6de252529)

Click on 'Generate Token' to get your IG Access Token.


2. Get your OpenAI API key from https://openai.com/index/openai-api/
3. Get your Tavily Search API key from https://tavily.com/#api
4. Fill in your `.env`  file. `env.example` explains it pretty well.

| KEY | DESCRIPTION |
|--|--|
| OPENAI_API_KEY | Your OpenAI API key from https://openai.com/index/openai-api/  |
| TAVILY_API_KEY| Tavily Search API key from https://tavily.com/#api |
| DATABASE_URL| Postgres DB URL  |
| IG_ACCESS_TOKEN| Your Instagram Access Token |
| NEXT_PUBLIC_BASE_URL| Deployment URL(only https to work with Instagram API) |



5. Since GPT-Instagram uses Drizzle ORM make sure to run `yarn generate` & `yarn migrate` before you run the project to create your DB.

6. Finally run `yarn dev` to run the Application.

