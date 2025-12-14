import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - 캠페인 순위 조회
export async function GET(request: NextRequest) {
  try {
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

    // 파트너의 모든 캠페인 조회
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, title, category, region')
      .eq('partner_id', partner.id);

    const campaignList = campaigns || [];
    const campaignIds = campaignList.map(c => c.id);

    if (campaignIds.length === 0) {
      return NextResponse.json({
        data: {
          rankings: []
        }
      });
    }

    // 모든 미션 템플릿 조회
    const { data: missionTemplates } = await supabase
      .from('mission_templates')
      .select('id, campaign_id')
      .in('campaign_id', campaignIds);

    const templates = missionTemplates || [];

    // 모든 미션 로그 조회
    const { data: allMissionLogs } = await supabase
      .from('mission_logs')
      .select('id, user_id, mission_template_id, status, completed_at')
      .in('mission_template_id', templates.map(t => t.id));

    const logs = allMissionLogs || [];

    // 캠페인별 통계 계산
    const rankings = campaignList.map(campaign => {
      const campaignTemplateIds = templates
        .filter(t => t.campaign_id === campaign.id)
        .map(t => t.id);

      const campaignLogs = logs.filter(log =>
        campaignTemplateIds.includes(log.mission_template_id)
      );

      // 고유 참여자 수
      const participants = new Set(campaignLogs.map(log => log.user_id)).size;

      // 완료된 미션
      const completed = campaignLogs.filter(log =>
        log.status === 'COMPLETED' || log.completed_at !== null
      ).length;

      // 완료율
      const completionRate = campaignLogs.length > 0
        ? Math.round((completed / campaignLogs.length) * 100)
        : 0;

      return {
        id: campaign.id,
        title: campaign.title,
        category: campaign.category,
        region: campaign.region,
        participants,
        completed,
        total: campaignLogs.length,
        completionRate
      };
    });

    // 참여자 수 기준으로 내림차순 정렬
    rankings.sort((a, b) => b.participants - a.participants);

    return NextResponse.json({
      data: {
        rankings
      }
    });
  } catch (error) {
    console.error('Campaign rankings error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
