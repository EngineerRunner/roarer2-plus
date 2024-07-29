import { ReactNode, useState } from "react";
import { Cable, Cloud, CloudUpload } from "lucide-react";
import { Popup } from "./Popup";
import * as Dialog from "@radix-ui/react-dialog";
import { Input } from "./Input";
import { api, cl, uploads } from "../lib/servers";
import { Button } from "./Button";

export type ChangeServersProps = {
  children: ReactNode;
};

export const ChangeServers = (props: ChangeServersProps) => {
  const [apiValue, setApiValue] = useState(api);
  const [clValue, setClValue] = useState(cl);
  const [uploadsValue, setUploadsValue] = useState(uploads);
  const canSubmit = apiValue && clValue && uploadsValue;

  return (
    <Popup trigger={props.children} triggerAsChild>
      <Dialog.Title>
        <p className="mx-4 text-lg font-bold">Change servers</p>
      </Dialog.Title>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Cable className="h-6 w-6" />
          <Input
            label="API"
            defaultValue={api}
            required
            onInput={(e) => setApiValue(e.currentTarget.value)}
            value={apiValue}
          />
        </div>
        <div className="flex items-center gap-2">
          <Cloud className="h-6 w-6" />
          <Input
            label="Cloudlink"
            defaultValue={cl}
            required
            onInput={(e) => setClValue(e.currentTarget.value)}
            value={clValue}
          />
        </div>
        <div className="flex items-center gap-2">
          <CloudUpload className="h-6 w-6" />
          <Input
            label="Uploads"
            defaultValue={uploads}
            required
            onInput={(e) => setUploadsValue(e.currentTarget.value)}
            value={uploadsValue}
          />
        </div>
        <Button
          onClick={() =>
            location.replace(
              location.origin +
                location.pathname +
                `?api=${encodeURIComponent(apiValue)}&cl=${encodeURIComponent(clValue)}&uploads=${encodeURIComponent(uploadsValue)}`,
            )
          }
          disabled={!canSubmit}
        >
          Change
        </Button>
      </div>
    </Popup>
  );
};
