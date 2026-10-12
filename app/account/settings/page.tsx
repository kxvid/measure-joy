"use client";

import { UserProfile } from "@clerk/nextjs";
import {
  EditorialPage,
  EditorialHeading,
  EditorialBackLink,
} from "@/components/editorial-page";

export default function SettingsPage() {
  return (
    <EditorialPage className="ed-account">
      <div className="ed-account-content">
        <EditorialBackLink href="/account">Back to Account</EditorialBackLink>

        <EditorialHeading
          label="My account"
          title="Settings"
          description="Manage your account settings"
        />

        <div className="ed-account-settings flex justify-center">
          <UserProfile
            routing="hash"
            appearance={{
              variables: {
                colorPrimary: "#191919",
                colorBackground: "#faf8f2",
                colorText: "#191919",
                colorTextSecondary: "#6f6e66",
                fontFamily: "var(--font-sans), sans-serif",
                borderRadius: "0px",
              },
              elements: {
                rootBox: "w-full",
                cardBox: "w-full shadow-none border border-[#d6d2c8]",
              },
            }}
          />
        </div>
      </div>
    </EditorialPage>
  );
}
