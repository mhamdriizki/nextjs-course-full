"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { createPostSchema, type CreatePostInput } from "@/lib/validation/post";
import { createPostFromObjectAction } from "./action";

export function CreatePostFormRHF() {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: "", slug: "", excerpt: "", content: "", published: false },
  });

  async function onSubmit(data: CreatePostInput) {
    const result = await createPostFromObjectAction(data);

    if (!result.success) {
      // Map error server ke field form masing-masing — bisa kejadian
      // walau client sudah lolos validasi (misal: slug ternyata sudah
      // dipakai post lain, baru ketahuan pas cek ke database di server).
      Object.entries(result.errors ?? {}).forEach(([field, messages]) => {
        if (messages?.[0]) {
          form.setError(field as keyof CreatePostInput, { message: messages[0] });
        }
      });
      return;
    }

    toast.success(`Post "${result.data.title}" berhasil dibuat`);
    form.reset();
    router.push(`/posts/${result.data.slug}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border rounded-lg p-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul Post</FormLabel>
              <FormControl>
                <Input placeholder="Judul..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="judul-artikel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ringkasan</FormLabel>
              <FormControl>
                <Input placeholder="Ringkasan singkat..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konten</FormLabel>
              <FormControl>
                <Textarea placeholder="Konten lengkap (opsional)..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <FormLabel>Publish sekarang?</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Post"}
        </Button>
      </form>
    </Form>
  );
}
