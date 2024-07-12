import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { GraphState } from "../GraphConfig";
import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";

const ResSchema = z.object({
  userimagestyle: z.string(),
  usertextstyle: z.string(),
});

export class ExtractIgPostSuggestions extends StructuredTool {
  schema = z.object({
    postSuggestions: z.array(
      z.object({
        imagepromt: z.string().describe("Suggested image promt"),
        caption: z.string().describe("Suggested Caption"),
        tags: z.array(
          z.string()
          .describe("suggested hashtag")
        )
        .describe("List of all the suggested hashtags")
      })
    ),
  });

  name = "ExtractIgPostSuggestions";

  description =
    "Given a PERSON or SUSPECT INSTAGRAM Investigative analysis of images and caption texts, do a detailed investigative work on these.";

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return JSON.stringify(input.postSuggestions);
  }
}

export async function extractPostSuggestions(
  state: GraphState,
): Promise<Partial<GraphState>> {
  const { query, userimagestyle, usertextstyle } = state;

  if (!userimagestyle || !usertextstyle) {
    throw new Error("ExplanationCondenser Agent Failed");
  }

  const SuspectData = new HumanMessage({
    content: [
      {
        type: "text",
        text: "==========================================================================",
      },
      {
        type: "text",
        text: "PERSON or SUSPECT INSTAGRAM Investigative analysis: ",
      },
      {
        type: "text",
        text: `PERSON or SUSPECT Instagram's post's image style: ${userimagestyle}`,
      },
      {
        type: "text",
        text: `PERSON or SUSPECT Instagram's post's caption text writing style: ${usertextstyle}`,
      },
      {
        type: "text",
        text: "==========================================================================",
      },
    ],
  });
  
  // Tools
  const searchTool = new TavilySearchResults();
  const igExpTool = new ExtractIgPostSuggestions();
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a Social Media Marketing expert with speciality in Instagram Marketing. You are an expert in making viral Instagram Posts.
      You are given the detailed Investigative analysis of a person's(also known as suspect in details) Instagram's post's image style and caption text writing style.
      After researching on the given user topic you need to generate exactly 6 Instagram post suggestion's.
      Each post suggestion should contain a caption text inspired by the person's(also known as suspect) caption text writing style,
      a image explanation promt of that caption text suitable for OpenAI Dalle, inspired by the person's(also known as suspect) image style and
      popular hashtags that can be used with post.
      `,
    ],
    SuspectData,
    ["human", "TOPIC TO RESEARCH : {input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const tools = [searchTool,igExpTool];
  const model = new ChatOpenAI({
    model: "gpt-4o",
  });

  const agent = await createOpenAIFunctionsAgent({
    llm: model,
      // @ts-ignore
    tools,
      // @ts-ignore
    prompt,
  });
  
  const agentExecutor = new AgentExecutor({
    agent,
      // @ts-ignore
    tools,
  });
  
  const result = await agentExecutor.invoke({
    input: query,
  });

  // const suggestions: string = JSON.parse(result);

  return {
    researcheddata: "",
  };
}

// AGENT TESTER CODE
export async function testerFunc(){

  const SuspectData = new HumanMessage({
    content: [
      {
        type: "text",
        text: "==========================================================================",
      },
      {
        type: "text",
        text: "PERSON or SUSPECT INSTAGRAM Investigative analysis: ",
      },
      {
        type: "text",
        text: `PERSON or SUSPECT Instagram's post's image style: The analysis of the suspect's Instagram images reveals a variety of preferences and personality traits. The suspect enjoys capturing scenic landscapes, particularly those involving friends, suggesting an appreciation for natural beauty and social interaction. There is a notable affection for travel and family moments, especially in picturesque settings such as a scenic European city. Additionally, the suspect seems to favor images that portray a sense of fun and spontaneity, including playful struggles, candid group selfies, and humorous encounters. The presence of edgy and gritty urban aesthetics in some posts indicates an interest in raw, unpolished settings. Fashion and personal style also play a significant role in the suspect's imagery, with sharp outfits and introspective close-ups suggesting a flair for stylish and moody photography. Fitness and self-improvement are also highlighted, as seen in gym selfies and supportive captions regarding workout experiences.`,
      },
      {
        type: "text",
        text: `PERSON or SUSPECT Instagram's post's caption text writing style: The suspect's Instagram captions reveal a multifaceted personality characterized by humor, informality, and a penchant for playful and witty commentary. Minimalist captions, such as simple emojis or short jokes, suggest a focus on the visual impact of the images rather than detailed descriptions. The suspect often employs self-deprecating humor and lighthearted teasing, indicating a humble and unpretentious demeanor. There is a notable appreciation for creative activities and a sense of nostalgia in reflective posts about past memories. The captions suggest a sociable individual who values friendships and family, often highlighting shared experiences and inside jokes. The playful use of language and creative captions further illustrate a person who enjoys engaging with their audience in a casual and entertaining manner.`,
      },
      {
        type: "text",
        text: "==========================================================================",
      },
    ],
  });
  
  // Tools
  const searchTool = new TavilySearchResults({maxResults: 10});
  const igExpTool = new ExtractIgPostSuggestions();
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a Social Media Marketing expert with speciality in Instagram Marketing. You are an expert in making viral Instagram Posts.
      You are given the detailed Investigative analysis of a person's(also known as suspect in details) Instagram's post's image style and caption text writing style.
      After researching on the given user topic you need to generate exactly 6 Instagram post suggestion's.
      Each post suggestion should contain a caption text inspired by the person's(also known as suspect) caption text writing style,
      a image explanation promt of that caption text suitable for OpenAI Dalle, inspired by the person's(also known as suspect) image style and
      popular hashtags that can be used with post.
      `,
    ],
    SuspectData,
    ["human", "TOPIC TO RESEARCH : {input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const tools = [searchTool];
  const model = new ChatOpenAI({
    model: "gpt-4o",
  });

  // const modelWithTools = model.withStructuredOutput(igExpTool)

  const agent = await createOpenAIFunctionsAgent({
    // @ts-ignore
    llm: model,
      // @ts-ignore
    tools,
      // @ts-ignore
    prompt,
  });
  
  const agentExecutor = new AgentExecutor({
    agent,
      // @ts-ignore
    tools,
  });

  // const chain = prompt.pipe(searchTool).pipe(tool);
  
  const result = await agentExecutor.invoke({
    input: "US Elections",
  });

  console.log("Suggester Tester", result)

}
