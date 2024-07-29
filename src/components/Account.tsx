import { FormEvent, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "./Button";
import { isCaptcha, Captcha } from "./Captcha";
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
  const [storeAccount, setStoreAccount] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tosAgreed, setTosAgreed] = useState(false);
  const [captcha, setCaptcha] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const logIn = useAPI((store) => store.logIn);

  const canLogIn = username && password;
  const canSignUp =
    canLogIn && confirmPassword === password && tosAgreed && captcha;
  const canSubmit = mode === "sign in" ? canLogIn : canSignUp;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const loginResult = await logIn(username, password, {
      storeAccount,
      ...(mode === "sign up" ?
        { signUp: true, captcha: captcha ?? "" }
      : { signUp: false }),
    });
    if (loginResult.error) {
      setError(loginResult.message);
    }
    setLoading(false);
  };

  return (
    <Menu
      trigger={<Button>Sign in</Button>}
      contextMenu={false}
      contentProps={{
        onFocusOutside: (e) => {
          if (isCaptcha(e.target as HTMLElement)) {
            e.preventDefault();
          }
        },
      }}
    >
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
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
        {mode === "sign up" ?
          <Input
            label="Confirm password"
            placeholder="Confirm password"
            value={confirmPassword}
            type="password"
            required
            onInput={(e) => setConfirmPassword(e.currentTarget.value)}
          />
        : undefined}
        <label className="flex items-center gap-2">
          <Checkbox checked={storeAccount} onInput={setStoreAccount} />
          <span>Store account</span>
        </label>
        {mode === "sign up" ?
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
        : undefined}
        {mode === "sign up" ?
          <Captcha
            onVerify={setCaptcha}
            onExpire={() => setCaptcha(undefined)}
          />
        : undefined}
        {error ?
          <div className="text-red-500">{error}</div>
        : null}
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
    </Menu>
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
          <ProfilePicture
            size="w-7 h-7 min-w-7 min-h-7"
            username={props.username}
            dontShowOnline
          />
          <ChevronUp />
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
