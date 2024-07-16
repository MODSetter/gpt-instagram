"use client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"



interface igpostsdataschema {
  imageurl: string | null;
  caption: string | null;
  tags: string[] | null;
  postid: number;
  imagepromt: string | null;
}

const ManageIgPosts = ({ data }: { data: igpostsdataschema[] }) => {
  const router = useRouter();
  const { toast } = useToast()


  async function onDelete(postId: number) {
    const postDel = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ig/${postId}`, { method: "DELETE" })

    const post = await postDel.json();

    if (post.deletedId) {
      toast({
        variant: "default",
        description: "INSTAGRAM POST DELETED",
        className: "bg-green-400/20 backdrop-blur-lg"
      });
      router.push(`/ig/`)
    } else {
      toast({
        variant: "destructive",
        description: post.error,
      });
    }
  }

  function onEdit(postId: number) {
    router.push(`/ig/manage/${postId}`)
  }
  return (
    <div className="grid justify-items-center grid-cols-1 mx-auto gap-4 md:grid-cols-3">
      {data.map((igpost) => {
        return (
          <div className="max-w-md rounded overflow-hidden border shadow-lg" key={igpost.postid}>
            <img className="w-full" src={`data:image/png;base64, ${igpost.imageurl}`} alt="Sunset in the mountains" />
            <div className="px-6 py-4">
              <p className="text-base">
                {igpost.caption}
              </p>
            </div>
            <div className="px-6 pt-4 pb-2">
              {igpost.tags?.map((tag) => {
                return (<span className="inline-block bg-emerald-400/10 rounded-full px-3 py-1 text-sm font-semiboldmr-2 mx-1 my-2">{tag}</span>)
              })}
            </div>
            <hr />
            <div className="flex justify-center gap-2 mx-2 my-8">
              <Button variant="secondary" onClick={() => onEdit(igpost.postid)}>AI Edit</Button>
              {/* <Button variant="destructive" onClick={() => onDelete(igpost.postid)}>Delete</Button> */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(igpost.postid)}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )
      })}
    </div>

  )
}

export default ManageIgPosts