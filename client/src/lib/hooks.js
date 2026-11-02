import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

// Gọi API GET và tự tải lại khi path thay đổi
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) });
  const load = useCallback(() => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true }));
    api(path)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
  }, [path]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}

let categoryCache = null;
export function useCategories() {
  const [categories, setCategories] = useState(categoryCache || []);
  useEffect(() => {
    if (categoryCache) return;
    api("/categories").then((data) => {
      categoryCache = data;
      setCategories(data);
    });
  }, []);
  return categories;
}
export const clearCategoryCache = () => (categoryCache = null);
