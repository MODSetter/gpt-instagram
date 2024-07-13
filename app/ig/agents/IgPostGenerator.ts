// import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { GraphState } from "../GraphConfig";
import {
  AIMessage,
  BaseMessage,
  FunctionMessage,
  HumanMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
// import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AgentExecutor, AgentFinish, AgentStep } from "langchain/agents";

import { zodToJsonSchema } from "zod-to-json-schema";
import { DynamicTool, StructuredTool } from "@langchain/core/tools";
import type { FunctionsAgentAction } from "langchain/agents/openai/output_parser";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";

import { TavilySearchAPIRetriever } from "@langchain/community/retrievers/tavily_search_api";
import { RunnableSequence } from "@langchain/core/runnables";

export class ContentImprover extends StructuredTool {
  schema = z.object({
    postsuggestions: z
      .array(
        z.object({
          postid: z.string().describe("Unique Post Id"),
          imagepromt: z
            .string()
            .describe("Suggested image promt after applying feedback"),
          caption: z
            .string()
            .describe(
              "Suggested Caption without hashtags  after applying feedback",
            ),
          tags: z
            .array(
              z.string().describe("suggested hashtag after applying feedback"),
            )
            .describe(
              "List of all the suggested hashtags after applying feedback",
            ),
        }),
      )
      .describe("List of Instagram Post Suggestions  after applying feedback"),
  });

  name = "ContentImprover";

  description = "Improves Instagram post based on feedback";

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return JSON.stringify(input.postsuggestions);
  }
}

const searchTool = new DynamicTool({
  name: "web-search-tool",
  description: "Tool for getting the latest information from the web",
  func: async (searchQuery: string, runManager) => {
    const retriever = new TavilySearchAPIRetriever({
      searchDepth: "advanced",
    });
    const docs = await retriever.invoke(searchQuery, runManager?.getChild());
    return docs.map((doc) => doc.pageContent).join("\n-----\n");
  },
});

const FeedbackSchema = z.array(
  z.object({
    postid: z.string(),
    imagepromtfeedback: z.string(),
    igcaptionfeedback: z.string(),
    tagsfeedback: z.string(),
  }),
);

const isFeedBackOkay = (critiquefeedback: z.infer<typeof FeedbackSchema>) => {
  let isOkay = true;
  for (const d of critiquefeedback) {
    if (
      d.imagepromtfeedback.toLocaleLowerCase() !== "okay" ||
      d.igcaptionfeedback.toLocaleLowerCase() !== "okay" ||
      d.tagsfeedback.toLocaleLowerCase() !== "okay"
    ) {
      isOkay = false;
    }
  }

  return isOkay;
};

const feedbacktoHumanmessage = (data: z.infer<typeof FeedbackSchema>) => {
  let humanmsg = [];

  for (const d of data) {
    humanmsg.push(
      {
        type: "text",
        text: "============================================================================",
      },
      {
        type: "text",
        text: `POST IMAGE PROMPT FEEDBACK: ${d.imagepromtfeedback}`,
      },
      {
        type: "text",
        text: `POST CAPTION FEEDBACK : ${d.igcaptionfeedback}`,
      },
      {
        type: "text",
        text: `POST IMAGE TAGS FEEDBACK : ${d.tagsfeedback}`,
      },
      {
        type: "text",
        text: "=============================================================================",
      },
    );
  }
  return humanmsg;
};

const ResearchDataSchema = z.array(
  z.object({
    postid: z.string(),
    imagepromt: z.string(),
    caption: z.string(),
    tags: z.array(z.string()),
  }),
);

const mapResearchDatatoHumanmessage = (
  data: z.infer<typeof ResearchDataSchema>,
) => {
  let humanmsg = [];

  for (const d of data) {
    humanmsg.push(
      {
        type: "text",
        text: "============================================================================",
      },
      {
        type: "text",
        text: `POST IMAGE PROMPT : ${d.imagepromt}`,
      },
      {
        type: "text",
        text: `POST CAPTION : ${d.caption}`,
      },
      {
        type: "text",
        text: `POST IMAGE TAGS : 
          ${d.tags.join("\n")}`,
      },
      {
        type: "text",
        text: "=============================================================================",
      },
    );
  }
  return humanmsg;
};

export async function extractPostSuggestions(
  state: GraphState,
): Promise<Partial<GraphState>> {
  const {
    query,
    userimagestyle,
    usertextstyle,
    researcheddata,
    critiquefeedback,
  } = state;

  console.log("In Ig Post Gen");

  if (!researcheddata) {
    console.log("In Ig Post Gen - no res data");
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
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a Social Media Marketing expert with speciality in Instagram Marketing. You are an expert in making viral Instagram Posts.
        `,
      ],
      [
        "human",
        `You are given the detailed Investigative analysis of a person's or suspect's Instagram post's image style and caption text writing style.
        Based on the given user QUERY you must always call one of the provided tools and then generate exactly 6 Instagram post suggestion's.
        Each post suggestion should contain a unique id, caption text without hashtags but with emotes inspired by the person's(also known as suspect) caption text writing style and
        inspired by the person's(also known as suspect) image style a image explanation promt of that caption text suitable for OpenAI Dalle and
        popular hashtags that can be used with post.`,
      ],
      ["human", "QUERY : {input}"],
      SuspectData,
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    //Structured Agent Response
    const responseSchema = z.object({
      postsuggestions: z
        .array(
          z.object({
            postid: z.string().describe("Unique Post Id"),
            imagepromt: z.string().describe("Suggested image promt"),
            caption: z.string().describe("Suggested Caption without hashtags"),
            tags: z
              .array(z.string().describe("suggested hashtag"))
              .describe("List of all the suggested hashtags"),
          }),
        )
        .describe("List of Instagram Post Suggestions"),
    });

    const responseOpenAIFunction = {
      name: "response",
      description: "Return the response to the user",
      parameters: zodToJsonSchema(responseSchema),
    };

    const structuredOutputParser = (
      message: AIMessage,
    ): FunctionsAgentAction | AgentFinish => {
      if (message.content && typeof message.content !== "string") {
        throw new Error("This agent cannot parse non-string model responses.");
      }
      if (message.additional_kwargs.function_call) {
        const { function_call } = message.additional_kwargs;
        try {
          const toolInput = function_call.arguments
            ? JSON.parse(function_call.arguments)
            : {};
          // If the function call name is `response` then we know it's used our final
          // response function and can return an instance of `AgentFinish`
          if (function_call.name === "response") {
            return { returnValues: { ...toolInput }, log: message.content };
          }
          return {
            tool: function_call.name,
            toolInput,
            log: `Invoking "${function_call.name}" with ${
              function_call.arguments ?? "{}"
            }\n${message.content}`,
            messageLog: [message],
          };
        } catch (error) {
          throw new Error(
            `Failed to parse function arguments from chat model response. Text: "${function_call.arguments}". ${error}`,
          );
        }
      } else {
        return {
          returnValues: { output: message.content },
          log: message.content,
        };
      }
    };

    const formatAgentSteps = (steps: AgentStep[]): BaseMessage[] =>
      steps.flatMap(({ action, observation }) => {
        if ("messageLog" in action && action.messageLog !== undefined) {
          const log = action.messageLog as BaseMessage[];
          return log.concat(new FunctionMessage(observation, action.tool));
        } else {
          return [new AIMessage(action.log)];
        }
      });

    const llm = new ChatOpenAI({
      model: "gpt-4o",
    });

    const llmWithTools = llm.bind({
      functions: [convertToOpenAIFunction(searchTool), responseOpenAIFunction],
    });

    /** Create the runnable */
    const runnableAgent = RunnableSequence.from<{
      input: string;
      steps: Array<AgentStep>;
    }>(
      // @ts-ignore
      [
        {
          input: (i) => i.input,
          agent_scratchpad: (i) => formatAgentSteps(i.steps),
        },
        prompt,
        llmWithTools,
        structuredOutputParser,
      ],
    );

    const executor = AgentExecutor.fromAgentAndTools({
      // @ts-ignore
      agent: runnableAgent,
      // @ts-ignore
      tools: [searchTool],
    });

    /** Call invoke on the agent */
    const res = await executor.invoke({
      input: query,
    });

    return {
      researcheddata: JSON.stringify(res["postsuggestions"]),
    };
  }
  // ALWARYS TRUE
  if (critiquefeedback) {
    const feedback = isFeedBackOkay(JSON.parse(critiquefeedback));

    if (!feedback) {
      const resdata = mapResearchDatatoHumanmessage(JSON.parse(researcheddata));
      const critdata = feedbacktoHumanmessage(JSON.parse(critiquefeedback));

      const postswithcrit = new HumanMessage({
        content: [
          {
            type: "text",
            text: "USER INSTAGRAM POST'S : ",
          },
          ...resdata,
          {
            type: "text",
            text: "OTHER EXPERT SUGGESTIONS : ",
          },
          ...critdata,
        ],
      });

      const prompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          `You are a Social Media Content Marketing expert with speciality in Instagram Marketing plus you have phd in English Litrature.`,
        ],
        [
          "human",
          `You are given the task to apply the feedback received from another Social Media Content Marketing expert to improve the respective user Instagram posts.
          Each post given in user instagram posts contains a caption text, image promt for Openai Dalle related to caption text and viral tags related to it.
          Apply the expert feedback respective to each post. If the feedback provided is "okay" do not change the image promt,caption or tags. If feedback is not "okay"
          then apply the feedback to improve.`,
        ],
        postswithcrit,
      ]);

      const tool = new ContentImprover();
      const model = new ChatOpenAI({
        model: "gpt-4o",
      });

      const modelWithTools = model.withStructuredOutput(tool);
      // @ts-ignore
      const chain = prompt.pipe(modelWithTools).pipe(tool);

      const response = await chain.invoke({});
      const res: z.infer<typeof FeedbackSchema> = JSON.parse(response);

      return {
        researcheddata: JSON.stringify(res),
      };
    } else {
      //Feedback is Okay END
      return {};
    }
  }

  return {};
}

// AGENT TESTER CODE
// export async function testerFunc() {
//   const SuspectData = new HumanMessage({
//     content: [
//       {
//         type: "text",
//         text: "==========================================================================",
//       },
//       {
//         type: "text",
//         text: "PERSON or SUSPECT INSTAGRAM Investigative analysis: ",
//       },
//       {
//         type: "text",
//         text: `PERSON or SUSPECT Instagram's post's image style: The analysis of the suspect's Instagram images reveals a variety of preferences and personality traits. The suspect enjoys capturing scenic landscapes, particularly those involving friends, suggesting an appreciation for natural beauty and social interaction. There is a notable affection for travel and family moments, especially in picturesque settings such as a scenic European city. Additionally, the suspect seems to favor images that portray a sense of fun and spontaneity, including playful struggles, candid group selfies, and humorous encounters. The presence of edgy and gritty urban aesthetics in some posts indicates an interest in raw, unpolished settings. Fashion and personal style also play a significant role in the suspect's imagery, with sharp outfits and introspective close-ups suggesting a flair for stylish and moody photography. Fitness and self-improvement are also highlighted, as seen in gym selfies and supportive captions regarding workout experiences.`,
//       },
//       {
//         type: "text",
//         text: `PERSON or SUSPECT Instagram's post's caption text writing style: The suspect's Instagram captions reveal a multifaceted personality characterized by humor, informality, and a penchant for playful and witty commentary. Minimalist captions, such as simple emojis or short jokes, suggest a focus on the visual impact of the images rather than detailed descriptions. The suspect often employs self-deprecating humor and lighthearted teasing, indicating a humble and unpretentious demeanor. There is a notable appreciation for creative activities and a sense of nostalgia in reflective posts about past memories. The captions suggest a sociable individual who values friendships and family, often highlighting shared experiences and inside jokes. The playful use of language and creative captions further illustrate a person who enjoys engaging with their audience in a casual and entertaining manner.`,
//       },
//       {
//         type: "text",
//         text: "==========================================================================",
//       },
//     ],
//   });

//   const prompt = ChatPromptTemplate.fromMessages([
//     [
//       "system",
//       `You are a Social Media Marketing expert with speciality in Instagram Marketing. You are an expert in making viral Instagram Posts.
//       `,
//     ],
//     [
//       "human",
//       `You are given the detailed Investigative analysis of a person's or suspect's Instagram post's image style and caption text writing style.
//       Based on the given user QUERY you must always call one of the provided tools and then generate highly relevant exact 6 Instagram post suggestion's.
//       Each post suggestion should contain a unique id, caption text without hashtags but with emotes inspired little bit by the person's(also known as suspect) caption text writing style and
//       a image explanation promt of that caption text suitable for OpenAI Dalle inspired little bit by the person's(also known as suspect) image style  and
//       popular hashtags that can be used with post.`,
//     ],
//     ["human", "QUERY : {input}"],
//     SuspectData,
//     new MessagesPlaceholder("agent_scratchpad"),
//   ]);

//   const responseSchema = z.object({
//     postsuggestions: z
//       .array(
//         z.object({
//           postid: z.string().describe("Unique Post Id"),
//           imagepromt: z.string().describe("Suggested image promt"),
//           caption: z.string().describe("Suggested Caption without hashtags"),
//           tags: z
//             .array(z.string().describe("suggested hashtag"))
//             .describe("List of all the suggested hashtags"),
//         }),
//       )
//       .describe("List of Instagram Post Suggestions"),
//   });

//   const responseOpenAIFunction = {
//     name: "response",
//     description: "Return the response to the user",
//     parameters: zodToJsonSchema(responseSchema),
//   };

//   const structuredOutputParser = (
//     message: AIMessage,
//   ): FunctionsAgentAction | AgentFinish => {
//     if (message.content && typeof message.content !== "string") {
//       throw new Error("This agent cannot parse non-string model responses.");
//     }
//     if (message.additional_kwargs.function_call) {
//       const { function_call } = message.additional_kwargs;
//       try {
//         const toolInput = function_call.arguments
//           ? JSON.parse(function_call.arguments)
//           : {};
//         // If the function call name is `response` then we know it's used our final
//         // response function and can return an instance of `AgentFinish`
//         if (function_call.name === "response") {
//           return { returnValues: { ...toolInput }, log: message.content };
//         }
//         return {
//           tool: function_call.name,
//           toolInput,
//           log: `Invoking "${function_call.name}" with ${
//             function_call.arguments ?? "{}"
//           }\n${message.content}`,
//           messageLog: [message],
//         };
//       } catch (error) {
//         throw new Error(
//           `Failed to parse function arguments from chat model response. Text: "${function_call.arguments}". ${error}`,
//         );
//       }
//     } else {
//       return {
//         returnValues: { output: message.content },
//         log: message.content,
//       };
//     }
//   };

//   const formatAgentSteps = (steps: AgentStep[]): BaseMessage[] =>
//     steps.flatMap(({ action, observation }) => {
//       if ("messageLog" in action && action.messageLog !== undefined) {
//         const log = action.messageLog as BaseMessage[];
//         return log.concat(new FunctionMessage(observation, action.tool));
//       } else {
//         return [new AIMessage(action.log)];
//       }
//     });

//   const llm = new ChatOpenAI({
//     model: "gpt-4o",
//   });

//   const llmWithTools = llm.bind({
//     functions: [convertToOpenAIFunction(searchTool), responseOpenAIFunction],
//   });
//   /** Create the runnable */

//   const runnableAgent = RunnableSequence.from<{
//     input: string;
//     steps: Array<AgentStep>;
//   }>(
//     // @ts-ignore
//     [
//       {
//         input: (i) => i.input,
//         agent_scratchpad: (i) => formatAgentSteps(i.steps),
//       },
//       prompt,
//       llmWithTools,
//       structuredOutputParser,
//     ],
//   );
//   // @ts-ignore
//   const executor = AgentExecutor.fromAgentAndTools({
//     // @ts-ignore
//     agent: runnableAgent,
//     // @ts-ignore
//     tools: [searchTool],
//   });
//   /** Call invoke on the agent */
//   const res = await executor.invoke({
//     input: "US Elections Candidates",
//   });

//   // const resjson = await res.json();
//   // console.log("Res",JSON.stringify(res))
//   console.log("Res", res["postsuggestions"]);

//   // const tools = [searchTool];
//   // const model = new ChatOpenAI({
//   //   model: "gpt-4o",
//   // });

//   // const modelWithTools = model.withStructuredOutput(igExpTool)

//   // const agent = await createOpenAIFunctionsAgent({
//   //   // @ts-ignore
//   //   llm: model,
//   //     // @ts-ignore
//   //   tools,
//   //     // @ts-ignore
//   //   prompt,
//   // });

//   // const agentExecutor = new AgentExecutor({
//   //   agent,
//   //     // @ts-ignore
//   //   tools,
//   // });

//   // // const chain = prompt.pipe(searchTool).pipe(tool);

//   // const result = await agentExecutor.invoke({
//   //   input: "US Elections",
//   // });

//   // console.log("Suggester Tester", result)
// }
