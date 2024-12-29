"use client"

import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Download, Link } from 'lucide-react'
import Logo from "@/components/ui/logo"

const callMetricsData = [
    { date: "11/13", calls: 5 },
    { date: "11/17", calls: 18 },
    { date: "11/25", calls: 4 },
    { date: "11/27", calls: 8 },
    { date: "11/29", calls: 4 },
    { date: "12/01", calls: 12 },
    { date: "12/05", calls: 6 },
    { date: "12/11", calls: 4 },
    { date: "12/22", calls: 6 },
    { date: "12/28", calls: 4 },
]

const callTypeData = [
    { type: "Pod Session", value: 87, color: "#FF8FAB" },
    { type: "Audio Session", value: 13, color: "#60A5FA" },
]

const activityData = [
    {
        name: "Base Builders NG Meeting",
        id: "vxr-zhdi-jsh",
        duration: "10mins",
        attendees: 5,
        quality: "99%",
        date: "23/11/2024",
    },
    {
        name: "Base Builders NG Meeting",
        id: "vxr-zhdi-jsh",
        duration: "10mins",
        attendees: 10,
        quality: "99%",
        date: "23/11/2024",
    },
    {
        name: "Base Builders NG Meeting",
        id: "vxr-zhdi-jsh",
        duration: "10mins",
        attendees: 15,
        quality: "99%",
        date: "23/11/2024",
    },
]

export default function AnalyticsDashboard() {
    return (
        <div className="dark flex min-h-screen flex-col text-gray-100">
            <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4 w-full max-w-7xl mx-auto">
                
                <div className="flex items-center space-x-2">
                    <Logo />
                </div>

                <div className="text-sm text-gray-400">
                    Sunday, Dec 28, 2024
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
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">152</div>
                                <p className="text-xs text-gray-400">Users on PodX</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">100</div>
                                <p className="text-xs text-gray-400">All calls completed successfully</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Monthly Active Users (MAUs)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">66</div>
                                <p className="text-xs text-gray-400">Active users</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">1,752</div>
                                <p className="text-xs text-gray-400">93% rated excellent</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">17.5</div>
                                <p className="text-xs text-gray-400">1,051 seconds per call</p>
                            </CardContent>
                        </Card>
                        <Card className="text-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Most Active Day</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">Nov 17, 2024</div>
                                <p className="text-xs text-gray-400">19 Calls</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="text-gray-100">
                            <CardHeader>
                                <CardTitle>Call Metrics</CardTitle>
                                <div className="text-sm text-gray-400">Real time metrics</div>
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
                                                label={{ value: 'Number of Calls', angle: -90, position: 'insideLeft', offset: 0, fill: '#9CA3AF' }}
                                            />
                                            <ChartTooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="rounded-lg border border-gray-700 p-2 shadow-sm">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[0.70rem] uppercase text-gray-400">
                                                                            {payload[0].payload.type}
                                                                        </span>
                                                                        <span className="font-bold text-gray-100">
                                                                            {payload[0].value} calls
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
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
                                <CardTitle>Call Metrics</CardTitle>
                                <div className="text-sm text-gray-400">Real time metrics</div>
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
                                        <LineChart
                                            data={callMetricsData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF' }}
                                                label={{ value: 'Date', position: 'bottom', offset: 0, fill: '#9CA3AF' }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF' }}
                                                label={{ value: 'Number of Calls', angle: -90, position: 'insideLeft', offset: 0, fill: '#9CA3AF' }}
                                            />
                                            <ChartTooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="rounded-lg border border-gray-700 p-2 shadow-sm">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[0.70rem] uppercase text-gray-400">
                                                                            {payload[0].payload.date}
                                                                        </span>
                                                                        <span className="font-bold text-gray-100">
                                                                            {payload[0].value} calls
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="calls"
                                                stroke="#A78BFA"
                                                strokeWidth={2}
                                                dot={{ fill: '#A78BFA', r: 4 }}
                                                activeDot={{
                                                    r: 6,
                                                    style: { fill: '#A78BFA' },
                                                }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="text-gray-100">
                        <CardHeader>
                            <CardTitle>Activity Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="call-activities" className="space-y-4">
                                <TabsList className="">
                                    <TabsTrigger value="call-activities" className="data-[state=active]:bg-gray-900">Call activities</TabsTrigger>
                                    <TabsTrigger value="onchain-activities" className="data-[state=active]:bg-gray-900">Onchain activities</TabsTrigger>
                                </TabsList>
                                <TabsContent value="call-activities" className="space-y-4">
                                    <div className="rounded-md border border-gray-800">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-gray-800 bg-gray-900">
                                                    <TableHead className="text-gray-300 py-4 px-6 text-left text-sm font-semibold uppercase">Session name</TableHead>
                                                    <TableHead className="text-gray-300 py-4 px-6 text-left text-sm font-semibold uppercase">Session ID</TableHead>
                                                    <TableHead className="text-gray-300 py-4 px-6 text-left text-sm font-semibold uppercase">Session Duration</TableHead>
                                                    <TableHead className="text-gray-300 py-4 px-6 text-left text-sm font-semibold uppercase">Attendees</TableHead>
                                                    <TableHead className="text-gray-300 py-4 px-6 text-left text-sm font-semibold uppercase">Quality score</TableHead>
                                                    <TableHead className="text-gray-300 py-4 px-6 text-left text-sm font-semibold uppercase">Created at</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {activityData.map((activity, index) => (
                                                    <TableRow
                                                        key={index}
                                                        className="border-gray-700 hover:bg-gray-750 transition-colors"
                                                    >
                                                        <TableCell className="py-4 px-6 text-sm font-medium">{activity.name}</TableCell>
                                                        <TableCell className="py-4 px-6 text-sm font-medium text-purple-400">
                                                            {activity.id}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-6 text-sm">{activity.duration}</TableCell>
                                                        <TableCell className="py-4 px-6 text-sm">{activity.attendees} attendees</TableCell>
                                                        <TableCell className="py-4 px-6 text-sm">{activity.quality}</TableCell>
                                                        <TableCell className="py-4 px-6 text-sm">{activity.date}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

