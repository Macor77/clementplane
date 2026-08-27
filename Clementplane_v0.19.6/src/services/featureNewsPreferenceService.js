import { supabase } from '../lib/supabaseClient';

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function getMyFeatureNewsPreference() {
  return unwrap(await supabase.rpc('get_my_feature_news_preference'));
}

export async function setMyFeatureNewsSubscription(subscribed) {
  return unwrap(await supabase.rpc('set_my_feature_news_subscription', {
    p_subscribed: Boolean(subscribed),
  }));
}
