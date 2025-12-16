import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - 미션 완료율 상세 정보 조회
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
          dailyTrend: [],
          campaignStats: [],
          categoryStats: []
        }
      });
    }

    // 모든 미션 템플릿 조회
    const { data: missionTemplates } = await supabase
      .from('mission_templates')
      .select('id, campaign_id')
      .in('campaign_id', campaignIds);

    const templates = missionTemplates || [];
    const templateIds = templates.map(t => t.id);

    if (templateIds.length === 0) {
      return NextResponse.json({
        data: {
          dailyTrend: [],
          campaignStats: [],
          categoryStats: []
        }
      });
    }

    // 모든 미션 로그 조회
    const { data: allMissionLogs } = await supabase
      .from('mission_logs')
      .select('id, user_id, mission_template_id, status, completed_at, started_at')
      .in('mission_template_id', templateIds);

    const logs = allMissionLogs || [];

    // 일별 완료율 추이 (최근 7일)
    const dailyTrend: Array<{ date: string; completionRate: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // 해당 날짜에 시작된 미션들
      const dayLogs = logs.filter(log => {
        if (!log.started_at) return false;
        const startedAt = new Date(log.started_at);
        return startedAt >= date && startedAt < nextDate;
      });
      
      // 완료된 미션들
      const completedLogs = dayLogs.filter(log => 
        log.status === 'COMPLETED' || log.completed_at !== null
      );
      
      const completionRate = dayLogs.length > 0
        ? Math.round((completedLogs.length / dayLogs.length) * 100)
        : 0;
      
      dailyTrend.push({
        date: dateStr,
        completionRate
      });
    }

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

      const participants = new Set(campaignLogs.map(log => log.user_id)).size;
      const completionRate = campaignLogs.length > 0
        ? Math.round((completed / campaignLogs.length) * 100)
        : 0;

      return {
        id: campaign.id,
        title: campaign.title,
        completionRate,
        completed,
        participants
      };
    });

    // 완료율 기준으로 정렬
    campaignStats.sort((a, b) => b.completionRate - a.completionRate);

    // 카테고리별 통계
    const categoryMap = new Map<string, { completed: number; total: number; co2Contribution: number }>();
    
    // CO2 계수
    const co2Coefficients: Record<string, number> = {
      '재활용': 0.3,
      '대중교통': 2.4,
      '에너지절약': 0.5,
      '제로웨이스트': 0.4,
      '자연보호': 0.6,
      '교육': 0.1,
      '기타': 0.2
    };

    campaignList.forEach(campaign => {
      const category = campaign.category || '기타';
      const campaignTemplateIds = templates
        .filter(t => t.campaign_id === campaign.id)
        .map(t => t.id);

      const campaignLogs = logs.filter(log =>
        campaignTemplateIds.includes(log.mission_template_id)
      );

      const completed = campaignLogs.filter(log =>
        log.status === 'COMPLETED' || log.completed_at !== null
      ).length;

      const co2Coefficient = co2Coefficients[category] || 0.2;
      const co2Contribution = completed * co2Coefficient;

      const existing = categoryMap.get(category) || { completed: 0, total: 0, co2Contribution: 0 };
      categoryMap.set(category, {
        completed: existing.completed + completed,
        total: existing.total + campaignLogs.length,
        co2Contribution: existing.co2Contribution + co2Contribution
      });
    });

    // 카테고리별 통계 배열로 변환
    const categoryStats = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        co2Contribution: stats.co2Contribution
      }))
      .sort((a, b) => b.completionRate - a.completionRate);

    return NextResponse.json({
      data: {
        dailyTrend,
        campaignStats,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Completion details error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

