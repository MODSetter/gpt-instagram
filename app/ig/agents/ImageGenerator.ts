import { z } from "zod";
import { GraphState } from "../GraphConfig";
import { DallEAPIWrapper } from "@langchain/openai";
import { ImageGenSchema, ResearchedDataSchema } from "../DataTypes";

export const tool = new DallEAPIWrapper({
  n: 1, // Default
  model: "dall-e-2", // Default
  apiKey: process.env.OPENAI_API_KEY, // Default
  responseFormat: "b64_json",
});

export const ImgGenDataSchema = z.array(
  z.object({
    imageurl: z.string(),
    imagepromt: z.string(),
    caption: z.string(),
    tags: z.array(z.string()),
  }),
);

export async function extractPostSuggestionsWithImages(
  state: GraphState,
): Promise<Partial<GraphState>> {
  console.log("In Img gen");
  const { researcheddata } = state;

  if (!researcheddata) {
    throw new Error("IgPostGen Agent Failed");
  }

  const psinput: z.infer<typeof ImageGenSchema> = JSON.parse(researcheddata);

  let response: z.infer<typeof ImgGenDataSchema> = [];

  for (const d of psinput) {
    const imageURL = await tool.invoke(d.imagepromt);
    const entry = { ...d, imageurl: imageURL };
    response.push(entry);
  }

  return {
    resdatawithimages: JSON.stringify(response),
  };
}
