import { AIMessage, BaseMessage, FunctionMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
import { ChatOpenAI } from "@langchain/openai";
import { AgentFinish, AgentStep } from "langchain/agents";
import { FunctionsAgentAction } from "langchain/agents/openai/output_parser";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { IGApiResponse, IgExplainedData, ImageGenSchema, ResearchedDataSchema } from "./DataTypes";
import { ExtractExplainedDataExplanation, mapExplainedDatatoHumanmessage, ResSchema } from "./agents/ExplanationCondenser";
import { ExtractIgDataExplanation } from "./agents/DataExplainer";
import { searchTool } from "./agents/IgPostGenerator";
import { feedbackschema, mapDatatoHumanmessage, ViralCritiquer } from "./agents/ViralCritique";
import { tool } from "./agents/ImageGenerator";

// igPostGen AGENT TESTER CODE
export async function igPostGentesterFunc() {
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

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a Social Media Marketing expert with speciality in Instagram Marketing. You are an expert in making viral Instagram Posts.
      `,
    ],
    [
      "human",
      `You are given the detailed Investigative analysis of a person's or suspect's Instagram post's image style and caption text writing style.
      Based on the given user QUERY you must always call one of the provided tools and then generate highly relevant exact 6 Instagram post suggestion's.
      Each post suggestion should contain a unique id, caption text without hashtags but with emotes inspired little bit by the person's(also known as suspect) caption text writing style and
      a image explanation promt of that caption text suitable for OpenAI Dalle inspired little bit by the person's(also known as suspect) image style  and
      popular hashtags that can be used with post.`,
    ],
    ["human", "QUERY : {input}"],
    SuspectData,
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

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
  // @ts-ignore
  const executor = AgentExecutor.fromAgentAndTools({
    // @ts-ignore
    agent: runnableAgent,
    // @ts-ignore
    tools: [searchTool],
  });
  /** Call invoke on the agent */
  const res = await executor.invoke({
    input: "US Elections Candidates",
  });

  // const resjson = await res.json();
  // console.log("Res",JSON.stringify(res))
  console.log("Res", res["postsuggestions"]);
}


// explanation Cond AGENT TESTER CODE
export async function expCondtesterFunc() {
  const explaineddataraw: IgExplainedData[] = JSON.parse(`[
   {
      "mediaid":"17992164176429557",
      "userimagestyle":"The suspect appears to enjoy capturing scenic moments with friends. The image displays a serene landscape of a lake at sunset with the suspect and two friends smiling and posing, suggesting a preference for natural beauty and companionship in photos.",
      "usertextstyle":"The caption is a simple smiley emoticon, reflecting a lighthearted and happy moment without the need for elaborate words. The suspect's use of minimal text suggests a focus on the image itself to convey the mood."
   },
   {
      "mediaid":"18132923389151815",
      "userimagestyle":"The suspect seems interested in fashion and personal style, as evidenced by a photo of the suspect dressed in a sharp suit, complete with accessories like bow tie and red sunglasses. This suggests a liking for classy and perhaps extravagant imagery.",
      "usertextstyle":"The caption is humorous and self-deprecating, referring to the suspect as a 'Sasta Chinese Tony Stark,' which translates to a 'cheap Chinese Tony Stark.' The informal and playful tone of the caption indicates a sense of humor and a lack of self-seriousness."
   },
   {
      "mediaid":"17969910415188674",
      "userimagestyle":"The suspect captures edgy and gritty moments with friends, as shown by an image against a graffiti-laden wall with the suspects striking relaxed and cool poses. The image suggests a liking for raw, urban aesthetics.",
      "usertextstyle":"The caption suggests the suspect is providing advice with a playful twist, presenting a 'pro tip' with an ambiguous meaning and a subtle innuendo. This indicates a playful and cryptic style of writing."
   },
   {
      "mediaid":"17964673582164590",
      "userimagestyle":"The suspect enjoys capturing fun moments with friends, particularly outdoors. The photo displays a group of friends smiling and posing in a lively environment, indicating a preference for dynamic and joyful group images.",
      "usertextstyle":"The caption is colloquial and includes playful slang, reflecting an informal and friendly tone. It mentions a friend's photography skills, indicating the suspect engages in and appreciates creative activities."
   },
   {
      "mediaid":"17961484681013189",
      "userimagestyle":"The suspect values family and nostalgic moments, as seen in a photo with family members in a scenic European city. The image has a tourist-like quality, suggesting a love for travel and preserving family memories.",
      "usertextstyle":"The caption is reflective and somewhat sentimental, indicating the suspect is reminiscing about past days that are now just memories. It has a nostalgic tone, showing a softer, more contemplative side."
   },
   {
      "mediaid":"17955819463024267",
      "userimagestyle":"The suspect enjoys capturing playful and candid moments, as shown by a slightly chaotic and humorous image of two individuals engaging in a playful struggle. This suggests a preference for spontaneous, fun moments.",
      "usertextstyle":"The caption is light-hearted and teasing, mentioning a sibling's (or friend's) caffeine theft and the playful retribution that follows. The multiple laughing emojis emphasize the humorous and affectionate nature of the interaction."
   },
   {
      "mediaid":"17929233841141147",
      "userimagestyle":"The suspect has a flair for capturing stylish and introspective moments, particularly close-up portraits. The image shows a close-up side profile with a serious expression, suggesting an interest in personal style and mood-driven photography.",
      "usertextstyle":"The caption humorously describes a relatable but painful experience, juxtaposed with the need to maintain composure. The repeated emojis illustrate the humorous struggle, indicating a self-aware and witty writing style."
   },
   {
      "mediaid":"17932586320121728",
      "userimagestyle":"The suspect is interested in fitness and self-improvement, as evidenced by a mirror selfie taken in a gym environment. The image implies a focus on personal health and physical activity.",
      "usertextstyle":"The caption employs humor and includes playful encouragement for a specific group ('No Legs Gang'), indicating a camaraderie and lightheartedness regarding workout experiences."
   },
   {
      "mediaid":"17874151369155598",
      "userimagestyle":"The suspect enjoys capturing social moments with friends in various settings. The photo shows a small group of friends on a rock outdoors, indicating a preference for capturing casual, friendly gatherings.",
      "usertextstyle":"The caption was not provided, suggesting either a spontaneous post or the belief that the image alone conveys the intended message."
   },
   {
      "mediaid":"17851289854179195",
      "userimagestyle":"The suspect enjoys casual and candid moments with friends. The image shows a selfie with friends at what appears to be a beach or waterfront, suggesting a preference for relaxed and enjoyable settings.",
      "usertextstyle":"The caption is playful and mentions a friend's annoyance. The use of informal language and playful commentary ('Damn! That looks though') indicates a casual and humorous writing style."
   },
   {
      "mediaid":"17873254855026202",
      "userimagestyle":"The suspect enjoys capturing rebellious and humorous moments. The image shows the suspect on a bike, making a bold hand gesture, indicating a playful and bold personality.",
      "usertextstyle":"The caption uses bird emojis, cleverly linked to the hand gesture depicted in the photo. The minimalistic and playful caption style suggests humor and a carefree attitude."
   },
   {
      "mediaid":"17860686361075258",
      "userimagestyle":"The suspect enjoys capturing spontaneous and unplanned moments, as evidenced by a blurry, slightly chaotic group selfie. The image suggests a focus on the authentic, unfiltered experiences with friends or family.",
      "usertextstyle":"The caption is self-deprecating and anticipates humorously negative reactions. The informal and candid phrasing indicates a playful and unfiltered approach to social media posts."
   }
]`);

  const mappedData = mapExplainedDatatoHumanmessage(explaineddataraw);

  const ExplanationDataPromt = new HumanMessage({
    content: [
      {
        type: "text",
        text: "SUSPECT INSTAGRAM POST DATA:",
      },
      ...mappedData,
    ],
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an expert forensic detective with an IQ of Sherlock Holmes.
      Currently, you are investigating a suspect whose Instagram profile post ids with detailed explanation of suspect post's image analysis plus caption text analysis is given to you.
      You are given the task to carefully and slowlty investigate image analysis plus caption text analysis of each post and give a detailed report of image analysis and caption text analysis capturing as much information about the suspect as possible.
      `,
    ],
    ExplanationDataPromt,
  ]);

  const tool = new ExtractExplainedDataExplanation();
  const model = new ChatOpenAI({
    model: "gpt-4o",
  });

  const modelWithTools = model.withStructuredOutput(tool);
  // @ts-ignore
  const chain = prompt.pipe(modelWithTools).pipe(tool);

  const response = await chain.invoke({});
  const explainedData: z.infer<typeof ResSchema> = JSON.parse(response);
  console.log("Tester Func OUTPUT Data", explainedData);
}


// data Exp AGENT TESTER CODE
export async function dataExptesterFunc(){
    const req = await fetch(`https://graph.instagram.com/me/media?fields=caption,media_url,media_type&access_token=https://graph.instagram.com/me?fields=id,username&access_token=IGQWRPaDVldGx0OUpsM3VUeElNQWMyM0lXTVJFTHVNeGVLVjg1OFg4bVplblZASN1hDXzBJOE5ZAM25JdWZA2S0xkS2VfdUpDUV9tOEMwS2lGbzRvNm9DZAFZAyR3JaUDRyOXdvNk1KSGFYRmVneW1NdXVYTjlXcm9HN0kZD`)

    const res = await req.json();
    const igdata: IGApiResponse[] = res["data"]
    // console.log(res)

    const mapIgDatatoHumanmessage = (data: IGApiResponse[]) => {
      let humanmsg = []
      for(const d of data){
          humanmsg.push({
            type: "text",
            text: "=============================================================================",
          },
          {
              type: "text",
              text: `POST ID : ${d.id}`,
          },
          {
            type: "text",
            text: `POST CAPTION TEXT : ${d.caption}`,
          },
          {
            type: "text",
            text: `POST IMAGE URL : `,
          },
          {
            type: "image_url",
            image_url: {
                "url": `${d.media_url}`,
                "detail": "high",
            },
          },
          {
            type: "text",
            text: "=============================================================================",
          }
        )
      }
      return humanmsg
    }

    const mappedData = mapIgDatatoHumanmessage(igdata)

    const IgDataPromt = new HumanMessage({
      content: [
        {
          type:"text",
          text: "SUSPECT INSTAGRAM POST DATA:",
        },
        ...mappedData
      ],
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an expert forensic detective with an IQ of Sherlock Holmes.
        Currently, you are investigating a suspect whose Instagram post images and its caption text is given to you.
        You are given the task to carefully and slowlty investigate the images and give a detailed explanation of each image about what type of images suspect like to take.
        Plus you are also given the task to carefully and slowlty investigate the suspect caption text and give a detailed explanation of each caption text capturing the writing style the suspect have.
        `,
      ],
      IgDataPromt,
    ]);

    const tool = new ExtractIgDataExplanation();
    const model = new ChatOpenAI({
        model: "gpt-4o",
      });
    const modelWithTools = model.withStructuredOutput(tool);
    // @ts-ignore
    const chain = prompt.pipe(modelWithTools).pipe(tool);

    const response = await chain.invoke({});
    const explainedData: string = JSON.parse(response);

    console.log("Tester Func OUTPUT Data",explainedData)
}


// Viral Critique AGENT TESTER CODE
export async function viralCritiquetesterFunc() {
  const psinput: z.infer<typeof ResearchedDataSchema> = [
    {
      postid: "#001",
      imagepromt:
        "A group of friends, with the scenic backdrop of Washington D.C.'s iconic landmarks like the Washington Monument and Capitol Building, engaging in a heated but friendly debate.",
      caption: "Just another day discussing our future leaders! 🇺🇸😂",
      tags: [
        "#Elections2023",
        "#VoteSmart",
        "#FutureLeaders",
        "#DCMoments",
        "#FriendsDebate",
      ],
    },
    {
      postid: "#002",
      imagepromt:
        "A stylish and edgy urban photo of a bustling New York City street, with fashionable pedestrians and a hint of campaign posters on the walls.",
      caption: "Street vibes and election fever 🗳️🌆👍",
      tags: [
        "#NYCElections",
        "#CityLife",
        "#Vote2023",
        "#StreetStyle",
        "#UrbanChic",
      ],
    },
    {
      postid: "#003",
      imagepromt:
        "A family picnic at a picturesque European-like park with a relaxed, candid shot showing both serious discussions and playful moments.",
      caption: "Debating candidates while enjoying the sunshine! 🌞🍃😂",
      tags: [
        "#FamilyTalks",
        "#SunnyDebate",
        "#Election2023",
        "#ParkLife",
        "#EuroVibes",
      ],
    },
    {
      postid: "#004",
      imagepromt:
        "A close-up, moody shot of a person at the gym with campaign posters visible in the background, signifying the importance of staying fit and informed.",
      caption: "Working out and working on choosing the right leader 💪🗳️",
      tags: [
        "#FitForChange",
        "#GymLife",
        "#Election2023",
        "#StayInformed",
        "#PowerOfChoice",
      ],
    },
    {
      postid: "#005",
      imagepromt:
        "A playful selfie with friends at a local campaign rally, capturing vibrant colors, smiling faces, and the excitement of political engagement.",
      caption: "Rallying up for change! 🙌🎉🗳️",
      tags: [
        "#CampaignRally",
        "#VibrantVoices",
        "#Elections2023",
        "#ChangeMakers",
        "#SelfieForChange",
      ],
    },
    {
      postid: "#006",
      imagepromt:
        "A gritty, unpolished street art scene showcasing election-themed murals with striking visuals and a touch of raw urban energy.",
      caption: "Art and politics collide in the streets! 🎨🗳️🔥",
      tags: [
        "#StreetArtVotes",
        "#UrbanPolitics",
        "#ElectionMurals",
        "#RawVoices",
        "#Vote2023",
      ],
    },
  ];

  const postsData = mapDatatoHumanmessage(psinput);

  const postsforpromt = new HumanMessage({
    content: [
      {
        type: "text",
        text: "INSTAGRAM POST's : ",
      },
      ...postsData,
    ],
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a Social Media Content Marketing expert with speciality in Instagram Marketing. You are an expert in making viral Instagram Posts.`,
    ],
    [
      "human",
      `You are given the task to evaluate the given Instagram Post's to make sure that they have the potential to become viral.
          Each Instagram post given contains a caption text, image promt for Openai Dalle related to caption text and viral tags related to caption text and image promt.
          You need to use your instagram marketing skills and give feedback on improving the posts. 
          You need to give feedback for each instagram post's caption text, image promt and viral tags.
          Most importantly make sure that if the feedback for that instagram post's caption text, image promt and viral tags is positive 
          then just give back the feedback as "okay" only.`,
    ],
    postsforpromt,
  ]);

  const tool = new ViralCritiquer();
  const model = new ChatOpenAI({
    model: "gpt-4o",
  });

  const modelWithTools = model.withStructuredOutput(tool);
  // @ts-ignore
  const chain = prompt.pipe(modelWithTools).pipe(tool);

  const response = await chain.invoke({});
  const res: z.infer<typeof feedbackschema> = JSON.parse(response);

  console.log(res);
}

//Image Gen Tester
export async function imgGentesterFunc(){
  
    const psinput: z.infer<typeof ImageGenSchema> = [
        {
          imagepromt: 'A scenic image of a group of friends traveling together, capturing the spirit of adventure and unity, with a picturesque European cityscape in the background',
          caption: 'Exploring new horizons with the best crew 🌍✨#USACandidates2023',
          tags: [
            '#TravelWithFriends',
            '#Adventure',
            '#USACandidates2023',
            '#EuropeTrip',
            '#ElectionBuzz'
          ]
        },
        {
          imagepromt: 'Candid moment of a family enjoying a fun day at the park, capturing the essence of togetherness and joy',
          caption: 'Family time is the best time 🥰 #USPresidentialCandidates',
          tags: [
            '#FamilyFirst',
            '#JoyfulMoments',
            '#USPresidentialCandidates',
            '#TogetherWeCan',
            '#Vote2023'
          ]
        },
        // {
        //   imagepromt: 'A well-dressed individual in an urban, edgy setting, with a gritty background highlighting contrast between personal style and raw surroundings',
        //   caption: 'Style meets substance in the heart of the city 🌆🕶️#VoteResponsibly' ,
        //   tags: [
        //     '#UrbanStyle',
        //     '#FashionForward',
        //     '#VoteResponsibly',
        //     '#USACandidates',
        //     '#CityVibes'
        //   ]
        // },
        // {
        //   imagepromt: 'Candid selfie of friends at a political rally or meeting, emphasizing engagement and participation',
        //   caption: 'Making our voices heard, one rally at a time 🗣️🇺🇸#EngagedCitizens' ,
        //   tags: [
        //     '#PoliticalRally',
        //     '#EngagedCitizens',
        //     '#USACandidates2023',
        //     '#DemocracyInAction',
        //     '#YouthVote'
        //   ]
        // },
        // {
        //   imagepromt: 'An individual working out in a gym, promoting the idea of self-improvement and dedication',
        //   caption: 'Stronger every day, ready for any challenge 💪 #CandidateFitness',
        //   tags: [
        //     '#FitnessGoals',
        //     '#SelfImprovement',
        //     '#CandidateFitness',
        //     '#VoteSmart',
        //     '#USPresidentialCandidates'
        //   ]
        // },
        // {
        //   imagepromt: 'A humorous group photo of friends or colleagues mimicking a playful struggle, showing fun and spontaneity',
        //   caption: 'Just another day of friendly debates and big ideas 😂🗳️#ElectionSeason' ,
        //   tags: [
        //     '#FriendlyDebates',
        //     '#ElectionSeason',
        //     '#FunTimes',
        //     '#USACandidates',
        //     '#VoteWisely'
        //   ]
        // }
      ]
  
    let response = []
  
    for (const d of psinput) {
      const imageURL = await tool.invoke(d.imagepromt);
      const entry = {...d, imageurl: imageURL}
      response.push(entry)
    }

    console.log(response)

    // const res = await tool.batch(response);

    // console.log(res)
    console.log(JSON.stringify(response))
    // return {
    //   resdatawithimages: JSON.stringify(response),
    // };

}


