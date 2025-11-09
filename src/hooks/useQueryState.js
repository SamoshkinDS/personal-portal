import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function useQueryState(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsKey = useMemo(() => JSON.stringify(defaults || {}), [defaults]);

  const values = useMemo(() => {
    const obj = { ...defaults };
    searchParams.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }, [searchParams, defaultsKey]);

  const update = useCallback(
    (patch, options = {}) => {
      const current = new URLSearchParams(searchParams);
      Object.entries(patch || {}).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          current.delete(key);
          return;
        }
        if (Array.isArray(value)) {
          current.set(key, value.join(","));
          return;
        }
        current.set(key, value);
      });
      setSearchParams(current, { replace: options.replace !== false });
    },
    [searchParams, setSearchParams]
  );

  return [values, update];
}
