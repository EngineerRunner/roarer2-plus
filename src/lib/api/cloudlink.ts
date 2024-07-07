import { CloudlinkClient } from "@williamhorning/cloudlink";
import { cl } from "../servers";

const cloudlinkClient = new CloudlinkClient({
  url: cl,
  log: import.meta.env.DEV,
});
export const getCloudlink = () => {
  return new Promise<CloudlinkClient>((resolve) => {
    if (cloudlinkClient.status === 1) {
      resolve(cloudlinkClient);
      return;
    }
    cloudlinkClient.on("open", () => {
      resolve(cloudlinkClient);
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
