import {create} from 'zustand'
import {FFmpeg} from "@ffmpeg/ffmpeg";

interface FfmpegDataDataStore {
    FFmpeg: FFmpeg | null;
    isFFmpegLoaded: boolean;
    setIsFFmpegLoaded: (val: boolean) => void;
    makeFFmpeg: () => void; // FFmpeg can't run on Node, so we can't initialize it by default
}

export const useFfmpegDataStore = create<FfmpegDataDataStore>()((set) => ({
    FFmpeg: null,
    makeFFmpeg: () => {
        set(() => ({FFmpeg: new FFmpeg()}))
    },
    isFFmpegLoaded: false,
    setIsFFmpegLoaded: (val: boolean) => set(() => ({isFFmpegLoaded: val})),
}));