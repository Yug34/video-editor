import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from "@/components/ui/drawer";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Codec, Format, Transformation} from "@/types";
import {FORMAT_NAMES, FORMATS} from "@/constants";
import {Dispatch, SetStateAction} from "react";

interface TranscodeProps {
    videoFormat: Format;
    setVideoConvertFormat: Dispatch<SetStateAction<Format | null>>;
    setVideoConvertCodec: Dispatch<SetStateAction<Codec | null>>;
    videoConvertFormat: Format;
    videoConvertCodec: Codec;

    addTransformation(transformation: Transformation): void;
}

export const Transcode = ({
                              videoFormat,
                              setVideoConvertFormat,
                              setVideoConvertCodec,
                              videoConvertFormat,
                              videoConvertCodec,
                              addTransformation
                          }: TranscodeProps) => {
    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button variant="outline">Transcode Video</Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Transcode Video</DrawerTitle>
                        <DrawerDescription>
                            Transcode video from <b>{videoFormat}</b> to another format and
                            codec.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-0">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="flex-1 text-center">
                                <div
                                    className="text-[0.70rem] uppercase text-muted-foreground">
                                    Convert video to
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 h-[120px]">
                            <Select
                                onValueChange={(e: string) => {
                                    setVideoConvertFormat(e as Format);
                                    setVideoConvertCodec(FORMATS[e as Format].codecs[0] as Codec);
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={videoConvertFormat}/>
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
                                    <div
                                        className="text-[0.70rem] uppercase text-muted-foreground">
                                        Choose format codec
                                    </div>
                                </div>
                            </div>

                            <Select onValueChange={(e) => {
                                setVideoConvertCodec(e as Codec);
                            }}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={videoConvertCodec}/>
                                </SelectTrigger>
                                <SelectContent>
                                    {FORMATS[videoConvertFormat!].codecs.map(
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
                        <Button
                            onClick={() => {
                                addTransformation({
                                    type: "Convert",
                                    transcode: {
                                        to: videoConvertFormat!,
                                        codec: videoConvertCodec!
                                    }
                                });
                            }}
                        >
                            Convert to {videoConvertFormat} in codec {videoConvertCodec}
                        </Button>

                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}