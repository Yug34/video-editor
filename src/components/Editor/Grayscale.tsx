import {Toggle} from "@/components/ui/toggle";
import {Transformation, TransformationTypes} from "@/types";

interface GrayscaleProps {
    addTransformation(transformation: Transformation): void;

    removeTransformation(transformationType: TransformationTypes): void;
}

export const Grayscale = ({addTransformation, removeTransformation}: GrayscaleProps) => {
    return (
        <Toggle
            aria-label="Toggle Video Grayscale"
            onPressedChange={(pressed: boolean) => {
                if (pressed) {
                    addTransformation({type: "Grayscale"});
                } else {
                    removeTransformation("Grayscale");
                }
            }}
        >
            {/* <Bold className="h-4 w-4" /> */}
            Grayscale
        </Toggle>
    )
}