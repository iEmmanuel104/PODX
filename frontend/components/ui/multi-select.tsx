'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/ui/file-upload';
import AddIcon from '@/public/icons/AddIcon';
import { Input } from '@/components/ui/input';

interface Session {
    id: string;
    name: string;
    whitelisted: boolean;
}

interface MultiSelectProps {
    sessions?: Session[];
    isLoading?: boolean;
    onSelectionChange?: (sessions: Session[]) => void;
}

export function MultiSelect({
    sessions = [],
    isLoading = false,
    onSelectionChange,
}: MultiSelectProps) {
    const [selectedSessions, setSelectedSessions] = React.useState<Session[]>([]);
    const [activeTab, setActiveTab] = React.useState('internal');
    const [searchValue, setSearchValue] = React.useState('');

    const filteredSessions = React.useMemo(() => {
        return sessions.filter(session =>
            session.name.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [searchValue, sessions]);

    const toggleSession = (session: Session) => {
        setSelectedSessions(current => {
            const exists = current.find(s => s.id === session.id);
            const newSessions = exists
                ? current.filter(s => s.id !== session.id)
                : [...current, { ...session, whitelisted: true }];

            onSelectionChange?.(newSessions);
            return newSessions;
        });
    };

    const whitelistAll = () => {
        const newSessions = [
            ...selectedSessions,
            ...filteredSessions
                .filter(session => !selectedSessions.some(s => s.id === session.id))
                .map(s => ({ ...s, whitelisted: true })),
        ];
        setSelectedSessions(newSessions);
        onSelectionChange?.(newSessions);
    };

    React.useEffect(() => {
        setSelectedSessions([]);
    }, [sessions]);

    return (
        <div className="w-full space-y-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between px-2">
                <span className="text-sm text-gray-400">
                    {selectedSessions.length === 0
                        ? 'Select sessions to whitelist'
                        : `${selectedSessions.length} session${
                              selectedSessions.length > 1 ? 's' : ''
                          } selected`}
                </span>
                {filteredSessions.length > 0 && selectedSessions.length < sessions.length && (
                    <button
                        onClick={whitelistAll}
                        className="flex items-center gap-2 text-xs font-medium text-gray-400 
                                 hover:text-white bg-[#3c3c3c] hover:bg-[#4c4c4c] 
                                 px-3 py-1.5 rounded-full transition-colors duration-200"
                    >
                        <AddIcon />
                        <span>Whitelist all</span>
                    </button>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-[#3D3D3D] p-1 rounded-full max-w-[160px]">
                    <TabsTrigger
                        value="internal"
                        className={`
                            px-4 py-1 text-xs font-medium rounded-full
                            ${
                                activeTab === 'internal'
                                    ? 'bg-[#6032F6] text-white'
                                    : 'text-gray-400 hover:text-gray-300'
                            }
                            transition-colors duration-200
                        `}
                    >
                        Internal
                    </TabsTrigger>
                    <TabsTrigger
                        value="external"
                        className={`
                            px-4 py-1 text-xs font-medium rounded-full
                            ${
                                activeTab === 'external'
                                    ? 'bg-[#6032F6] text-white'
                                    : 'text-gray-400 hover:text-gray-300'
                            }
                            transition-colors duration-200
                        `}
                    >
                        External
                    </TabsTrigger>
                </TabsList>

                {/* Content */}
                <div className="mt-4">
                    {activeTab === 'external' ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-gray-400 text-sm">
                                Upload wallet addresses you want to whitelist
                            </p>
                            <FileUpload />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Input
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                                placeholder="Search sessions..."
                                className="w-full bg-[#252525] border-[#3c3c3c] focus-visible:ring-[#6032F6] text-white"
                            />

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {isLoading ? (
                                    <div className="text-center py-4 text-gray-400">
                                        Loading sessions...
                                    </div>
                                ) : filteredSessions.length === 0 ? (
                                    <div className="text-center py-4 text-gray-400">
                                        No sessions found
                                    </div>
                                ) : (
                                    filteredSessions.map(session => {
                                        const isSelected = selectedSessions.some(
                                            s => s.id === session.id
                                        );
                                        return (
                                            <div
                                                key={session.id}
                                                className={`
                                                    flex items-center justify-between p-3 
                                                    rounded-lg cursor-pointer
                                                    ${
                                                        isSelected
                                                            ? 'bg-[#6032F6]/10'
                                                            : 'hover:bg-[#3c3c3c]'
                                                    }
                                                    transition-colors duration-200
                                                `}
                                                onClick={() => toggleSession(session)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        toggleSession(session);
                                                    }
                                                }}
                                            >
                                                <span
                                                    className={`text-sm font-medium ${
                                                        isSelected
                                                            ? 'text-[#6032F6]'
                                                            : 'text-gray-300'
                                                    }`}
                                                >
                                                    {session.name}
                                                </span>
                                                <Badge
                                                    className={`
                                                        ${
                                                            isSelected
                                                                ? 'bg-[#6032F6] text-white hover:bg-[#4D28C4]'
                                                                : 'bg-[#3c3c3c] text-gray-300 hover:bg-[#4c4c4c]'
                                                        }
                                                        transition-colors duration-200
                                                        rounded-full px-3 py-1 text-xs font-medium
                                                    `}
                                                >
                                                    {isSelected ? 'Whitelisted' : 'Whitelist'}
                                                </Badge>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Tabs>

            {/* Selected Sessions */}
            {selectedSessions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#3c3c3c]">
                    {selectedSessions.map(session => (
                        <Badge
                            key={session.id}
                            className="bg-[#6032F6]/10 text-[#6032F6] px-3 py-1.5 
                                     flex items-center gap-2 text-xs font-medium rounded-full"
                        >
                            {session.name.length > 20
                                ? `${session.name.substring(0, 20)}...`
                                : session.name}
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleSession(session);
                                }}
                                className="text-[#6032F6] hover:text-[#4D28C4] 
                                         transition-colors duration-200"
                                aria-label={`Remove ${session.name} from whitelist`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
