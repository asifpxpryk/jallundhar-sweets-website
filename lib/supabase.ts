import { createClient } from "@supabase/supabase-js";

// Public (anon/publishable) key — safe to expose client-side.
// Row Level Security only allows: public read on menu tables,
// public insert (not read/update/delete) on orders/order_items.
const SUPABASE_URL = "https://szynajbvvgazmtzxxxde.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eW5hamJ2dmdhem10enh4eGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODMwMzMsImV4cCI6MjEwNDM1OTAzM30.Hv7D8Nd9yQSD1Kz19gZAp-JeyVx2uvz57Usj8Rw1Sv4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
