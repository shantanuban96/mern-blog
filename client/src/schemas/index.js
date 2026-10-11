import { z } from 'zod';

// Form validation rules. They match the Joi rules on the server,
// so users see errors instantly instead of after a request.

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
    email,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72)
      .regex(/[A-Za-z]/, 'Password must contain a letter')
      .regex(/\d/, 'Password must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const postSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  content: z.string().trim().min(10, 'Content must be at least 10 characters').max(20000),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(1000),
});

// Returns { data } when valid, or { errors: { field: message } } when not
export function validateForm(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data, errors: null };

  const errors = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0];
    if (!errors[field]) errors[field] = issue.message;
  });
  return { data: null, errors };
}
