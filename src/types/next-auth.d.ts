import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "officer" | "executive" | "admin";
    } & DefaultSession["user"];
  }
}
