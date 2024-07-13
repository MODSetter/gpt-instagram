import { z } from "zod";
import { GraphState } from "../GraphConfig";
import {  DallEAPIWrapper } from "@langchain/openai";
import { ImageGenSchema } from "../DataTypes";


export const tool = new DallEAPIWrapper({
    n: 1, // Default
    model: "dall-e-2", // Default
    apiKey: process.env.OPENAI_API_KEY, // Default
  });

export async function extractPostSuggestionsWithImages(
  state: GraphState,
): Promise<Partial<GraphState>> {
  console.log("In Img gen")
  const { researcheddata } = state;

  if (!researcheddata) {
    throw new Error("IgPostGen Agent Failed");
  }

  const psinput: z.infer<typeof ImageGenSchema> = JSON.parse(researcheddata)

  let response = []

  for (const d of psinput) {
    setTimeout(function() {
      console.log("Dalle can only do 5 img per mn");
    }, 12500);
    const imageURL = await tool.invoke(d.imagepromt);
    const entry = {...d, imageurl: imageURL}
    response.push(entry)
  }

  return {
    resdatawithimages: JSON.stringify(response),
  };
}


