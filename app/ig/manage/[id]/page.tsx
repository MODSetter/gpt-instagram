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
  }


  async function onSave(postToSave: PostSchema) {
    // const req = {
    //   userfeedback: values.userquery,
    //   posttoedit: post
    // }

    // console.log(req)
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

      router.push(`/ig/manage/${id}`)
    } else {
      toast({
        variant: "destructive",
        description: res.error,
      });
    }
  }

  if (post) {
    return (
      <div className='grid place-content-center'>
        <div className="max-w-md rounded overflow-hidden shadow-lg">
          <img className="w-full" src={`data:image/png;base64, ${post.imageurl}`} alt="Sunset in the mountains" />
          <div className="px-6 py-4">
            <p className="text-gray-700 text-base">
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

export default ManagePost