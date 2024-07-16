import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { GraphState } from "../GraphConfig";
// import { DallEAPIWrapper } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ResearchedDataSchema } from "../DataTypes";


export const feedbackschema = z.object({
  critiquefeeback: z.string(),
});

export class ViralCritiquer extends StructuredTool {
  schema = z.object({
    feedback: z.array(
      z
        .object({
          postid: z.string().describe("Unique Post Id of the post"),
          imagepromtfeedback: z.string().describe("Feedback on image prompt"),
          igcaptionfeedback: z.string().describe("Feedback on caption text"),
          tagsfeedback: z.string().describe("Feedback on tags of post"),
        }),
    ),
  });

  name = "ViralCritiquer";

  description = "Gives a feedback regarding Instagram Posts.";

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return JSON.stringify(input.feedback);
  }
}

export const mapDatatoHumanmessage = (data: z.infer<typeof ResearchedDataSchema>) => {
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

const isFeedbackSchema = z.array(
  z.object({
    postid: z.string(),
    imagepromtfeedback: z.string(),
    igcaptionfeedback: z.string(),
    tagsfeedback: z.string(),
  }),
);

const isFeedBackOkay = (critiquefeedback: z.infer<typeof isFeedbackSchema>) => {
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

export async function viralCritiquer(
  state: GraphState,
): Promise<Partial<GraphState>> {
  console.log("=================In Viral Critique Agent==================");
  const { researcheddata } = state;

  if (!researcheddata) {
    throw new Error("IgPostGen Agent Failed");
  }

  const psinput: z.infer<typeof ResearchedDataSchema> = JSON.parse(researcheddata);

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
        then just give back the feedback as "okay" only. Only give "okay" if you think feedback score is at least 7 out of scale of 10 based on your expert evaluation`,
    ],
    postsforpromt,
  ]);

  const tool = new ViralCritiquer();
  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.6,
  });

  const modelWithTools = model.withStructuredOutput(tool);
  // @ts-ignore
  const chain = prompt.pipe(modelWithTools).pipe(tool);

  const response = await chain.invoke({});
  const res: z.infer<typeof isFeedbackSchema> = JSON.parse(response);

  const feedback = isFeedBackOkay(res);

  console.log("Crit Feedback", response)
  return {
    critiquefeedback: JSON.stringify(res),
    isfeedBackOkay: feedback
  };
}
