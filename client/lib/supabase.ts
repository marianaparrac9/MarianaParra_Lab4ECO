import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export function notify(name: string, event: string, payload: any) {
  const channel = supabase.channel(name);
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      channel.send({ type: "broadcast", event, payload }).then(() => {
        supabase.removeChannel(channel);
      });
    }
  });
}
