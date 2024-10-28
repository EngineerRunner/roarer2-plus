import { Fragment, useState } from "react";
import { twMerge } from "tailwind-merge";
import Marked from "marked-react";
import { codeToHtml } from "shiki";
import { urlFromDiscordEmoji } from "../lib/discordEmoji";
import { hostWhitelist } from "../lib/hostWhitelist";
import { Mention } from "./Mention";
import { User } from "./User";
import { Scratchblocks } from "./Scratchblocks";

const MENTION_REGEX = /@(?<mention>[a-zA-Z0-9\-_]+)/g;
const EMOJI_REGEX =
  /(?<emoji><(?<emojiAnimated>a?):(?<emojiName>\w+):(?<emojiId>\d+)>)/g;
const NATIVE_EMOJI_REGEX = /(?:<:(?<nativeEmojiID>[a-zA-Z0-9]+)>)/;
const ESCAPES_REGEX = /(?:(?<lt>&lt;)|(?<gt>&gt;))/;
const TEXT_REGEX = new RegExp(
  `(?:${MENTION_REGEX.source}|${EMOJI_REGEX.source}|${ESCAPES_REGEX.source}|${NATIVE_EMOJI_REGEX.source}|[^@\<&]+|.)`,
  "g",
);
// It's inlined because Microsoft Edge literally crashes if I don't do that
const BIG_REGEX =
  /^(?:\p{Emoji_Presentation}|(?<emoji><(?<emojiAnimated>a?):(?<emojiName>\w+):(?<emojiId>\d+)>)|(?:<:(?<nativeEmojiID>[a-zA-Z0-9]+)>)|\s)+$/gu;

const HEADING_TO_SIZE = {
  1: "text-2xl",
  2: "text-xl",
  3: "text-lg",
  4: "text-md",
  5: "text-sm",
  6: "text-xs",
} as const;

let id = 0;
const getKey = () => id++;

export type MarkdownProps = {
  children: string;
  secondaryBackground?: boolean;
  inline?: boolean;
  bigEmoji?: boolean;
  knownEmoji?: { _id: string; name: string }[];
};
export const Markdown = (mdProps: MarkdownProps) => {
  const md = mdProps.children;
  const isBig =
    (mdProps?.bigEmoji ?? true) && !!mdProps.children.match(BIG_REGEX);
  return (
    <div className={isBig ? "text-2xl" : ""}>
      <Marked
        gfm
        breaks
        isInline={!!mdProps.inline}
        langPrefix=""
        renderer={{
          code: (code, lang) => {
            return (
              <pre
                className="my-1 overflow-auto rounded-lg bg-gray-800 px-1 py-0.5 text-gray-100 first:mt-0 last:mb-0"
                key={getKey()}
              >
                <SyntaxHighlight code={code?.toString()} lang={lang} />
              </pre>
            );
          },
          blockquote: (children) => (
            <blockquote
              className="my-1 border-l-2 border-lime-500 pl-2 first:mt-0 last:mb-0 dark:border-lime-600"
              key={getKey()}
            >
              {children}
            </blockquote>
          ),
          heading: (children, level) => (
            <p
              className={twMerge(
                "my-1 font-bold first:mt-0 last:mb-0",
                HEADING_TO_SIZE[level],
              )}
              key={getKey()}
            >
              {children}
            </p>
          ),
          hr: () => (
            <hr
              className="mx-12 my-1 border-current opacity-20 first:mt-0 last:mb-0"
              key={getKey()}
            />
          ),
          list: (children, ordered) => {
            const Tag = ordered ? "ol" : "ul";
            return (
              <Tag
                className={twMerge(
                  "my-1 table border-spacing-x-1 list-inside first:mt-0 last:mb-0",
                  ordered ? "list-decimal" : "list-disc",
                )}
                key={getKey()}
              >
                {children}
              </Tag>
            );
          },
          listItem: (children) => (
            <li className="table-row" key={getKey()}>
              <span className="table-cell text-right">
                <span className="list-item" />
              </span>
              <div className="table-cell">{children}</div>
            </li>
          ),
          checkbox: (checked) => (
            <Fragment key={getKey()}>
              <input
                className="mr-2"
                type="checkbox"
                checked={!!checked}
                readOnly
                aria-hidden
              />
              <span className="sr-only">{checked ? "Done" : "Not done"}</span>
            </Fragment>
          ),
          paragraph: (children) => (
            <p className="my-1 first:mt-0 last:mb-0" key={getKey()}>
              {children}
            </p>
          ),
          table: (children) => (
            <table
              className="my-1 border-collapse first:mt-0 last:mb-0"
              key={getKey()}
            >
              {children}
            </table>
          ),
          tableCell: (children, flags) => {
            const Tag = flags.header ? "th" : "td";
            return (
              <Tag
                className="border border-gray-300 px-2"
                style={{ textAlign: flags.align ?? "left" }}
                key={getKey()}
              >
                {children}
              </Tag>
            );
          },
          codespan: (code) => {
            const match = code?.toString()?.match(/^\((\w+)\) (.*)$/);
            return (
              <code
                className="rounded-lg bg-gray-800 px-1 py-0.5 text-gray-100"
                key={getKey()}
              >
                {match ?
                  <SyntaxHighlight lang={match[1]} code={match[2]} inline />
                : code}
              </code>
            );
          },
          link: (href, text) => {
            const match = href.match(
              /^https?:\/\/app.meower.org\/users\/([a-z0-9\-_]+)$/i,
            );
            if (match) {
              const username = match[1]!;
              return (
                <User username={username} key={getKey()}>
                  <button type="button" className="font-bold text-lime-600">
                    {text}
                  </button>
                </User>
              );
            }
            // meo has a bug where invalid URLs within images crash meo.
            // instead of fixing this, meo now does not support markdown
            // images. meo also supports simply putting an image url to load an
            // image. this leads to most meo users just sending links instead
            // of using the proper syntax. this copies meo's behavior for this
            // such that images sent using meo still look correct.
            // todo: if this is ever properly fixed in meo, this should be
            // removed
            if (
              !mdProps.inline &&
              hostWhitelist.some((host) => {
                if (typeof host !== "string" && !host.autolink) {
                  return;
                }
                const url = typeof host === "string" ? host : host.url;
                return url !== href && href.startsWith(url);
              })
            ) {
              return (
                <img
                  className="inline-block max-h-40"
                  src={href}
                  alt={href}
                  title={href}
                />
              );
            }
            return (
              <a
                href={urlFor(href)}
                className="font-bold text-lime-600"
                key={getKey()}
                target="_blank"
              >
                {text}
              </a>
            );
          },
          image: (src, alt, title) =>
            mdProps.inline ? <></>
            : (
              hostWhitelist.some((host) =>
                src.startsWith(typeof host === "string" ? host : host.url),
              )
            ) ?
              <img
                src={src}
                alt={alt}
                title={title ?? alt}
                className="inline-block max-h-40"
                key={getKey()}
              />
            : <a className="font-bold text-lime-600" href={src} key={getKey()}>
                {alt || "Unnamed image"}
              </a>,
          text: (text) => {
            const matches = [...(text?.toString() ?? "").matchAll(TEXT_REGEX)];
            return (
              <Fragment key={getKey()}>
                {matches.map((match) => {
                  if (match.groups?.mention) {
                    return (
                      <Mention key={getKey()} username={match[0].slice(1)} />
                    );
                  }
                  if (match.groups?.emoji) {
                    return (
                      <img
                        key={getKey()}
                        className="inline-block"
                        src={urlFromDiscordEmoji({
                          name: match.groups?.emojiName ?? "",
                          id: match.groups?.emojiId ?? "",
                          isGif: !!match.groups?.emojiAnimated,
                          big: isBig,
                        })}
                        alt={`:${match.groups?.emojiName}:`}
                        title={`:${match.groups?.emojiName}:`}
                      />
                    );
                  }
                  if (match.groups?.nativeEmojiID) {
                    const name = mdProps.knownEmoji?.find(
                      (e) => e._id === match.groups?.nativeEmojiID,
                    )?.name;
                    return (
                      <img
                        className={twMerge(
                          "inline-block",
                          isBig ? "h-9" : "h-6",
                        )}
                        src={`https://uploads.meower.org/emojis/${encodeURIComponent(match.groups.nativeEmojiID)}`}
                        alt={name}
                        title={name}
                      />
                    );
                  }
                  if (match.groups?.lt) {
                    return "<";
                  }
                  if (match.groups?.gt) {
                    return ">";
                  }
                  return match[0];
                })}
              </Fragment>
            );
          },
        }}
      >
        {md}
      </Marked>
    </div>
  );
};

const urlFor = (url: string) => {
  try {
    new URL(url);
    return url;
  } catch {
    return `https://${url}`;
  }
};

type SyntaxHighlightProps = {
  lang?: string;
  code?: string;
  inline?: boolean;
};
const SyntaxHighlight = (props: SyntaxHighlightProps) => {
  const [syntaxHighlighted, setSyntaxHighlighted] = useState("");
  if (props.lang === "scratch") {
    return <Scratchblocks code={props.code ?? ""} inline={props.inline} />;
  }
  if (props.lang) {
    codeToHtml(props.code ?? "", {
      lang: props.lang,
      theme: "github-dark-default",
      structure: "inline",
    }).then(setSyntaxHighlighted);
  }
  return syntaxHighlighted ?
      <span dangerouslySetInnerHTML={{ __html: syntaxHighlighted }} />
    : props.code;
};
