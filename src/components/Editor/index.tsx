import { ChangeEvent, useEffect, useRef, useState } from "react";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import {
  Codec,
  Format,
  Transformation,
  TransformationTypes,
  VideoDuration,
} from "@/types";
import { VideoDurationWrapper, isVideoFormatBrowserCompatible } from "@/util";

import ImageUpload from "../ImageUpload";
import { CODECS, CODEC_NAMES, FORMATS, FORMAT_NAMES } from "@/constants";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toggle } from "../ui/toggle";
import { Bold } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

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

  const [videoConvertFormat, setVideoConvertFormat] = useState<Format>(
    FORMAT_NAMES.filter((format) => format !== videoFormat)[0] as Format
  );
  const [videoConvertCodec, setVideoConvertCodec] = useState<Codec>(
    FORMATS[videoConvertFormat].codecs[0] as Codec
  );

  useEffect(() => {
    console.log(videoConvertCodec);
  }, [videoConvertCodec]);

  useEffect(() => {
    console.log(videoConvertFormat);
  }, [videoConvertFormat]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (video && isLoaded) {
      ffmpegRef.current.on("log", ({ message }) => {
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

    ffmpeg.on("log", ({ message }) => {
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
        new Blob([videoData], { type: `video/${format}` })
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

    ffmpeg.on("log", ({ message }) => {
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
        new Blob([videoData], { type: `video/${videoFormat}` })
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

    setIsUnplayable(isVideoFormatBrowserCompatible(toFormat));

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
      new Blob([data], { type: `video/${format}` })
    );
    setSourceVideoURL(videoURL);
    setIsTransformComplete(true);
  };

  const VideoPlayer = ({ isUnplayable }: { isUnplayable: boolean }) => {
    return (
      <div
        className={`relative flex justify-center items-center h-90 max-h-90 ${
          isUnplayable ? "border border-white" : ""
        } rounded-md`}
      >
        <video
          className={"w-full"}
          ref={videoRef}
          controls
          src={sourceVideoURL!}
        />
        {isUnplayable && (
          <>
            <div>
              <p>
                .{videoFormat} videos are unplayable on the browser. Although,
                your video was edited successfully.
              </p>
              <p>Click on the download button to download your video!</p>
            </div>
          </>
        )}
      </div>
    );
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
                  <Toggle
                    aria-label="Toggle bold"
                    onPressedChange={(pressed: boolean) => {
                      if (pressed) {
                        addTransformation({ type: "Grayscale" });
                      } else {
                        removeTransformation("Grayscale");
                      }
                    }}
                  >
                    {/* <Bold className="h-4 w-4" /> */}
                    Grayscale
                  </Toggle>
                  <Toggle
                    aria-label="Toggle bold"
                    onPressedChange={(pressed: boolean) => {
                      if (pressed) {
                        addTransformation({ type: "Mute" });
                      } else {
                        removeTransformation("Mute");
                      }
                    }}
                  >
                    Mute
                  </Toggle>
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="outline">Transcode Video</Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                          <DrawerTitle>Transcode Video</DrawerTitle>
                          <DrawerDescription>
                            Transcode video from one format and codec to
                            another.
                          </DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 pb-0">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="flex-1 text-center">
                              <div className="text-[0.70rem] uppercase text-muted-foreground">
                                Convert video format to convert to
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 h-[120px]">
                            <Select
                              onValueChange={(e) => {
                                setVideoConvertFormat(e as Format);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a format" />
                              </SelectTrigger>
                              <SelectContent>
                                {FORMAT_NAMES.filter(
                                  (format) => format !== videoFormat
                                ).map((format) => (
                                  <SelectItem key={format} value={format}>
                                    .{format}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <div className="flex items-center justify-center space-x-2">
                              <div className="flex-1 text-center">
                                <div className="text-[0.70rem] uppercase text-muted-foreground">
                                  Choose format codec
                                </div>
                              </div>
                            </div>

                            <Select
                              onValueChange={(e) => {
                                setVideoConvertCodec(e as Codec);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a format" />
                              </SelectTrigger>
                              <SelectContent>
                                {FORMATS[videoConvertFormat].codecs.map(
                                  (codec) => (
                                    <SelectItem key={codec} value={codec}>
                                      {codec}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DrawerFooter>
                          <Button>Submit</Button>
                          <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </div>
                    </DrawerContent>
                  </Drawer>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">Grayscale</Button>
                    </PopoverTrigger>
                    <Button
                      onClick={() => {
                        transform();
                      }}
                    >
                      Transform
                    </Button>
                    <PopoverContent side="left" className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">
                            Grayscale
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Covert video to black and white.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="width">Width</Label>
                            <Input
                              id="width"
                              defaultValue="100%"
                              className="col-span-2 h-8"
                            />
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="maxWidth">Max. width</Label>
                            <Input
                              id="maxWidth"
                              defaultValue="300px"
                              className="col-span-2 h-8"
                            />
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="height">Height</Label>
                            <Input
                              id="height"
                              defaultValue="25px"
                              className="col-span-2 h-8"
                            />
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="maxHeight">Max. height</Label>
                            <Input
                              id="maxHeight"
                              defaultValue="none"
                              className="col-span-2 h-8"
                            />
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="md:order-1">
                <div className="flex h-full flex-col space-y-4">
                  <VideoPlayer isUnplayable={false} />
                </div>
              </div>
            </div>
          </div>
          <p ref={messageRef}></p>
        </div>
      ) : (
        <div>
          <ImageUpload
            isFFmpegLoaded={isLoaded}
            fileInputRef={fileInputRef}
            initialize={initialize}
            initializeWithPreloadedVideo={initializeWithPreloadedVideo}
          />
        </div>
      )}
    </div>
  );
};
