import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// PATCH - 보상 발송 상태 토글
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);
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

    // 캠페인 소유권 확인
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('partner_id', partner.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    const body = await request.json();
    const { userId, rewardSent, note } = body;

    if (!userId || typeof rewardSent !== 'boolean') {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    // 기존 레코드 확인
    const { data: existing } = await supabase
      .from('campaign_reward_tracking')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // 업데이트
      const { error: updateError } = await supabase
        .from('campaign_reward_tracking')
        .update({
          reward_sent: rewardSent,
          sent_at: rewardSent ? new Date().toISOString() : null,
          note: note || null,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Reward tracking update error:', updateError);
        return NextResponse.json({ error: '업데이트 실패' }, { status: 500 });
      }
    } else {
      // 새로 생성
      const { error: insertError } = await supabase
        .from('campaign_reward_tracking')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          reward_sent: rewardSent,
          sent_at: rewardSent ? new Date().toISOString() : null,
          note: note || null
        });

      if (insertError) {
        console.error('Reward tracking insert error:', insertError);
        return NextResponse.json({ error: '생성 실패' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      rewardSent,
      sentAt: rewardSent ? new Date().toISOString() : null
    });
  } catch (error) {
    console.error('Reward tracking PATCH error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
