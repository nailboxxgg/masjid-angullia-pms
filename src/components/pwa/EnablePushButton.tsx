"use client";

import { useState } from "react";
import { requestPushNotifications } from "@/lib/push-notifications";

export default function EnablePushButton() {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function enablePush() {
    try {
      setIsLoading(true);
      setStatus("Requesting permission...");

      await requestPushNotifications();

      setStatus("Notifications enabled.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Failed to enable notifications."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button onClick={enablePush} disabled={isLoading}>
        {isLoading ? "Enabling..." : "Enable Notifications"}
      </button>

      {status && <p>{status}</p>}
    </div>
  );
}