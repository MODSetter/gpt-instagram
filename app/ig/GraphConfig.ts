// Define graph here
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI, DallEAPIWrapper } from "@langchain/openai";



//LangGraph State Object
export type GraphState = {
  query: string;
  igrawdata: string;
  igexplaineddata: string | null;
  userimagestyle : string | null;
  usertextstyle: string | null;
  researcheddata: string | null;
  
  response: string | null;
};

//LangGraph State Object Middleware(Activation on each edge tranfer)
const graphChannels = {
    query: null,
    igrawdata: null,
    igexplaineddata: null,
    userimagestyle : null,
    usertextstyle: null,
    researcheddata: null,
    
    response: null,
};

//// Conditional Edge
// const verifyQuality = (
//   state: GraphState
// ): "human_loop_node" | "execute_request_node" => {
//   const { bestApi, params } = state;
//   if (!bestApi) {
//     throw new Error("No best API found");
//   }
//   if (!params) {
//     return "human_loop_node";
//   }
//   const requiredParamsKeys = bestApi.required_parameters.map(
//     ({ name }) => name
//   );
//   const extractedParamsKeys = Object.keys(params);
//   const missingKeys = findMissingParams(
//     requiredParamsKeys,
//     extractedParamsKeys
//   );
//   if (missingKeys.length > 0) {
//     return "human_loop_node";
//   }
//   return "execute_request_node";
// };


/**
 * TODO: implement
 */
function createGraph() {
  const graph = new StateGraph<GraphState>({
    channels: graphChannels,
  })
    // //Define Edges
    // .addNode("extract_category_node", extractCategory)
    // .addNode("get_apis_node", getApis)
    // .addNode("select_api_node", selectApi)
    // .addNode("extract_params_node", extractParameters)
    // .addNode("human_loop_node", requestParameters)
    // .addNode("execute_request_node", createFetchRequest)

    // //Define Edges
    // .addEdge("extract_category_node", "get_apis_node")
    // .addEdge("get_apis_node", "select_api_node")
    // .addEdge("select_api_node", "extract_params_node")
    // .addConditionalEdges("extract_params_node", verifyParams)
    // .addConditionalEdges("human_loop_node", verifyParams)
    // .addEdge(START, "extract_category_node")
    // .addEdge("execute_request_node", END);

  const app = graph.compile();
  return app;
}



// async function main(query: string) {
//   const app = createGraph();

//   const llm = new ChatOpenAI({
//     modelName: "gpt-4-turbo-preview",
//     temperature: 0,
//   });

//   const stream = await app.stream({
//     llm,
//     query,
//   });

//   let finalResult: GraphState | null = null;
//   for await (const event of stream) {
//     console.log("\n------\n");
//     if (Object.keys(event)[0] === "execute_request_node") {
//       console.log("---FINISHED---");
//       finalResult = event.execute_request_node;
//     } else {
//       console.log("Stream event: ", Object.keys(event)[0]);
//       // Uncomment the line below to see the values of the event.
//       // console.log("Value(s): ", Object.values(event)[0]);
//     }
//   }

//   if (!finalResult) {
//     throw new Error("No final result");
//   }
//   if (!finalResult.bestApi) {
//     throw new Error("No best API found");
//   }

//   console.log("---FETCH RESULT---");
//   console.log(finalResult.response);

//   const resultHasProperIds = relevantIds.includes(finalResult.bestApi.id);
//   if (resultHasProperIds) {
//     console.log("✅✅✅The result has the proper ids✅✅✅");
//   } else {
//     console.log("❌❌❌The result does not have the proper ids❌❌❌");
//   }
// }

// main(datasetQuery);
