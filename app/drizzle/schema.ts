import { serial, text, timestamp, pgTable } from "drizzle-orm/pg-core";

export const igposts = pgTable("igposts", {
  postid: serial("id").primaryKey(),
  imageurl: text("imageurl"),
  caption: text("caption"),
  tags: text("tags"),
});