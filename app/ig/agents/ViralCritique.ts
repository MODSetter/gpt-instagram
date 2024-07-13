import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { GraphState } from "../GraphConfig";
// import { DallEAPIWrapper } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

const ResSchema = z.array(
  z.object({
    postid: z.string(),
    imagepromt: z.string(),
    caption: z.string(),
    tags: z.array(z.string()),
  }),
);

const feedbackschema = z.object({
  critiquefeeback: z.string(),
});

export class ViralCritiquer extends StructuredTool {
  schema = z.object({
    feedback: z.array(
      z
        .object({
          postid: z.string().describe("Unique Post Id of the post"),
          imagepromtfeedback: z.string().describe("Feedback on image prompt"),
          igcaptionfeedback: z.string().describe("Feedback on caption text"),
          tagsfeedback: z.string().describe("Feedback on tags of post"),
        }),
    ),
  });

  name = "ViralCritiquer";

  description = "Gives a feedback regarding Instagram Posts.";

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return JSON.stringify(input.feedback);
  }
}

const mapDatatoHumanmessage = (data: z.infer<typeof ResSchema>) => {
  let humanmsg = [];

  for (const d of data) {
    humanmsg.push(
      {
        type: "text",
        text: "============================================================================",
      },
      {
        type: "text",
        text: `POST IMAGE PROMPT : ${d.imagepromt}`,
      },
      {
        type: "text",
        text: `POST CAPTION : ${d.caption}`,
      },
      {
        type: "text",
        text: `POST IMAGE TAGS : 
          ${d.tags.join("\n")}`,
      },
      {
        type: "text",
        text: "=============================================================================",
      },
    );
  }
  return humanmsg;
};

export async function viralCritiquer(
  state: GraphState,
): Promise<Partial<GraphState>> {
  console.log("In viral c");
  const { researcheddata } = state;

  if (!researcheddata) {
    throw new Error("IgPostGen Agent Failed");
  }

  const psinput: z.infer<typeof ResSchema> = JSON.parse(researcheddata);

  const postsData = mapDatatoHumanmessage(psinput);

  const postsforpromt = new HumanMessage({
    content: [
      {
        type: "text",
        text: "INSTAGRAM POST's : ",
      },
      ...postsData,
    ],
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a Social Media Content Marketing expert with speciality in Instagram Marketing. You are an expert in making viral Instagram Posts.`,
    ],
    [
      "human",
      `You are given the task to evaluate the given Instagram Post's to make sure that they have the potential to become viral.
        Each Instagram post given contains a caption text, image promt for Openai Dalle related to caption text and viral tags related to caption text and image promt.
        You need to use your instagram marketing skills and give feedback on improving the posts. 
        You need to give feedback for each instagram post's caption text, image promt and viral tags.
        Most importantly make sure that if the feedback for that instagram post's caption text, image promt and viral tags is positive 
        then just give back the feedback as "okay" only.`,
    ],
    postsforpromt,
  ]);

  const tool = new ViralCritiquer();
  const model = new ChatOpenAI({
    model: "gpt-4o",
  });

  const modelWithTools = model.withStructuredOutput(tool);
  // @ts-ignore
  const chain = prompt.pipe(modelWithTools).pipe(tool);

  const response = await chain.invoke({});
  const res: z.infer<typeof feedbackschema> = JSON.parse(response);

  return {
    critiquefeedback: JSON.stringify(res),
  };
}

// AGENT TESTER CODE
export async function testerFunc() {
  const psinput: z.infer<typeof ResSchema> = [
    {
      postid: "#001",
      imagepromt:
        "A group of friends, with the scenic backdrop of Washington D.C.'s iconic landmarks like the Washington Monument and Capitol Building, engaging in a heated but friendly debate.",
      caption: "Just another day discussing our future leaders! 🇺🇸😂",
      tags: [
        "#Elections2023",
        "#VoteSmart",
        "#FutureLeaders",
        "#DCMoments",
        "#FriendsDebate",
      ],
    },
    {
      postid: "#002",
      imagepromt:
        "A stylish and edgy urban photo of a bustling New York City street, with fashionable pedestrians and a hint of campaign posters on the walls.",
      caption: "Street vibes and election fever 🗳️🌆👍",
      tags: [
        "#NYCElections",
        "#CityLife",
        "#Vote2023",
        "#StreetStyle",
        "#UrbanChic",
      ],
    },
    {
      postid: "#003",
      imagepromt:
        "A family picnic at a picturesque European-like park with a relaxed, candid shot showing both serious discussions and playful moments.",
      caption: "Debating candidates while enjoying the sunshine! 🌞🍃😂",
      tags: [
        "#FamilyTalks",
        "#SunnyDebate",
        "#Election2023",
        "#ParkLife",
        "#EuroVibes",
      ],
    },
    {
      postid: "#004",
      imagepromt:
        "A close-up, moody shot of a person at the gym with campaign posters visible in the background, signifying the importance of staying fit and informed.",
      caption: "Working out and working on choosing the right leader 💪🗳️",
      tags: [
        "#FitForChange",
        "#GymLife",
        "#Election2023",
        "#StayInformed",
        "#PowerOfChoice",
      ],
    },
    {
      postid: "#005",
      imagepromt:
        "A playful selfie with friends at a local campaign rally, capturing vibrant colors, smiling faces, and the excitement of political engagement.",
      caption: "Rallying up for change! 🙌🎉🗳️",
      tags: [
        "#CampaignRally",
        "#VibrantVoices",
        "#Elections2023",
        "#ChangeMakers",
        "#SelfieForChange",
      ],
    },
    {
      postid: "#006",
      imagepromt:
        "A gritty, unpolished street art scene showcasing election-themed murals with striking visuals and a touch of raw urban energy.",
      caption: "Art and politics collide in the streets! 🎨🗳️🔥",
      tags: [
        "#StreetArtVotes",
        "#UrbanPolitics",
        "#ElectionMurals",
        "#RawVoices",
        "#Vote2023",
      ],
    },
  ];

  const postsData = mapDatatoHumanmessage(psinput);

  const postsforpromt = new HumanMessage({
    content: [
      {
        type: "text",
        text: "INSTAGRAM POST's : ",
      },
      ...postsData,
    ],
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a Social Media Content Marketing expert with speciality in Instagram Marketing. You are an expert in making viral Instagram Posts.`,
    ],
    [
      "human",
      `You are given the task to evaluate the given Instagram Post's to make sure that they have the potential to become viral.
          Each Instagram post given contains a caption text, image promt for Openai Dalle related to caption text and viral tags related to caption text and image promt.
          You need to use your instagram marketing skills and give feedback on improving the posts. 
          You need to give feedback for each instagram post's caption text, image promt and viral tags.
          Most importantly make sure that if the feedback for that instagram post's caption text, image promt and viral tags is positive 
          then just give back the feedback as "okay" only.`,
    ],
    postsforpromt,
  ]);

  const tool = new ViralCritiquer();
  const model = new ChatOpenAI({
    model: "gpt-4o",
  });

  const modelWithTools = model.withStructuredOutput(tool);
  // @ts-ignore
  const chain = prompt.pipe(modelWithTools).pipe(tool);

  const response = await chain.invoke({});
  const res: z.infer<typeof feedbackschema> = JSON.parse(response);

  console.log(res);
  // console.log(JSON.stringify(res))
  // return {
  //   resdatawithimages: JSON.stringify(response),
  // };
}
