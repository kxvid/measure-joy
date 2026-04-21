"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Mail } from "lucide-react"
import type { SentEmail } from "@/app/actions/emails"

interface RecentEmailsTableProps {
    emails: SentEmail[]
}

export function RecentEmailsTable({ emails }: RecentEmailsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Recent Sends
                    <Badge variant="secondary">{emails.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="max-h-[400px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>To</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {emails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                        {process.env.RESEND_API_KEY
                                            ? "No emails sent yet"
                                            : "Connect Resend to see email history"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                emails.map((e) => (
                                    <TableRow key={e.id}>
                                        <TableCell className="text-sm font-medium max-w-[200px] truncate">
                                            {e.subject}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs max-w-[180px] truncate">
                                            {e.to}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(e.created_at).toLocaleDateString()}{" "}
                                            {new Date(e.created_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
