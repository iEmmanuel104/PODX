"use client"

import * as React from "react"
import { ChevronDown, CommandIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface Session {
  id: string
  name: string
  whitelisted: boolean
}

export function MultiSelect() {
  const [open, setOpen] = React.useState(false)
  const [selectedSessions, setSelectedSessions] = React.useState<Session[]>([])
  const [activeTab, setActiveTab] = React.useState("internal")
  const [searchValue, setSearchValue] = React.useState("")

  const sessions: Session[] = [
    { id: "1", name: "Base Builders NG Monthly Call", whitelisted: false },
    { id: "2", name: "Base Builders NG Weekly Call", whitelisted: false },
    { id: "3", name: "Base Builders NG Daily Call", whitelisted: false },
    { id: "4", name: "PodX Build Session", whitelisted: false },
    { id: "5", name: "How to design usable products", whitelisted: false },
  ]

  const filteredSessions = React.useMemo(() => {
    return sessions.filter((session) => 
      session.name.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [searchValue])

  const toggleSession = (session: Session) => {
    setSelectedSessions((current) => {
      const exists = current.find((s) => s.id === session.id)
      if (exists) {
        return current.filter((s) => s.id !== session.id)
      }
      return [...current, { ...session, whitelisted: true }]
    })
  }

  const whitelistAll = () => {
    const newSessions = filteredSessions.filter(
      session => !selectedSessions.some(s => s.id === session.id)
    )
    setSelectedSessions([...selectedSessions, ...newSessions.map(s => ({ ...s, whitelisted: true }))])
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-[#1c1c1c] border-gray-700 hover:bg-[#252525] text-gray-300"
        >
          <span className="truncate">
            {selectedSessions.length === 0
              ? "Select session(s) to whitelist"
              : `${selectedSessions.length} session${selectedSessions.length > 1 ? 's' : ''} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-[#1c1c1c] border-gray-700" side="bottom">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-transparent border-b border-gray-700 rounded-none h-12 p-0">
            <TabsTrigger
              value="internal"
              className={cn(
                "w-24 h-full rounded-none data-[state=active]:bg-transparent",
                activeTab === "internal" ? "bg-[#3f3822] text-[#fbbf24]" : "text-gray-400"
              )}
            >
              Internal
            </TabsTrigger>
            <TabsTrigger
              value="external"
              className="w-24 h-full rounded-none data-[state=active]:bg-transparent text-gray-400"
            >
              External
            </TabsTrigger>
          </TabsList>
          <Command className="bg-transparent">
            <CommandInput
              value={searchValue}
              onValueChange={setSearchValue}
              placeholder="Search for sessions"
              className="border border-transparent focus:border-[#8b5cf6] bg-[#252525] my-2"
            />
            <CommandList>
              {filteredSessions.length === 0 ? (
                <CommandEmpty className="py-6 text-center text-sm">
                  <div className="flex flex-col items-center gap-4">
                    <CommandIcon className="w-8 h-8 text-gray-500" />
                    <span className="text-gray-400">No available session</span>
                    <Button variant="outline" className="bg-[#252525] text-gray-300 border-gray-700">
                      Upload files ⌘U
                    </Button>
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup className="p-2">
                  {filteredSessions.length > 0 && selectedSessions.length < sessions.length && (
                    <div className="flex items-center gap-2 p-2 border-b border-gray-700">
                      <button 
                        onClick={whitelistAll}
                        className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
                      >
                        + Whitelist all
                      </button>
                    </div>
                  )}
                  {filteredSessions.map((session) => {
                    const isSelected = selectedSessions.some((s) => s.id === session.id)
                    return (
                      <CommandItem
                        key={session.id}
                        onSelect={() => toggleSession(session)}
                        className="flex items-center justify-between p-2 cursor-pointer hover:bg-[#252525]"
                      >
                        <span className="text-gray-300">{session.name}</span>
                        <Badge 
                          className={cn(
                            isSelected 
                              ? "bg-[#8b5cf6] text-white" 
                              : "bg-[#252525] text-gray-300 hover:bg-[#303030]"
                          )}
                        >
                          {isSelected ? "Whitelisted" : "Whitelist"}
                        </Badge>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </Tabs>
        {selectedSessions.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 border-t border-gray-700">
            {selectedSessions.map((session) => (
              <Badge key={session.id} className="bg-[#252525] text-gray-300 pl-2 flex items-center gap-1">
                {session.name.split(" ").slice(0, 2).join(" ")}...
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggleSession(session)
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleSession(session)
                  }}
                >
                  <X className="h-3 w-3 text-gray-500 hover:text-gray-400" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}