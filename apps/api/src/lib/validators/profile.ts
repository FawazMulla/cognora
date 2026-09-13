import { z } from "zod";

export const profileSchema = z.object({
  university: z.string().min(1, "University is required"),
  branch: z.string().min(1, "Branch is required"),
  semester: z.number().int().min(1).max(10),
  subjects: z.array(
    z.object({
      name: z.string().min(1),
      examDate: z.string().optional(),
    })
  ).optional(),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  examDate: z.string().optional(),
});
