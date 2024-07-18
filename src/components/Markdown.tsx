import { Fragment, ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";
import Marked from "marked-react";
import { codeToHtml } from "shiki";
import { urlFromDiscordEmoji } from "../lib/discordEmoji";
import { hostWhitelist } from "../lib/hostWhitelist";
import { Mention } from "./Mention";
import { User } from "./User";
import { Scratchblocks } from "./Scratchblocks";

const TEXT_REGEX =
  /(?:@(?<mention>[a-zA-Z0-9\-_]+)|(?<emoji>\<(?<emojiAnimated>a?):(?<emojiName>\w+):(?<emojiId>\d+)>)|[^@\<]+|.)/g;

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
};
export const Markdown = (mdProps: MarkdownProps) => {
  const md = mdProps.children;
  return (
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
          return <Link href={href} children={text} key={getKey()} />;
        },
        image: (src, alt, title) =>
          mdProps.inline ? <></>
          : hostWhitelist.some((host) => src.startsWith(host)) ?
            <img
              src={src}
              alt={alt}
              title={title ?? ""}
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
              {matches.map((match) => (
                <Fragment key={getKey()}>
                  {match.groups?.mention ?
                    <Mention username={match[0].slice(1)} />
                  : match.groups?.emoji ?
                    <img
                      className="inline-block"
                      src={urlFromDiscordEmoji({
                        name: match.groups?.emojiName ?? "",
                        id: match.groups?.emojiId ?? "",
                        isGif: !!match.groups?.emojiAnimated,
                      })}
                      alt={`:${match.groups?.emojiName}:`}
                    />
                  : match[0]}
                </Fragment>
              ))}
            </Fragment>
          );
        },
      }}
    >
      {md}
    </Marked>
  );
};

type LinkProps = {
  href: string;
  children?: ReactNode;
};
const Link = (props: LinkProps) => {
  const match = props.href.match(
    /^https?:\/\/app.meower.org\/users\/([a-z0-9\-_]+)$/i,
  );
  if (match) {
    const username = match[1]!;
    return (
      <User username={username} key={getKey()}>
        <button type="button" className="font-bold text-lime-600">
          {props.children}
        </button>
      </User>
    );
  }
  return (
    <a
      href={props.href}
      className="font-bold text-lime-600"
      key={getKey()}
      target="_blank"
    >
      {props.children}
    </a>
  );
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
