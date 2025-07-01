import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import authOptions from "../pages/api/auth/[...nextauth]";

export const auth = {
  getSession: (ctx: GetServerSidePropsContext) =>
    getServerSession(ctx.req, ctx.res, authOptions),
  // any other helpers
};
