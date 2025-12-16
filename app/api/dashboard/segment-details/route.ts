import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - 세그먼트 상세 정보 조회 (카테고리 및 지역 분포)
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
          categoryDistribution: [],
          regionDistribution: []
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
          categoryDistribution: [],
          regionDistribution: []
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

    // 카테고리별 완료 수 계산
    const categoryCompletionMap = new Map<string, number>();
    campaignList.forEach(campaign => {
      const category = campaign.category || '기타';
      const campaignTemplateIds = templates
        .filter(t => t.campaign_id === campaign.id)
        .map(t => t.id);

      const categoryCompletedCount = completedLogs.filter(log =>
        campaignTemplateIds.includes(log.mission_template_id)
      ).length;

      const current = categoryCompletionMap.get(category) || 0;
      categoryCompletionMap.set(category, current + categoryCompletedCount);
    });

    // 카테고리 분포 배열로 변환 및 정렬
    const categoryDistribution = Array.from(categoryCompletionMap.entries())
      .map(([category, completed]) => ({
        category,
        completed
      }))
      .sort((a, b) => b.completed - a.completed);

    // 지역별 참여자 수 계산
    const regionMap = new Map<string, Set<string>>();
    campaignList.forEach(campaign => {
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

    // 지역 분포 배열로 변환 및 정렬
    const regionDistribution = Array.from(regionMap.entries())
      .map(([region, users]) => ({
        region,
        participants: users.size
      }))
      .sort((a, b) => b.participants - a.participants);

    return NextResponse.json({
      data: {
        categoryDistribution,
        regionDistribution
      }
    });
  } catch (error) {
    console.error('Segment details error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

