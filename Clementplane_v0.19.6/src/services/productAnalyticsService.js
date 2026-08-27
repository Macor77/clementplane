import { supabase } from '../lib/supabaseClient';

export async function trackProductEvent(eventName, context = null, metadata = {}) {
  const { error } = await supabase.rpc('track_product_event', {
    p_event_name: eventName,
    p_context: context,
    p_metadata: metadata,
  });
  if (error) throw error;
}
