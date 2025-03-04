import { cn } from '@/lib/utils';
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import Upload from '@/public/icons/Upload';

const mainVariant = {
    initial: {
        x: 0,
        y: 0,
    },
    animate: {
        x: 20,
        y: -20,
        opacity: 0.9,
    },
};

const secondaryVariant = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
};

export const FileUpload = ({ onChange }: { onChange?: (files: File[]) => void }) => {
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (newFiles: File[]) => {
        setFiles(prevFiles => [...prevFiles, ...newFiles]);
        onChange && onChange(newFiles);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const { getRootProps, isDragActive } = useDropzone({
        multiple: false,
        noClick: true,
        onDrop: handleFileChange,
        onDropRejected: error => {
            console.debug(error);
        },
    });

    return (
        <div className="w-full bg-[#2b2b2b]" {...getRootProps()}>
            <motion.div
                onClick={handleClick}
                whileHover="animate"
                className="py-3 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden border border-dashed border-[#3c3c3c] dark:border-neutral-700"
            >
                <input
                    ref={fileInputRef}
                    id="file-upload-handle"
                    type="file"
                    aria-label="File upload"
                    onChange={e => handleFileChange(Array.from(e.target.files || []))}
                    className="hidden"
                />
                <div className="flex flex-col gap-3 items-center justify-center">
                    <div className="h-4 w-4">
                        <Upload />
                    </div>
                    <div className="flex flex-col gap-2 items-center justify-center">
                        <p className="relative z-20 font-sans font-medium text-neutral-400 dark:text-neutral-400 text-[10px]">
                            Drag & drop your files to upload
                        </p>
                        <p className="relative z-20 font-sans font-medium text-neutral-400 dark:text-neutral-400 text-[10px]">
                            <span className="text-[#DDB958]">.cvs</span>{' '}
                            <span className="text-[#6E6E6E]">or</span>{' '}
                            <span className="text-[#DDB958]">.txt</span>
                        </p>
                    </div>
                    <div className="relative w-full max-w-xl mx-auto">
                        {files.length > 0 &&
                            files.map((file, idx) => (
                                <motion.div
                                    key={'file' + idx}
                                    layoutId={idx === 0 ? 'file-upload' : 'file-upload-' + idx}
                                    className={cn(
                                        'relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md',
                                        'shadow-sm'
                                    )}
                                >
                                    <div className="flex justify-between w-full items-center gap-4">
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            layout
                                            className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs"
                                        >
                                            {file.name}
                                        </motion.p>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            layout
                                            className="rounded-lg px-2 py-1 w-fit flex-shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
                                        >
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </motion.p>
                                    </div>

                                    <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            layout
                                            className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 "
                                        >
                                            {file.type}
                                        </motion.p>

                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            layout
                                        >
                                            modified{' '}
                                            {new Date(file.lastModified).toLocaleDateString()}
                                        </motion.p>
                                    </div>
                                </motion.div>
                            ))}
                        {!files.length && (
                            <div className="flex items-center justify-center">
                                <button className="py-1 px-2 rounded-[5px] border-[.7px] border-[#4f4f4f] bg-[#3d3d3d] text-[10px] font-medium flex items-center gap-[2px]">
                                    {' '}
                                    <span className="text-[#d4d4d4]">Select files</span>{' '}
                                    <span className="text-[#7a7a7a]">⌘U</span>
                                </button>
                            </div>
                        )}

                        {/* {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-8 w-full max-w-[8rem] mx-auto rounded-md"
              ></motion.div>
            )} */}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
