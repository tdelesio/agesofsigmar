"use client"
"use client"


import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"


export default function ProjectDashboardHomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-r from-slate-900 to-slate-700 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8 text-center">
                    Welcome to Project Dashboard
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <h2 className="text-2xl font-semibold mb-4">AOS Project</h2>
                            <p className="text-gray-600 mb-4">
                                Access and manage AOS project resources and documentation.
                            </p>
                            <Button asChild className="w-full">
                                <Link href="aos">Go to AOS</Link>
                            </Button>
                        </CardContent>
                    </Card>


                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <h2 className="text-2xl font-semibold mb-4">Spearhead Project</h2>
                            <p className="text-gray-600 mb-4">
                                Access Spearhead project management and development tools.
                            </p>
                            <Button asChild className="w-full">
                                <Link href="spearhead">Go to Spearhead</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}