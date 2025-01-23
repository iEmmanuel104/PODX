// utils/exportMetrics.ts
import { CallStatsReport } from '@/store/api/callAnalyticsApi';
import { format } from 'date-fns';

export const exportMetricsToCSV = (data: any) => {
    if (!data) return;

    const { analytics, reports } = data;

    // Prepare summary metrics
    const summaryData = [
        ['Summary Metrics'],
        ['Metric', 'Value'],
        ['Total Calls', analytics.totalCalls],
        ['Total Duration (minutes)', Math.round(analytics.totalDuration / 60)],
        ['Average Duration (minutes)', Math.round(analytics.averageDuration / 60)],
        ['Average Quality Score', `${analytics.averageQualityScore.toFixed(1)}%`],
        [''],
        ['Quality Distribution'],
        ['Excellent Quality Calls', analytics.qualityScoreRanges.excellent],
        ['Good Quality Calls', analytics.qualityScoreRanges.good],
        ['Fair Quality Calls', analytics.qualityScoreRanges.fair],
        ['Poor Quality Calls', analytics.qualityScoreRanges.poor],
        [''],
        ['Call Duration Types'],
        ['Short Calls (<5min)', analytics.callsByDuration.short],
        ['Medium Calls (5-15min)', analytics.callsByDuration.medium],
        ['Long Calls (>15min)', analytics.callsByDuration.long],
        [''],
        ['Detailed Call Records'],
        ['Session ID', 'Call Type', 'Duration (min)', 'Quality Score', 'Status', 'Created At'],
    ];

    // Add detailed call records
    reports.forEach((report: CallStatsReport) => {
        const sessionId = report.call_cid.split(':')[1] || report.call_session_id;
        const callType = report.call_cid.split(':')[0] || 'unknown';
        summaryData.push([
            sessionId,
            callType,
            Math.round(report.call_duration_seconds / 60).toString(),
            report.quality_score ? `${report.quality_score}%` : 'N/A',
            report.call_status,
            report.created_at ? format(new Date(report.created_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        ]);
    });

    // Convert to CSV string
    const csvContent = summaryData
        .map(row =>
            row
                .map(cell => {
                    // Handle cells that might contain commas
                    if (typeof cell === 'string' && cell.includes(',')) {
                        return `"${cell}"`;
                    }
                    return cell;
                })
                .join(',')
        )
        .join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `call_metrics_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
