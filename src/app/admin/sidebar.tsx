import { SHELL_ICONS } from "@/components/lc/app-shell";

/** Nama ikon yang boleh dipilih di /admin/menus (didefinisikan di AppShell). */
export const ADMIN_ICONS = SHELL_ICONS;
export const ADMIN_ICON_NAMES = Object.keys(SHELL_ICONS) as (keyof typeof SHELL_ICONS)[];
