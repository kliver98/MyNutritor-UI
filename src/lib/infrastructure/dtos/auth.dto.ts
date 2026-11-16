import { z } from 'zod';

export const UserRoleDtoSchema = z.union([
  z.literal('admin'),
  z.literal('user'),
  z.literal('ADMIN'),
  z.literal('USER'),
  z.literal('1'),
  z.literal('2'),
  z.number(),
  z.string()
]);

export const UserDtoSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String).optional(),
    userId: z.union([z.string(), z.number()]).transform(String).optional(),
    username: z.string(),
    email: z.string().optional().default(''),
    full_name: z.string().nullable().optional(),
    fullName: z.string().nullable().optional(),
    role: UserRoleDtoSchema.optional().default('user'),
    roleId: z.union([z.string(), z.number()]).optional(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional(),
    updated_at: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
    lastUpdated: z.union([z.string(), z.number()]).optional()
  })
  .passthrough();

export type UserDto = z.infer<typeof UserDtoSchema>;

export const LoginResponseDtoSchema = z
  .object({
    access_token: z.string().optional(),
    accessToken: z.string().optional(),
    token: z.string().optional(),
    token_type: z.string().optional().default('Bearer'),
    tokenType: z.string().optional().default('Bearer'),
    user: UserDtoSchema.optional()
  })
  .passthrough();

export type LoginResponseDto = z.infer<typeof LoginResponseDtoSchema>;

export const RegisterResponseDtoSchema = z
  .object({
    access_token: z.string().optional(),
    accessToken: z.string().optional(),
    token: z.string().optional(),
    token_type: z.string().optional().default('Bearer'),
    user: UserDtoSchema.optional()
  })
  .passthrough();

export type RegisterResponseDto = z.infer<typeof RegisterResponseDtoSchema>;
