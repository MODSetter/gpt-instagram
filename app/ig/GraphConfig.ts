// Define graph here
import { END, START, StateGraph } from "@langchain/langgraph";
import { extractDataExplanation } from "./agents/DataExplainer";
import { extractCondencedExplanation } from "./agents/ExplanationCondenser";
import { extractPostSuggestions } from "./agents/IgPostGenerator";
import { viralCritiquer } from "./agents/ViralCritique";
import { extractPostSuggestionsWithImages } from "./agents/ImageGenerator";
import { IGApiResponse } from "./DataTypes";



//LangGraph State Object
export type GraphState = {
  query: string;
  igrawdata: string;
  igexplaineddata: string | null;
  userimagestyle: string | null;
  usertextstyle: string | null;
  researcheddata: string | null;
  critiquefeedback: string | null;
  isfeedBackOkay: boolean;
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
  isfeedBackOkay: null,
  resdatawithimages: null,
};

//// Conditional Edge
const verifyQuality = (
  state: GraphState,
): "image_generator_node" | "ig_post_generator_node" => {
  console.log("=============IN verifyQual Switch===============");
  const { researcheddata, isfeedBackOkay } = state;

  if (!researcheddata) {
    return "ig_post_generator_node";
  }

  if (isfeedBackOkay) {
    return "image_generator_node";
  } else {
    return "ig_post_generator_node";
  }
};


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
    .addEdge("ig_post_generator_node", "viral_critique_node")
    .addConditionalEdges("viral_critique_node", verifyQuality)
    .addEdge(START, "data_explainer_node")
    .addEdge("image_generator_node", END);

  const app = graph.compile();
  return app;
}



