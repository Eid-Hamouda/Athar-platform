import { api } from "@/lib/api";
import type { ExpressUser, UpdateProfileRequest } from "@/types/api";

export const userService = {
  getMe(): Promise<ExpressUser> {
    return api.get<ExpressUser>("/users/me");
  },

  updateMe(payload: UpdateProfileRequest): Promise<ExpressUser> {
    return api.patch<ExpressUser>("/users/me", payload);
  },

  uploadAvatar(file: File): Promise<ExpressUser> {
    const form = new FormData();
    form.append("avatar", file);
    return api.post<ExpressUser>("/users/me/avatar", form, { isFormData: true });
  },

  getById(id: string): Promise<ExpressUser> {
    return api.get<ExpressUser>(`/users/${id}`);
  },
};
