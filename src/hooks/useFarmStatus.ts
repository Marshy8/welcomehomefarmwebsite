import { useEffect, useState } from "react";
import { SAMPLE_STATUS } from "../data/sampleStatus";
import { fetchFarmStatus, isConnected } from "../lib/farmApi";
import type { FarmStatusState } from "../types";

export function useFarmStatus(): FarmStatusState {
  const [state, setState] = useState<FarmStatusState>(() =>
    isConnected
      ? { phase: "loading" }
      : { phase: "ready", status: SAMPLE_STATUS, isSample: true },
  );

  useEffect(() => {
    if (!isConnected) return;
    const controller = new AbortController();
    fetchFarmStatus(controller.signal)
      .then((status) => setState({ phase: "ready", status, isSample: false }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ phase: "error" });
      });
    return () => controller.abort();
  }, []);

  return state;
}
