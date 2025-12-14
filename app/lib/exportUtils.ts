import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  topRegion: string | null;
  campaignCompletionRate: number;
}

// CSV Export
export const exportToCSV = (data: DashboardOverview) => {
  const timestamp = new Date().toISOString().split('T')[0];

  // Create CSV content
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

  // Download
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `dashboard_report_${timestamp}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// PDF Export
export const exportToPDF = (data: DashboardOverview) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('Dashboard Report', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('ko-KR')}`, 105, 28, { align: 'center' });

  let yPos = 40;

  // Main KPIs
  doc.setFontSize(14);
  doc.text('Main Indicators', 20, yPos);
  yPos += 10;

  const kpiData = [
    ['Total Participants', data.totalParticipants.toLocaleString()],
    ['Completed Missions', data.completedMissions.toLocaleString()],
    ['Mission Completion Rate', `${data.missionCompletionRate}%`],
    ['CO2 Reduction', `${data.co2Reduction}kg`],
    ['Monthly Growth', `${data.monthlyGrowth}%`],
    ['Weekly New Participants', data.weeklyNewParticipants.toString()],
    ['Campaign Completion Rate', `${data.campaignCompletionRate}%`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: kpiData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Top Campaign
  if (data.topCampaign) {
    doc.setFontSize(14);
    doc.text('Top Campaign', 20, yPos);
    yPos += 10;

    const campaignData = [
      ['Title', data.topCampaign.title],
      ['Participants', data.topCampaign.participants.toString()],
      ['Completed', data.topCampaign.completed.toString()],
      ['Completion Rate', `${data.topCampaign.completionRate}%`]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Property', 'Value']],
      body: campaignData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      margin: { left: 20, right: 20 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Category Distribution
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('Category Distribution', 20, yPos);
  yPos += 10;

  const categoryData = data.categoryDistribution.map(item => [
    item.category,
    item.participants.toString()
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Participants']],
    body: categoryData,
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Weekly Trend
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('Weekly Trend', 20, yPos);
  yPos += 10;

  const trendData = data.weeklyTrend.map(item => [
    item.date,
    item.participants.toString()
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Participants']],
    body: trendData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 20, right: 20 }
  });

  // Save
  doc.save(`dashboard_report_${timestamp}.pdf`);
};

// HWP Export (RTF format that HWP can open)
export const exportToHWP = (data: DashboardOverview) => {
  const timestamp = new Date().toISOString().split('T')[0];

  // Create RTF content (compatible with HWP)
  let rtf = '{\\rtf1\\ansi\\deff0\n';
  rtf += '{\\fonttbl{\\f0\\fnil\\fcharset129 Malgun Gothic;}}\n';
  rtf += '{\\colortbl;\\red16\\green185\\blue129;\\red0\\green0\\blue0;}\n';
  rtf += '\\viewkind4\\uc1\\pard\\sa200\\sl276\\slmult1\\lang1042\\f0\\fs28\n\n';

  // Title
  rtf += '{\\b\\fs44 Dashboard Report}\\par\n';
  rtf += `{\\fs20 Generated: ${new Date().toLocaleString('ko-KR')}}\\par\\par\n\n`;

  // Main KPIs
  rtf += '{\\cf1\\b\\fs32 \\uc8050\\uc50836 \\uc51648\\uc54364 (Main Indicators)}\\par\n';
  rtf += '\\par\n';
  rtf += `{\\b \\uc52509 \\uc52712\\uc50668\\uc51088:} ${data.totalParticipants.toLocaleString()}\\par\n`;
  rtf += `{\\b \\uc50872\\uc47308\\uc46108 \\uc48120\\uc49496:} ${data.completedMissions.toLocaleString()}\\par\n`;
  rtf += `{\\b \\uc48120\\uc49496 \\uc50872\\uc47308\\uc50984:} ${data.missionCompletionRate}%\\par\n`;
  rtf += `{\\b CO2 \\uc51208\\uc44144\\uc47049:} ${data.co2Reduction}kg\\par\n`;
  rtf += `{\\b \\uc50900\\uc44036 \\uc49457\\uc51109\\uc50984:} ${data.monthlyGrowth}%\\par\n`;
  rtf += `{\\b \\uc51060\\uc48264 \\uc51452 \\uc49888\\uc44172 \\uc52712\\uc50668\\uc51088:} ${data.weeklyNewParticipants}\\par\n`;
  rtf += `{\\b \\uc52880\\uc54144\\uc51064 \\uc50872\\uc47308\\uc50984:} ${data.campaignCompletionRate}%\\par\n`;
  rtf += '\\par\\par\n';

  // Top Campaign
  if (data.topCampaign) {
    rtf += '{\\cf1\\b\\fs32 \\uc52572\\uc44256 \\uc49457\\uc44284 \\uc52880\\uc54144\\uc51064 (Top Campaign)}\\par\n';
    rtf += '\\par\n';
    rtf += `{\\b \\uc51228\\uc47785:} ${data.topCampaign.title}\\par\n`;
    rtf += `{\\b \\uc52712\\uc50668\\uc51088 \\uc49688:} ${data.topCampaign.participants}\\par\n`;
    rtf += `{\\b \\uc50872\\uc47308\\uc46108 \\uc48120\\uc49496:} ${data.topCampaign.completed}\\par\n`;
    rtf += `{\\b \\uc50872\\uc47308\\uc50984:} ${data.topCampaign.completionRate}%\\par\n`;
    rtf += '\\par\\par\n';
  }

  // Category Distribution
  rtf += '{\\cf1\\b\\fs32 \\uc52852\\uc53944\\uc44256\\uc47532\\uc48324 \\uc52712\\uc50668\\uc51088 \\uc48516\\uc54252 (Category Distribution)}\\par\n';
  rtf += '\\par\n';
  data.categoryDistribution.forEach(item => {
    rtf += `{\\b ${item.category}:} ${item.participants}\\uc47749\\par\n`;
  });
  rtf += '\\par\\par\n';

  // Weekly Trend
  rtf += '{\\cf1\\b\\fs32 \\uc51452\\uc44036 \\uc52712\\uc50668\\uc51088 \\uc52628\\uc51060 (Weekly Trend)}\\par\n';
  rtf += '\\par\n';
  data.weeklyTrend.forEach(item => {
    rtf += `{\\b ${item.date}:} ${item.participants}\\uc47749\\par\n`;
  });
  rtf += '\\par\n';

  rtf += '}';

  // Download as .hwp file (actually RTF that HWP can open)
  const blob = new Blob([rtf], { type: 'application/x-hwp' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `dashboard_report_${timestamp}.hwp`;
  link.click();
  URL.revokeObjectURL(link.href);
};
