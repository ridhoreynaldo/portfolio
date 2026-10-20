import { FieldInputs } from "@/components/field-inputs";
import { Card, PageTitle } from "@/shared/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { saveProfileAction } from "@/modules/content/actions";
import { getProfile } from "@/modules/content/repository";
import { PROFILE_FIELDS } from "@/modules/content/resources";

export default async function ProfilePage() {
  const user = await requirePermissionPage("profile.read");
  const profile = await getProfile();
  const canEdit = can(user, "profile.update");
  return (
    <>
      <PageTitle sub="Identitas, hero, kontak, dan biodata yang tampil di halaman publik">Profil & Biodata</PageTitle>
      <Card>
        <form action={saveProfileAction} className="space-y-5">
          <FieldInputs fields={PROFILE_FIELDS} values={profile ?? undefined} disabled={!canEdit} />
          {canEdit && <button className="btn-primary">Simpan</button>}
        </form>
      </Card>
    </>
  );
}
