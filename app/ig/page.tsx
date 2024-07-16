import { Button } from "@/components/ui/button";
import { db } from "../drizzle/client";
import { igposts } from "../drizzle/schema";
import { imgGentesterFunc } from "./AgentTester";
import { testGraph } from "./GraphConfig";
import ManageIgPosts from "@/components/ManageIgPosts";




export default async function Ig() {
  // imgGentesterFunc()
  // testGraph();

  const igpostsdata = await db.select().from(igposts);

  // console.log("REC", igpostsdata)
  return (
    <>
      <ManageIgPosts data={igpostsdata} />

    </>
  );
}
