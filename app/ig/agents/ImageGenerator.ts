// import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { GraphState } from "../GraphConfig";
import {  DallEAPIWrapper } from "@langchain/openai";


const ResSchema = z
.array(
  z.object({
    imagepromt: z.string(),
    caption: z.string(),
    tags: z
      .array(z.string())
  }),
)

const tool = new DallEAPIWrapper({
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

  const psinput: z.infer<typeof ResSchema> = JSON.parse(researcheddata)

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

// AGENT TESTER CODE
// export async function testerFunc(){
  
//     const psinput: z.infer<typeof ResSchema> = [
//         {
//           imagepromt: 'A scenic image of a group of friends traveling together, capturing the spirit of adventure and unity, with a picturesque European cityscape in the background',
//           caption: 'Exploring new horizons with the best crew 🌍✨#USACandidates2023',
//           tags: [
//             '#TravelWithFriends',
//             '#Adventure',
//             '#USACandidates2023',
//             '#EuropeTrip',
//             '#ElectionBuzz'
//           ]
//         },
//         {
//           imagepromt: 'Candid moment of a family enjoying a fun day at the park, capturing the essence of togetherness and joy',
//           caption: 'Family time is the best time 🥰 #USPresidentialCandidates',
//           tags: [
//             '#FamilyFirst',
//             '#JoyfulMoments',
//             '#USPresidentialCandidates',
//             '#TogetherWeCan',
//             '#Vote2023'
//           ]
//         },
//         {
//           imagepromt: 'A well-dressed individual in an urban, edgy setting, with a gritty background highlighting contrast between personal style and raw surroundings',
//           caption: 'Style meets substance in the heart of the city 🌆🕶️#VoteResponsibly' ,
//           tags: [
//             '#UrbanStyle',
//             '#FashionForward',
//             '#VoteResponsibly',
//             '#USACandidates',
//             '#CityVibes'
//           ]
//         },
//         {
//           imagepromt: 'Candid selfie of friends at a political rally or meeting, emphasizing engagement and participation',
//           caption: 'Making our voices heard, one rally at a time 🗣️🇺🇸#EngagedCitizens' ,
//           tags: [
//             '#PoliticalRally',
//             '#EngagedCitizens',
//             '#USACandidates2023',
//             '#DemocracyInAction',
//             '#YouthVote'
//           ]
//         },
//         {
//           imagepromt: 'An individual working out in a gym, promoting the idea of self-improvement and dedication',
//           caption: 'Stronger every day, ready for any challenge 💪 #CandidateFitness',
//           tags: [
//             '#FitnessGoals',
//             '#SelfImprovement',
//             '#CandidateFitness',
//             '#VoteSmart',
//             '#USPresidentialCandidates'
//           ]
//         },
//         // {
//         //   imagepromt: 'A humorous group photo of friends or colleagues mimicking a playful struggle, showing fun and spontaneity',
//         //   caption: 'Just another day of friendly debates and big ideas 😂🗳️#ElectionSeason' ,
//         //   tags: [
//         //     '#FriendlyDebates',
//         //     '#ElectionSeason',
//         //     '#FunTimes',
//         //     '#USACandidates',
//         //     '#VoteWisely'
//         //   ]
//         // }
//       ]
  
//     let response = []
  
//     for (const d of psinput) {
//       const imageURL = await tool.invoke(d.imagepromt);
//       const entry = {...d, imageurl: imageURL}
//       response.push(entry)
//     }

//     const res = await tool.batch(response);

//     console.log(res)
//     console.log(JSON.stringify(response))
//     // return {
//     //   resdatawithimages: JSON.stringify(response),
//     // };

// }
