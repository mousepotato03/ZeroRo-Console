import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - 미션 상세 통계 조회
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
      .select('id, title')
      .eq('partner_id', partner.id);

    const campaignList = campaigns || [];
    const campaignIds = campaignList.map(c => c.id);

    if (campaignIds.length === 0) {
      return NextResponse.json({
        data: {
          completedMissions: 0,
          totalMissions: 0,
          completionRate: 0,
          campaigns: []
        }
      });
    }

    // 모든 미션 템플릿 조회
    const { data: missionTemplates } = await supabase
      .from('mission_templates')
      .select('id, campaign_id, title')
      .in('campaign_id', campaignIds);

    const templates = missionTemplates || [];
    const templateIds = templates.map(t => t.id);

    if (templateIds.length === 0) {
      return NextResponse.json({
        data: {
          completedMissions: 0,
          totalMissions: 0,
          completionRate: 0,
          campaigns: []
        }
      });
    }

    // 모든 미션 로그 조회
    const { data: allMissionLogs } = await supabase
      .from('mission_logs')
      .select('id, user_id, mission_template_id, status, completed_at')
      .in('mission_template_id', templateIds);

    const logs = allMissionLogs || [];

    // 전체 완료된 미션
    const completedLogs = logs.filter(log => log.status === 'COMPLETED' || log.completed_at !== null);
    const completedMissions = completedLogs.length;
    const totalMissions = logs.length;
    const completionRate = totalMissions > 0
      ? Math.round((completedMissions / totalMissions) * 100)
      : 0;

    // 캠페인별 통계
    const campaignStats = campaignList.map(campaign => {
      const campaignTemplateIds = templates
        .filter(t => t.campaign_id === campaign.id)
        .map(t => t.id);

      const campaignLogs = logs.filter(log =>
        campaignTemplateIds.includes(log.mission_template_id)
      );

      const completed = campaignLogs.filter(log =>
        log.status === 'COMPLETED' || log.completed_at !== null
      ).length;

      const inProgress = campaignLogs.filter(log =>
        log.status === 'IN_PROGRESS'
      ).length;

      const pending = campaignLogs.filter(log =>
        log.status === 'PENDING_VERIFICATION'
      ).length;

      const failed = campaignLogs.filter(log =>
        log.status === 'FAILED'
      ).length;

      const total = campaignLogs.length;
      const campaignCompletionRate = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

      return {
        id: campaign.id,
        title: campaign.title,
        completed,
        inProgress,
        pending,
        failed,
        total,
        completionRate: campaignCompletionRate
      };
    });

    return NextResponse.json({
      data: {
        completedMissions,
        totalMissions,
        completionRate,
        campaigns: campaignStats
      }
    });
  } catch (error) {
    console.error('Mission details error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
