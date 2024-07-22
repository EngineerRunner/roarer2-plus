import {
  AlertCircle,
  BookCheck,
  File,
  FilePen,
  Flag,
  Hammer,
  HardDrive,
  Info,
  Lock,
  LockOpen,
  LogOut,
  Megaphone,
  MessageCircle,
  MessageCircleCode,
  PencilOff,
  Trash2,
  UserMinus,
  UserRoundX,
  Users,
} from "lucide-react";

export const PERMISSIONS = [
  {
    name: "Sysadmin",
    description: "System administrator of Meower.",
    icon: HardDrive,
  },
  {
    name: "View reports",
    description: "Can view reports to users or posts and who sent them.",
    icon: Flag,
  },
  {
    name: "Update reports",
    description: "Can mark reports as resolved or escalate them.",
    icon: BookCheck,
  },
  {
    name: "View notes",
    description:
      "Can view notes on users made by moderators for other moderators to view.",
    icon: File,
  },
  {
    name: "Edit notes",
    description: "Can add notes on users which other moderators can then see.",
    icon: FilePen,
  },
  {
    name: "View post revisions",
    description: "Can view versions of posts from before they were edited.",
    icon: PencilOff,
  },
  {
    name: "Delete posts",
    description: "Can delete posts created by anybody.",
    icon: Trash2,
  },
  {
    name: "View alternative accounts",
    description: "Can view all accounts made by the same person.",
    icon: Users,
  },
  {
    name: "Send alerts",
    description: "Can send alerts to the inboxes of individual users.",
    icon: AlertCircle,
  },
  {
    name: "Kick users",
    description: "Can temporarily kick users from Meower.",
    icon: LogOut,
  },
  {
    name: "Clear profile details",
    description: "Can clear the quotes and profile pictures of users.",
    icon: UserMinus,
  },
  {
    name: "View ban states",
    description: "Can view whether, and for how long a user is banned.",
    icon: Info,
  },
  {
    name: "Ban users",
    description: "Can temporarily and permanently ban users.",
    icon: Hammer,
  },
  {
    name: "Delete users",
    description: "Can delete individual users completely.",
    icon: UserRoundX,
  },
  {
    name: "View IPs",
    description: "Can view IP addresses of users.",
    icon: LockOpen,
  },
  {
    name: "Block IPs",
    description: "Can IP-ban individual users from Meower.",
    icon: Lock,
  },
  {
    name: "View chats",
    description: "Can view any chat, even ones they are not part of.",
    icon: MessageCircle,
  },
  {
    name: "Edit chats",
    description:
      "Can modify any chat, even ones they are not part of or the creator of.",
    icon: MessageCircleCode,
  },
  {
    name: "Send announcements",
    description: "Can send announcements to every Meower users' inbox at once.",
    icon: Megaphone,
  },
] satisfies Permission[];

export type Permission = {
  name: string;
  description: string;
  icon: typeof HardDrive;
};
