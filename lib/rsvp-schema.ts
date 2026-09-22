import { z } from "zod";

export const rsvpSchema = z
  .object({
    name: z.string().trim().min(2, "Nome muito curto").max(120),
    email: z.string().trim().toLowerCase().email("E-mail inválido").max(200),
    phone: z.string().trim().max(30).nullish(),
    attending: z.enum(["yes", "no"]),
    guests: z.coerce.number().int().min(0).max(6).nullish(),
    guestNames: z.string().trim().max(600).nullish(),
    diet: z.string().trim().max(400).nullish(),
    message: z.string().trim().max(1200).nullish(),
  })
  .transform((data) => {
    const yes = data.attending === "yes";
    return {
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      attending: data.attending,
      guests: yes ? Math.min(6, Math.max(0, data.guests ?? 0)) : 0,
      guestNames: yes ? (data.guestNames ?? "") : "",
      diet: yes ? (data.diet ?? "") : "",
      message: data.message ?? "",
    };
  });

export type RsvpInput = z.infer<typeof rsvpSchema>;