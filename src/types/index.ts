export type VideoDuration = {
    hours: number;
    minutes: number;
    seconds: number;
}

export type Format = "avi" | "mov" | "mp4" | "webm" | "wmv";

export type FormatInfo = {
    name: string;
    extension: string;
    type: string;
    codecs: Codec[];
    isPlayable: boolean;
}

export type TransformationTypes = "Convert" | "Grayscale" | "Trim" | "Mute" | "Compress";

export type Transformation = {
    type: TransformationTypes;
    transcode?: {
        to: Format;
        codec: Codec;
    }
    trim?: {
        from: VideoDuration;
        to: VideoDuration;
    }
}

export type Codec = "h264" | "vp8" | "windows" | "mpeg4";

export type CodecInfo = {
    name: string;
    compressionRange: {
        min: number;
        max: number;
    };
    ffmpegLib: string;
};