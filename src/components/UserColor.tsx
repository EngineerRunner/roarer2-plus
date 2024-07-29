import { CSSProperties, ReactNode } from "react";
import { useAPI } from "../lib/api";
import { useShallow } from "zustand/react/shallow";
import { hsla, parseToHsla } from "color2k";

export type UserColorProps = {
  children: ReactNode;
  username: string;
};
export const UserColor = (props: UserColorProps) => {
  const [users, loadUser] = useAPI(
    useShallow((state) => [state.users, state.loadUser]),
  );
  loadUser(props.username);
  const user = users[props.username];

  if (!user || user.error) {
    return <span>{props.children}</span>;
  }

  const [h, s, _l, a] = (() => {
    try {
      return parseToHsla(`#${user.avatar_color}`);
    } catch {
      return [0, 0, 0, 1];
    }
  })();
  return (
    <span
      className="text-[var(--dark)] dark:text-[var(--light)]"
      style={
        {
          "--light": hsla(h, s - 0.2, 0.8, a),
          "--dark": hsla(h, s, 0.4, a),
        } as CSSProperties
      }
    >
      {props.children}
    </span>
  );
};
