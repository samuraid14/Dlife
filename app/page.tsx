import Journal from "./journal";
import { currentAppUser } from "./lib/member-auth";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await currentAppUser();
  return <Journal signedIn={!!user} loginMode={user?.mode} />;
}
