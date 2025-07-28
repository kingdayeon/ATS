/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateToken = (applicationId: string, secret: string) => {
  // 간단한 토큰 생성. 실제 환경에서는 더 안전한 JWT 등을 사용해야 합니다.
  return btoa(`${applicationId}-${secret}`);
};

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ✨ [수정] URL 쿼리 파라미터 대신, 요청 본문(body)에서 데이터를 읽습니다.
    const { applicationId, finalStatus, token } = await req.json();

    if (!applicationId || !finalStatus || !token) {
      throw new Error("필수 파라미터가 누락되었습니다.");
    }

    if (finalStatus !== 'hired' && finalStatus !== 'offer_declined') {
      throw new Error("유효하지 않은 상태 값입니다.");
    }

    const secretKey = Deno.env.get("FUNCTION_SECRET_KEY") ?? "default-secret";
    if (token !== generateToken(applicationId, secretKey)) {
      throw new Error("유효하지 않은 요청입니다.");
    }
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // DB 업데이트: final_status와 status를 함께 변경
    const { error } = await supabase
      .from("applications")
      .update({ 
        final_status: finalStatus,
        status: finalStatus === 'hired' ? 'accepted' : 'rejected' // 'accepted'는 채용, 'rejected'는 포기/불합격
      })
      .eq("id", applicationId);

    if (error) throw error;

    const isSuccess = finalStatus === 'hired';
    const message = isSuccess
      ? '입사 결정을 축하드립니다! 무신사 채용팀에서 곧 상세 안내를 드릴 예정입니다.'
      : '입사 포기 의사가 정상적으로 전달되었습니다. 귀하의 결정을 존중하며, 앞날에 좋은 일이 가득하기를 바랍니다.';

    return new Response(
      JSON.stringify({ success: true, message: message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}); 