import { useEffect, useState } from "react";
import api from "@/lib/api";

let cache = null;

export function useOptions() {
  const [options, setOptions] = useState(cache || {});
  useEffect(() => {
    if (cache) { setOptions(cache); return; }
    api.get("/options").then((r) => { cache = r.data; setOptions(r.data); }).catch(() => {});
  }, []);
  return options || {};
}

export function invalidateOptions() { cache = null; }
