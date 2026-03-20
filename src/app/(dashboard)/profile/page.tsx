import { getProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata = { title: "Company Profile — Favice" };

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Company Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          These details appear on every invoice you create.
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
