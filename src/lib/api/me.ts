import { z } from "zod";
import { Slice } from ".";
import { api } from "../servers";
import { request, Errorable } from "./utils";

type UpdateConfig = {
  pfp_data?: number;
  avatar?: string;
  avatar_color?: string;
  quote?: string;
  pronouns?: string;
};

export type MeSlice = {
  updateMe: (config: UpdateConfig) => Promise<Errorable>;
};
export const createMeSlice: Slice<MeSlice> = (_set, get) => {
  return {
    updateMe: async (config) => {
      const state = get();
      const response = await request(
        fetch(`${api}/me/config`, {
          method: "PATCH",
          headers: {
            ...(state.credentials ? { Token: state.credentials.token } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(config),
        }),
        z.object({}),
      );
      if (response.error) {
        return response;
      }
      return { error: false };
    },
  };
};
