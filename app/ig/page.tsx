import { ChatWindow } from "@/components/ChatWindow";
import { testGraph } from "./GraphConfig";
import { testerFunc } from "./agents/ImageGenerator";

// export interface IgRawDataSchema {
//   caption: string,
//   media_url: string,
//   media_type: string,
//   id: string
// }

export default async function Ig() {
  // const response = await fetch(`https://graph.instagram.com/me/media?fields=caption,media_url,media_type&access_token=${process.env.IG_ACCESS_TOKEN}`)

  // const mapIgDatatoHumanmessage = (data: IgRawDataSchema[]) => {
  //   let humanmsg = []
  //   // console.log("RW",data)
  //   for(const d of data){
  //       humanmsg.push({
  //         type: "text",
  //         text: "=============================================================================",
  //       },
  //       {
  //         type: "text",
  //         text: `POST CAPTION TEXT : ${d.caption}`,
  //       },
  //       {
  //         type: "text",
  //         text: `POST IMAGE URL : `,
  //       },
  //       {
  //         type: "image_url",
  //         image_url: `${d.media_url}`,
  //       },
  //       {
  //         type: "text",
  //         text: "=============================================================================",
  //       }
  //     )
  //   }
  //   return humanmsg
  // }
  
  // const res = await response.json();
  // console.log("REW",typeof res["data"])
  // mapIgDatatoHumanmessage(res["data"])
  // //console.log("REW",res["data"])


  // testGraph();
  // testerFunc();
  return (
    <div>
      Hi
    </div>
  );
}
