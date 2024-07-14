"use client"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggler } from "./theme-toggle";
import { ArrowRight, Github } from "lucide-react";
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

const formSchema = z.object({
  userquery: z.string().min(3, {
    message: "User Topics must be at least 3 characters.",
  }),
})

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
  }



export default function Home() {
  

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userquery: "",
    },
  })
  return (
    <>
      <div className="flex flex-col relative mx-auto h-screen w-full max-w-7xl px-6 md:px-8 lg:px-12">

        <header className="flex items-center justify-between py-8">
          <p className="text-lg animate-text-gradient inline-flex bg-gradient-to-r from-neutral-900 via-slate-500 to-neutral-500 bg-[200%_auto] bg-clip-text leading-tight text-transparent dark:from-neutral-100 dark:via-slate-400 dark:to-neutral-400">GPT-Instagram</p>
          <nav className="flex justify-between gap-6">
            <ThemeToggler />
          </nav>
        </header>

        <div className="pt-8 grow">
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-2">
            <div className="mb-8 flex">
              <span className="relative inline-block overflow-hidden rounded-full p-[1px]">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#a9a9a9_0%,#0c0c0c_50%,#a9a9a9_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#171717_0%,#737373_50%,#171717_100%)]" />
                <div className="inline-flex h-full w-full cursor-pointer justify-center rounded-full bg-white px-3 py-1 text-xs font-medium leading-5 text-slate-600 backdrop-blur-xl dark:bg-black dark:text-slate-200">
                  ⚡️⚡️⚡️ Multi Agent Instagram AI ........ Viral Posts with your personality ⚡️⚡️⚡️
                  <span className="inline-flex items-center pl-2 text-black dark:text-white">
                    {' '}
                  </span>
                </div>
              </span>
            </div>
            <p className="text-center mb-2 text-2xl font-medium animate-text-gradient inline-flex bg-gradient-to-r from-neutral-900 via-slate-500 to-neutral-500 bg-[200%_auto] bg-clip-text leading-tight text-transparent dark:from-neutral-100 dark:via-slate-400 dark:to-neutral-400 text-gray-900 dark:text-gray-50 sm:text-6xl">

              <span className="animate-text-gradient inline-flex bg-gradient-to-r from-neutral-900 via-slate-500 to-neutral-500 bg-[200%_auto] bg-clip-text leading-tight text-transparent dark:from-neutral-100 dark:via-slate-400 dark:to-neutral-400">
                GPT-Instagram{' '}
              </span>
            </p>
            <p className="mt-6 text-center text-lg leading-6 text-gray-600 dark:text-gray-200">
              A Multi Agent Instagram AI to generate post recomendations on a user given topic with user personality from historical User Instagram Posts.
            </p>
            <div className="mt-10 flex gap-4">

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="userquery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posts Based on Toics</FormLabel>
                        <FormControl>
                          <Input placeholder="user query here" {...field} />
                        </FormControl>
                        <FormDescription>
                          Add related topics keywords here. eg "US ELECTIONS 2024","Latest Viral News"
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">
                    Start Recommendation Engine <ArrowRight className="pl-0.5" size={16} />
                  </Button>{' '}
                </form>
              </Form>


            </div>
          </div>
        </div>
        <footer className="py-6">
          <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-sm">© 2024 GPT-Instagram by MODSetter</p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Link className="text-gray-400 hover:text-blue-500 transition-colors" href="https://github.com/MODSetter/next-toggle" rel="noopener noreferrer">
                <Github className="h-6 w-6" />
                <span className="sr-only">GitHub</span>
              </Link>

            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
