import { IGApiResponse } from "@/app/ig/DataTypes";
import { createGraph } from "@/app/ig/GraphConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const igapi = await fetch(
    `https://graph.instagram.com/me/media?fields=caption,media_url,media_type&access_token=${process.env.IG_ACCESS_TOKEN}`,
  );

  const igres = await igapi.json();
  const igdata: IGApiResponse[] = igres["data"];

  const body = await req.json();
  const graph = createGraph();

  const response = await graph.invoke({
    query: body.userquery,
    igrawdata: JSON.stringify(igdata),
  });

  if (response.resdatawithimages) {
    return NextResponse.json(response.resdatawithimages, { status: 200 });
  } else {
    return NextResponse.json(
      { error: "Agent Failed Try Again" },
      { status: 500 },
    );
  }
}
