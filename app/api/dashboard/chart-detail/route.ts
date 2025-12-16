import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - 차트 상세 정보 조회 (카테고리/지역/날짜별 상세 통계)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'category', 'region', 'date'
    const value = searchParams.get('value'); // 카테고리명, 지역명, 또는 날짜

    if (!type || !value) {
      return NextResponse.json({ error: '타입과 값이 필요합니다.' }, { status: 400 });
    }

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
          participants: 0,
          completed: 0,
          completionRate: 0,
          co2Reduction: 0
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
          participants: 0,
          completed: 0,
          completionRate: 0,
          co2Reduction: 0
        }
      });
    }

    // 모든 미션 로그 조회
    const { data: allMissionLogs } = await supabase
      .from('mission_logs')
      .select('id, user_id, mission_template_id, status, completed_at, started_at')
      .in('mission_template_id', templateIds);

    const logs = allMissionLogs || [];

    // 필터링된 캠페인 찾기
    let filteredCampaignIds: number[] = [];
    
    if (type === 'category') {
      filteredCampaignIds = campaignList
        .filter(c => (c.category || '기타') === value)
        .map(c => c.id);
    } else if (type === 'region') {
      filteredCampaignIds = campaignList
        .filter(c => (c.region || '그 외 지역') === value)
        .map(c => c.id);
    } else if (type === 'date') {
      // 날짜 필터는 모든 캠페인 포함하되 해당 날짜의 로그만 필터링
      filteredCampaignIds = campaignIds;
    }

    // 필터링된 템플릿 ID
    const filteredTemplateIds = templates
      .filter(t => filteredCampaignIds.includes(t.campaign_id))
      .map(t => t.id);

    // 필터링된 로그
    let filteredLogs = logs.filter(log => 
      filteredTemplateIds.includes(log.mission_template_id)
    );

    // 날짜 필터 적용
    if (type === 'date') {
      const targetDate = new Date(value);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      filteredLogs = filteredLogs.filter(log => {
        if (!log.started_at) return false;
        const startedAt = new Date(log.started_at);
        return startedAt >= targetDate && startedAt < nextDate;
      });
    }

    // 통계 계산
    const participants = new Set(filteredLogs.map(log => log.user_id)).size;
    const completed = filteredLogs.filter(log =>
      log.status === 'COMPLETED' || log.completed_at !== null
    ).length;
    const completionRate = filteredLogs.length > 0
      ? Math.round((completed / filteredLogs.length) * 100)
      : 0;

    // CO2 절감량 계산
    const co2Coefficients: Record<string, number> = {
      '재활용': 0.3,
      '대중교통': 2.4,
      '에너지절약': 0.5,
      '제로웨이스트': 0.4,
      '자연보호': 0.6,
      '교육': 0.1,
      '기타': 0.2
    };

    let co2Reduction = 0;
    if (type === 'category') {
      const coefficient = co2Coefficients[value] || 0.2;
      co2Reduction = parseFloat((completed * coefficient).toFixed(1));
    } else if (type === 'region') {
      // 지역별 CO2는 해당 지역의 캠페인들의 카테고리별로 계산
      const regionCampaigns = campaignList.filter(c => 
        filteredCampaignIds.includes(c.id)
      );
      
      regionCampaigns.forEach(campaign => {
        const category = campaign.category || '기타';
        const campaignTemplateIds = templates
          .filter(t => t.campaign_id === campaign.id)
          .map(t => t.id);
        
        const campaignCompleted = filteredLogs.filter(log =>
          campaignTemplateIds.includes(log.mission_template_id) &&
          (log.status === 'COMPLETED' || log.completed_at !== null)
        ).length;

        const coefficient = co2Coefficients[category] || 0.2;
        co2Reduction += campaignCompleted * coefficient;
      });
      co2Reduction = parseFloat(co2Reduction.toFixed(1));
    } else if (type === 'date') {
      // 날짜별 CO2는 해당 날짜의 완료된 미션들의 카테고리별로 계산
      const dateCampaigns = campaignList.filter(c => 
        filteredCampaignIds.includes(c.id)
      );
      
      dateCampaigns.forEach(campaign => {
        const category = campaign.category || '기타';
        const campaignTemplateIds = templates
          .filter(t => t.campaign_id === campaign.id)
          .map(t => t.id);
        
        const campaignCompleted = filteredLogs.filter(log =>
          campaignTemplateIds.includes(log.mission_template_id) &&
          (log.status === 'COMPLETED' || log.completed_at !== null)
        ).length;

        const coefficient = co2Coefficients[category] || 0.2;
        co2Reduction += campaignCompleted * coefficient;
      });
      co2Reduction = parseFloat(co2Reduction.toFixed(1));
    }

    return NextResponse.json({
      data: {
        type,
        value,
        participants,
        completed,
        completionRate,
        co2Reduction
      }
    });
  } catch (error) {
    console.error('Chart detail error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

