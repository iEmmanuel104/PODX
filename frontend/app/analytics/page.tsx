'use client';

import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    Line,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Download, Link, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from '@/components/ui/logo';
import { format } from 'date-fns';
import { exportMetricsToCSV } from '@/utils/exportMetrics';
import { useListDetailedCallStatsQuery } from '@/store/callStats/callAnalyticsApi';

// Pagination controls component
const PaginationControls = ({
    hasMore,
    onNext,
    onPrevious,
    currentPage,
    isLoading,
}: {
    hasMore: boolean;
    onNext: () => void;
    onPrevious: () => void;
    currentPage: number;
    isLoading: boolean;
}) => (
    <div className="flex items-center justify-center gap-4 mt-4">
        <Button variant="outline" onClick={onPrevious} disabled={currentPage === 1 || isLoading}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
        </Button>
        <span className="text-sm text-gray-400">Page {currentPage}</span>
        <Button variant="outline" onClick={onNext} disabled={!hasMore || isLoading}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
    </div>
);

export default function AnalyticsDashboard() {
    const [currentPage, setCurrentPage] = useState(1);
    const [nextToken, setNextToken] = useState<string | undefined>();
    const pageSize = 100;

    const {
        data: statsData,
        isLoading,
        error,
    } = useListDetailedCallStatsQuery({
        size: pageSize,
        next: nextToken ?? '',
    });

    // Handle pagination
    const handleNextPage = () => {
        if (statsData?.data?.pagination?.next) {
            setNextToken(statsData.data.pagination.next);
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setNextToken(undefined); // Reset to first page
            setCurrentPage(prev => prev - 1);
        }
    };

    // Transform the API data for charts
    const callMetricsData = useMemo(() => {
        if (!statsData?.data?.analytics?.timeDistribution) return [];
        return Object.entries(statsData.data.analytics.timeDistribution)
            .map(([date, count]) => ({
                date: format(new Date(date), 'MM/dd'),
                calls: count,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [statsData]);

    const callTypeData = useMemo(() => {
        if (!statsData?.data?.reports) return [];

        const typeCount = statsData.data.reports.reduce(
            (acc: { [key: string]: number }, report) => {
                const callType = report.call_cid.split(':')[0] || 'unknown';
                acc[callType] = (acc[callType] || 0) + 1;
                return acc;
            },
            {}
        );

        return Object.entries(typeCount).map(([type, value]) => ({
            type: type.charAt(0).toUpperCase() + type.slice(1),
            value,
            color: type === 'default' ? '#FF8FAB' : '#60A5FA',
        }));
    }, [statsData]);

    // Transform reports for the table
    const formattedReports = useMemo(() => {
        if (!statsData?.data?.reports) return [];

        return statsData.data.reports.map(report => ({
            ...report,
            displaySessionId: report.call_cid.split(':')[1] || report.call_session_id,
            callType: report.call_cid.split(':')[0] || 'unknown',
        }));
    }, [statsData]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-red-500">Error loading analytics data</p>
            </div>
        );
    }

    const analytics = statsData?.data?.analytics;
    const pagination = statsData?.data?.pagination;

    return (
        <div className="dark flex min-h-screen flex-col text-gray-100">
            <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4 w-full max-w-7xl mx-auto">
                <div className="flex items-center space-x-2">
                    <Logo />
                </div>
                <div className="text-sm text-gray-400">
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </div>
            </header>

            <main className="flex-1 p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => exportMetricsToCSV(statsData?.data)}
                                disabled={isLoading || !statsData?.data}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export to CSV
                            </Button>
                            <Button variant="outline">
                                <Link className="mr-2 h-4 w-4" />
                                Share Link
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Calls (100 batch metrics)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">
                                    {analytics?.totalCalls || 0}
                                </div>
                                <p className="text-xs text-gray-400">
                                    All calls completed successfully
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Duration
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">
                                    {Math.round((analytics?.totalDuration ?? 0) / 60)}
                                </div>
                                <p className="text-xs text-gray-400">Minutes of calls</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Average Quality Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">
                                    {analytics?.averageQualityScore.toFixed(1) || 0}%
                                </div>
                                <p className="text-xs text-gray-400">Overall call quality</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Average Duration
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">
                                    {Math.round((analytics?.averageDuration ?? 0) / 60)}
                                </div>
                                <p className="text-xs text-gray-400">Minutes per call</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Quality Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">
                                    {analytics?.qualityScoreRanges.excellent || 0}
                                </div>
                                <p className="text-xs text-gray-400">Excellent quality calls</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Call Duration Types
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">
                                    {analytics?.callsByDuration.long || 0}
                                </div>
                                <p className="text-xs text-gray-400">
                                    Long duration calls ({'>'}15min)
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="text-gray-100">
                            <CardHeader>
                                <CardTitle>Call Types</CardTitle>
                                <div className="text-sm text-gray-400">Distribution by status</div>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={{
                                        value: {
                                            label: 'Calls',
                                            color: 'hsl(var(--primary))',
                                        },
                                    }}
                                    className="aspect-[4/3]"
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={callTypeData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#374151"
                                            />
                                            <XAxis
                                                dataKey="type"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF' }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF' }}
                                            />
                                            <ChartTooltip />
                                            <Bar
                                                dataKey="value"
                                                fill="currentColor"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader>
                                <CardTitle>Daily Call Volume</CardTitle>
                                <div className="text-sm text-gray-400">Calls over time</div>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={{
                                        calls: {
                                            label: 'Calls',
                                            color: '#A78BFA',
                                        },
                                    }}
                                    className="aspect-[4/3]"
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart
                                            data={callMetricsData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#374151"
                                            />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF' }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF' }}
                                            />
                                            <ChartTooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="calls"
                                                stroke="#A78BFA"
                                                strokeWidth={2}
                                                dot={{ fill: '#A78BFA', r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="text-gray-100">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Calls</CardTitle>
                                <div className="text-sm text-gray-400">
                                    Showing {formattedReports.length} of {pagination?.total || 0}{' '}
                                    calls
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-gray-800">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-800 bg-gray-900">
                                            <TableHead className="text-gray-300">
                                                Session ID
                                            </TableHead>
                                            <TableHead className="text-gray-300">
                                                Duration
                                            </TableHead>
                                            <TableHead className="text-gray-300">Type</TableHead>
                                            <TableHead className="text-gray-300">
                                                Quality Score
                                            </TableHead>
                                            <TableHead className="text-gray-300">
                                                Created At
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formattedReports.map(report => (
                                            <TableRow
                                                key={report.call_cid}
                                                className="border-gray-700"
                                            >
                                                <TableCell className="font-medium text-purple-400">
                                                    {report.displaySessionId}
                                                </TableCell>
                                                <TableCell>
                                                    {Math.round(report.call_duration_seconds / 60)}{' '}
                                                    min
                                                </TableCell>
                                                <TableCell>{report.callType}</TableCell>
                                                <TableCell>{report.quality_score}%</TableCell>
                                                <TableCell>
                                                    {report.created_at
                                                        ? format(
                                                              new Date(report.created_at),
                                                              'MMM dd, yyyy'
                                                          )
                                                        : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <PaginationControls
                                    hasMore={!!pagination?.hasMore}
                                    onNext={handleNextPage}
                                    onPrevious={handlePreviousPage}
                                    currentPage={currentPage}
                                    isLoading={isLoading}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
