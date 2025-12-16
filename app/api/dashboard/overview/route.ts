import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - 대시보드 전체 통계 조회
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
      // 캠페인이 없는 경우 빈 통계 반환
      return NextResponse.json({
        data: {
          totalParticipants: 0,
          completedMissions: 0,
          missionCompletionRate: 0,
          co2Reduction: 0,
          monthlyGrowth: 0,
          weeklyNewParticipants: 0,
          topCampaign: null,
          weeklyTrend: [],
          categoryDistribution: [],
          topCategory: null,
          topRegion: null,
          campaignCompletionRate: 0
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
          totalParticipants: 0,
          completedMissions: 0,
          missionCompletionRate: 0,
          co2Reduction: 0,
          monthlyGrowth: 0,
          weeklyNewParticipants: 0,
          topCampaign: null,
          weeklyTrend: [],
          categoryDistribution: [],
          topCategory: null,
          topRegion: null,
          campaignCompletionRate: 0
        }
      });
    }

    // 모든 미션 로그 조회
    const { data: allMissionLogs } = await supabase
      .from('mission_logs')
      .select('id, user_id, mission_template_id, status, completed_at, started_at')
      .in('mission_template_id', templateIds);

    const logs = allMissionLogs || [];

    // 1. 총 참여자 (고유 user_id 수)
    const uniqueParticipants = new Set(logs.map(log => log.user_id));
    const totalParticipants = uniqueParticipants.size;

    // 2. 완료된 미션 (status === 'COMPLETED' 또는 completed_at !== null)
    const completedLogs = logs.filter(log => log.status === 'COMPLETED' || log.completed_at !== null);
    const completedMissions = completedLogs.length;

    // 3. 미션 완료율 (완료된 미션 / 전체 미션 * 100)
    const missionCompletionRate = logs.length > 0
      ? Math.round((completedMissions / logs.length) * 100)
      : 0;

    // 4. CO2 절감량 (카테고리별 정확한 계산)
    // 카테고리별 CO2 절감량 계수 (kg)
    const co2Coefficients: Record<string, number> = {
      '재활용': 0.3,           // 재활용 1회당 0.3kg
      '대중교통': 2.4,         // 대중교통 이용 1회당 2.4kg (자차 대비)
      '에너지절약': 0.5,       // 에너지 절약 활동 1회당 0.5kg
      '제로웨이스트': 0.4,     // 제로웨이스트 활동 1회당 0.4kg
      '자연보호': 0.6,         // 자연보호 활동 1회당 0.6kg
      '교육': 0.1,             // 교육 참여 1회당 0.1kg
      '기타': 0.2              // 기타 활동 1회당 0.2kg
    };

    let co2Reduction = 0;
    campaignList.forEach(campaign => {
      const campaignTemplateIds = templates
        .filter(t => t.campaign_id === campaign.id)
        .map(t => t.id);

      const campaignCompletedCount = completedLogs.filter(log =>
        campaignTemplateIds.includes(log.mission_template_id)
      ).length;

      const category = campaign.category || '기타';
      const coefficient = co2Coefficients[category] || 0.2;
      co2Reduction += campaignCompletedCount * coefficient;
    });

    co2Reduction = parseFloat(co2Reduction.toFixed(1));

    // 5. 전월 대비 성장률 계산 (누적 참여자 기준)
    const now = new Date();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 전월 말까지의 총 참여자 (누적)
    const totalParticipantsUntilLastMonth = new Set(
      logs.filter(log => {
        const startedAt = new Date(log.started_at || '');
        return startedAt <= lastMonthEnd;
      }).map(log => log.user_id)
    ).size;

    // 현재까지의 총 참여자 (누적)
    const totalParticipantsNow = totalParticipants;

    // 성장률 계산
    const monthlyGrowth = totalParticipantsUntilLastMonth > 0
      ? Math.round(((totalParticipantsNow - totalParticipantsUntilLastMonth) / totalParticipantsUntilLastMonth) * 100)
      : 0;

    // 6. 이번 주 신규 참여자 (최근 7일간 첫 참여한 사용자 수)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 각 사용자의 첫 참여 날짜 찾기
    const userFirstParticipation = new Map<string, Date>();
    logs.forEach(log => {
      const startedAt = new Date(log.started_at || '');
      const currentFirst = userFirstParticipation.get(log.user_id);

      if (!currentFirst || startedAt < currentFirst) {
        userFirstParticipation.set(log.user_id, startedAt);
      }
    });

    // 최근 7일 이내에 첫 참여한 사용자 수 카운트
    let weeklyNewParticipants = 0;
    userFirstParticipation.forEach((firstDate, userId) => {
      if (firstDate >= sevenDaysAgo) {
        weeklyNewParticipants++;
      }
    });

    // 7. 최고 성과 캠페인 (참여자 수 기준)
    const campaignStats = campaignList.map(campaign => {
      const campaignTemplateIds = templates
        .filter(t => t.campaign_id === campaign.id)
        .map(t => t.id);

      const campaignLogs = logs.filter(log =>
        campaignTemplateIds.includes(log.mission_template_id)
      );

      const participants = new Set(campaignLogs.map(log => log.user_id)).size;
      const completed = campaignLogs.filter(log =>
        log.status === 'COMPLETED' || log.completed_at !== null
      ).length;
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
        completionRate
      };
    });

    const topCampaign = campaignStats.reduce((max, current) =>
      current.participants > max.participants ? current : max
    , campaignStats[0] || null);

    // 8. 주간 참여자 추이 (최근 7일간 일별)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dailyParticipants = new Set(
        logs.filter(log => {
          const startedAt = new Date(log.started_at || '');
          return startedAt >= date && startedAt < nextDate;
        }).map(log => log.user_id)
      );

      weeklyTrend.push({
        date: date.toISOString().split('T')[0],
        participants: dailyParticipants.size
      });
    }

    // 9. 카테고리별 신청자 분포
    const categoryMap = new Map<string, Set<string>>();
    campaignStats.forEach(campaign => {
      const category = campaign.category || '기타';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Set());
      }

      const campaignTemplateIds = templates
        .filter(t => t.campaign_id === campaign.id)
        .map(t => t.id);

      logs.filter(log => campaignTemplateIds.includes(log.mission_template_id))
        .forEach(log => {
          categoryMap.get(category)!.add(log.user_id);
        });
    });

    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, users]) => ({
      category,
      participants: users.size
    }));

    // 10. 가장 인기있는 카테고리 (완료된 미션 수 기준)
    const categoryCompletionMap = new Map<string, number>();
    campaignStats.forEach(campaign => {
      const category = campaign.category || '기타';
      const current = categoryCompletionMap.get(category) || 0;
      categoryCompletionMap.set(category, current + campaign.completed);
    });

    let topCategory = null;
    let topCategoryCompleted = 0;
    let maxCompleted = 0;
    categoryCompletionMap.forEach((completed, category) => {
      if (completed > maxCompleted) {
        maxCompleted = completed;
        topCategory = category;
        topCategoryCompleted = completed;
      }
    });

    // 11. 최다 활동 지역 (참여자 수 기준)
    const regionMap = new Map<string, Set<string>>();
    campaignStats.forEach(campaign => {
      const region = campaign.region || '그 외 지역';
      if (!regionMap.has(region)) {
        regionMap.set(region, new Set());
      }

      const campaignTemplateIds = templates
        .filter(t => t.campaign_id === campaign.id)
        .map(t => t.id);

      logs.filter(log => campaignTemplateIds.includes(log.mission_template_id))
        .forEach(log => {
          regionMap.get(region)!.add(log.user_id);
        });
    });

    let topRegion = null;
    let topRegionParticipants = 0;
    let maxRegionParticipants = 0;
    regionMap.forEach((users, region) => {
      if (users.size > maxRegionParticipants) {
        maxRegionParticipants = users.size;
        topRegion = region;
        topRegionParticipants = users.size;
      }
    });

    // 12. 캠페인 완료율 (전체 완료된 미션 / 전체 시작된 미션)
    const campaignCompletionRate = logs.length > 0
      ? Math.round((completedMissions / logs.length) * 100)
      : 0;

    return NextResponse.json({
      data: {
        totalParticipants,
        completedMissions,
        missionCompletionRate,
        co2Reduction,
        monthlyGrowth,
        weeklyNewParticipants,
        topCampaign: topCampaign ? {
          id: topCampaign.id,
          title: topCampaign.title,
          participants: topCampaign.participants,
          completed: topCampaign.completed,
          completionRate: topCampaign.completionRate
        } : null,
        weeklyTrend,
        categoryDistribution,
        topCategory,
        topCategoryCompleted,
        topRegion,
        topRegionParticipants,
        campaignCompletionRate
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
