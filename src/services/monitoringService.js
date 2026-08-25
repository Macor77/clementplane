import { supabase } from '../lib/supabaseClient';

function clean(value, max = 500) {
  return String(value ?? '').slice(0, max);
}

export function normalizeError(error) {
  if (error instanceof Error) {
    return {
      name: clean(error.name || 'Error', 80),
      message: clean(error.message || String(error), 500),
      stack: clean(error.stack || '', 3000),
    };
  }

  return {
    name: 'Error',
    message: clean(error, 500),
    stack: '',
  };
}

export async function reportClientError(error, context = 'unknown', metadata = {}) {
  const normalized = normalizeError(error);

  try {
    const { error: trackingError } = await supabase.rpc('track_product_event', {
      p_event_name: 'client_error',
      p_context: clean(context, 120),
      p_metadata: {
        ...metadata,
        ...normalized,
        path: typeof window !== 'undefined' ? clean(window.location?.pathname || '', 240) : '',
        user_agent: typeof navigator !== 'undefined' ? clean(navigator.userAgent || '', 500) : '',
      },
    });

    if (trackingError && trackingError.message !== 'AUTH_REQUIRED') {
      console.warn('Formaplane monitoring unavailable', trackingError);
    }
  } catch (trackingError) {
    console.warn('Formaplane monitoring unavailable', trackingError);
  }
}

export function installGlobalErrorMonitoring() {
  if (typeof window === 'undefined') return () => {};

  const onError = (event) => {
    void reportClientError(event.error || event.message || 'Unhandled window error', 'window.error');
  };

  const onUnhandledRejection = (event) => {
    void reportClientError(event.reason || 'Unhandled promise rejection', 'window.unhandledrejection');
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}
