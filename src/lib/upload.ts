import { z } from "zod";
import { useAPI } from "./api";
import { byteToHuman } from "./byteToHuman";
import { uploads } from "./servers";

const ICON_MAX_SIZE = 5 << 20;
const ATTACHMENT_MAX_SIZE = 25 << 20;

export type UploadReturn =
  | { error: true; message: string }
  | { error: false; response: UploadedFile };
export const uploadFile = async (
  file: File,
  type: "icons" | "attachments",
): Promise<UploadReturn> => {
  const token = useAPI.getState().credentials?.token;
  if (!token) {
    return {
      error: true,
      message: "You need to be logged in to upload an image.",
    };
  }

  const maxSize = type === "icons" ? ICON_MAX_SIZE : ATTACHMENT_MAX_SIZE;
  if (file.size > maxSize) {
    return {
      error: true,
      message: `This image is too big! Please keep it at or under ${byteToHuman(maxSize)}.`,
    };
  }

  const form = new FormData();
  form.set("file", file);
  let response;
  try {
    response = IMAGE_SCHEMA.parse(
      await (
        await fetch(`${uploads}/${type}`, {
          method: "POST",
          body: form,
          headers: { Authorization: token },
        })
      ).json(),
    );
  } catch (e) {
    return { error: true, message: (e as Error).message };
  }
  return { error: false, response: response };
};

const IMAGE_SCHEMA = z.object({
  bucket: z.string(),
  claimed: z.boolean(),
  filename: z.string(),
  hash: z.string(),
  id: z.string(),
  uploaded_at: z.number(),
  uploaded_by: z.string(),
});

export type UploadedFile = z.infer<typeof IMAGE_SCHEMA>;
