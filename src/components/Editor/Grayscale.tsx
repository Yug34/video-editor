import {Toggle} from "@/components/ui/toggle";
import {Transformation, TransformationTypes} from "@/types";
import {MaskOnIcon} from "@radix-ui/react-icons";

interface GrayscaleProps {
    addTransformation(transformation: Transformation): void;

    removeTransformation(transformationType: TransformationTypes): void;
}

export const Grayscale = ({addTransformation, removeTransformation}: GrayscaleProps) => {
    return (
        <Toggle
            className={"max-w-36"}
            aria-label="Toggle Video Grayscale"
            onPressedChange={(pressed: boolean) => {
                if (pressed) {
                    addTransformation({type: "Grayscale"});
                } else {
                    removeTransformation("Grayscale");
                }
            }}
        >
            Grayscale
            <MaskOnIcon className={"ml-3"}/>
        </Toggle>
    )
}