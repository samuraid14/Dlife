import { currentAppUser, canSetupOwner } from "../../../lib/member-auth";
import { guard, json } from "../../../lib/server";
export async function GET() {
  return guard(async () => {
    const u = await currentAppUser();
    return json({
      user: u
        ? {
            username: u.username,
            role: u.role,
            mode: u.mode,
            hasAccount: !!u.authId,
          }
        : null,
      canSetupOwner: await canSetupOwner(),
    });
  });
}
