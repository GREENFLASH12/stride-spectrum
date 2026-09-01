import { GROUP_STYLES, PROFILE_LABELS, profileGroup } from "@/lib/snapshot";

export function ProfileBadge({
  profile,
  size = "sm",
}: {
  profile: string;
  size?: "sm" | "lg";
}) {
  const g = GROUP_STYLES[profileGroup(profile)];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full ring-1 ${g.bg} ${g.ring} ${g.text} ${
        size === "lg"
          ? "px-4 py-2 text-sm font-semibold tracking-tight"
          : "px-2.5 py-1 text-[0.7rem] font-semibold"
      }`}
    >
      <span className={`inline-block rounded-full ${g.dot} ${size === "lg" ? "size-2.5" : "size-1.5"}`} />
      {PROFILE_LABELS[profile] ?? profile}
    </span>
  );
}
