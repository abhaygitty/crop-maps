import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
    "https://vanasmrithi.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcWdzaGl1aXVseWp2c2JidXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDc3NzMsImV4cCI6MjA3ODc4Mzc3M30.TxKIb0PmFyBriENCJA3LN21MkH6pvt2dWEf4XiwIic8"
);