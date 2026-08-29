"use server"

import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { ActionResult } from "@/lib/validation/action-result";
import { uploadAvatarSchema } from "@/lib/validation/file";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { flattenError } from "zod";

export async function updateAvatarAction(
  _prevState: ActionResult<{ url: string }> | null,
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return {
      success: false,
      message: "Unauthorized"
    }
  };

  const result = uploadAvatarSchema.safeParse({
    avatar: formData.get("avatar"),
  });

  if (!result.success) {
    return { success: false, errors: flattenError(result.error).fieldErrors };
  }

  try {
    const { url } = await uploadImage(result.data.avatar, {
      folder: "avatars",
      publicId: session.user.id
    });

    await db.user.update({
      where: { id: session.user.id},
      data: {image: url}
    });

    revalidatePath("/dashboard/settings");
    return {
      success: true,
      data: {url}
    }
  } catch (error) {
    return {
      success: false,
      message: "Gagal upload avatar baru"
    }
  }
}
