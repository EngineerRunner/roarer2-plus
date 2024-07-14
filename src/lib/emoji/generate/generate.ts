/**
 * @module
 * This program is used to generate the emoji list at ../data/emoji.json.
 * It is never used in the browser.
 *
 * Run with:
 * ```
 * pnpm generate-emoji
 * ```
 *
 * (Requires Deno)
 */

import { z } from "npm:zod";

const RESPONSE_SCHEMA = z.object({
  categories: z
    .object({
      id: z.string(),
      emojis: z.string().array(),
    })
    .array(),
  emojis: z.record(
    z.string(),
    z.object({
      id: z.string(),
      name: z.string(),
      keywords: z.string().array(),
      skins: z
        .object({
          unified: z.string(),
          native: z.string(),
        })
        .array(),
    }),
  ),
});

const CATEGORY_EMOJI: Record<string, string> = {
  people: "😀",
  nature: "🐻",
  foods: "🍏",
  activity: "🎁",
  places: "🌍",
  objects: "👑",
  symbols: "🔡",
  flags: "🚩",
};

const data = RESPONSE_SCHEMA.parse(
  await (
    await fetch(
      "https://raw.githubusercontent.com/missive/emoji-mart/main/packages/emoji-mart-data/sets/15/all.json",
    )
  ).json(),
);
const emoji = data.categories.map((category) => {
  const categoryEmoji = CATEGORY_EMOJI[category.id];
  if (!categoryEmoji) {
    throw new Error(`No category emoji for ${category.id}, please supply one`);
  }
  const emoji = category.emojis.map((emoji) => {
    const emojiData = data.emojis[emoji];
    if (!emojiData) {
      throw new Error(`No data for ${emoji}`);
    }
    const skins = emojiData.skins.map((skin) => skin.native);
    return skins;
  });
  return {
    id: category.id,
    categoryEmoji: categoryEmoji,
    emoji: category.id === "flags" ? emoji.toSorted() : emoji,
  };
});
await Deno.writeTextFile("src/lib/emoji/data/data.json", JSON.stringify(emoji));
