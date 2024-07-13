import { z } from "zod";

export interface IGApiResponse {
    caption: string,
    media_url: string,
    media_type: string,
    id: string
}

export const ResearchedDataSchema = z.array(
    z.object({
      postid: z.string(),
      imagepromt: z.string(),
      caption: z.string(),
      tags: z.array(z.string()),
    }),
  );


  export interface IgExplainedData {
    mediaid: string;
    userimagestyle: string;
    usertextstyle: string;
  }
  

  
export const ImageGenSchema = z
.array(
  z.object({
    imagepromt: z.string(),
    caption: z.string(),
    tags: z
      .array(z.string())
  }),
)