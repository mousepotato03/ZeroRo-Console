import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - 신규 사용자 상세 정보 조회
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
          topCampaigns: [],
          topCategories: []
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
          topCampaigns: [],
          topCategories: []
        }
      });
    }

    // 모든 미션 로그 조회
    const { data: allMissionLogs } = await supabase
      .from('mission_logs')
      .select('id, user_id, mission_template_id, started_at')
      .in('mission_template_id', templateIds);

    const logs = allMissionLogs || [];

    // 최근 7일 계산
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 각 사용자의 첫 참여 날짜 찾기
    const userFirstParticipation = new Map<string, Date>();
    logs.forEach(log => {
      if (!log.started_at) return;
      const startedAt = new Date(log.started_at);
      const currentFirst = userFirstParticipation.get(log.user_id);

      if (!currentFirst || startedAt < currentFirst) {
        userFirstParticipation.set(log.user_id, startedAt);
      }
    });

    // 일별 신규 추이 (최근 7일)
    const dailyTrend: Array<{ date: string; newUsers: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      let newUsersCount = 0;
      userFirstParticipation.forEach((firstDate, userId) => {
        if (firstDate >= date && firstDate < nextDate) {
          newUsersCount++;
        }
      });
      
      dailyTrend.push({
        date: dateStr,
        newUsers: newUsersCount
      });
    }

    // 캠페인별 신규 사용자 수 계산
    const campaignNewUsers = new Map<number, { title: string; category: string; newUsers: number }>();
    
    campaignList.forEach(campaign => {
      const campaignTemplateIds = templates
        .filter(t => t.campaign_id === campaign.id)
        .map(t => t.id);

      const campaignLogs = logs.filter(log =>
        campaignTemplateIds.includes(log.mission_template_id)
      );

      // 이 캠페인에서 첫 참여한 사용자들의 첫 참여 날짜 찾기
      const campaignUserFirstParticipation = new Map<string, Date>();
      campaignLogs.forEach(log => {
        if (!log.started_at) return;
        const startedAt = new Date(log.started_at);
        const currentFirst = campaignUserFirstParticipation.get(log.user_id);

        if (!currentFirst || startedAt < currentFirst) {
          campaignUserFirstParticipation.set(log.user_id, startedAt);
        }
      });

      // 최근 7일 이내 첫 참여한 사용자 수
      let newUsersCount = 0;
      campaignUserFirstParticipation.forEach((firstDate) => {
        if (firstDate >= sevenDaysAgo) {
          newUsersCount++;
        }
      });

      campaignNewUsers.set(campaign.id, {
        title: campaign.title,
        category: campaign.category || '기타',
        newUsers: newUsersCount
      });
    });

    // 캠페인별 Top 5 (신규 사용자 수 기준)
    const topCampaigns = Array.from(campaignNewUsers.values())
      .sort((a, b) => b.newUsers - a.newUsers)
      .slice(0, 5)
      .map((item, index) => ({
        id: index,
        name: item.title,
        title: item.title,
        newUsers: item.newUsers
      }));

    // 카테고리별 신규 사용자 수 계산
    const categoryNewUsers = new Map<string, number>();
    
    campaignNewUsers.forEach((data) => {
      const category = data.category || '기타';
      const current = categoryNewUsers.get(category) || 0;
      categoryNewUsers.set(category, current + data.newUsers);
    });

    // 카테고리별 Top 5
    const topCategories = Array.from(categoryNewUsers.entries())
      .map(([category, newUsers]) => ({ category, newUsers }))
      .sort((a, b) => b.newUsers - a.newUsers)
      .slice(0, 5);

    return NextResponse.json({
      data: {
        dailyTrend,
        topCampaigns,
        topCategories
      }
    });
  } catch (error) {
    console.error('New users details error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

