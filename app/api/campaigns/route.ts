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

    // 캠페인 생성
    const { data: campaign, error: createError } = await supabase
      .from('campaigns')
      .insert({
        title: body.title,
        description: body.description,
        host_organizer: partner.organization_name,
        campaign_url: body.campaign_url || `https://zeroro.io/campaigns/${Date.now()}`,
        image_url: body.image_url,
        start_date: body.start_date,
        end_date: body.end_date,
        region: body.region,
        status: body.status || 'ACTIVE',
        category: body.category,
        campaign_type: body.campaign_type || 'ONLINE',
        campaign_source: 'ZERORO',
        partner_id: partner.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Campaign create error:', createError);
      return NextResponse.json({ error: '캠페인 생성 실패' }, { status: 500 });
    }

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    console.error('Campaign POST error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
