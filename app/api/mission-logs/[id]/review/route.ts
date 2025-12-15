import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

// PATCH - 미션 로그 승인/거절
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: logId } = await params;
    const body = await request.json();
    const { action } = body; // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '유효하지 않은 액션입니다.' }, { status: 400 });
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

    // 미션 로그 조회
    const { data: missionLog, error: logError } = await supabase
      .from('mission_logs')
      .select(`
        id,
        user_id,
        status,
        mission_template_id,
        mission_templates (
          id,
          campaign_id
        )
      `)
      .eq('id', logId)
      .single();

    console.log('Mission log query result:', missionLog, 'Error:', logError);

    if (logError || !missionLog) {
      return NextResponse.json({ error: '미션 로그를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 이미 처리된 로그인지 확인
    if (missionLog.status !== 'PENDING_VERIFICATION') {
      return NextResponse.json({ error: '이미 처리된 인증입니다.' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'COMPLETED' : 'FAILED';
    const points = 100; // 기본 포인트 (추후 mission_templates에서 가져오기)

    // 트랜잭션 처리: 상태 업데이트 + 포인트 지급
    // 1. 미션 로그 상태 업데이트
    const { error: updateError } = await supabase
      .from('mission_logs')
      .update({
        status: newStatus,
        completed_at: action === 'approve' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', logId);

    if (updateError) {
      console.error('Mission log update error:', updateError);
      return NextResponse.json({ error: '상태 업데이트 실패' }, { status: 500 });
    }

    // 2. 승인인 경우 포인트 지급
    if (action === 'approve' && points > 0) {
      // 현재 포인트 조회
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', missionLog.user_id)
        .single();

      const currentPoints = profile?.points || 0;

      // 포인트 업데이트
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({
          points: currentPoints + points,
          updated_at: new Date().toISOString()
        })
        .eq('id', missionLog.user_id);

      if (pointsError) {
        console.error('Points update error:', pointsError);
        // 포인트 지급 실패해도 상태는 이미 변경됨
        return NextResponse.json({
          data: { status: newStatus },
          warning: '상태는 변경되었으나 포인트 지급에 실패했습니다.'
        });
      }

      // 포인트 히스토리 기록 (테이블이 있는 경우)
      try {
        await supabase
          .from('point_histories')
          .insert({
            user_id: missionLog.user_id,
            amount: points,
            type: 'MISSION_REWARD',
            description: `미션 완료 보상`,
            mission_log_id: logId,
            created_at: new Date().toISOString()
          });
      } catch (e) {
        // 히스토리 테이블이 없어도 무시
        console.log('Point history insert skipped (table may not exist)');
      }
    }

    return NextResponse.json({
      data: {
        id: logId,
        status: newStatus,
        pointsAwarded: action === 'approve' ? points : 0
      }
    });
  } catch (error) {
    console.error('Mission log review error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
