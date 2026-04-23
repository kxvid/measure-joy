"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Users, Search, UserMinus } from "lucide-react"
import { toast } from "sonner"
import { removeSubscriber, type Subscriber } from "@/app/actions/emails"

interface SubscriberTableProps {
    subscribers: Subscriber[]
}

export function SubscriberTable({ subscribers: initial }: SubscriberTableProps) {
    const [subscribers, setSubscribers] = useState(initial)
    const [search, setSearch] = useState("")
    const [pending, startTransition] = useTransition()

    const filtered = search.trim()
        ? subscribers.filter(
              (s) =>
                  s.email.toLowerCase().includes(search.toLowerCase()) ||
                  s.source.toLowerCase().includes(search.toLowerCase())
          )
        : subscribers

    function handleRemove(id: string, email: string) {
        startTransition(async () => {
            const result = await removeSubscriber(id)
            if (result.success) {
                setSubscribers((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, is_active: false } : s))
                )
                toast.success(`Unsubscribed ${email}`)
            } else {
                toast.error(result.error || "Failed to unsubscribe")
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Subscribers
                        <Badge variant="secondary">{subscribers.length}</Badge>
                    </CardTitle>
                    <div className="relative w-48">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="pl-8 h-9 text-sm"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="max-h-[400px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        {search ? "No matching subscribers" : "No subscribers yet"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-mono text-xs">
                                            {s.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {s.source}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={s.is_active ? "default" : "secondary"}
                                                className="text-xs"
                                            >
                                                {s.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {new Date(s.subscribed_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {s.is_active && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    title="Unsubscribe"
                                                    disabled={pending}
                                                    onClick={() => handleRemove(s.id, s.email)}
                                                >
                                                    <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />
                                                </Button>
                                            )}
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
