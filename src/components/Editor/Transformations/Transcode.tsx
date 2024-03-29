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
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Codec, Format} from "@/types";
import {FORMAT_NAMES, FORMATS} from "@/constants";
import {Dispatch, SetStateAction} from "react";
import {MixIcon} from "@radix-ui/react-icons";
import {useVideoDataStore} from "@/store/VideoDataStore";
import {useTransformationsStore} from "@/store/TransformationsStore";
import {toast} from "sonner";

interface TranscodeProps {
    setVideoConvertFormat: Dispatch<SetStateAction<Format | null>>;
    setVideoConvertCodec: Dispatch<SetStateAction<Codec | null>>;
    videoConvertFormat: Format;
    videoConvertCodec: Codec;
}

export const Transcode = ({
                              setVideoConvertFormat,
                              setVideoConvertCodec,
                              videoConvertFormat,
                              videoConvertCodec,
                          }: TranscodeProps) => {
    const {videoFormat} = useVideoDataStore();
    const {
        addTransformation,
        checkForTransformationType,
        transformations,
        removeTransformation
    } = useTransformationsStore();

    const handleTrimClick = () => {
        if (checkForTransformationType("Convert", transformations)) {
            removeTransformation("Convert");
            toast("Convert Edit", {
                description: "Removed transcode edit",
                dismissible: false,
            });
        } else {
            addTransformation({
                type: "Convert",
                transcode: {
                    to: videoConvertFormat!,
                    codec: videoConvertCodec!,
                },
            });
            toast("Convert Edit", {
                description: "Added transcode edit",
                dismissible: false,
            });
        }
    };

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button
                    variant={checkForTransformationType("Convert", transformations) ? "destructive" : "outline"}
                    className={
                        "w-full md:rounded-none md:border-b-0 md:border-t-0 md:border-l-0 md:border-r"
                    }
                >
                    {checkForTransformationType("Convert", transformations) ? "Remove Transcode" : "Transcode"}
                    <MixIcon className={"ml-3"}/>
                </Button>
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
                                <div className="text-[0.70rem] uppercase text-muted-foreground">
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
                                    {FORMAT_NAMES.filter((format) => format !== videoFormat).map(
                                        (format) => (
                                            <SelectItem key={format} value={format}>
                                                .{format}
                                            </SelectItem>
                                        )
                                    )}
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
                                    <SelectValue placeholder={videoConvertCodec}/>
                                </SelectTrigger>
                                <SelectContent>
                                    {FORMATS[videoConvertFormat!].codecs.map((codec) => (
                                        <SelectItem key={codec} value={codec}>
                                            {codec}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DrawerFooter>
                        <Button
                            variant={checkForTransformationType("Convert", transformations) ? "destructive" : "default"}
                            onClick={handleTrimClick}
                        >
                            {checkForTransformationType("Convert", transformations) ? "Remove Transcoding" : `Convert to ${videoConvertFormat} in codec ${videoConvertCodec}`}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
};