import { useEffect, useRef } from "react";
import "@hcaptcha/vanilla-hcaptcha";
import { VanillaHCaptchaWebComponent } from "@hcaptcha/vanilla-hcaptcha";

// todo: make customizable
const SITEKEY = "4c12844a-bb0e-4d3d-a12d-a59f6a6c4afb";

export type CatchaProps = {
  onVerify: (token: string) => void;
  onExpire: () => void;
};
export const Captcha = (props: CatchaProps) => {
  const element = useRef<VanillaHCaptchaWebComponent | null>(null);

  useEffect(() => {
    element.current?.addEventListener("verified", (e_) => {
      const e = e_ as Event & { token: string };
      props.onVerify(e.token);
    });
    element.current?.addEventListener("expired", () => {
      props.onExpire();
    });
  }, []);

  // @ts-expect-error - h-captcha is not a react element
  return <h-captcha site-key={SITEKEY} ref={element} />;
};

export const isCaptcha = (element: HTMLElement) =>
  element.tagName === "IFRAME" &&
  (element as HTMLIFrameElement).src.startsWith(
    "https://newassets.hcaptcha.com/",
  );
