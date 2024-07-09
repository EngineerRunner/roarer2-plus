import { CloudlinkClient } from "@williamhorning/cloudlink";
import { cl } from "../servers";

const toResolveOnInit: ((cloudlink: CloudlinkClient) => void)[] = [];

let cloudlinkClient: CloudlinkClient | null = null;
//  = new CloudlinkClient({
//   url: cl,
//   log: import.meta.env.DEV,
// });
export const initCloudlink = (newToken: string | null) => {
  if (cloudlinkClient) {
    throw new Error("Cloudlink is already initialized");
  }
  const client = new CloudlinkClient({
    url: cl + `?v=1${newToken ? `&token=${encodeURIComponent(newToken)}` : ""}`,
    log: import.meta.env.DEV,
  });
  cloudlinkClient = client;
  toResolveOnInit.forEach((resolve) => resolve(client));
};
const initializedCloudlink = () => {
  return new Promise<CloudlinkClient>((resolve) => {
    if (cloudlinkClient) {
      return resolve(cloudlinkClient);
    }
    toResolveOnInit.push(resolve);
  });
};
export const getCloudlink = () => {
  return new Promise<CloudlinkClient>((resolve) => {
    initializedCloudlink().then((cloudlink) => {
      if (cloudlink.status === 1) {
        resolve(cloudlink);
        return;
      }
      cloudlink.on("open", () => {
        resolve(cloudlink);
      });
    });
  });
};
getCloudlink().then((cloudlink) => {
  setInterval(() => {
    cloudlink.send({
      cmd: "ping",
      val: "",
      listener: "🏓",
    });
  }, 20000);
});
