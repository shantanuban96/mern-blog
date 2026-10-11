import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../api/http';

// Loads data from the API and tracks loading/error state.
// `fetcher` returns the API body ({ data, meta }); it re-runs whenever `deps` change.
export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetcher();
      setData(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, meta, loading, error, reload: load };
}
