import { tool } from "@/app/ig/agents/ImageGenerator";
import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const responseSchema = z.object({
  imagepromt: z.string().describe("Suggested new image promt"),
  caption: z.string().describe("Suggested new Caption text without hashtags"),
  tags: z
    .array(z.string().describe("suggested hashtag"))
    .describe("List of all the new suggested hashtags"),
});


const model = new ChatOpenAI({
    model: "gpt-4o",
  });


  export async function extractPostSuggestionWithImages(
    postData: z.infer<typeof responseSchema>,
  ) {
    const image = await tool.invoke(postData.imagepromt);
    const res = { ...postData, imageurl: image };
  
    return res;
  }

export async function POST(req: NextRequest) {
  const dataRes = await req.json();

  const postToEditMessage = new HumanMessage({
    content: [
      {
        type: "text",
        text: "INSTAGRAM POST",
      },
      {
        type: "text",
        text: "========================================",
      },
      {
        type: "text",
        text: `POST CAPTION TEXT : ${dataRes.posttoedit.caption}`,
      },
      {
        type: "text",
        text: `POST TAGS : ${dataRes.posttoedit.tags}`,
      },
      {
        type: "text",
        text: `POST IMAGE PROMT : ${dataRes.posttoedit.imagepromt}`,
      },
      {
        type: "text",
        text: "========================================",
      },
    ],
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a Promt Engineering Expert and a Social Media Content Marketing expert with speciality in Instagram Marketing plus you have phd in English Litrature.`,
    ],
    [
      "human",
      `You are given the task to apply the user feedback to improve a given Instagram Post.
          Instagram Post contains its caption text, tags and a image promt for OpenAI Dalle for its caption text and its tags.
          You need to apply the user feedback to improve image promt, caption text and tags of the Instagram post.
          Return new image promt, caption text and tags which is highly relevent to user feedback.`,
    ],
    postToEditMessage,
    ["human", `USER FEEDBACK TO APPLY : ${dataRes.userfeedback}`],
  ]);


  const structuredLlm = model.withStructuredOutput(responseSchema);

  const newPost = await structuredLlm.invoke("");

  const postWithImage = await extractPostSuggestionWithImages(newPost);

  const postWithid = {...postWithImage, postid: dataRes.posttoedit.postid}

  if(newPost){
    return NextResponse.json(postWithid, { status: 200 });
  }else{
    return NextResponse.json({error: "Something Wrong with LLM"}, { status: 500 });
  }

}
