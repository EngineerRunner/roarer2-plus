import { FormEvent, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown } from "lucide-react";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import { ProfilePicture } from "./ProfilePicture";
import { Menu, MenuItem } from "./Menu";
import { StoredAccounts } from "./StoredAccounts";
import { useAPI } from "../lib/api";

export const Account = () => {
  const credentials = useAPI((store) => store.credentials);

  return credentials ? <AccountMenu {...credentials} /> : <SignInButton />;
};

const SignInButton = () => {
  const [mode, setMode] = useState<"sign in" | "sign up">("sign in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [storeAccount, setStoreAccount] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tosAgreed, setTosAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const logIn = useAPI((store) => store.logIn);

  const canLogIn = username && password;
  const canSignUp = canLogIn && confirmPassword === password && tosAgreed;
  const canSubmit = mode === "sign in" ? canLogIn : canSignUp;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const loginResult = await logIn(username, password, {
      signUp: mode === "sign up",
      keepLoggedIn,
      storeAccount,
    });
    if (loginResult.error) {
      setError(loginResult.message);
    }
    setLoading(false);
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button>Sign in</Button>
      </Popover.Trigger>
      <Popover.Anchor />
      <Popover.Portal>
        <Popover.Content asChild align="end" sideOffset={4}>
          <form
            className="z-[--z-above-sidebar] flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 dark:border-gray-800 dark:bg-gray-950"
            onSubmit={handleSubmit}
          >
            <Input
              label="Username"
              placeholder="Username"
              value={username}
              type="text"
              required
              onInput={(e) => setUsername(e.currentTarget.value)}
            />
            <Input
              label="Password"
              placeholder="Password"
              value={password}
              type="password"
              required
              onInput={(e) => setPassword(e.currentTarget.value)}
            />
            {mode === "sign up" ? (
              <Input
                label="Confirm password"
                placeholder="Confirm password"
                value={confirmPassword}
                type="password"
                required
                onInput={(e) => setConfirmPassword(e.currentTarget.value)}
              />
            ) : undefined}
            <label className="flex items-center gap-2">
              <Checkbox checked={keepLoggedIn} onInput={setKeepLoggedIn} />
              <span>Keep me logged in</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={keepLoggedIn ? storeAccount : false}
                onInput={setStoreAccount}
                disabled={!keepLoggedIn}
              />
              <span>Store account</span>
            </label>
            {mode === "sign up" ? (
              <label className="flex items-center gap-2">
                <Checkbox checked={tosAgreed} onInput={setTosAgreed} />
                <span>
                  I agree to Meower's{" "}
                  <a
                    className="font-bold text-lime-600"
                    target="_blank"
                    href="https://meower.org/legal"
                  >
                    terms
                  </a>
                  .
                </span>
              </label>
            ) : undefined}
            {error ? <div className="text-red-500">{error}</div> : null}
            <div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="grow"
                  disabled={!canSubmit || loading}
                >
                  {mode === "sign in" ? "Sign in" : "Sign up"}
                </Button>
                <Button
                  type="button"
                  secondary
                  onClick={() =>
                    setMode(mode === "sign in" ? "sign up" : "sign in")
                  }
                  disabled={loading}
                >
                  {mode === "sign in" ? "Sign up" : "Sign in"}
                </Button>
              </div>
              <div className="text-right">
                ...or use a{" "}
                <StoredAccounts>
                  <button className="inline font-bold text-lime-600">
                    stored account
                  </button>
                </StoredAccounts>
                .
              </div>
            </div>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

type AccountMenuProps = {
  username: string;
  token: string;
};
const AccountMenu = (props: AccountMenuProps) => {
  const signOut = useAPI((store) => store.signOut);

  return (
    <Menu
      trigger={
        <button type="button" className="flex items-center gap-1">
          <ProfilePicture username={props.username} dontShowOnline />
          <ChevronDown />
        </button>
      }
    >
      <span className="px-2 pt-1 text-sm font-bold">{props.username}</span>
      <StoredAccounts>
        {/* StoredAccounts doesn't seem to work when closing */}
        <MenuItem dontClose>Switch account</MenuItem>
      </StoredAccounts>
      <MenuItem onClick={signOut}>Sign out</MenuItem>
    </Menu>
  );
};
