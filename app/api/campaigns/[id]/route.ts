import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// GET - 개별 캠페인 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 캠페인 조회 (본인 소유만)
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('partner_id', partner.id)
      .single();

    if (error || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error('Campaign GET error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// PATCH - 캠페인 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { location, ...campaignData } = body;

    // 캠페인 수정 (본인 소유만)
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update({
        title: campaignData.title,
        description: campaignData.description,
        image_url: campaignData.image_url,
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
        region: campaignData.region,
        status: campaignData.status,
        category: campaignData.category,
        campaign_type: campaignData.campaign_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('partner_id', partner.id)
      .select()
      .single();

    if (error || !campaign) {
      return NextResponse.json({ error: '캠페인 수정 실패' }, { status: 404 });
    }

    // 오프라인 캠페인 위치 정보 처리
    if (campaignData.campaign_type === 'OFFLINE' && location) {
      // 기존 위치 정보 확인
      const { data: existingLocation } = await supabase
        .from('offline_campaign_locations')
        .select('id')
        .eq('campaign_id', id)
        .single();

      if (existingLocation) {
        // 기존 위치 정보 수정
        const { error: updateError } = await supabase
          .from('offline_campaign_locations')
          .update({
            location_lat: location.lat,
            location_lng: location.lng,
            location_radius: location.radius || 100,
            location_address: location.address,
          })
          .eq('campaign_id', id);

        if (updateError) {
          console.error('Location update error:', updateError);
        }
      } else {
        // 새 위치 정보 생성
        const { error: insertError } = await supabase
          .from('offline_campaign_locations')
          .insert({
            campaign_id: parseInt(id),
            location_lat: location.lat,
            location_lng: location.lng,
            location_radius: location.radius || 100,
            location_address: location.address,
          });

        if (insertError) {
          console.error('Location insert error:', insertError);
        }
      }
    } else if (campaignData.campaign_type === 'ONLINE') {
      // 온라인으로 변경된 경우 위치 정보 삭제
      await supabase
        .from('offline_campaign_locations')
        .delete()
        .eq('campaign_id', id);
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error('Campaign PATCH error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// DELETE - 캠페인 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 캠페인 삭제 (본인 소유만)
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('partner_id', partner.id);

    if (error) {
      return NextResponse.json({ error: '캠페인 삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Campaign DELETE error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
