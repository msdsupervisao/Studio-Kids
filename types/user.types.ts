import type { Database, UserRole } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type { UserRole };

export interface CurrentUser {
  id: string;
  email: string;
  profile: Profile;
}
