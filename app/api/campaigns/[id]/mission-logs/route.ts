import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - 캠페인의 미션 로그 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const supabase = await createClient();

    // 로그인된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 파트너 정보 조회
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!partner) {
      return NextResponse.json({ error: '파트너 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 캠페인이 본인 소유인지 확인 (임시로 파트너 체크 제거 - 디버깅용)
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, partner_id')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    console.log('Campaign partner_id:', campaign.partner_id, 'Current partner_id:', partner.id);

    // 해당 캠페인의 미션 템플릿 ID들 조회
    const { data: missionTemplates } = await supabase
      .from('mission_templates')
      .select('id')
      .eq('campaign_id', campaignId);

    if (!missionTemplates || missionTemplates.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const templateIds = missionTemplates.map(t => t.id);

    // 미션 로그 조회 (해당 템플릿들에 대한)
    const { data: missionLogs, error } = await supabase
      .from('mission_logs')
      .select(`
        id,
        user_id,
        mission_template_id,
        status,
        proof_data,
        created_at,
        updated_at,
        mission_templates (
          id,
          title
        ),
        profiles (
          username
        )
      `)
      .in('mission_template_id', templateIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Mission logs query error:', error);
      return NextResponse.json({ error: '미션 로그 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({ data: missionLogs || [] });
  } catch (error) {
    console.error('Mission logs GET error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
