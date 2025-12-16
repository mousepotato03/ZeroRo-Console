import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// ArrayBuffer를 Base64로 변환하는 헬퍼 함수
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 한글 폰트 로드 및 등록 함수
async function loadKoreanFont(doc: jsPDF): Promise<boolean> {
  try {
    const fontResponse = await fetch('/fonts/NotoSansKR-Regular.ttf');
    
    if (!fontResponse.ok) {
      console.error(
        `한글 폰트 파일 로드 실패: ${fontResponse.status} ${fontResponse.statusText}\n` +
        `폰트 파일이 /fonts/NotoSansKR-Regular.ttf 경로에 존재하는지 확인하세요.`
      );
      return false;
    }
    
    const fontArrayBuffer = await fontResponse.arrayBuffer();
    
    if (fontArrayBuffer.byteLength === 0) {
      console.error('한글 폰트 파일이 비어있습니다.');
      return false;
    }
    
    const fontBase64 = arrayBufferToBase64(fontArrayBuffer);
    doc.addFileToVFS('NotoSansKR-Regular.ttf', fontBase64);
    doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
    
    console.log('한글 폰트 로드 및 등록 완료');
    return true;
  } catch (error) {
    console.error('한글 폰트 로드 중 오류 발생:', error);
    return false;
  }
}

interface DashboardOverview {
  totalParticipants: number;
  completedMissions: number;
  missionCompletionRate: number;
  co2Reduction: number;
  monthlyGrowth: number;
  weeklyNewParticipants: number;
  topCampaign: {
    title: string;
    participants: number;
    completed: number;
    completionRate: number;
  } | null;
  weeklyTrend: Array<{
    date: string;
    participants: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    participants: number;
  }>;
  topCategory: string | null;
  campaignCompletionRate: number;
  organizationName?: string; // 주최측 이름 (옵셔널)
}

// 헬퍼 함수: 0 값 처리 문구 생성
function getZeroValueNote(value: number, label: string, reason: string): string {
  if (value === 0) {
    return `${label}이(가) 없어 ${reason} (기간 내 데이터 없음).`;
  }
  return '';
}

// 헬퍼 함수: 카테고리 분포 합계 계산
function getCategoryTotal(categoryDistribution: Array<{ category: string; participants: number }>): number {
  return categoryDistribution.reduce((sum, item) => sum + item.participants, 0);
}

// CSV Export
export const exportToCSV = (data: DashboardOverview) => {
  const timestamp = new Date().toISOString().split('T')[0];

  let csv = 'Dashboard Report\n\n';
  csv += '=== 주요 지표 ===\n';
  csv += `총 참여자,${data.totalParticipants}\n`;
  csv += `완료된 미션,${data.completedMissions}\n`;
  csv += `미션 완료율,${data.missionCompletionRate}%\n`;
  csv += `CO2 절감량,${data.co2Reduction}kg\n`;
  csv += `월간 성장률,${data.monthlyGrowth}%\n`;
  csv += `이번 주 신규 참여자,${data.weeklyNewParticipants}\n`;
  csv += `캠페인 완료율,${data.campaignCompletionRate}%\n\n`;

  if (data.topCampaign) {
    csv += '=== 최고 성과 캠페인 ===\n';
    csv += `제목,${data.topCampaign.title}\n`;
    csv += `참여자 수,${data.topCampaign.participants}\n`;
    csv += `완료된 미션,${data.topCampaign.completed}\n`;
    csv += `완료율,${data.topCampaign.completionRate}%\n\n`;
  }

  csv += '=== 카테고리별 참여자 분포 ===\n';
  csv += '카테고리,참여자 수\n';
  data.categoryDistribution.forEach(item => {
    csv += `${item.category},${item.participants}\n`;
  });
  csv += '\n';

  csv += '=== 주간 참여자 추이 ===\n';
  csv += '날짜,참여자 수\n';
  data.weeklyTrend.forEach(item => {
    csv += `${item.date},${item.participants}\n`;
  });

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `dashboard_report_${timestamp}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// PDF Export - 리디자인 버전
export const exportToPDF = async (data: DashboardOverview) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const doc = new jsPDF();
  const fontLoaded = await loadKoreanFont(doc);
  
  let fontName = 'helvetica';
  if (fontLoaded) {
    try {
      doc.setFont('NotoSansKR', 'normal');
      fontName = 'NotoSansKR';
    } catch (e) {
      console.warn('한글 폰트 설정 실패:', e);
    }
  } else {
    console.warn('⚠️ 한글 폰트가 로드되지 않았습니다. PDF에서 한글이 깨질 수 있습니다.');
  }

  const reportDate = new Date().toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // ========== 페이지 1: 표지 ==========
  doc.setFont(fontName, 'normal');
  doc.setFontSize(28);
  doc.text('환경 영향 보고서', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
  
  // 주최측 이름
  if (data.organizationName) {
    doc.setFontSize(14);
    doc.text(data.organizationName, pageWidth / 2, pageHeight / 2, { align: 'center' });
  }
  
  doc.setFontSize(10);
  doc.text(`생성일: ${new Date().toLocaleString('ko-KR')}`, pageWidth / 2, pageHeight / 2 + (data.organizationName ? 15 : 10), { align: 'center' });

  // ========== 페이지 2: Executive Summary ==========
  doc.addPage();
  let yPos = margin;

  // 제목
  doc.setFont(fontName, 'bold');
  doc.setFontSize(18);
  doc.text('Executive Summary', margin, yPos);
  yPos += 15;

  // KPI 카드 (2x2 그리드)
  const cardWidth = (contentWidth - 10) / 2;
  const cardHeight = 40; // 높이 증가
  const cardSpacing = 10;

  // 총 참여자 카드
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, yPos, cardWidth, cardHeight, 3, 3, 'FD');
  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.text('총 참여자', margin + 8, yPos + 8);
  doc.setFontSize(20);
  doc.setFont(fontName, 'bold');
  const totalParticipantsNum = data.totalParticipants.toLocaleString();
  const totalParticipantsWidth = doc.getTextWidth(totalParticipantsNum);
  doc.text(totalParticipantsNum, margin + 8, yPos + 22);
  doc.setFontSize(12);
  doc.setFont(fontName, 'normal');
  doc.text('명', margin + 8 + totalParticipantsWidth + 2, yPos + 22);
  doc.setFontSize(9);
  doc.setFont(fontName, 'normal');
  let growthText: string;
  if (data.monthlyGrowth >= 999) {
    growthText = '신규 시작';
  } else {
    growthText = data.monthlyGrowth >= 0 ? `전월 대비 +${data.monthlyGrowth}%` : `전월 대비 ${data.monthlyGrowth}%`;
  }
  doc.setTextColor(data.monthlyGrowth >= 0 ? 16 : 239, data.monthlyGrowth >= 0 ? 185 : 68, data.monthlyGrowth >= 0 ? 129 : 68);
  doc.text(growthText, margin + 8, yPos + 33, { maxWidth: cardWidth - 16 });
  doc.setTextColor(0, 0, 0);

  // 이번 주 신규 카드
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 3, 3, 'FD');
  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.text('이번 주 신규', margin + cardWidth + cardSpacing + 8, yPos + 8);
  doc.setFontSize(20);
  doc.setFont(fontName, 'bold');
  const weeklyNewNum = data.weeklyNewParticipants.toLocaleString();
  const weeklyNewWidth = doc.getTextWidth(weeklyNewNum);
  doc.text(weeklyNewNum, margin + cardWidth + cardSpacing + 8, yPos + 22);
  doc.setFontSize(12);
  doc.setFont(fontName, 'normal');
  doc.text('명', margin + cardWidth + cardSpacing + 8 + weeklyNewWidth + 2, yPos + 22);
  doc.setFontSize(9);
  doc.setFont(fontName, 'normal');
  doc.text('최근 7일간 첫 참여', margin + cardWidth + cardSpacing + 8, yPos + 33, { maxWidth: cardWidth - 16 });

  yPos += cardHeight + cardSpacing;

  // 미션 성과 카드 (통합)
  const startedMissions = data.missionCompletionRate > 0 
    ? Math.round(data.completedMissions / (data.missionCompletionRate / 100)) 
    : 0;
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, yPos, cardWidth, cardHeight, 3, 3, 'FD');
  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.text('미션 성과', margin + 8, yPos + 8);
  doc.setFontSize(20);
  doc.setFont(fontName, 'bold');
  const missionRateText = data.missionCompletionRate + '%';
  doc.text(missionRateText, margin + 8, yPos + 22, { maxWidth: cardWidth - 16 });
  doc.setFontSize(9);
  doc.setFont(fontName, 'normal');
  const missionDetailText = `완료 ${data.completedMissions} / 시작 ${startedMissions}개`;
  doc.text(missionDetailText, margin + 8, yPos + 33, { maxWidth: cardWidth - 16 });

  // CO2 절감량 카드
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 3, 3, 'FD');
  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.text('CO2 절감량', margin + cardWidth + cardSpacing + 8, yPos + 8);
  doc.setFontSize(20);
  doc.setFont(fontName, 'bold');
  const co2Text = data.co2Reduction.toLocaleString() + 'kg';
  doc.text(co2Text, margin + cardWidth + cardSpacing + 8, yPos + 22, { maxWidth: cardWidth - 16 });
  doc.setFontSize(9);
  doc.setFont(fontName, 'normal');
  const topCategoryText = data.topCategory || '없음';
  doc.text(`Top: ${topCategoryText}`, margin + cardWidth + cardSpacing + 8, yPos + 33, { maxWidth: cardWidth - 16 });

  yPos += cardHeight + 20;

  // 0 값 처리 문구
  const zeroNotes: string[] = [];
  if (data.completedMissions === 0) {
    zeroNotes.push(getZeroValueNote(data.completedMissions, '완료된 미션', 'CO2 절감량은 0kg로 집계되었습니다'));
  }
  if (data.weeklyNewParticipants === 0) {
    zeroNotes.push(getZeroValueNote(data.weeklyNewParticipants, '이번 주 신규 참여자', '최근 7일간 첫 참여한 사용자가 없습니다'));
  }
  if (data.categoryDistribution.length === 0) {
    zeroNotes.push('카테고리별 참여 데이터가 없습니다 (기간 내 참여 활동 없음).');
  }

  if (zeroNotes.length > 0) {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    zeroNotes.forEach((note, index) => {
      doc.text(`• ${note}`, margin, yPos + (index * 5));
    });
    doc.setTextColor(0, 0, 0);
    yPos += zeroNotes.length * 5 + 10;
  }

  // 주요 인사이트
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('주요 인사이트', margin, yPos);
  yPos += 8;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  const insights: string[] = [];
  if (data.monthlyGrowth >= 999) {
    insights.push(`총 ${data.totalParticipants}명의 참여자가 시작되어 신규 활동이 시작되었습니다.`);
  } else if (data.monthlyGrowth !== 0) {
    insights.push(`총 참여자가 전월 대비 ${Math.abs(data.monthlyGrowth)}% ${data.monthlyGrowth > 0 ? '증가' : '감소'}하여 ${data.monthlyGrowth > 0 ? '성장' : '하락'} 추세를 보입니다.`);
  }
  if (data.topCategory) {
    const topCategoryData = data.categoryDistribution.find(c => c.category === data.topCategory);
    if (topCategoryData) {
      const categoryTotal = getCategoryTotal(data.categoryDistribution);
      const topCategoryPercentage = categoryTotal > 0 
        ? Math.round((topCategoryData.participants / categoryTotal) * 100) 
        : 0;
      insights.push(`${data.topCategory} 카테고리가 전체 참여의 ${topCategoryPercentage}%를 차지하며 가장 높은 기여도를 보입니다.`);
    }
  }
  if (data.topCampaign) {
    insights.push(`${data.topCampaign.title} 캠페인이 ${data.topCampaign.participants}명의 참여로 최고 성과를 기록했습니다.`);
  }

  insights.forEach((insight, index) => {
    doc.text(`• ${insight}`, margin + 5, yPos + (index * 6));
  });
  yPos += insights.length * 6 + 10;

  // 다음 액션
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.text('다음 액션', margin, yPos);
  yPos += 8;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  const actions: string[] = [];
  if (data.weeklyNewParticipants < data.totalParticipants * 0.1) {
    actions.push('신규 참여자 유지율 개선을 위해 리텐션 전략을 검토합니다.');
  }
  if (data.topCategory) {
    actions.push(`${data.topCategory} 카테고리의 성공 요인을 분석하여 다른 카테고리에 적용합니다.`);
  }
  if (data.missionCompletionRate < 50) {
    actions.push('미션 완료율 향상을 위한 난이도 조정 및 리마인더 전략을 수립합니다.');
  }

  actions.forEach((action, index) => {
    doc.text(`□ ${action}`, margin + 5, yPos + (index * 6));
  });

  // ========== 페이지 3: 주요 지표 (KPI) 상세 ==========
  doc.addPage();
  yPos = margin;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.text('1. 주요 지표 (KPI)', margin, yPos);
  yPos += 15;

  // 1.1 총 참여자
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.text('1.1 총 참여자', margin, yPos);
  yPos += 8;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.text(`이번 기간 총 참여자는 ${data.totalParticipants.toLocaleString()}명입니다.`, margin, yPos);
  yPos += 6;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.text('[트렌드 설명]', margin, yPos);
  yPos += 6;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  if (data.monthlyGrowth === 0) {
    doc.text('• 전월 대비 변화 없음 (0%)', margin + 5, yPos);
    yPos += 6;
    doc.text('• 전월과 동일한 수준을 유지하고 있습니다', margin + 5, yPos);
  } else if (data.monthlyGrowth >= 999) {
    // 전월에 참여자가 없었고 현재 참여자가 생긴 경우
    doc.text('• 전월 대비 신규 참여자 발생', margin + 5, yPos);
    yPos += 6;
    doc.text(`• 총 ${data.totalParticipants}명의 참여자가 시작되었습니다`, margin + 5, yPos);
  } else {
    const growthDirection = data.monthlyGrowth > 0 ? '증가' : '감소';
    doc.text(`• 전월 대비 ${Math.abs(data.monthlyGrowth)}% ${growthDirection}`, margin + 5, yPos);
    yPos += 6;
    doc.text(`• ${growthDirection} 추세가 ${data.monthlyGrowth > 0 ? '지속' : '전환'}되고 있습니다`, margin + 5, yPos);
  }
  yPos += 10;

  // 각주
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('[각주 1] 총 참여자: 보고 기간 내 최소 1회 이상 참여한 고유 사용자 수', margin, yPos);
  yPos += 5;
  doc.text('[각주 2] 전월 대비: 전월 동일 기간 대비 변화율', margin, yPos);
  yPos += 15;
  doc.setTextColor(0, 0, 0);

  // 1.2 이번 주 신규 참여자
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.text('1.2 이번 주 신규 참여자', margin, yPos);
  yPos += 8;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  if (data.weeklyNewParticipants === 0) {
    doc.text('최근 7일간 첫 참여한 신규 사용자는 0명입니다 (최근 7일간 첫 참여한 사용자 없음).', margin, yPos);
  } else {
    doc.text(`최근 7일간 첫 참여한 신규 사용자는 ${data.weeklyNewParticipants.toLocaleString()}명입니다.`, margin, yPos);
  }
  yPos += 6;

  if (data.weeklyNewParticipants > 0) {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    doc.text('[트렌드 설명]', margin, yPos);
    yPos += 6;

    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    const newUserPercentage = data.totalParticipants > 0 
      ? ((data.weeklyNewParticipants / data.totalParticipants) * 100).toFixed(1) 
      : '0.0';
    doc.text(`• 전체 참여자 대비 ${newUserPercentage}%를 차지`, margin + 5, yPos);
    yPos += 10;
  }

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('[각주] 신규 참여자: 최근 7일간 첫 참여한 고유 사용자 수', margin, yPos);
  yPos += 15;
  doc.setTextColor(0, 0, 0);

  // 페이지 넘김 체크
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  // 1.3 미션 성과 (통합)
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.text('1.3 미션 성과', margin, yPos);
  yPos += 8;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  if (data.completedMissions === 0) {
    doc.text('완료된 미션이 없어 미션 완료율은 0%로 집계되었습니다 (기간 내 완료 데이터 없음).', margin, yPos);
  } else {
    doc.text(`미션 완료율은 ${data.missionCompletionRate}%이며, ${data.completedMissions.toLocaleString()}개의 미션이 완료되었습니다.`, margin, yPos);
  }
  yPos += 6;

  if (data.completedMissions > 0) {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    doc.text('[상세]', margin, yPos);
    yPos += 6;

    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    doc.text(`• 완료된 미션: ${data.completedMissions.toLocaleString()}개`, margin + 5, yPos);
    yPos += 6;
    doc.text(`• 시작된 미션: ${startedMissions.toLocaleString()}개`, margin + 5, yPos);
    yPos += 6;
    doc.text(`• 전체 캠페인 평균 완료율: ${data.campaignCompletionRate}%`, margin + 5, yPos);
    yPos += 10;
  }

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('[각주 1] 미션 완료율: (완료된 미션 수 / 시작된 미션 수) × 100', margin, yPos);
  yPos += 5;
  doc.text('[각주 2] 전체 캠페인 완료율: 모든 캠페인의 평균 완료율', margin, yPos);
  yPos += 15;
  doc.setTextColor(0, 0, 0);

  // 페이지 넘김 체크
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  // 1.4 CO2 절감량
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.text('1.4 CO2 절감량', margin, yPos);
  yPos += 8;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  if (data.co2Reduction === 0) {
    doc.text('완료된 미션이 없어 CO2 절감량은 0kg로 집계되었습니다 (기간 내 완료 데이터 없음).', margin, yPos);
  } else {
    doc.text(`총 CO2 절감량은 ${data.co2Reduction.toLocaleString()}kg입니다.`, margin, yPos);
  }
  yPos += 6;

  if (data.co2Reduction > 0 && data.topCategory) {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    doc.text('[카테고리별 기여]', margin, yPos);
    yPos += 6;

    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    const topCategoryData = data.categoryDistribution.find(c => c.category === data.topCategory);
    if (topCategoryData) {
      const categoryTotal = getCategoryTotal(data.categoryDistribution);
      const topCategoryPercentage = categoryTotal > 0 
        ? Math.round((topCategoryData.participants / categoryTotal) * 100) 
        : 0;
      doc.text(`• ${data.topCategory}: ${topCategoryPercentage}%`, margin + 5, yPos);
      yPos += 6;
    }
  }

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('[각주 1] CO2 절감량: Σ(카테고리별 완료 미션 수 × 카테고리별 CO2 계수)', margin, yPos);
  yPos += 5;
  doc.text('[각주 2] CO2 계수는 카테고리별 환경 활동의 표준 값을 기반으로 설정됨', margin, yPos);
  yPos += 15;
  doc.setTextColor(0, 0, 0);

  // ========== 페이지 4: 참여자 트렌드 ==========
  doc.addPage();
  yPos = margin;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.text('2. 참여자 트렌드', margin, yPos);
  yPos += 10;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.text('2.1 주간 참여자 추이', margin, yPos);
  yPos += 8;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.text('최근 7일간 일별 참여자 수는 다음과 같습니다.', margin, yPos);
  yPos += 10;

  // 주간 추이 표
  const trendData = data.weeklyTrend.map(item => [
    item.date,
    item.participants.toString() + '명'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['날짜', '참여자 수']],
    body: trendData,
    theme: 'grid',
    headStyles: { 
      fillColor: [16, 185, 129],
      font: fontName,
      fontStyle: 'normal',
      textColor: [255, 255, 255]
    },
    bodyStyles: {
      font: fontName,
      fontStyle: 'normal'
    },
    styles: {
      font: fontName,
      fontStyle: 'normal'
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // 각주
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('[각주 1] 일별 참여자: 해당 일자에 활동한 고유 사용자 수', margin, yPos);
  yPos += 5;
  doc.text('[각주 2] 중복 집계: 사용자가 여러 일자에 참여한 경우 각 일자별로 집계됨', margin, yPos);
  doc.setTextColor(0, 0, 0);

  // ========== 페이지 5: 카테고리 분포 ==========
  doc.addPage();
  yPos = margin;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.text('3. 카테고리 분포', margin, yPos);
  yPos += 10;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.text('3.1 카테고리별 참여자 분포', margin, yPos);
  yPos += 8;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  if (data.categoryDistribution.length === 0) {
    doc.text('카테고리별 참여 데이터가 없습니다 (기간 내 참여 활동 없음).', margin, yPos);
  } else {
    doc.text('카테고리별 참여자 분포는 다음과 같습니다.', margin, yPos);
    yPos += 10;

    // 카테고리 분포 표
    const categoryTotal = getCategoryTotal(data.categoryDistribution);
    const categoryData = data.categoryDistribution.map(item => {
      const percentage = categoryTotal > 0 
        ? ((item.participants / categoryTotal) * 100).toFixed(1) 
        : '0.0';
      return [
        item.category,
        item.participants.toString() + '명',
        percentage + '%'
      ];
    });

    // 합계 행 추가
    categoryData.push([
      '합계',
      categoryTotal.toString() + '명',
      '100.0%'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['카테고리', '참여자 수', '비율']],
      body: categoryData,
      theme: 'grid',
      headStyles: { 
        fillColor: [16, 185, 129],
        font: fontName,
        fontStyle: 'normal',
        textColor: [255, 255, 255]
      },
      bodyStyles: {
        font: fontName,
        fontStyle: 'normal'
      },
      styles: {
        font: fontName,
        fontStyle: 'normal'
      },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // 주의사항 박스 (중복 집계 여부)
    const categorySum = categoryTotal;
    const totalParticipants = data.totalParticipants;
    const isDuplicate = categorySum !== totalParticipants;

    if (isDuplicate) {
      // 주의사항 박스
      doc.setDrawColor(245, 158, 11);
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'FD');
      
      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(146, 64, 14);
      doc.text('⚠️ 주의사항', margin + 5, yPos + 8);
      
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8);
      doc.text(
        `카테고리별 참여자 수의 합(${categorySum.toLocaleString()}명)이 총 참여자 수(${totalParticipants.toLocaleString()}명)와 다를 수 있습니다.`,
        margin + 5, yPos + 15
      );
      doc.text(
        '이는 한 사용자가 여러 카테고리에 참여할 수 있기 때문입니다 (중복 집계).',
        margin + 5, yPos + 20
      );
      doc.setTextColor(0, 0, 0);
      yPos += 30;
    }

    // 각주
    doc.setFont(fontName, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    if (isDuplicate) {
      doc.text('[각주 1] 카테고리별 참여자: 해당 카테고리 활동에 참여한 사용자 수 (중복 집계)', margin, yPos);
      yPos += 5;
      doc.text('[각주 2] 중복 집계: 한 사용자가 여러 카테고리에 참여한 경우 각 카테고리별로 집계됨', margin, yPos);
    } else {
      doc.text('[각주 1] 카테고리별 참여자: 해당 카테고리 활동에 참여한 고유 사용자 수', margin, yPos);
      yPos += 5;
      doc.text('[각주 2] 고유 집계: 한 사용자가 여러 카테고리에 참여한 경우에도 1명으로 집계됨', margin, yPos);
      yPos += 5;
      doc.text(`[각주 3] 합계는 총 참여자 수(${totalParticipants.toLocaleString()}명)와 일치합니다`, margin, yPos);
    }
    doc.setTextColor(0, 0, 0);
  }

  // ========== 페이지 6: 캠페인 성과 분석 ==========
  if (data.topCampaign) {
    doc.addPage();
    yPos = margin;

    doc.setFont(fontName, 'normal');
    doc.setFontSize(16);
    doc.text('4. 캠페인 성과 분석', margin, yPos);
    yPos += 10;

    doc.setFont(fontName, 'normal');
    doc.setFontSize(12);
    doc.text('4.1 최고 성과 캠페인', margin, yPos);
    yPos += 8;

    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    doc.text('참여자 수 기준 상위 캠페인은 다음과 같습니다.', margin, yPos);
    yPos += 10;

    // Top 캠페인 정보
    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    doc.text('1. ' + data.topCampaign.title, margin, yPos);
    yPos += 6;

    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    doc.text(`   • 참여자: ${data.topCampaign.participants.toLocaleString()}명`, margin + 5, yPos);
    yPos += 6;
    doc.text(`   • 완료율: ${data.topCampaign.completionRate}%`, margin + 5, yPos);
    yPos += 6;
    doc.text(`   • 완료 수: ${data.topCampaign.completed.toLocaleString()}개`, margin + 5, yPos);
    yPos += 15;

    // 각주
    doc.setFont(fontName, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('[각주 1] 랭킹 기준: 참여자 수 기준 내림차순 정렬', margin, yPos);
    yPos += 5;
    doc.text('[각주 2] 집계 기간: 보고 기간 전체', margin, yPos);
    doc.setTextColor(0, 0, 0);
  }

  // ========== 페이지 7: 부록 ==========
  doc.addPage();
  yPos = margin;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(16);
  doc.text('부록: 데이터 정의 및 계산식', margin, yPos);
  yPos += 15;

  // A. 지표 정의
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.text('A. 지표 정의', margin, yPos);
  yPos += 10;

  const definitions = [
    ['총 참여자', '보고 기간 내 최소 1회 이상 참여한 고유 사용자 수'],
    ['신규 참여자', '최근 7일간 첫 참여한 고유 사용자 수'],
    ['미션 완료율', '(완료된 미션 수 / 시작된 미션 수) × 100'],
    ['CO2 절감량', 'Σ(카테고리별 완료 미션 수 × 카테고리별 CO2 계수)'],
    ['전월 대비', '전월 동일 기간 대비 변화율'],
  ];

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  definitions.forEach(([term, definition]) => {
    doc.setFont(fontName, 'normal');
    doc.text(`${term}:`, margin, yPos);
    doc.setFont(fontName, 'normal');
    doc.text(definition, margin + 40, yPos);
    yPos += 7;
  });

  yPos += 5;

  // B. 계산식 및 집계 기준
  doc.setFont(fontName, 'normal');
  doc.setFontSize(12);
  doc.text('B. 계산식 및 집계 기준', margin, yPos);
  yPos += 10;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.text('미션 완료율 계산식:', margin, yPos);
  yPos += 6;
  doc.text('  완료율 = (완료된 미션 수 / 시작된 미션 수) × 100', margin + 5, yPos);
  yPos += 10;

  doc.text('CO2 절감량 계산식:', margin, yPos);
  yPos += 6;
  doc.text('  CO2 절감량 = Σ(카테고리별 완료 미션 수 × 카테고리별 CO2 계수)', margin + 5, yPos);
  yPos += 10;

  doc.text('집계 기준:', margin, yPos);
  yPos += 6;
  doc.text('  • 시작된 미션: 사용자가 미션을 시작한 시점', margin + 5, yPos);
  yPos += 6;
  doc.text('  • 완료된 미션: 미션의 모든 단계를 완료한 시점', margin + 5, yPos);
  yPos += 6;
  doc.text(`  • 집계 기간: ${reportDate}`, margin + 5, yPos);

  // Save
  doc.save(`dashboard_report_${timestamp}.pdf`);
};

// DOCX Export - 리디자인 버전 (PDF와 동일한 구조)
export const exportToDOCX = async (data: DashboardOverview) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportDate = new Date().toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const sections: (Paragraph | Table)[] = [];

  // 표지
  const coverParagraphs: Paragraph[] = [
    new Paragraph({
      text: '환경 영향 보고서',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  ];

  // 주최측 이름
  if (data.organizationName) {
    coverParagraphs.push(
      new Paragraph({
        text: data.organizationName,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  coverParagraphs.push(
    new Paragraph({
      text: `생성일: ${new Date().toLocaleString('ko-KR')}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    })
  );

  sections.push(...coverParagraphs);

  // Executive Summary
  sections.push(
    new Paragraph({
      text: 'Executive Summary',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
    })
  );

  // KPI 카드 (표로 구현)
  const kpiTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [
                new TextRun({ text: '총 참여자', bold: true }),
                new TextRun({ text: '\n' + data.totalParticipants.toLocaleString() + '명', bold: true, size: 32 }),
                new TextRun({ 
                  text: data.monthlyGrowth >= 999 
                    ? '\n신규 시작'
                    : `\n전월 대비 ${data.monthlyGrowth >= 0 ? '+' : ''}${data.monthlyGrowth}%`,
                  size: 18,
                  color: data.monthlyGrowth >= 0 ? '10B981' : 'EF4444'
                })
              ]
            })],
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'F9FAFB' },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [
                new TextRun({ text: '이번 주 신규', bold: true }),
                new TextRun({ text: '\n' + data.weeklyNewParticipants.toLocaleString() + '명', bold: true, size: 32 }),
                new TextRun({ 
                  text: `\n최근 7일간 첫 참여`,
                  size: 18
                })
              ]
            })],
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'F9FAFB' },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [
                new TextRun({ text: '미션 성과', bold: true }),
                new TextRun({ text: '\n' + data.missionCompletionRate + '%', bold: true, size: 32 }),
                new TextRun({ 
                  text: `\n완료 ${data.completedMissions} / 시작 ${data.missionCompletionRate > 0 ? Math.round(data.completedMissions / (data.missionCompletionRate / 100)) : 0}개`,
                  size: 18
                })
              ]
            })],
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'F9FAFB' },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [
                new TextRun({ text: 'CO2 절감량', bold: true }),
                new TextRun({ text: '\n' + data.co2Reduction.toLocaleString() + 'kg', bold: true, size: 32 }),
                new TextRun({ 
                  text: `\nTop: ${data.topCategory || '없음'}`,
                  size: 18
                })
              ]
            })],
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'F9FAFB' },
          }),
        ],
      }),
    ],
  });

  sections.push(kpiTable);

  // 주요 인사이트
  sections.push(
    new Paragraph({
      text: '주요 인사이트',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  );

  const insights: string[] = [];
  if (data.monthlyGrowth >= 999) {
    insights.push(`총 ${data.totalParticipants}명의 참여자가 시작되어 신규 활동이 시작되었습니다.`);
  } else if (data.monthlyGrowth !== 0) {
    insights.push(`총 참여자가 전월 대비 ${Math.abs(data.monthlyGrowth)}% ${data.monthlyGrowth > 0 ? '증가' : '감소'}하여 ${data.monthlyGrowth > 0 ? '성장' : '하락'} 추세를 보입니다.`);
  }
  if (data.topCategory) {
    const topCategoryData = data.categoryDistribution.find(c => c.category === data.topCategory);
    if (topCategoryData) {
      const categoryTotal = getCategoryTotal(data.categoryDistribution);
      const topCategoryPercentage = categoryTotal > 0 
        ? Math.round((topCategoryData.participants / categoryTotal) * 100) 
        : 0;
      insights.push(`${data.topCategory} 카테고리가 전체 참여의 ${topCategoryPercentage}%를 차지하며 가장 높은 기여도를 보입니다.`);
    }
  }
  if (data.topCampaign) {
    insights.push(`${data.topCampaign.title} 캠페인이 ${data.topCampaign.participants}명의 참여로 최고 성과를 기록했습니다.`);
  }

  insights.forEach(insight => {
    sections.push(
      new Paragraph({
        text: `• ${insight}`,
        spacing: { after: 100 },
      })
    );
  });

  // 다음 액션
  sections.push(
    new Paragraph({
      text: '다음 액션',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  );

  const actions: string[] = [];
  if (data.weeklyNewParticipants < data.totalParticipants * 0.1) {
    actions.push('신규 참여자 유지율 개선을 위해 리텐션 전략을 검토합니다.');
  }
  if (data.topCategory) {
    actions.push(`${data.topCategory} 카테고리의 성공 요인을 분석하여 다른 카테고리에 적용합니다.`);
  }
  if (data.missionCompletionRate < 50) {
    actions.push('미션 완료율 향상을 위한 난이도 조정 및 리마인더 전략을 수립합니다.');
  }

  actions.forEach(action => {
    sections.push(
      new Paragraph({
        text: `□ ${action}`,
        spacing: { after: 100 },
      })
    );
  });

  // 주요 지표 상세 (간략화)
  sections.push(
    new Paragraph({
      text: '1. 주요 지표 (KPI)',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 800, after: 200 },
    })
  );

  const kpiDetailTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: '지표', alignment: AlignmentType.CENTER })],
            shading: { fill: '10B981' },
          }),
          new TableCell({
            children: [new Paragraph({ text: '값', alignment: AlignmentType.CENTER })],
            shading: { fill: '10B981' },
          }),
          new TableCell({
            children: [new Paragraph({ text: '설명', alignment: AlignmentType.CENTER })],
            shading: { fill: '10B981' },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('총 참여자')] }),
          new TableCell({ children: [new Paragraph(data.totalParticipants.toLocaleString() + '명')] }),
          new TableCell({ children: [new Paragraph('보고 기간 내 최소 1회 이상 참여한 고유 사용자 수')] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('이번 주 신규')] }),
          new TableCell({ children: [new Paragraph(data.weeklyNewParticipants.toLocaleString() + '명')] }),
          new TableCell({ children: [new Paragraph('최근 7일간 첫 참여한 고유 사용자 수')] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('미션 성과')] }),
          new TableCell({ children: [new Paragraph(data.missionCompletionRate + '%')] }),
          new TableCell({ children: [new Paragraph(`완료 ${data.completedMissions}개 / 시작 ${data.missionCompletionRate > 0 ? Math.round(data.completedMissions / (data.missionCompletionRate / 100)) : 0}개`)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('CO2 절감량')] }),
          new TableCell({ children: [new Paragraph(data.co2Reduction.toLocaleString() + 'kg')] }),
          new TableCell({ children: [new Paragraph('Σ(카테고리별 완료 미션 수 × 카테고리별 CO2 계수)')] }),
        ],
      }),
    ],
  });

  sections.push(kpiDetailTable);

  // 참여자 트렌드
  sections.push(
    new Paragraph({
      text: '2. 참여자 트렌드',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 800, after: 200 },
    })
  );

  const trendTableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: '날짜', alignment: AlignmentType.CENTER })],
          shading: { fill: '10B981' },
        }),
        new TableCell({
          children: [new Paragraph({ text: '참여자 수', alignment: AlignmentType.CENTER })],
          shading: { fill: '10B981' },
        }),
      ],
    }),
    ...data.weeklyTrend.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(item.date)] }),
            new TableCell({ children: [new Paragraph(item.participants.toString() + '명')] }),
          ],
        })
    ),
  ];

  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: trendTableRows,
    })
  );

  sections.push(
    new Paragraph({
      text: '[각주 1] 일별 참여자: 해당 일자에 활동한 고유 사용자 수',
      spacing: { before: 200 },
    }),
    new Paragraph({
      text: '[각주 2] 중복 집계: 사용자가 여러 일자에 참여한 경우 각 일자별로 집계됨',
    })
  );

  // 카테고리 분포
  if (data.categoryDistribution.length > 0) {
    sections.push(
      new Paragraph({
        text: '3. 카테고리 분포',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 800, after: 200 },
      })
    );

    const categoryTotal = getCategoryTotal(data.categoryDistribution);
    const categoryTableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: '카테고리', alignment: AlignmentType.CENTER })],
            shading: { fill: '10B981' },
          }),
          new TableCell({
            children: [new Paragraph({ text: '참여자 수', alignment: AlignmentType.CENTER })],
            shading: { fill: '10B981' },
          }),
          new TableCell({
            children: [new Paragraph({ text: '비율', alignment: AlignmentType.CENTER })],
            shading: { fill: '10B981' },
          }),
        ],
      }),
      ...data.categoryDistribution.map((item) => {
        const percentage = categoryTotal > 0 
          ? ((item.participants / categoryTotal) * 100).toFixed(1) 
          : '0.0';
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(item.category)] }),
            new TableCell({ children: [new Paragraph(item.participants.toString() + '명')] }),
            new TableCell({ children: [new Paragraph(percentage + '%')] }),
          ],
        });
      }),
      new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: '합계', bold: true })] })] 
          }),
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: categoryTotal.toString() + '명', bold: true })] })] 
          }),
          new TableCell({ 
            children: [new Paragraph({ children: [new TextRun({ text: '100.0%', bold: true })] })] 
          }),
        ],
      }),
    ];

    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: categoryTableRows,
      })
    );

    // 주의사항
    const isDuplicate = categoryTotal !== data.totalParticipants;
    if (isDuplicate) {
      sections.push(
        new Paragraph({
          text: '⚠️ 주의사항',
          spacing: { before: 300 },
        }),
        new Paragraph({
          text: `카테고리별 참여자 수의 합(${categoryTotal.toLocaleString()}명)이 총 참여자 수(${data.totalParticipants.toLocaleString()}명)와 다를 수 있습니다. 이는 한 사용자가 여러 카테고리에 참여할 수 있기 때문입니다 (중복 집계).`,
          spacing: { after: 200 },
        })
      );
    }

    sections.push(
      new Paragraph({
        text: isDuplicate 
          ? '[각주 1] 카테고리별 참여자: 해당 카테고리 활동에 참여한 사용자 수 (중복 집계)'
          : '[각주 1] 카테고리별 참여자: 해당 카테고리 활동에 참여한 고유 사용자 수',
      }),
      new Paragraph({
        text: isDuplicate
          ? '[각주 2] 중복 집계: 한 사용자가 여러 카테고리에 참여한 경우 각 카테고리별로 집계됨'
          : '[각주 2] 고유 집계: 한 사용자가 여러 카테고리에 참여한 경우에도 1명으로 집계됨',
      })
    );
  }

  // 부록
  sections.push(
    new Paragraph({
      text: '부록: 데이터 정의 및 계산식',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 800, after: 200 },
    }),
    new Paragraph({
      text: 'A. 지표 정의',
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: '총 참여자: 보고 기간 내 최소 1회 이상 참여한 고유 사용자 수',
    }),
    new Paragraph({
      text: '신규 참여자: 최근 7일간 첫 참여한 고유 사용자 수',
    }),
    new Paragraph({
      text: '미션 완료율: (완료된 미션 수 / 시작된 미션 수) × 100',
    }),
    new Paragraph({
      text: 'CO2 절감량: Σ(카테고리별 완료 미션 수 × 카테고리별 CO2 계수)',
    })
  );

  // 문서 생성
  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  });

  // 파일 다운로드
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `dashboard_report_${timestamp}.docx`);
};
