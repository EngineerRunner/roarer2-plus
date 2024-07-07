import { ReactNode } from "react";
import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Popup } from "./Popup";
import { UserView } from "./UserView";
import { useAPI } from "../lib/api";
import * as Dialog from "@radix-ui/react-dialog";

export type StoredAccountsProps = {
  children: ReactNode;
};
export const StoredAccounts = (props: StoredAccountsProps) => {
  const [storedAccounts, credentials] = useAPI(
    useShallow((state) => [state.storedAccounts, state.credentials]),
  );
  const accountEntries = Object.entries(storedAccounts);
  return (
    <Popup trigger={props.children} triggerAsChild className="min-w-72 px-0">
      <Dialog.Title>
        <p className="mx-4 text-lg font-bold">Choose an account</p>
      </Dialog.Title>
      {credentials && credentials.username in storedAccounts ? (
        <StoredAccount {...credentials} isLoggedIn />
      ) : undefined}
      {accountEntries.length ? (
        accountEntries.map(([username, token]) =>
          credentials?.username !== username ? (
            <StoredAccount username={username} token={token} key={username} />
          ) : undefined,
        )
      ) : (
        <div className="mx-4">
          You currently do not have any stored accounts.
        </div>
      )}
    </Popup>
  );
};

type StoredAccountProps = {
  username: string;
  token: string;
  isLoggedIn?: boolean;
};
const StoredAccount = (props: StoredAccountProps) => {
  const [logIn, removeStoredAccount] = useAPI(
    useShallow((state) => [state.logIn, state.removeStoredAccount]),
  );
  return (
    <div className="flex">
      <UserView
        username={props.username}
        secondary
        disabled={props.isLoggedIn}
        onClick={() =>
          logIn(props.username, props.token, {
            signUp: false,
            keepLoggedIn: true,
            storeAccount: true,
          })
        }
        text={props.isLoggedIn ? "Logged in" : undefined}
        className="px-4"
      />
      <button
        aria-label="Remove"
        className="bg-white px-4 py-1 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
        onClick={() => removeStoredAccount(props.username)}
      >
        <X aria-hidden />
      </button>
    </div>
  );
};
