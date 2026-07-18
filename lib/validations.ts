import { z } from "zod";
import { UPLOAD_LIMITS } from "@/lib/constants";

const usernameSchema = z
  .string()
  .min(3, "Minimo de 3 caracteres")
  .max(30, "Maximo de 30 caracteres")
  .regex(/^[a-z0-9_.]+$/, "Use apenas letras minusculas, numeros, ponto e underline");

const passwordSchema = z
  .string()
  .min(8, "Minimo de 8 caracteres")
  .regex(/[A-Z]/, "Inclua ao menos uma letra maiuscula")
  .regex(/[0-9]/, "Inclua ao menos um numero");

export const loginSchema = z.object({
  email: z.string().email("E-mail invalido"),
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome completo").max(100),
  username: usernameSchema,
  email: z.string().email("E-mail invalido"),
  password: passwordSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail invalido"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const changePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const channelSchema = z.object({
  name: z.string().min(2, "Minimo de 2 caracteres").max(60),
  slug: z
    .string()
    .min(3, "Minimo de 3 caracteres")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minusculas, numeros e hifen"),
  description: z.string().max(1000).optional(),
});
export type ChannelInput = z.infer<typeof channelSchema>;

export const videoUploadSchema = z.object({
  title: z.string().min(3, "Minimo de 3 caracteres").max(150),
  description: z.string().max(5000).optional(),
  categoryId: z.string().uuid().optional(),
  channelId: z.string().uuid(),
  videoFile: z
    .instanceof(File)
    .refine((file) => file.size <= UPLOAD_LIMITS.maxVideoSizeBytes, "Video maior que 2GB")
    .refine(
      (file) => (UPLOAD_LIMITS.allowedVideoTypes as readonly string[]).includes(file.type),
      "Formato de video nao suportado"
    ),
  thumbnailFile: z
    .instanceof(File)
    .refine((file) => file.size <= UPLOAD_LIMITS.maxThumbnailSizeBytes, "Thumbnail maior que 5MB")
    .refine(
      (file) => (UPLOAD_LIMITS.allowedImageTypes as readonly string[]).includes(file.type),
      "Formato de imagem nao suportado"
    )
    .optional(),
});
export type VideoUploadInput = z.infer<typeof videoUploadSchema>;

export const commentSchema = z.object({
  videoId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  content: z.string().min(1, "Escreva algo antes de enviar").max(2000),
});
export type CommentInput = z.infer<typeof commentSchema>;

export const playlistSchema = z.object({
  title: z.string().min(2, "Minimo de 2 caracteres").max(100),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(true),
});
export type PlaylistInput = z.infer<typeof playlistSchema>;
