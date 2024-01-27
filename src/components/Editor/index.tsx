import {ChangeEvent, useEffect, useRef, useState} from "react";

import {Button} from "@/components/ui/button";
import {toast} from "sonner";

import {FFmpeg} from "@ffmpeg/ffmpeg";
import {fetchFile, toBlobURL} from "@ffmpeg/util";
import {CODECS, FORMAT_NAMES, FORMATS} from "@/constants";
import ImageUpload from "../ImageUpload";
import {Codec, Format, Transformation, TransformationTypes, VideoDuration,} from "@/types";
import {isVideoFormatBrowserCompatible} from "@/util";
import {VideoDurationWrapper} from "@/util/videoDurationWrapper";
import {Grayscale} from "@/components/Editor/Grayscale";
import {Mute} from "@/components/Editor/Mute";
import {Transcode} from "@/components/Editor/Transcode";

export const Editor = () => {
    const ffmpegRef = useRef(new FFmpeg());
    const messageRef = useRef<HTMLParagraphElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [video, setVideo] = useState<Uint8Array | null>(null);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [videoFormat, setVideoFormat] = useState<Format | null>(null);
    const [videoDuration, setVideoDuration] =
        useState<VideoDurationWrapper | null>(null);
    const [sourceVideoURL, setSourceVideoURL] = useState<string | null>(null);

    const [isUnplayable, setIsUnplayable] = useState<boolean>(false);

    const [transformations, setTransformations] = useState<Transformation[]>([]);
    const [isTransformComplete, setIsTransformComplete] =
        useState<boolean>(false);
    const [isDownloaded, setIsDownloaded] = useState<boolean>(false);

    const [videoConvertFormat, setVideoConvertFormat] = useState<Format | null>(null);
    const [videoConvertCodec, setVideoConvertCodec] = useState<Codec | null>(null);

    useEffect(() => {
        if (videoFormat) {
            const videoConvertFormat = FORMAT_NAMES.filter((format) => format !== videoFormat)[0] as Format;
            setVideoConvertFormat(videoConvertFormat);
            setVideoConvertCodec(FORMATS[videoConvertFormat].codecs[0] as Codec);
        }
    }, [videoFormat]);

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (video && isLoaded) {
            ffmpegRef.current.on("log", ({message}) => {
                toast("FFmpeg Logs", {
                    description: message,
                    id: "progressToast",
                    dismissible: false,
                });
            });
        }
    }, [video, isLoaded]);

    const load = async () => {
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        const ffmpeg = ffmpegRef.current;

        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(
                `${baseURL}/ffmpeg-core.wasm`,
                "application/wasm"
            ),
        });

        setIsLoaded(true);
    };

    const initialize = async (e: ChangeEvent) => {
        const file = (e.target as HTMLInputElement)!.files![0];

        const format = file.type.split("/")[1] as Format;
        setVideoFormat(format);

        const fileData = await fetchFile(file);
        const ffmpeg = ffmpegRef.current;
        await ffmpeg.writeFile(`input.${format}`, fileData);

        ffmpeg.on("log", ({message}) => {
            let DurationPattern = /DURATION *: \d+:\d+:\d+.?\d*(?=,*)/gi;
            const msgToMatch = message.split(",")[0];
            if (msgToMatch.match(DurationPattern)) {
                const splitMessage = msgToMatch.split(":");
                let timeStamps = splitMessage.splice(1, splitMessage.length);
                timeStamps = timeStamps.map((timeStamp) => timeStamp.trim());
                const videoDuration: VideoDuration = {
                    hours: parseInt(timeStamps[0]),
                    minutes: parseInt(timeStamps[1]),
                    seconds: parseInt(timeStamps[2]),
                };
                setVideoDuration(VideoDurationWrapper.fromVideoDuration(videoDuration));
            }
        });

        // Does nothing, just getting the metadata of the video.
        await ffmpeg.exec([`-i`, `input.${format}`]);

        ffmpeg.readFile(`input.${format}`).then((videoData) => {
            const videoURL = URL.createObjectURL(
                new Blob([videoData], {type: `video/${format}`})
            );
            setSourceVideoURL(videoURL);
        });

        setVideo(fileData);
    };

    const initializeWithPreloadedVideo = async (fileUrl: string) => {
        const videoFormat = "mp4"; // All preloaded images are PNGs.
        setVideoFormat(videoFormat);

        // write file data to WASM memory
        const fileData = await fetchFile(fileUrl);
        const ffmpeg = ffmpegRef.current;
        await ffmpeg.writeFile(`input.${videoFormat}`, fileData);

        ffmpeg.on("log", ({message}) => {
            let DurationPattern = /DURATION *: \d+:\d+:\d+.?\d*(?=,*)/gi;
            const msgToMatch = message.split(",")[0];
            if (msgToMatch.match(DurationPattern)) {
                const splitMessage = msgToMatch.split(":");
                let timeStamps = splitMessage.splice(1, splitMessage.length);
                timeStamps = timeStamps.map((timeStamp) => timeStamp.trim());
                const videoDuration: VideoDuration = {
                    hours: parseInt(timeStamps[0]),
                    minutes: parseInt(timeStamps[1]),
                    seconds: parseInt(timeStamps[2]),
                };
                setVideoDuration(VideoDurationWrapper.fromVideoDuration(videoDuration));
            }
        });

        // Does nothing, just getting the metadata of the video.
        await ffmpeg.exec([`-i`, `input.${videoFormat}`]);

        ffmpeg.readFile(`input.${videoFormat}`).then((videoData) => {
            const videoURL = URL.createObjectURL(
                new Blob([videoData], {type: `video/${videoFormat}`})
            );
            setSourceVideoURL(videoURL);
        });

        setVideo(fileData);
    };

    const transcode = async (
        toFormat: Format,
        toCodec: Codec,
        fromFormat?: Format
    ) => {
        const ffmpeg = ffmpegRef.current;
        await ffmpeg.exec(
            `-i input.${fromFormat ?? videoFormat} -threads 4 -strict -2 -c:v ${
                CODECS[toCodec].ffmpegLib
            } input.${toFormat}`.split(" ")
        );

        setIsUnplayable(!isVideoFormatBrowserCompatible(toFormat));

        await ffmpeg.deleteFile(`input.${fromFormat ?? videoFormat}`);
        setVideoFormat(toFormat);
    };

    const grayscale = async (format: Format) => {
        const ffmpeg = ffmpegRef.current;

        // WebM weirdness. Does not work on FFmpeg itself.
        // Converting WebM to MP4, applying filter, then converting back:
        if (format === "webm") {
            await transcode("mp4", "h264");
            await ffmpeg.exec(`-i input.mp4 -vf format=gray output.mp4`.split(" "));
            await ffmpeg.deleteFile("input.mp4");
            await ffmpeg.rename("output.mp4", "input.mp4");
            await transcode(format, "vp8", "mp4");
        } else {
            await ffmpeg.exec(
                `-i input.${format} -vf format=gray output.${format}`.split(" ")
            );
            await ffmpeg.rename(`output.${format}`, `input.${format}`);
        }
    };

    const mute = async (format: Format) => {
        const ffmpeg = ffmpegRef.current;
        await ffmpeg.exec(
            `-i input.${format} -vcodec copy -an output.${format}`.split(" ")
        );
        await ffmpeg.rename(`output.${format}`, `input.${format}`);
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

        const ffmpeg = ffmpegRef.current;
        await ffmpeg.exec(
            `-ss ${startTimestamp} -i input.${format} -t ${endTimeStamp} -c copy output.${videoFormat}`.split(
                " "
            )
        );
        await ffmpeg.rename(`output.${format}`, `input.${format}`);
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

        const ffmpeg = ffmpegRef.current;
        const data = await ffmpeg.readFile(`input.${format}`);
        const videoURL = URL.createObjectURL(
            new Blob([data], {type: `video/${format}`})
        );
        setSourceVideoURL(videoURL);
        setIsTransformComplete(true);
    };

    const VideoPlayer = ({isUnplayable}: { isUnplayable: boolean }) => {
        return (
            <div className={"relative flex justify-center items-center h-90 max-h-90 rounded-md"}>
                <video
                    className={"w-full"}
                    ref={videoRef}
                    controls
                    src={sourceVideoURL!}
                />
                {isUnplayable && (
                    <div
                        className={"absolute bg-black w-full h-full flex flex-col justify-center items-center opacity-60"}>
                        <p>Unfortunately, <b>.{videoFormat}</b> videos are not supported on browsers.</p>
                        <p>Although, your video was edited successfully.</p>
                        <Button onClick={downloadVideo}>Click here to download!</Button>
                    </div>
                )}
            </div>
        );
    };

    const downloadVideo = () => {
        const link = document.createElement("a");
        link.download = `output.${videoFormat}`;
        link.target = "_blank";

        link.href = sourceVideoURL!;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsDownloaded(true);
    };

    const addTransformation = (transformation: Transformation) => {
        setTransformations((prevTransformations) => [
            ...prevTransformations,
            transformation,
        ]);
    };

    const removeTransformation = (transformationType: TransformationTypes) => {
        setTransformations((prevTransformations) =>
            prevTransformations.filter(
                (transformation) => transformation.type !== transformationType
            )
        );
    };

    return (
        <div>
            {video && isLoaded ? (
                <div>
                    <div className="h-full py-6">
                        <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
                            <div className="flex flex-col space-y-4 md:order-2">
                                <div className="flex flex-col h-full">
                                    <Grayscale
                                        addTransformation={addTransformation}
                                        removeTransformation={removeTransformation}
                                    />
                                    <Mute
                                        addTransformation={addTransformation}
                                        removeTransformation={removeTransformation}
                                    />
                                    <Transcode
                                        videoFormat={videoFormat!}
                                        setVideoConvertFormat={setVideoConvertFormat}
                                        setVideoConvertCodec={setVideoConvertCodec}
                                        videoConvertFormat={videoConvertFormat!}
                                        videoConvertCodec={videoConvertCodec!}
                                        addTransformation={addTransformation}
                                    />
                                    <Button onClick={downloadVideo}>Download</Button>
                                    <Button onClick={transform}>Transform</Button>
                                </div>
                            </div>
                            <div className="md:order-1">
                                <div className="flex h-full flex-col space-y-4">
                                    <VideoPlayer isUnplayable={isUnplayable}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p ref={messageRef}></p>
                </div>
            ) : (
                <ImageUpload
                    isFFmpegLoaded={isLoaded}
                    fileInputRef={fileInputRef}
                    initialize={initialize}
                    initializeWithPreloadedVideo={initializeWithPreloadedVideo}
                />
            )}
        </div>
    );
};
