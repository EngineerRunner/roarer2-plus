import { useShallow } from "zustand/react/shallow";
import { useAPI } from "../lib/api";

export type UsernameProps = {
  username: string;
};
export const Username = (props: UsernameProps) => {
  const [users, loadUser] = useAPI(
    useShallow((state) => [state.users, state.loadUser]),
  );
  loadUser(props.username);

  const user = users[props.username];

  return user && !user.error ? user._id : props.username;
};
