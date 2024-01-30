"use client";
import {ModeToggle} from "@/components/theme-toggler";
import {Editor} from "@/components/Editor";
import {toBlobURL} from "@ffmpeg/util";
import {useEffect} from "react";
import {useFfmpegDataStore} from "@/store/FFmpegStore";

export default function Home() {
    const {setIsFFmpegLoaded, makeFFmpeg, FFmpeg} = useFfmpegDataStore();

    const loadFFmpegBinaries = async () => {
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await FFmpeg!.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(
                `${baseURL}/ffmpeg-core.wasm`,
                "application/wasm"
            ),
        });

        setIsFFmpegLoaded(true);
    };

    useEffect(() => {
        makeFFmpeg();
    }, []);

    useEffect(() => {
        if (FFmpeg) {
            loadFFmpegBinaries();
        }
    }, [FFmpeg]);

    return (
        <div className="absolute w-screen flex h-screen flex-col px-12">
            <div className="flex items-center justify-between rounded-lg border-solid border-b py-2">
                <h2 className="flex text-lg font-semibold">Video Editor</h2>
                <ModeToggle/>
            </div>
            <Editor/>
        </div>
    );
}
