"use client";

import { PortalHeader } from "./PortalHeader";
import { STAFF_NAV_ITEMS } from "@/constants/navigation";

interface StaffHeaderProps {
  userName?: string;
  userInitials?: string;
  department?: string;
  notificationCount?: number;
  onSignOut?: () => void;
}

export function StaffHeader(props: StaffHeaderProps): React.ReactElement {
  return (
    <PortalHeader
      portal="staff"
      navItems={[...STAFF_NAV_ITEMS]}
      userName={props.userName}
      userInitials={props.userInitials}
      userSubtitle={props.department?.replace("_", " ")}
      notificationCount={props.notificationCount}
      onSignOut={props.onSignOut}
    />
  );
}
