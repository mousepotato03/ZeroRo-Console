import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - CO2 절감량 상세 정보 조회
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
          categoryBreakdown: [],
          total: 0
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
          categoryBreakdown: [],
          total: 0
        }
      });
    }

    // 모든 미션 로그 조회
    const { data: allMissionLogs } = await supabase
      .from('mission_logs')
      .select('id, user_id, mission_template_id, status, completed_at')
      .in('mission_template_id', templateIds);

    const logs = allMissionLogs || [];

    // 완료된 미션 필터링
    const completedLogs = logs.filter(log => 
      log.status === 'COMPLETED' || log.completed_at !== null
    );

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

    // 카테고리별 완료 미션 수 및 CO2 절감량 계산
    const categoryBreakdownMap = new Map<string, { completed: number; coefficient: number; co2: number }>();

    campaignList.forEach(campaign => {
      const category = campaign.category || '기타';
      const campaignTemplateIds = templates
        .filter(t => t.campaign_id === campaign.id)
        .map(t => t.id);

      const categoryCompletedCount = completedLogs.filter(log =>
        campaignTemplateIds.includes(log.mission_template_id)
      ).length;

      const coefficient = co2Coefficients[category] || 0.2;
      const co2 = categoryCompletedCount * coefficient;

      const existing = categoryBreakdownMap.get(category) || { completed: 0, coefficient, co2: 0 };
      categoryBreakdownMap.set(category, {
        completed: existing.completed + categoryCompletedCount,
        coefficient,
        co2: existing.co2 + co2
      });
    });

    // 배열로 변환 및 정렬 (CO2 절감량 기준 내림차순)
    const categoryBreakdown = Array.from(categoryBreakdownMap.entries())
      .map(([category, data]) => ({
        category,
        completed: data.completed,
        coefficient: data.coefficient,
        co2: parseFloat(data.co2.toFixed(1))
      }))
      .sort((a, b) => b.co2 - a.co2);

    // 총합 계산
    const total = categoryBreakdown.reduce((sum, item) => sum + item.co2, 0);

    return NextResponse.json({
      data: {
        categoryBreakdown,
        total: parseFloat(total.toFixed(1))
      }
    });
  } catch (error) {
    console.error('CO2 details error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

