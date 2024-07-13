import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../GraphConfig";
import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { IgExplainedData } from "../DataTypes";

export const ResSchema = z.object({
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

export const mapExplainedDatatoHumanmessage = (data: IgExplainedData[]) => {
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

  const explaineddataraw: IgExplainedData[] = JSON.parse(igexplaineddata);

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

