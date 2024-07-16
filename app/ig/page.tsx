import { Button } from "@/components/ui/button";
import { db } from "../drizzle/client";
import { igposts } from "../drizzle/schema";
import { imgGentesterFunc } from "./AgentTester";
import { testGraph } from "./GraphConfig";
import ManageIgPosts from "@/components/ManageIgPosts";




export default async function Ig() {
  const igpostsdata = await db.select().from(igposts);

  return (
    <>
      <ManageIgPosts data={igpostsdata.reverse()} />
    </>
  );
}
