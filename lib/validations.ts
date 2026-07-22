import { z } from "zod";
import { UPLOAD_LIMITS } from "@/lib/constants";

export const usernameSchema = z
  .string()
  .min(3, "Mínimo de 3 caracteres")
  .max(30, "Máximo de 30 caracteres")
  .regex(/^[a-z0-9_.]+$/, "Use apenas letras minúsculas, números, ponto e underline");

const passwordSchema = z
  .string()
  .min(8, "Mínimo de 8 caracteres")
  .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula")
  .regex(/[0-9]/, "Inclua ao menos um número");

export const loginSchema = z.object({
  // Aceita nome de usuario (contas novas) ou e-mail (contas criadas antes
  // da migracao para login por usuario) — por isso nao usa usernameSchema
  // aqui, que rejeitaria o "@" de um e-mail.
  identifier: z.string().min(1, "Informe seu usuário ou e-mail"),
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome completo").max(100),
  username: usernameSchema,
  password: passwordSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const changePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const channelSchema = z.object({
  name: z.string().min(2, "Mínimo de 2 caracteres").max(60),
  slug: z
    .string()
    .min(3, "Mínimo de 3 caracteres")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  description: z.string().max(1000).optional(),
});
export type ChannelInput = z.infer<typeof channelSchema>;

export const videoUploadSchema = z.object({
  title: z.string().min(3, "Mínimo de 3 caracteres").max(150),
  description: z.string().max(5000).optional(),
  categoryId: z.string().uuid().optional(),
  channelId: z.string().uuid(),
  videoFile: z
    .instanceof(File)
    .refine((file) => file.size <= UPLOAD_LIMITS.maxVideoSizeBytes, "Vídeo maior que 2GB")
    .refine(
      (file) => (UPLOAD_LIMITS.allowedVideoTypes as readonly string[]).includes(file.type),
      "Formato de vídeo não suportado"
    ),
  thumbnailFile: z
    .instanceof(File)
    .refine((file) => file.size <= UPLOAD_LIMITS.maxThumbnailSizeBytes, "Thumbnail maior que 5MB")
    .refine(
      (file) => (UPLOAD_LIMITS.allowedImageTypes as readonly string[]).includes(file.type),
      "Formato de imagem não suportado"
    )
    .optional(),
});
export type VideoUploadInput = z.infer<typeof videoUploadSchema>;

export const createDraftVideoSchema = z.object({
  channelId: z.string().uuid(),
  title: z.string().min(3, "Mínimo de 3 caracteres").max(150),
  description: z.string().max(5000),
  categoryId: z.string().uuid().nullable(),
  durationSeconds: z.number().int().min(0).max(24 * 60 * 60),
  isShort: z.boolean().optional(),
});

export const updateVideoSchema = z.object({
  title: z.string().min(3, "Mínimo de 3 caracteres").max(150),
  description: z.string().max(5000),
  categoryId: z.string().uuid().nullable(),
});

export const videoModerationSchema = z.object({
  videoId: z.string().uuid(),
  status: z.enum(["published", "rejected"]),
  rejectionReason: z.string().max(1000).optional(),
});

export const commentSchema = z.object({
  videoId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  content: z.string().min(1, "Escreva algo antes de enviar").max(2000),
});
export type CommentInput = z.infer<typeof commentSchema>;

export const playlistSchema = z.object({
  title: z.string().min(2, "Mínimo de 2 caracteres").max(100),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(true),
});
export type PlaylistInput = z.infer<typeof playlistSchema>;
