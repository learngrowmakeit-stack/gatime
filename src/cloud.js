import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const missingCloudConfig = [
  !url && 'VITE_SUPABASE_URL',
  !key && 'VITE_SUPABASE_PUBLISHABLE_KEY',
].filter(Boolean);
// Capture only the failure flag before Supabase consumes the callback URL.
export const signInCallbackFailed = [window.location.search,window.location.hash].some(part=>{const params=new URLSearchParams(part.slice(1));return params.has('error')||params.has('error_code');});
export const cloud = url && key ? createClient(url, key) : null;

export function recipeApi(userId) {
  return {
    async save(op) {
      const { data, error } = await cloud.rpc('save_recipe', {
        p_recipe_id: op.id, p_data: op.data, p_expected_version: op.baseVersion, p_mutation_id: op.mutationId,
      });
      if (error) throw error;
      return data;
    },
    async list() {
      const rows = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await cloud.from('recipes').select('recipe_id,data,version,deleted').eq('user_id', userId).order('recipe_id').range(offset, offset + 499);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 500) return rows;
      }
    },
  };
}
