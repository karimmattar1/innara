"use client";

import { PortalHeader } from "./PortalHeader";
import { MANAGER_NAV_ITEMS } from "@/constants/navigation";

interface ManagerHeaderProps {
  userName?: string;
  userInitials?: string;
  notificationCount?: number;
  onSignOut?: () => void;
}

export function ManagerHeader(props: ManagerHeaderProps): React.ReactElement {
  return (
    <PortalHeader
      portal="manager"
      navItems={[...MANAGER_NAV_ITEMS]}
      userName={props.userName}
      userInitials={props.userInitials}
      userSubtitle="Manager"
      notificationCount={props.notificationCount}
      onSignOut={props.onSignOut}
      settingsPath="/manager/settings"
    />
  );
}
