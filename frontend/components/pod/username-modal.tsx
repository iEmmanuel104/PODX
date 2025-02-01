"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface UsernameModalProps {
    initialUsername: string
    onSave: (username: string) => void
    onCancel: () => void
    isOpen: boolean
}

export function UsernameModal({ initialUsername, onSave, onCancel, isOpen }: UsernameModalProps) {
    const [username, setUsername] = React.useState(initialUsername)

    const handleSave = () => {
        onSave(username)
    }

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onCancel()
            }}
        >
            <DialogContent className="sm:max-w-md bg-[#1d1d1d] border-0 rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-[20px] text-white">Set your username</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <p className="text-[#7b7b7b] text-[14px]">Pick a unique username</p>
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-[#292929] border-0 text-white px-4 py-2.5 rounded-[10px]"
                                placeholder="Enter username"
                            />
                        </div>
                        <div className="text-right">
                            <button className="text-[#d5b255] hover:text-[#d5b255]/80 text-sm underline">Ask AI to suggest</button>
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-2 mt-2">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        className="bg-[#3c3c3c] hover:bg-[#3c3c3c]/90 text-white border-0"
                    >
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSave} className="bg-[#6032f6] hover:bg-[#6032f6]/90 text-white">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}