import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { readLegacyUserData } from './userStorage';

export default function useSupabaseUserData(userId, userEmail, dataKey, defaultValue, legacyKeys = []) {
  const [data, setDataState] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const initializedKey = useRef('');
  const latestData = useRef(data);
  const skipSave = useRef(false);

  const reload = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    initializedKey.current = '';
    setLoading(true);
    setError('');
    setDataState(defaultValue);
    latestData.current = defaultValue;

    const load = async () => {
      const { data: row, error: loadError } = await supabase
        .from('user_app_data')
        .select('payload')
        .eq('user_id', userId)
        .eq('data_key', dataKey)
        .maybeSingle();

      if (!active) return;
      if (loadError) {
        setError(`Could not load ${dataKey}: ${loadError.message}`);
        setLoading(false);
        return;
      }

      if (row) {
        setDataState(row.payload);
        latestData.current = row.payload;
        initializedKey.current = dataKey;
        setLoading(false);
        return;
      }

      let nextValue = defaultValue;
      try {
        const legacy = readLegacyUserData(legacyKeys);
        if (legacy.found) {
          nextValue = legacy.value;
          const { error: migrationError } = await supabase
            .from('user_app_data')
            .upsert({ user_id: userId, data_key: dataKey, payload: nextValue }, {
              onConflict: 'user_id,data_key'
            });
          if (migrationError) throw migrationError;
          localStorage.removeItem(legacy.sourceKey);
        }
      } catch (migrationError) {
        if (!active) return;
        setError(`Could not migrate ${dataKey}: ${migrationError.message}`);
        setLoading(false);
        return;
      }

      if (!active) return;
      setDataState(nextValue);
      latestData.current = nextValue;
      initializedKey.current = dataKey;
      setLoading(false);
    };

    load().catch((loadError) => {
      if (!active) return;
      setError(`Could not load ${dataKey}: ${loadError.message || 'Unexpected error.'}`);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [userId, userEmail, dataKey, revision]);

  useEffect(() => {
    if (loading || initializedKey.current !== dataKey) return undefined;

    const channel = supabase
      .channel(`user-data-${userId}-${dataKey}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_app_data',
        filter: `user_id=eq.${userId}`
      }, (change) => {
        const row = change.new;
        if (row?.data_key !== dataKey || row.payload === undefined) return;
        if (JSON.stringify(latestData.current) === JSON.stringify(row.payload)) return;
        skipSave.current = true;
        latestData.current = row.payload;
        setDataState(row.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, dataKey, loading]);

  const setData = useCallback((nextValue) => {
    setDataState((current) => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue;
      latestData.current = resolved;
      return resolved;
    });
  }, []);

  useEffect(() => {
    if (loading || initializedKey.current !== dataKey) return undefined;
    if (skipSave.current) {
      skipSave.current = false;
      return undefined;
    }

    let active = true;
    const timeout = window.setTimeout(async () => {
      const payload = latestData.current;
      const { error: saveError } = await supabase
        .from('user_app_data')
        .upsert({ user_id: userId, data_key: dataKey, payload }, {
          onConflict: 'user_id,data_key'
        });

      if (!active) return;
      setError(saveError ? `Could not save ${dataKey}: ${saveError.message}` : '');
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [data, dataKey, loading, userId]);

  return { data, setData, loading, error, reload };
}
