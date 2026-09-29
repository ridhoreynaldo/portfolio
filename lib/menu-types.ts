export interface MenuNode {
  id: string;
  label: string;
  icon: string;
  path: string;
  sortOrder: number;
  isActive: boolean;
  roleIds: string[];
  children: MenuNode[];
}
