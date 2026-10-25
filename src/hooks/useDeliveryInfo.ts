import { useEffect, useState } from "react";
import { getDeliveryInfo, type DeliveryInfo } from "@/lib/delivery-date";

/**
 * T1 ticking delivery info.
 *
 * `live` stays false for the first (SSR/hydration) render — components show
 * `info.headlineStatic` (date-level, timezone-safe) until mounted, then swap to
 * the seconds-ticking `info.headlineLive`. Avoids hydration mismatches.
 */
export function useDeliveryInfo(): { info: DeliveryInfo; live: boolean } {
  const [info, setInfo] = useState<DeliveryInfo>(() => getDeliveryInfo(new Date()));
  const [live, setLive] = useState(false);

  useEffect(() => {
    setLive(true);
    setInfo(getDeliveryInfo(new Date()));
    const id = setInterval(() => setInfo(getDeliveryInfo(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return { info, live };
}
