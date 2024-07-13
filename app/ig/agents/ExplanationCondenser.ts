import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../GraphConfig";
import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

export interface ExplainedData {
  mediaid: string;
  userimagestyle: string;
  usertextstyle: string;
}

const ResSchema = z.object({
  mainimageanalysis: z.string(),
  maintextanalysis: z.string(),
});

export class ExtractExplainedDataExplanation extends StructuredTool {
  schema = z.object({
    condencedExplanation: z.object({
      mainimageanalysis: z.string().describe("Detailed long Image analysis"),
      maintextanalysis: z.string().describe("Detailed long Caption Text analysis"),
    }).describe("Detailed investigation report after your analysis"),
  });

  name = "ExtractExplainedDataExplanation";

  description =
    "Given a suspect Instagram profile post ids with detailed explanation of suspect post image analysis and caption text analysis. Do your work as informed.";

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return JSON.stringify(input.condencedExplanation);
  }
}

const mapExplainedDatatoHumanmessage = (data: ExplainedData[]) => {
  let humanmsg = [];
  for (const d of data) {
    humanmsg.push(
      {
        type: "text",
        text: "=============================================================================",
      },
      {
        type: "text",
        text: `POST ID : ${d.mediaid}`,
      },
      {
        type: "text",
        text: `POST CAPTION ANALYSIS : ${d.usertextstyle}`,
      },
      {
        type: "text",
        text: `POST IMAGE ANALYSIS : ${d.userimagestyle}`,
      },
      {
        type: "text",
        text: "=============================================================================",
      },
    );
  }
  return humanmsg;
};

export async function extractCondencedExplanation(
  state: GraphState,
): Promise<Partial<GraphState>> {
  console.log("In Exp Cond")
  const { igexplaineddata } = state;

  if (!igexplaineddata) {
    throw new Error("DataExplanation Agent Failed");
  }

  const explaineddataraw: ExplainedData[] = JSON.parse(igexplaineddata);

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
      `
    ],
    ["human", `Currently, you are investigating a suspect whose Instagram profile post ids with detailed explanation of suspect post's image analysis and caption text analysis is given to you.
      You are given the task to carefully and slowlty investigate image analysis and caption text analysis of each post and give a detailed report of image analysis and caption text analysis in one big pargagraph capturing as much information about the suspect as possible.`],
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

  console.log("EXP DATA",explainedData)

  return {
    userimagestyle: explainedData.mainimageanalysis,
    usertextstyle: explainedData.maintextanalysis,
  };
}

// AGENT TESTER CODE
// export async function testerFunc() {
//   const explaineddataraw: ExplainedData[] = JSON.parse(`[
//    {
//       "mediaid":"17992164176429557",
//       "userimagestyle":"The suspect appears to enjoy capturing scenic moments with friends. The image displays a serene landscape of a lake at sunset with the suspect and two friends smiling and posing, suggesting a preference for natural beauty and companionship in photos.",
//       "usertextstyle":"The caption is a simple smiley emoticon, reflecting a lighthearted and happy moment without the need for elaborate words. The suspect's use of minimal text suggests a focus on the image itself to convey the mood."
//    },
//    {
//       "mediaid":"18132923389151815",
//       "userimagestyle":"The suspect seems interested in fashion and personal style, as evidenced by a photo of the suspect dressed in a sharp suit, complete with accessories like bow tie and red sunglasses. This suggests a liking for classy and perhaps extravagant imagery.",
//       "usertextstyle":"The caption is humorous and self-deprecating, referring to the suspect as a 'Sasta Chinese Tony Stark,' which translates to a 'cheap Chinese Tony Stark.' The informal and playful tone of the caption indicates a sense of humor and a lack of self-seriousness."
//    },
//    {
//       "mediaid":"17969910415188674",
//       "userimagestyle":"The suspect captures edgy and gritty moments with friends, as shown by an image against a graffiti-laden wall with the suspects striking relaxed and cool poses. The image suggests a liking for raw, urban aesthetics.",
//       "usertextstyle":"The caption suggests the suspect is providing advice with a playful twist, presenting a 'pro tip' with an ambiguous meaning and a subtle innuendo. This indicates a playful and cryptic style of writing."
//    },
//    {
//       "mediaid":"17964673582164590",
//       "userimagestyle":"The suspect enjoys capturing fun moments with friends, particularly outdoors. The photo displays a group of friends smiling and posing in a lively environment, indicating a preference for dynamic and joyful group images.",
//       "usertextstyle":"The caption is colloquial and includes playful slang, reflecting an informal and friendly tone. It mentions a friend's photography skills, indicating the suspect engages in and appreciates creative activities."
//    },
//    {
//       "mediaid":"17961484681013189",
//       "userimagestyle":"The suspect values family and nostalgic moments, as seen in a photo with family members in a scenic European city. The image has a tourist-like quality, suggesting a love for travel and preserving family memories.",
//       "usertextstyle":"The caption is reflective and somewhat sentimental, indicating the suspect is reminiscing about past days that are now just memories. It has a nostalgic tone, showing a softer, more contemplative side."
//    },
//    {
//       "mediaid":"17955819463024267",
//       "userimagestyle":"The suspect enjoys capturing playful and candid moments, as shown by a slightly chaotic and humorous image of two individuals engaging in a playful struggle. This suggests a preference for spontaneous, fun moments.",
//       "usertextstyle":"The caption is light-hearted and teasing, mentioning a sibling's (or friend's) caffeine theft and the playful retribution that follows. The multiple laughing emojis emphasize the humorous and affectionate nature of the interaction."
//    },
//    {
//       "mediaid":"17929233841141147",
//       "userimagestyle":"The suspect has a flair for capturing stylish and introspective moments, particularly close-up portraits. The image shows a close-up side profile with a serious expression, suggesting an interest in personal style and mood-driven photography.",
//       "usertextstyle":"The caption humorously describes a relatable but painful experience, juxtaposed with the need to maintain composure. The repeated emojis illustrate the humorous struggle, indicating a self-aware and witty writing style."
//    },
//    {
//       "mediaid":"17932586320121728",
//       "userimagestyle":"The suspect is interested in fitness and self-improvement, as evidenced by a mirror selfie taken in a gym environment. The image implies a focus on personal health and physical activity.",
//       "usertextstyle":"The caption employs humor and includes playful encouragement for a specific group ('No Legs Gang'), indicating a camaraderie and lightheartedness regarding workout experiences."
//    },
//    {
//       "mediaid":"17874151369155598",
//       "userimagestyle":"The suspect enjoys capturing social moments with friends in various settings. The photo shows a small group of friends on a rock outdoors, indicating a preference for capturing casual, friendly gatherings.",
//       "usertextstyle":"The caption was not provided, suggesting either a spontaneous post or the belief that the image alone conveys the intended message."
//    },
//    {
//       "mediaid":"17851289854179195",
//       "userimagestyle":"The suspect enjoys casual and candid moments with friends. The image shows a selfie with friends at what appears to be a beach or waterfront, suggesting a preference for relaxed and enjoyable settings.",
//       "usertextstyle":"The caption is playful and mentions a friend's annoyance. The use of informal language and playful commentary ('Damn! That looks though') indicates a casual and humorous writing style."
//    },
//    {
//       "mediaid":"17873254855026202",
//       "userimagestyle":"The suspect enjoys capturing rebellious and humorous moments. The image shows the suspect on a bike, making a bold hand gesture, indicating a playful and bold personality.",
//       "usertextstyle":"The caption uses bird emojis, cleverly linked to the hand gesture depicted in the photo. The minimalistic and playful caption style suggests humor and a carefree attitude."
//    },
//    {
//       "mediaid":"17860686361075258",
//       "userimagestyle":"The suspect enjoys capturing spontaneous and unplanned moments, as evidenced by a blurry, slightly chaotic group selfie. The image suggests a focus on the authentic, unfiltered experiences with friends or family.",
//       "usertextstyle":"The caption is self-deprecating and anticipates humorously negative reactions. The informal and candid phrasing indicates a playful and unfiltered approach to social media posts."
//    }
// ]`);

//   const mappedData = mapExplainedDatatoHumanmessage(explaineddataraw);

//   const ExplanationDataPromt = new HumanMessage({
//     content: [
//       {
//         type: "text",
//         text: "SUSPECT INSTAGRAM POST DATA:",
//       },
//       ...mappedData,
//     ],
//   });

//   const prompt = ChatPromptTemplate.fromMessages([
//     [
//       "system",
//       `You are an expert forensic detective with an IQ of Sherlock Holmes.
//       Currently, you are investigating a suspect whose Instagram profile post ids with detailed explanation of suspect post's image analysis plus caption text analysis is given to you.
//       You are given the task to carefully and slowlty investigate image analysis plus caption text analysis of each post and give a detailed report of image analysis and caption text analysis capturing as much information about the suspect as possible.
//       `,
//     ],
//     ExplanationDataPromt,
//   ]);

//   const tool = new ExtractExplainedDataExplanation();
//   const model = new ChatOpenAI({
//     model: "gpt-4o",
//   });

//   const modelWithTools = model.withStructuredOutput(tool);
//   // @ts-ignore
//   const chain = prompt.pipe(modelWithTools).pipe(tool);

//   const response = await chain.invoke({});
//   const explainedData: z.infer<typeof ResSchema> = JSON.parse(response);
//   console.log("Tester Func OUTPUT Data", explainedData);
// }
