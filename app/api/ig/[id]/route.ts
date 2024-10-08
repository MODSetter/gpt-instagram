import { db } from "@/app/drizzle/client";
import { igposts } from "@/app/drizzle/schema";
import { NextResponse } from "next/server"
import { eq } from 'drizzle-orm';

type Params = {
    id: number
}

export async function GET(request: Request, context: { params: Params }) {
    const post = await db.select().from(igposts).where(eq(igposts.postid, context.params.id));

    if(post){
        return NextResponse.json(post[0], { status: 200 });
      }else{
        return NextResponse.json({error: "Something Wrong with ID"}, { status: 500 });
      }
}

export async function DELETE(request: Request, context: { params: Params }) {
  const deletedPostIds: { deletedId: number }[] = await db.delete(igposts)
  .where(eq(igposts.postid, context.params.id))
  .returning({ deletedId: igposts.postid });

  if(deletedPostIds){
      return NextResponse.json(deletedPostIds[0], { status: 200 });
    }else{
      return NextResponse.json({error: "Something Wrong with ID"}, { status: 500 });
    }
}