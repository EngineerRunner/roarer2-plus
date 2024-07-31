import { useAPI } from "../lib/api";
import { useShallow } from "zustand/react/shallow";
import { MarkdownInput } from "./MarkdownInput";
import { Checkbox } from "./Checkbox";

export const Settings = () => {
  return (
    <div className="px-2">
      <AccountSettings />
    </div>
  );
};

const AccountSettings = () => {
  const [credentials, users, loadUser, updateMe, settings, setSettings] =
    useAPI(
      useShallow((state) => [
        state.credentials,
        state.users,
        state.loadUser,
        state.updateMe,
        state.settings,
        state.setSettings,
      ]),
    );
  if (!credentials) {
    return;
  }
  loadUser(credentials.username);
  const user = users[credentials.username];

  return (
    !user ? "Loading profile..."
    : user.error ?
      <div>
        Failed to get your profile!
        <br />
        Message: {user.message}
      </div>
    : <div className="flex flex-col gap-2">
        <p className="font-bold">Quote:</p>
        <MarkdownInput
          onSubmit={async (quote: string) => updateMe({ quote })}
          value={user.quote ?? ""}
          attachments={false}
        />
        <label className="flex items-center gap-2">
          <Checkbox
            checked={settings.enterSend}
            onInput={(enterSend) => setSettings({ enterSend })}
          />
          <div>
            Send posts on Enter.
            <div className="text-sm">
              You can still type new lines by pressing Shift+Enter.
            </div>
          </div>
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={settings.avatarBorders}
            onInput={(avatarBorders) => setSettings({ avatarBorders })}
          />
          <div>Show colored borders on profile pictures</div>
        </label>
      </div>
  );
};
