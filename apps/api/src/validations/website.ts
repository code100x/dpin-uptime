import { z } from "zod";

export const WebsiteDataValidation = z.object({
  url: z.string().url({ message: "Invalid URL format" }),
});
