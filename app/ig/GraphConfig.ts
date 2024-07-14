// Define graph here
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI, DallEAPIWrapper } from "@langchain/openai";
import { extractDataExplanation } from "./agents/DataExplainer";
import { extractCondencedExplanation } from "./agents/ExplanationCondenser";
import { extractPostSuggestions } from "./agents/IgPostGenerator";
import { viralCritiquer } from "./agents/ViralCritique";
import { extractPostSuggestionsWithImages } from "./agents/ImageGenerator";
import { z } from "zod";
import { IGApiResponse } from "./DataTypes";

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

//LangGraph State Object
export type GraphState = {
  query: string;
  igrawdata: string;
  igexplaineddata: string | null;
  userimagestyle: string | null;
  usertextstyle: string | null;
  researcheddata: string | null;
  critiquefeedback: string | null;
  resdatawithimages: string | null;
};

//LangGraph State Object Middleware(Activation on each edge tranfer)
const graphChannels = {
  query: null,
  igrawdata: null,
  igexplaineddata: null,
  userimagestyle: null,
  usertextstyle: null,
  researcheddata: null,
  critiquefeedback: null,
  resdatawithimages: null,
};

//// Conditional Edge
const verifyQuality = (
  state: GraphState,
): "image_generator_node" | "viral_critique_node" | "ig_post_generator_node" => {
  console.log("in verifyQual")
  const { critiquefeedback, researcheddata } = state;

  if(!researcheddata){
    return "ig_post_generator_node"
  }

  if (!critiquefeedback) {
    return "viral_critique_node";
  }

  // console.log(critiquefeedback)

  // return "image_generator_node";

  const feedback = isFeedBackOkay(JSON.parse(critiquefeedback));

  if (feedback) {
    return "image_generator_node";
  }else{
    return "ig_post_generator_node";
  }
};

/**
 * TODO: implement
 */
export function createGraph() {
  const graph = new StateGraph<GraphState>({
    channels: graphChannels,
  })
    //Define Edges
    .addNode("data_explainer_node", extractDataExplanation)
    .addNode("explaination__condenser_node", extractCondencedExplanation)
    .addNode("ig_post_generator_node", extractPostSuggestions)
    .addNode("viral_critique_node", viralCritiquer)
    .addNode("image_generator_node", extractPostSuggestionsWithImages)

    //Define Edges
    .addEdge("data_explainer_node", "explaination__condenser_node")
    .addEdge("explaination__condenser_node", "ig_post_generator_node")
    .addConditionalEdges("ig_post_generator_node", verifyQuality)
    .addConditionalEdges("viral_critique_node", verifyQuality)
    .addEdge(START, "data_explainer_node")
    .addEdge("image_generator_node", END);

  const app = graph.compile();
  return app;
}

// export interface IgRawDataSchema {
//   caption: string,
//   media_url: string,
//   media_type: string,
//   id: string
// }

export async function testGraph() {
  const app = createGraph();
  const req = await fetch(`https://graph.instagram.com/me/media?fields=caption,media_url,media_type&access_token=https://graph.instagram.com/me?fields=id,username&access_token=IGQWRPaDVldGx0OUpsM3VUeElNQWMyM0lXTVJFTHVNeGVLVjg1OFg4bVplblZASN1hDXzBJOE5ZAM25JdWZA2S0xkS2VfdUpDUV9tOEMwS2lGbzRvNm9DZAFZAyR3JaUDRyOXdvNk1KSGFYRmVneW1NdXVYTjlXcm9HN0kZD`)

    const res = await req.json();
    const igdata: IGApiResponse[] = res["data"]
    //console.log(JSON.stringify(igdata))

  const response = await app.invoke({
    query: "US Elections 2024",
    igrawdata: JSON.stringify(igdata),
  });

  console.log(response)

  console.log(response["resdatawithimages"])
  console.log(JSON.parse(response["resdatawithimages"]))
}

// main(datasetQuery);
