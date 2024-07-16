"use client"
import { Button } from '@/components/ui/button';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation";


const formSchema = z.object({
  userquery: z.string().min(3, {
    message: "User Feedback must be at least 3 characters.",
  }),
})

interface ManagePageProps {
  params: { id: number };
}

interface PostSchema {
  postid: number;
  imageurl: string | null;
  imagepromt: string | null;
  caption: string | null;
  tags: string[] | null;
}

const ManagePost = ({
  params: { id },
}: ManagePageProps) => {
  const router = useRouter();
  const { toast } = useToast()

  const [post, setPost] = useState<PostSchema | null>(null);

  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ig/${id}`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        setPost(data)
      })
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userquery: "",
    },
  })

  //submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    const req = {
      userfeedback: values.userquery,
      posttoedit: post
    }

    // console.log(req)
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    };
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ig/edit`, requestOptions);

    const res = await response.json();

    if (res.imageurl) {
      setPost(res);
      toast({
        variant: "default",
        description: "POST MODDED",
        className: "bg-green-400/20 backdrop-blur-lg"
      });
    } else {
      toast({
        variant: "destructive",
        description: res.error,
      });

    }

    setLoading(false)
  }


  async function onSave(postToSave: PostSchema) {
    const requestOptions = {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postToSave),
    };
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ig/save`, requestOptions);

    const res = await response.json();

    if (res.updatedId) {
      toast({
        variant: "default",
        description: "POST Saved",
        className: "bg-green-400/20 backdrop-blur-lg"
      });

      router.push(`/ig/`)
    } else {
      toast({
        variant: "destructive",
        description: res.error,
      });
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div role="status">
          <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
        AI AGENT WORKING (estimated wait: 30 sec)
      </div>
    )

  } else {
    if (post) {
      return (
        <div className='grid place-content-center'>
          <div className="max-w-md rounded overflow-hidden border shadow-lg">
            <img className="w-full" src={`data:image/png;base64, ${post.imageurl}`} alt="Sunset in the mountains" />
            <div className="px-6 py-4">
              <p className="text-base">
                {post.caption}
              </p>
            </div>
            <div className="px-6 pt-4 pb-2">
              {post.tags?.map((tag) => {
                return (<span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">{tag}</span>)
              })}
            </div>
            <hr />
            <div className="flex flex-col justify-center gap-2 mx-2 my-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="userquery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Edit or Save</FormLabel>
                        <FormControl>
                          <Input placeholder="instructions here" {...field} />
                        </FormControl>
                        <FormDescription>
                          Add Your Instructions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='flex flex-col'>
                    <Button variant="secondary" type='submit'>Edit</Button>
                  </div>

                </form>
              </Form>
              <Button variant="destructive" onClick={() => onSave(post)}>Save</Button>
            </div>

          </div>
        </div>
      )
    }
  }



}

export default ManagePost