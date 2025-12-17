import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';

// GET - 캠페인 검수 대상 조회 (모든 미션을 PENDING_VERIFICATION 상태로 완료한 사용자)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);
    const supabase = await createClient();

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const aiFilter = searchParams.get('ai_filter') as 'all' | 'qualified' | 'not_qualified' | null;

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
      .select('id, title')
      .eq('id', campaignId)
      .eq('partner_id', partner.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 해당 캠페인의 미션 템플릿 조회
    const { data: missionTemplates } = await supabase
      .from('mission_templates')
      .select('id, title, verification_type, reward_points, order')
      .eq('campaign_id', campaignId)
      .order('order', { ascending: true });

    const templates = missionTemplates || [];
    const templateIds = templates.map(t => t.id);
    const totalMissions = templates.length;

    if (totalMissions === 0) {
      return NextResponse.json({ data: { verifications: [], templates: [] } });
    }

    // 미션 로그 조회 (PENDING_VERIFICATION 또는 COMPLETED 상태)
    const { data: missionLogs } = await supabase
      .from('mission_logs')
      .select(`
        id,
        user_id,
        mission_template_id,
        status,
        proof_data,
        started_at,
        completed_at,
        profiles!inner (
          id,
          username,
          user_img
        )
      `)
      .in('mission_template_id', templateIds)
      .in('status', ['PENDING_VERIFICATION', 'COMPLETED', 'FAILED']);

    const logs = missionLogs || [];

    // 사용자별로 그룹화
    const userLogsMap = new Map<string, typeof logs>();
    logs.forEach(log => {
      const userId = log.user_id;
      if (!userLogsMap.has(userId)) {
        userLogsMap.set(userId, []);
      }
      userLogsMap.get(userId)!.push(log);
    });

    // 모든 사용자의 이메일 정보 조회 (Admin Client 사용)
    const userIds = Array.from(userLogsMap.keys());
    const userEmailMap = new Map<string, string>();

    if (userIds.length > 0) {
      const supabaseAdmin = createAdminClient();
      // 개별 사용자 이메일 조회
      for (const userId of userIds) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userData?.user?.email) {
          userEmailMap.set(userId, userData.user.email);
        }
      }
    }

    // 보상 발송 추적 정보 조회
    const { data: rewardTracking } = await supabase
      .from('campaign_reward_tracking')
      .select('user_id, reward_sent, sent_at, note')
      .eq('campaign_id', campaignId);

    const rewardTrackingMap = new Map<string, { rewardSent: boolean; sentAt: string | null; note: string | null }>();
    (rewardTracking || []).forEach(rt => {
      rewardTrackingMap.set(rt.user_id, {
        rewardSent: rt.reward_sent,
        sentAt: rt.sent_at,
        note: rt.note
      });
    });

    // 모든 미션을 완료(PENDING_VERIFICATION)한 사용자 필터링
    const verifications: Array<{
      userId: string;
      username: string | null;
      userImg: string | null;
      email: string | null; // 구글 이메일
      status: 'pending' | 'approved' | 'rejected';
      totalPoints: number;
      aiQualified: boolean | null; // AI 검증 결과 (null = 검증 없음)
      aiReason: string | null; // AI 판정 이유
      rewardSent: boolean; // 보상 발송 여부
      rewardSentAt: string | null; // 보상 발송 시간
      rewardNote: string | null; // 보상 메모
      missions: Array<{
        missionId: number;
        missionTitle: string;
        verificationType: string;
        status: string;
        proofData: any;
        completedAt: string | null;
        aiResult: {
          isValid: boolean;
          confidence: number;
          reason: string;
        } | null;
      }>;
      submittedAt: string | null;
    }> = [];

    userLogsMap.forEach((userLogs, userId) => {
      // PENDING_VERIFICATION 상태의 미션 수
      const pendingLogs = userLogs.filter(l => l.status === 'PENDING_VERIFICATION');
      const completedLogs = userLogs.filter(l => l.status === 'COMPLETED');
      const failedLogs = userLogs.filter(l => l.status === 'FAILED');

      // 모든 미션이 PENDING_VERIFICATION 상태인 경우 검수 대상
      // 또는 이미 승인/거부된 경우도 표시 (히스토리 용도)
      const hasPendingAll = pendingLogs.length === totalMissions;
      const hasCompletedAll = completedLogs.length === totalMissions;
      const hasFailedAll = failedLogs.length === totalMissions;

      if (hasPendingAll || hasCompletedAll || hasFailedAll) {
        const profileData = userLogs[0]?.profiles as any;

        // 미션별 정보 매핑 (AI 검증 결과 포함)
        const missions = templates.map(template => {
          const log = userLogs.find(l => l.mission_template_id === template.id);
          const proofData = log?.proof_data as any;
          const verificationResult = proofData?.verification_result;

          return {
            missionId: template.id,
            missionTitle: template.title,
            verificationType: template.verification_type,
            rewardPoints: template.reward_points,
            status: log?.status || 'NOT_STARTED',
            proofData: proofData || null,
            completedAt: log?.completed_at || null,
            aiResult: verificationResult ? {
              isValid: verificationResult.is_valid ?? false,
              confidence: verificationResult.confidence ?? 0,
              reason: verificationResult.reason ?? ''
            } : null
          };
        });

        // AI 검증 결과 종합 (모든 미션의 AI 판정 기반)
        const aiResults = missions
          .filter(m => m.aiResult !== null)
          .map(m => m.aiResult!);

        let aiQualified: boolean | null = null;
        let aiReason: string | null = null;

        if (aiResults.length > 0) {
          // 모든 미션이 AI 적격이면 적격, 하나라도 부적격이면 부적격
          const allValid = aiResults.every(r => r.isValid);
          aiQualified = allValid;

          // 부적격 이유 수집
          const failedReasons = aiResults
            .filter(r => !r.isValid)
            .map(r => r.reason);
          aiReason = failedReasons.length > 0
            ? failedReasons.join(' / ')
            : aiResults[0]?.reason || null;
        }

        // 총 포인트 계산
        const totalPoints = templates.reduce((sum, t) => sum + t.reward_points, 0);

        // 가장 최근 완료 시간
        const latestCompletedAt = userLogs
          .filter(l => l.completed_at)
          .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]?.completed_at;

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (hasCompletedAll) status = 'approved';
        if (hasFailedAll) status = 'rejected';

        const rewardInfo = rewardTrackingMap.get(userId);
        verifications.push({
          userId,
          username: profileData?.username || null,
          userImg: profileData?.user_img || null,
          email: userEmailMap.get(userId) || null,
          status,
          totalPoints,
          aiQualified,
          aiReason,
          rewardSent: rewardInfo?.rewardSent || false,
          rewardSentAt: rewardInfo?.sentAt || null,
          rewardNote: rewardInfo?.note || null,
          missions,
          submittedAt: latestCompletedAt || null
        });
      }
    });

    // pending 상태가 먼저, 그 다음 최근 제출 순으로 정렬
    verifications.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      if (!a.submittedAt) return 1;
      if (!b.submittedAt) return -1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    // AI 필터 적용
    let filteredVerifications = verifications;
    if (aiFilter === 'qualified') {
      filteredVerifications = verifications.filter(v => v.aiQualified === true);
    } else if (aiFilter === 'not_qualified') {
      filteredVerifications = verifications.filter(v => v.aiQualified === false);
    }
    // 'all' 또는 null인 경우 필터링 없음

    return NextResponse.json({
      data: {
        verifications: filteredVerifications,
        templates: templates.map(t => ({
          id: t.id,
          title: t.title,
          verificationType: t.verification_type,
          rewardPoints: t.reward_points
        }))
      }
    });
  } catch (error) {
    console.error('Campaign verifications GET error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// PATCH - 미션 승인/거부
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
      .select('id, title')
      .eq('id', campaignId)
      .eq('partner_id', partner.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다.' }, { status: 404 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    // 해당 캠페인의 미션 템플릿 조회
    const { data: missionTemplates } = await supabase
      .from('mission_templates')
      .select('id, reward_points')
      .eq('campaign_id', campaignId);

    const templates = missionTemplates || [];
    const templateIds = templates.map(t => t.id);

    if (templateIds.length === 0) {
      return NextResponse.json({ error: '미션이 없습니다.' }, { status: 404 });
    }

    // 사용자의 미션 로그 조회
    const { data: userLogs } = await supabase
      .from('mission_logs')
      .select('id, mission_template_id, status')
      .eq('user_id', userId)
      .in('mission_template_id', templateIds)
      .eq('status', 'PENDING_VERIFICATION');

    if (!userLogs || userLogs.length !== templates.length) {
      return NextResponse.json({ error: '검수 대상이 아닙니다.' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'COMPLETED' : 'FAILED';

    // 미션 로그 상태 업데이트
    const { error: updateError } = await supabase
      .from('mission_logs')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .in('mission_template_id', templateIds)
      .eq('status', 'PENDING_VERIFICATION');

    if (updateError) {
      console.error('Mission log update error:', updateError);
      return NextResponse.json({ error: '상태 업데이트 실패' }, { status: 500 });
    }

    // 승인 시 포인트 지급
    if (action === 'approve') {
      const totalPoints = templates.reduce((sum, t) => sum + t.reward_points, 0);

      // 현재 포인트 조회
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', userId)
        .single();

      const currentPoints = profile?.total_points || 0;

      // 포인트 업데이트
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({
          total_points: currentPoints + totalPoints
        })
        .eq('id', userId);

      if (pointsError) {
        console.error('Points update error:', pointsError);
        // 포인트 업데이트 실패해도 미션 상태는 이미 변경됨
      }

      // 포인트 로그 기록
      const { error: logError } = await supabase
        .from('point_log')
        .insert({
          user_id: userId,
          point: totalPoints,
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error('Point log error:', logError);
      }

      return NextResponse.json({
        success: true,
        action: 'approved',
        pointsAwarded: totalPoints
      });
    }

    return NextResponse.json({
      success: true,
      action: 'rejected'
    });
  } catch (error) {
    console.error('Campaign verification PATCH error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
