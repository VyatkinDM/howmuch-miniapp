import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zjfkrsgnleqdafshsajk.supabase.co'
const supabaseKey = 'sb_publishable_y4AuzbneM7MD6bpNaM3DJw_53QlsFLL'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)