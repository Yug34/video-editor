import React, {useEffect, useRef, useState} from "react";

import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {CODECS, FORMAT_NAMES, FORMATS} from "@/constants";
import ImageUpload from "../ImageUpload";
import {Codec, Format, Transformation, TransformationTypes, VideoDuration,} from "@/types";
import {downloadLinkedItem, isVideoFormatBrowserCompatible} from "@/util";
import {VideoDurationWrapper} from "@/util/videoDurationWrapper";
import {Grayscale} from "@/components/Editor/Transformations/Grayscale";
import {Mute} from "@/components/Editor/Transformations/Mute";
import {Transcode} from "@/components/Editor/Transformations/Transcode";
import {Trim} from "./Transformations/Trim";
import {DownloadIcon, MagicWandIcon, Pencil2Icon,} from "@radix-ui/react-icons";
import {useTransformationsStore} from "@/store/TransformationsStore";
import {useVideoDataStore} from "@/store/VideoDataStore";
import {useFfmpegDataStore} from "@/store/FFmpegStore";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Editor = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const {
        transformations,
        setIsTransformComplete,
        isTransformComplete,
        clearTransformations,
    } = useTransformationsStore();

    const {FFmpeg, isFFmpegLoaded} = useFfmpegDataStore();

    const {
        video,
        videoFormat,
        setVideoFormat,
        sourceVideoURL,
        setSourceVideoURL,
        isUnplayable,
        setIsUnplayable,
    } = useVideoDataStore();

    const [videoConvertFormat, setVideoConvertFormat] = useState<Format | null>(
        null
    );
    const [videoConvertCodec, setVideoConvertCodec] = useState<Codec | null>(
        null
    );

    useEffect(() => {
        if (videoFormat) {
            const videoConvertFormat = FORMAT_NAMES.filter(
                (format) => format !== videoFormat
            )[0] as Format;
            setVideoConvertFormat(videoConvertFormat);
            setVideoConvertCodec(FORMATS[videoConvertFormat].codecs[0] as Codec);
        }
    }, [videoFormat]);

    useEffect(() => {
        if (video && isFFmpegLoaded) {
            FFmpeg!.on("log", ({message}) => {
                toast("FFmpeg Logs", {
                    description: message,
                    id: "progressToast",
                    dismissible: false,
                });
            });
        }
    }, [video, isFFmpegLoaded]);

    const transcode = async (
        toFormat: Format,
        toCodec: Codec,
        fromFormat?: Format
    ) => {
        await FFmpeg!.exec(
            `-i input.${fromFormat ?? videoFormat} -threads 4 -strict -2 -c:v ${
                CODECS[toCodec].ffmpegLib
            } input.${toFormat}`.split(" ")
        );

        setIsUnplayable(!isVideoFormatBrowserCompatible(toFormat));

        await FFmpeg!.deleteFile(`input.${fromFormat ?? videoFormat}`);
        setVideoFormat(toFormat);
    };

    const grayscale = async (format: Format) => {
        // WebM weirdness. Does not work on FFmpeg itself.
        // Converting WebM to MP4, applying filter, then converting back:
        if (format === "webm") {
            await transcode("mp4", "h264");
            await FFmpeg!.exec(`-i input.mp4 -vf format=gray output.mp4`.split(" "));
            await FFmpeg!.deleteFile("input.mp4");
            await FFmpeg!.rename("output.mp4", "input.mp4");
            await transcode(format, "vp8", "mp4");
        } else {
            await FFmpeg!.exec(
                `-i input.${format} -vf format=gray output.${format}`.split(" ")
            );
            await FFmpeg!.rename(`output.${format}`, `input.${format}`);
        }
    };

    const mute = async (format: Format) => {
        await FFmpeg!.exec(
            `-i input.${format} -vcodec copy -an output.${format}`.split(" ")
        );
        await FFmpeg!.rename(`output.${format}`, `input.${format}`);
    };

    const trim = async (
        format: Format,
        from: VideoDuration,
        to: VideoDuration
    ) => {
        const startTimestamp =
            VideoDurationWrapper.fromVideoDuration(from).toString();

        // WHAT? More WebM weirdness.
        // Why do I need to subtract twice for WebMs? This makes no sense.
        // TODO: Here's the official docs: https://trac.ffmpeg.org/wiki/Seeking
        const endTimeStamp =
            format === "webm"
                ? VideoDurationWrapper.subtract(
                    VideoDurationWrapper.subtract(to, from),
                    from
                ).toString()
                : VideoDurationWrapper.subtract(to, from).toString();

        await FFmpeg!.exec(
            `-ss ${startTimestamp} -i input.${format} -t ${endTimeStamp} -c copy output.${videoFormat}`.split(
                " "
            )
        );
        await FFmpeg!.rename(`output.${format}`, `input.${format}`);
    };

    const transform = async () => {
        const transcodeSteps = transformations.filter(
            (t: Transformation) => t.type === "Convert"
        );
        const hasTranscode = transcodeSteps.length > 0;

        const format = hasTranscode ? transcodeSteps[0].transcode!.to : videoFormat;

        // Order transformations as Trim -> (the rest of them) to save compute time.
        const transformationOrder: Record<TransformationTypes, number> = {
            Trim: 1,
            Compress: 2,
            Mute: 3,
            Convert: 4,
            Grayscale: 5,
        };

        const sortedTransformations = transformations.sort(
            (a: Transformation, b: Transformation) => {
                return transformationOrder[a.type] - transformationOrder[b.type];
            }
        );

        for (const transformation of sortedTransformations) {
            switch (transformation.type) {
                case "Convert":
                    await transcode(
                        transformation.transcode!.to,
                        transformation.transcode!.codec
                    );
                    break;
                case "Grayscale":
                    await grayscale(format!);
                    break;
                case "Mute":
                    await mute(format!);
                    break;
                case "Trim":
                    await trim(
                        format!,
                        transformation.trim!.from,
                        transformation.trim!.to
                    );
                    break;
            }
        }

        const data = await FFmpeg!.readFile(`input.${format}`);
        const videoURL = URL.createObjectURL(
            new Blob([data], {type: `video/${format}`})
        );
        setSourceVideoURL(videoURL);
        setIsTransformComplete(true);
        clearTransformations();
    };

    const VideoPlayer = ({isUnplayable}: { isUnplayable: boolean }) => {
        return (
            <div
                className={
                    "relative flex justify-center items-center rounded-md h-full w-full"
                }
            >
                <video
                    className={"w-full h-full"}
                    ref={videoRef}
                    controls
                    src={sourceVideoURL!}
                />
                {isUnplayable && (
                    <div
                        className={
                            "absolute bg-black w-full h-full flex flex-col justify-center items-center opacity-60"
                        }
                    >
                        <p>
                            Unfortunately, <b>.{videoFormat}</b> videos are not supported on
                            browsers.
                        </p>
                        <p>Although, your video was edited successfully.</p>
                        <Button onClick={downloadVideo}>Click here to download!</Button>
                    </div>
                )}
            </div>
        );
    };

    const downloadVideo = () => {
        downloadLinkedItem(`output.${videoFormat}`, sourceVideoURL!);
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const transformationComponents: {
        type: TransformationTypes;
        el: React.ReactNode;
    }[] = [
        {
            type: "Mute",
            el: <Mute/>,
        },
        {
            type: "Grayscale",
            el: <Grayscale/>,
        },
        {
            type: "Convert",
            el: (
                <Transcode
                    setVideoConvertFormat={setVideoConvertFormat}
                    setVideoConvertCodec={setVideoConvertCodec}
                    videoConvertFormat={videoConvertFormat!}
                    videoConvertCodec={videoConvertCodec!}
                />
            ),
        },
        {
            type: "Trim",
            el: <Trim/>,
        },
    ];

    return (
        <div className={"flex flex-col h-screen justify-center items-center"}>
            {video && isFFmpegLoaded ? (
                <Card className={"p-0"}>
                    <CardHeader className={"p-0"}>
                        <CardTitle
                            className={"flex justify-between mb-4 border-b lg:hidden"}
                        >
                            <DropdownMenu
                                open={isMenuOpen}
                                onOpenChange={() => {
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                            >
                                <DropdownMenuTrigger>
                                    <Button
                                        className={
                                            "min-w-20 rounded-none rounded-tl-md border-y-0 border-l-0 border-r lg:hidden focus:outline-none"
                                        }
                                    >
                                        Edit Image
                                        <Pencil2Icon className={"ml-2"}/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Select an edit to make</DropdownMenuLabel>
                                    {transformationComponents.map((el) => (
                                        <DropdownMenuItem
                                            key={el.type}
                                            className={"p-0 my-1"}
                                            onClick={(e) => {
                                                e.preventDefault();
                                            }}
                                        >
                                            {el.el}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={transform} className={"rounded-none rounded-tr-md"}>
                                Apply Edits
                                <MagicWandIcon className={"ml-3"}/>
                            </Button>
                        </CardTitle>

                        <CardTitle
                            style={{marginTop: "0px", marginBottom: "16px"}}
                            className={"hidden border-b lg:flex lg:justify-between"}
                        >
                            <div className={"flex"}>
                                {transformationComponents.map(({type, el}) => (
                                    <React.Fragment key={type}>{el}</React.Fragment>
                                ))}
                            </div>
                            <Button onClick={transform} className={"rounded-none rounded-tr-md"}>
                                Apply Edits
                                <MagicWandIcon className={"ml-3"}/>
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className={"flex justify-center items-center p-8 gap-x-4"}>
                        <div className={"flex justify-center items-center w-[70vw] h-[70vh] max-w-[70vw] max-h-[70vh]"}>
                            <VideoPlayer isUnplayable={isUnplayable}/>
                        </div>
                    </CardContent>
                    <CardFooter className="p-0">
                        <Button
                            variant={"outline"}
                            disabled={!isTransformComplete}
                            onClick={downloadVideo}
                            className={"w-full rounded-none rounded-b-lg border-x-0 border-b-0 border-t"}
                        >
                            {!isTransformComplete ? "Edit video to download" : "Download"}
                            <DownloadIcon className={"ml-3"}/>
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <ImageUpload fileInputRef={fileInputRef}/>
            )}
        </div>
    );
};
