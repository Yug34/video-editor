import {create} from 'zustand'
import {Format} from "@/types";
import {VideoDurationWrapper} from "@/util/videoDurationWrapper";

interface VideoDataStoreState {
    video: Uint8Array | null
    setVideo: (video: Uint8Array) => void
    videoFormat: Format | null
    setVideoFormat: (format: Format) => void
    videoDuration: VideoDurationWrapper | null
    setVideoDuration: (videoDuration: VideoDurationWrapper) => void
    sourceVideoURL: string | null
    setSourceVideoURL: (url: string) => void
    isUnplayable: boolean
    setIsUnplayable: (value: boolean) => void
}

export const useVideoDataStore = create<VideoDataStoreState>()((set) => ({
    video: null,
    setVideo: (video: Uint8Array) => set(() => ({video: video})),
    videoFormat: null,
    setVideoFormat: (format: Format) => set(() => ({videoFormat: format})),
    videoDuration: null,
    setVideoDuration: (duration: VideoDurationWrapper) => set(() => ({videoDuration: duration})),
    sourceVideoURL: null,
    setSourceVideoURL: (url: string) => set(() => ({sourceVideoURL: url})),
    isUnplayable: false,
    setIsUnplayable: (value: boolean) => set(() => ({isUnplayable: value}))
}));
