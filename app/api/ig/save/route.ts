import { db } from "@/app/drizzle/client";
import { igposts } from "@/app/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    const dataRes = await req.json();

    const updatedUserId = await db.update(igposts)
  .set(dataRes)
  .where(eq(igposts.postid, dataRes.postid))
  .returning({ updatedId: igposts.postid });

    if(updatedUserId[0].updatedId){
        return NextResponse.json(updatedUserId[0], { status: 200 });
      }else{
        return NextResponse.json({error: "Something Wrong with Data"}, { status: 500 });
      }
}