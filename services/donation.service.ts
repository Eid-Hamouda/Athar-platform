import { api } from "@/lib/api";
import type { DonationListParams, ExpressDonation } from "@/types/api";

function toQueryString(params: DonationListParams) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.status) query.set("status", params.status);
  if (params.condition) query.set("condition", params.condition);
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const donationService = {
  async list(params: DonationListParams = {}) {
    const { data, meta } = await api.getWithMeta<ExpressDonation[]>(
      `/donations${toQueryString(params)}`,
      { skipAuth: true }
    );
    return { donations: data, meta };
  },

  getById(id: string): Promise<ExpressDonation> {
    return api.get<ExpressDonation>(`/donations/${id}`, { skipAuth: true });
  },
};
