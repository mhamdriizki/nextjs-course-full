"use server"

import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { ActionResult } from "@/lib/validation/action-result";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";


const MAX_SIZE = 2*1024*1024; // 2MB

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

  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size == 0) {
    return {
      success: false,
      message: "Pilih gambar terlebih dahulu"
    }
  }

  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      message: "File harus berupa gambar"
    };
  } 

  if (file.size > MAX_SIZE) {
    return {
      success: false,
      message: "Ukuran gambar maksimum 2MB"
    }
  }

  try {
    const { url } = await uploadImage(file, {
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