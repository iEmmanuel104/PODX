"use client";

import { useEffect, useMemo } from "react";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Download, Link, Loader2 } from "lucide-react";
import Logo from "@/components/ui/logo";
import { useGetDetailedCallStatsQuery } from "@/store/api/callAnalyticsApi";

export default function AnalyticsDashboard() {
    // Get current date range (last 30 days)
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const {
        data: statsData,
        isLoading,
        error,
    } = useGetDetailedCallStatsQuery({
        // startDate,
        // endDate,
        // size: 100
    });

    // Transform the API data for charts
    const callMetricsData = useMemo(() => {
        if (!statsData?.data?.analytics?.timeDistribution) return [];
        return Object.entries(statsData.data.analytics.timeDistribution)
            .map(([date, count]) => ({
                date: new Date(date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }),
                calls: count,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [statsData]);

    const callTypeData = useMemo(() => {
        if (!statsData?.data?.reports) return [];

        // Create a map to count call types
        const typeCount = statsData.data.reports.reduce((acc: { [key: string]: number }, report) => {
            // Extract call type from call_cid (everything before the colon)
            const callType = report.call_cid.split(":")[0] || "unknown";
            acc[callType] = (acc[callType] || 0) + 1;
            return acc;
        }, {});

        // Transform into chart data format
        return Object.entries(typeCount).map(([type, value]) => ({
            type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
            value,
            color: type === "default" ? "#FF8FAB" : "#60A5FA",
        }));
    }, [statsData]);

    // Transform session data for table display
    const formattedReports = useMemo(() => {
        if (!statsData?.data?.reports) return [];

        return statsData.data.reports.map((report) => ({
            ...report,
            // Extract session ID from call_cid (everything after the colon)
            displaySessionId: report.call_cid.split(":")[1] || report.call_session_id,
            callType: report.call_cid.split(":")[0] || "unknown",
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
    const reports = statsData?.data?.reports || [];

    return (
        <div className="dark flex min-h-screen flex-col text-gray-100">
            <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4 w-full max-w-7xl mx-auto">
                <div className="flex items-center space-x-2">
                    <Logo />
                </div>
                <div className="text-sm text-gray-400">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
            </header>

            <main className="flex-1 p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                        <div className="flex items-center gap-2">
                            <Button variant="outline">
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
                                <CardTitle className="text-sm font-medium">Total Calls (Last 100)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">{analytics?.totalCalls || 0}</div>
                                <p className="text-xs text-gray-400">All calls completed successfully</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">{Math.round((analytics?.totalDuration ?? 0) / 60)}</div>
                                <p className="text-xs text-gray-400">Minutes of calls</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Quality Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">{analytics?.averageQualityScore.toFixed(1) || 0}%</div>
                                <p className="text-xs text-gray-400">Overall call quality</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">{Math.round((analytics?.averageDuration ?? 0) / 60)}</div>
                                <p className="text-xs text-gray-400">Minutes per call</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Quality Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">{analytics?.qualityScoreRanges.excellent || 0}</div>
                                <p className="text-xs text-gray-400">Excellent quality calls</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Call Duration Types</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">{analytics?.callsByDuration.long || 0}</div>
                                <p className="text-xs text-gray-400">Long duration calls ({">"}15min)</p>
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
                                            label: "Calls",
                                            color: "hsl(var(--primary))",
                                        },
                                    }}
                                    className="aspect-[4/3]"
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={callTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                            <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF" }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF" }} />
                                            <ChartTooltip />
                                            <Bar dataKey="value" fill="currentColor" radius={[4, 4, 0, 0]} />
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
                                            label: "Calls",
                                            color: "#A78BFA",
                                        },
                                    }}
                                    className="aspect-[4/3]"
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={callMetricsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF" }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF" }} />
                                            <ChartTooltip />
                                            <Line type="monotone" dataKey="calls" stroke="#A78BFA" strokeWidth={2} dot={{ fill: "#A78BFA", r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="text-gray-100">
                        <CardHeader>
                            <CardTitle>Recent Calls</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-gray-800">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-800 bg-gray-900">
                                            <TableHead className="text-gray-300">Session ID</TableHead>
                                            <TableHead className="text-gray-300">Duration</TableHead>
                                            <TableHead className="text-gray-300">Status</TableHead>
                                            <TableHead className="text-gray-300">Quality Score</TableHead>
                                            <TableHead className="text-gray-300">Created At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formattedReports.map((report) => (
                                            <TableRow key={report.call_cid} className="border-gray-700">
                                                <TableCell className="font-medium text-purple-400">{report.displaySessionId}</TableCell>
                                                <TableCell>{Math.round(report.call_duration_seconds / 60)} min</TableCell>
                                                <TableCell>{report.callType}</TableCell>
                                                <TableCell>{report.quality_score}%</TableCell>
                                                <TableCell>{report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
