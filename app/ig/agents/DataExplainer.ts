import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../GraphConfig";
import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

export interface IgRawDataSchema {
    caption: string,
    media_url: string,
    media_type: string,
    id: string
}

export class ExtractIgDataExplanation extends StructuredTool {
  schema = z.object({
    explainedData: z.array(
      z
        .object({
          mediaid: z.string().describe("Post Id of the post"),
          userimagestyle: z
            .string()
            .describe("Detailed Image investigation after your analysis"),
          usertextstyle: z
            .string()
            .describe("Detailed Text investigation after your analysis"),
        })
        .describe("Detailed investigative work of this post."),
    ),
  });

  name = "ExtractIgDataExplanation";

  description =
    "Given a suspect Instagram data such as images and cation texts, do a detailed investigative work on these.";

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return JSON.stringify(input.explainedData);
  }
}

export async function extractDataExplanation(
  state: GraphState,
): Promise<Partial<GraphState>> {
  const { igrawdata } = state;

  const igdata: IgRawDataSchema[] = JSON.parse(igrawdata);

  const mapIgDatatoHumanmessage = (data: IgRawDataSchema[]) => {
    let humanmsg = [];
    for (const d of data) {
        if(d.caption && d.media_url){
            humanmsg.push(
                {
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
                  image_url: `${d.media_url}`,
                },
                {
                  type: "text",
                  text: "=============================================================================",
                },
              );
        }
    }
    return humanmsg;
  };

  const mappedData = mapIgDatatoHumanmessage(igdata);

  const IgDataPromt = new HumanMessage({
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

  return {
    igexplaineddata: explainedData,
  };
}

// AGENT TESTER CODE
export async function testerFunc(){
    const req = await fetch(`https://graph.instagram.com/me/media?fields=caption,media_url,media_type&access_token=https://graph.instagram.com/me?fields=id,username&access_token=IGQWRPaDVldGx0OUpsM3VUeElNQWMyM0lXTVJFTHVNeGVLVjg1OFg4bVplblZASN1hDXzBJOE5ZAM25JdWZA2S0xkS2VfdUpDUV9tOEMwS2lGbzRvNm9DZAFZAyR3JaUDRyOXdvNk1KSGFYRmVneW1NdXVYTjlXcm9HN0kZD`)

    const res = await req.json();
    const igdata: IgRawDataSchema[] = res["data"]
    // console.log(res)
    // const igdata: IgRawDataSchema[] = [ {
    //     "id": "17992164176429557",
    //     "caption": "😁",
    //     "media_url": "https://scontent-sjc3-1.cdninstagram.com/v/t51.29350-15/437049401_943965147040058_7396000057875129042_n.webp?stp=dst-jpg&_nc_cat=104&ccb=1-7&_nc_sid=18de74&_nc_ohc=f5Pt4OWp1VEQ7kNvgEfvvYl&_nc_ht=scontent-sjc3-1.cdninstagram.com&edm=ANo9K5cEAAAA&oh=00_AYDvbL-rOIzhEgA71Ye3VmmNkGkxcHBTD8iiQvtiezS-Fw&oe=66961CDB",
    //     "media_type": "IMAGE"
    // }];

    const mapIgDatatoHumanmessage = (data: IgRawDataSchema[]) => {
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
