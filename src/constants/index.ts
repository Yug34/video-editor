import {Codec, CodecInfo, Format, FormatInfo, TransformationTypes} from "../types";

export const CODECS: Record<Codec, CodecInfo> = {
    h264: {
        name: "H.264",
        compressionRange: {
            min: 1,
            max: 51
        },
        ffmpegLib: "libx264"
    },
    vp8: {
        name: "VP8",
        compressionRange: {
            min: 4,
            max: 63
        },
        ffmpegLib: "libvpx"
    },
    // TODO: Probably just remove this
    // vp9: {
    //     name: "VP9",
    //     compressionRange: {
    //         min: 1,
    //         max: 63
    //     },
    //     ffmpegLib: "libvpx-vp9"
    // },
    windows: {
        name: "Windows Media Video",
        compressionRange: {
            min: 1,
            max: 51
        },
        ffmpegLib: "wmv2"
    },
    mpeg4: {
        name: "MPEG-4",
        compressionRange: {
            min: 1,
            max: 31
        },
        ffmpegLib: "libx264"
    }
}

export const CODEC_NAMES: Codec[] = Object.keys(CODECS) as Codec[];

export const FORMATS: Record<Format, FormatInfo> = {
    mp4: {
        name: 'MP4',
        extension: '.mp4',
        type: 'video/mp4',
        codecs: ['h264', 'mpeg4'],
        isPlayable: true
    },
    webm: {
        name: "webm",
        extension: ".webm",
        type: "video/webm",
        // codecs: ["vp9", "vp8"]
        codecs: ["vp8"],
        isPlayable: true
    },
    avi: {
        name: 'AVI',
        extension: '.avi',
        type: 'video/avi',
        codecs: ["h264", "mpeg4"],
        isPlayable: false
    },
    mov: {
        name: 'MOV',
        extension: '.mov',
        type: 'video/mov',
        codecs: ['h264', 'mpeg4'],
        isPlayable: true
    },
    wmv: {
        name: 'WMV',
        extension: '.wmv',
        type: 'video/wmv',
        codecs: ['windows'],
        isPlayable: false
    }
}

export const FORMAT_NAMES = Object.keys(FORMATS) as Format[];

export const TRANSFORMATION_NAMES: TransformationTypes[] = ["Convert", "Grayscale", "Trim", "Mute"];
// export const TRANSFORMATION_NAMES: TransformationTypes[] = ["Convert", "Grayscale", "Trim", "Mute", "Compress"];