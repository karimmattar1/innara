"use client";

import { PortalHeader } from "./PortalHeader";
import { ADMIN_NAV_ITEMS } from "@/constants/navigation";

interface AdminHeaderProps {
  userName?: string;
  userInitials?: string;
  notificationCount?: number;
  onSignOut?: () => void;
}

export function AdminHeader(props: AdminHeaderProps): React.ReactElement {
  return (
    <PortalHeader
      portal="admin"
      navItems={[...ADMIN_NAV_ITEMS]}
      userName={props.userName}
      userInitials={props.userInitials}
      userSubtitle="Platform Admin"
      notificationCount={props.notificationCount}
      onSignOut={props.onSignOut}
    />
  );
}
