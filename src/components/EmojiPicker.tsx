import { ReactNode, useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Tabs from "@radix-ui/react-tabs";
import { Menu, MenuItem } from "./Menu";
import { DiscordEmoji, discordEmoji } from "../lib/discordEmoji";
import { urlFromDiscordEmoji } from "../lib/discordEmoji";
import emojiCategories from "../lib/emoji/data/data.json";
import { ChevronDown } from "lucide-react";

const SKIN_TONE_STORAGE_KEY = "roarer2:emojiSkinTone";

export type EmojiPickerProps = {
  onEmoji: (emoji: DiscordEmoji | string) => void;
  discordEmoji?: boolean;
  trigger: ReactNode;
};
export const EmojiPicker = (props: EmojiPickerProps) => {
  const storageSkinTone = localStorage.getItem(SKIN_TONE_STORAGE_KEY);
  const numberStorageSkinTone = Number(storageSkinTone);
  const [skinTone, setSkinTone] = useState(
    storageSkinTone && !Number.isNaN(numberStorageSkinTone) ?
      numberStorageSkinTone
    : 0,
  );

  const allowDiscordEmoji = props.discordEmoji ?? true;

  useEffect(() => {
    localStorage.setItem(SKIN_TONE_STORAGE_KEY, skinTone.toString());
  }, [skinTone]);

  const skinToneEmoji = emojiCategories
    .find((category) => category.id === "people")
    ?.emoji.find((emoji) => emoji.length > 1);
  if (!skinToneEmoji) {
    throw new Error("No emoji with skin tones");
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{props.trigger}</Popover.Trigger>
      <Popover.Anchor />
      <Popover.Portal>
        <Popover.Content align="end" asChild sideOffset={4}>
          <div className="z-[--z-above-sidebar] w-80 rounded-lg border border-gray-200 bg-white px-2 py-1 dark:border-gray-800 dark:bg-gray-950">
            <Tabs.Root defaultValue={allowDiscordEmoji ? "meower" : "people"}>
              <Tabs.List className="mb-2 flex justify-center gap-2">
                {emojiCategories.map((category) => (
                  <Tabs.Trigger asChild value={category.id} key={category.id}>
                    <button
                      type="button"
                      aria-label={category.id}
                      className="border-b-2 border-transparent text-xl aria-selected:border-lime-500 aria-selected:dark:border-lime-600"
                    >
                      {category.categoryEmoji}
                    </button>
                  </Tabs.Trigger>
                ))}
                {allowDiscordEmoji ?
                  <Tabs.Trigger asChild value="meower">
                    <button
                      aria-label="Meower"
                      className="border-b-2 border-transparent text-xl aria-selected:border-lime-500 aria-selected:dark:border-lime-600"
                    >
                      ✨
                    </button>
                  </Tabs.Trigger>
                : undefined}
              </Tabs.List>
              {emojiCategories.map((category) => (
                <Tabs.Content value={category.id} key={category.id}>
                  <div className="grid max-h-80 grid-cols-7 flex-wrap justify-center gap-0 overflow-auto px-2">
                    {category.emoji.map((emoji) => {
                      const firstEmoji = emoji[0];
                      if (!firstEmoji) {
                        return undefined;
                      }
                      return (
                        <button
                          className="p-1 text-xl"
                          key={emoji.toString()}
                          onClick={() =>
                            props.onEmoji(emoji[skinTone] ?? firstEmoji)
                          }
                        >
                          {emoji[skinTone] ?? firstEmoji}
                        </button>
                      );
                    })}
                  </div>
                  {category.id === "people" ?
                    <div className="flex justify-end">
                      <Menu
                        trigger={
                          <button className="flex items-center gap-1 p-1 text-xl">
                            <span>
                              {skinToneEmoji[skinTone] ?? skinToneEmoji[0]}
                            </span>
                            <ChevronDown className="h-5 w-5" />
                          </button>
                        }
                      >
                        {skinToneEmoji.map((emoji, i) => (
                          <MenuItem
                            key={emoji}
                            aria-label={`Skin tone ${i}`}
                            onClick={() => setSkinTone(i)}
                          >
                            {emoji}
                          </MenuItem>
                        ))}
                      </Menu>
                    </div>
                  : undefined}
                </Tabs.Content>
              ))}
              {allowDiscordEmoji ?
                <Tabs.Content value="meower">
                  <div className="grid max-h-80 grid-cols-7 flex-wrap justify-center gap-0 overflow-auto px-2">
                    {discordEmoji.map((emoji) => (
                      <button
                        key={emoji.id}
                        className="box-content h-6 w-6 p-1"
                        title={`:${emoji.name}:`}
                        onClick={() => props.onEmoji(emoji)}
                      >
                        <img
                          src={urlFromDiscordEmoji(emoji)}
                          alt={emoji.name}
                        />
                      </button>
                    ))}
                  </div>
                </Tabs.Content>
              : undefined}
            </Tabs.Root>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
