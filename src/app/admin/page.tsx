import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-secondary-900 font-heading">Admin Overview</h1>
                    <p className="text-secondary-600 mt-1">Welcome back. Here is what&apos;s happening at Masjid Angullia.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/families" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white border border-secondary-200 text-secondary-700 hover:bg-secondary-50 h-9 px-4 py-2 shadow-sm transition-colors">
                        <Users className="mr-2 h-4 w-4 text-secondary-500" /> Register Family
                    </Link>
                    <Link href="/admin/events" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 h-9 px-4 py-2 shadow-sm transition-colors">
                        <Calendar className="mr-2 h-4 w-4" /> Create Event
                    </Link>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-600">Total Families</CardTitle>
                        <Users className="h-4 w-4 text-primary-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-secondary-900">142</div>
                        <p className="text-xs text-secondary-500">+4 newly registered</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-secondary-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-600">Pending Requests</CardTitle>
                        <FileText className="h-4 w-4 text-secondary-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-secondary-900">7</div>
                        <p className="text-xs text-secondary-500">2 require immediate attention</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-accent-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-600">Month&apos;s Donations</CardTitle>
                        <DollarSign className="h-4 w-4 text-accent-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-secondary-900">₱45,231</div>
                        <p className="text-xs text-green-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" /> +12% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-600">Upcoming Events</CardTitle>
                        <Calendar className="h-4 w-4 text-secondary-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-secondary-900">3</div>
                        <p className="text-xs text-secondary-500">Next: Jumu&apos;ah Prayer</p>
                    </CardContent>
                </Card>
            </div>

            {/* Action Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Recent Requests List */}
                <Card className="col-span-1 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-secondary-500" />
                            Recent Pending Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg border border-secondary-100">
                                    <div>
                                        <h4 className="font-medium text-secondary-900 text-sm">Marriage Certificate Copy</h4>
                                        <p className="text-xs text-secondary-500">Submitted by: Abdul Rahman • 2h ago</p>
                                    </div>
                                    <button className="px-3 py-1.5 text-xs font-medium bg-white border border-secondary-200 rounded-md hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors">
                                        Review
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-secondary-100 text-center">
                            <button className="text-sm font-medium text-primary-600 hover:underline">View All Requests</button>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats or Activity */}
                <Card className="col-span-1 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Financial Snapshot</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[240px] bg-secondary-50 rounded-lg border border-dashed border-secondary-200">
                        <p className="text-secondary-400 text-sm">Chart Integration Placeholder</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
