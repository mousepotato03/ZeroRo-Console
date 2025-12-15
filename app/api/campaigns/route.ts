import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - 로그인된 파트너의 캠페인 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 로그인된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 파트너 정보 조회
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: '파트너 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 해당 파트너의 캠페인만 조회
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('partner_id', partner.id)
      .order('updated_at', { ascending: false });

    if (campaignsError) {
      return NextResponse.json({ error: '캠페인 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({ data: campaigns });
  } catch (error) {
    console.error('Campaign GET error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// POST - 새 캠페인 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 로그인된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 파트너 정보 조회
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, organization_name')
      .eq('user_id', user.id)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: '파트너 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    const body = await request.json();
    const { missions, location, ...campaignData } = body;

    // 1. 캠페인 생성
    const { data: campaign, error: createError } = await supabase
      .from('campaigns')
      .insert({
        title: campaignData.title,
        description: campaignData.description,
        host_organizer: partner.organization_name,
        campaign_url: campaignData.campaign_url || `https://zeroro.io/campaigns/${Date.now()}`,
        image_url: campaignData.image_url,
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
        region: campaignData.region,
        status: campaignData.status || 'ACTIVE',
        category: campaignData.category,
        campaign_type: campaignData.campaign_type || 'ONLINE',
        campaign_source: 'ZERORO',
        partner_id: partner.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Campaign create error:', createError);
      return NextResponse.json({ error: '캠페인 생성 실패' }, { status: 500 });
    }

    // 2. 오프라인 캠페인인 경우 위치 정보 저장
    if (campaignData.campaign_type === 'OFFLINE' && location) {
      const { error: locationError } = await supabase
        .from('offline_campaign_locations')
        .insert({
          campaign_id: campaign.id,
          location_lat: location.lat,
          location_lng: location.lng,
          location_radius: location.radius || 100,
          location_address: location.address,
        });

      if (locationError) {
        console.error('Location create error:', locationError);
        return NextResponse.json({
          data: campaign,
          warning: '캠페인은 생성되었으나 위치 정보 저장 중 오류가 발생했습니다.'
        }, { status: 201 });
      }
    }

    // 3. 미션 생성 (missions 배열이 있는 경우)
    if (missions && Array.isArray(missions) && missions.length > 0) {
      const missionInserts = missions.map((mission: any, index: number) => ({
        campaign_id: campaign.id,
        title: mission.title,
        description: mission.description || null,
        order: mission.order ?? index,
        verification_type: mission.type || 'IMAGE',
        reward_points: mission.points || 0,
        success_criteria: mission.successCriteria || null,
      }));

      const { error: missionError } = await supabase
        .from('mission_templates')
        .insert(missionInserts);

      if (missionError) {
        console.error('Mission create error:', missionError);
        return NextResponse.json({
          data: campaign,
          warning: '캠페인은 생성되었으나 미션 저장 중 오류가 발생했습니다.'
        }, { status: 201 });
      }
    }

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    console.error('Campaign POST error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
