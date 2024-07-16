import { db } from "@/app/drizzle/client";
import { igposts } from "@/app/drizzle/schema";
import { IGApiResponse } from "@/app/ig/DataTypes";
import { createGraph } from "@/app/ig/GraphConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const igapi = await fetch(
    `https://graph.instagram.com/me/media?fields=caption,media_url,media_type&access_token=${process.env.IG_ACCESS_TOKEN}`,
  );

  const igres = await igapi.json();
  const igdata: IGApiResponse[] = igres["data"];

  const igImageData = igdata.map((data) => {
    if(data.media_type === "IMAGE") {
      return data
    }
  })

  const body = await req.json();
  const graph = createGraph();

  const response = await graph.invoke({
    query: body.userquery,
    igrawdata: JSON.stringify(igImageData),
  });

  const graphresObj = JSON.parse(response.resdatawithimages)

  

  const datatosave = graphresObj.map((entry: any) => {
    return {
      'imageurl': entry.imageurl,
      'imagepromt' : entry.imagepromt,
      'caption': entry.caption,
      'tags': entry.tags,
    }
  });

  const saveInDb = await db.insert(igposts).values(datatosave);

  if (response && saveInDb) {
    return NextResponse.json(graphresObj, { status: 200 });
  } else {
    return NextResponse.json(
      { error: "Agent Failed Try Again" },
      { status: 500 },
    );
  }
}
